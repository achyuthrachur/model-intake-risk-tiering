import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { loadArtifactsConfig } from '@/lib/config-loader';
import { prepareDocumentForAnalysis, isSupported } from '@/lib/document-parser';
import { generateObject } from 'ai';
import { z } from 'zod';
import { getModel } from '@/lib/ai/openai-client';
import { isAIEnabled } from '@/lib/ai/config';

// Schema for AI analysis response
const ArtifactAnalysisSchema = z.object({
  status: z.enum(['complete', 'partial', 'inadequate']),
  score: z.number().min(0).max(100),
  summary: z.string(),
  expectedElements: z.array(z.string()),
  foundElements: z.array(z.string()),
  missingElements: z.array(z.string()),
  concerns: z.array(z.string()),
  recommendations: z.array(z.string()),
});

type ArtifactAnalysisResult = z.infer<typeof ArtifactAnalysisSchema>;

interface AnalysisResponse {
  artifactId: string;
  artifactName: string;
  status: 'complete' | 'partial' | 'inadequate';
  score: number;
  summary: string;
  expectedElements: string[];
  foundElements: string[];
  missingElements: string[];
  concerns: string[];
  recommendations: string[];
  analysisDate: string;
  aiPowered: boolean;
  cached: boolean;
}

// Generate AI-powered analysis
async function generateAIAnalysis(
  artifactDefinition: any,
  documentText: string,
  useCase: any
): Promise<ArtifactAnalysisResult> {
  const prompt = `Analyze this "${artifactDefinition.name}" document for model risk management compliance.

## ARTIFACT REQUIREMENTS

**Description:** ${artifactDefinition.description}

**What Good Looks Like:**
${artifactDefinition.whatGoodLooksLike}

**Responsible Role:** ${artifactDefinition.ownerRole}

## USE CASE CONTEXT

- **Title:** ${useCase.title}
- **Business Line:** ${useCase.businessLine}
- **Model Type:** ${useCase.aiType || 'Not specified'}
- **Usage Type:** ${useCase.usageType}
- **Customer Impact:** ${useCase.customerImpact}
- **Human in Loop:** ${useCase.humanInLoop}

## DOCUMENT CONTENT

${documentText}

## YOUR TASK

Analyze this document against the artifact requirements. Provide:

1. **Status**: "complete" if adequately covers all expected elements, "partial" if some required elements present but others missing, "inadequate" if major required elements missing

2. **Score**: 0-100 representing overall completeness and quality

3. **Expected Elements**: What elements/sections SHOULD be in this document based on requirements

4. **Found Elements**: Which expected elements are ACTUALLY present in the document

5. **Missing Elements**: Elements expected but NOT found in the document

6. **Concerns**: Quality concerns, inconsistencies, or issues with the content

7. **Recommendations**: Specific, actionable recommendations to improve the document

Be thorough but fair in your assessment. Focus on substance over formatting.`;

  const { object } = await generateObject({
    model: getModel(),
    schema: ArtifactAnalysisSchema,
    prompt,
    maxTokens: 2000,
  });

  return object;
}

// Generate basic analysis without AI
function generateBasicAnalysis(
  artifactDefinition: any,
  documentText: string
): ArtifactAnalysisResult {
  const textLength = documentText.length;

  // Basic heuristics
  let score = 0;
  let status: 'complete' | 'partial' | 'inadequate' = 'inadequate';

  if (textLength > 5000) {
    score = 70;
    status = 'partial';
  } else if (textLength > 2000) {
    score = 50;
    status = 'partial';
  } else if (textLength > 500) {
    score = 30;
    status = 'inadequate';
  } else {
    score = 10;
    status = 'inadequate';
  }

  // Check for common expected keywords
  const keywords = ['purpose', 'scope', 'methodology', 'results', 'conclusion', 'approval', 'review'];
  const foundKeywords = keywords.filter(k => documentText.toLowerCase().includes(k));

  score = Math.min(100, score + foundKeywords.length * 5);
  if (foundKeywords.length >= 4) {
    status = 'partial';
  }
  if (foundKeywords.length >= 6 && textLength > 3000) {
    status = 'complete';
    score = Math.max(score, 80);
  }

  return {
    status,
    score,
    summary: textLength > 100
      ? `Document contains ${textLength.toLocaleString()} characters. Basic analysis performed without AI.`
      : 'Document appears to have minimal content.',
    expectedElements: artifactDefinition.whatGoodLooksLike
      .split(/[,;.]/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 10),
    foundElements: foundKeywords.map(k => `Contains "${k}" section/reference`),
    missingElements: keywords
      .filter(k => !foundKeywords.includes(k))
      .map(k => `Missing "${k}" section`),
    concerns: [
      'AI analysis unavailable - basic heuristic analysis only',
      'Manual review recommended for complete assessment',
    ],
    recommendations: [
      'Configure OPENAI_API_KEY for detailed AI analysis',
      'Review document against artifact requirements manually',
    ],
  };
}

// POST: Analyze a single artifact
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; artifactId: string }> }
) {
  try {
    const { id: useCaseId, artifactId } = await params;

    // Get use case with decision and attachments
    const useCase = await prisma.useCase.findUnique({
      where: { id: useCaseId },
      include: {
        decision: true,
        attachments: true,
      },
    });

    if (!useCase) {
      return NextResponse.json(
        { error: 'Use case not found' },
        { status: 404 }
      );
    }

    // Get artifact definition
    const artifactsConfig = loadArtifactsConfig();
    const artifactDefinition = artifactsConfig.artifacts[artifactId];

    if (!artifactDefinition) {
      return NextResponse.json(
        { error: 'Unknown artifact type' },
        { status: 400 }
      );
    }

    // Find the uploaded attachment for this artifact
    const attachment = useCase.attachments.find(a => a.artifactId === artifactId);

    if (!attachment) {
      return NextResponse.json(
        { error: 'No uploaded file found for this artifact' },
        { status: 404 }
      );
    }

    // Check if MIME type is supported
    const mimeType = attachment.mimeType || 'application/pdf';
    if (!isSupported(mimeType)) {
      return NextResponse.json(
        {
          error: `Document type not supported for analysis: ${mimeType}`,
          supportedTypes: ['PDF', 'Word (.docx)', 'Plain text'],
        },
        { status: 400 }
      );
    }

    // Extract document text
    let documentText: string;
    try {
      documentText = await prepareDocumentForAnalysis(
        attachment.storagePath,
        mimeType,
        15000 // Max 15k characters for analysis
      );
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to extract text from document', details: String(error) },
        { status: 500 }
      );
    }

    if (!documentText || documentText.length < 50) {
      return NextResponse.json(
        { error: 'Document appears to be empty or contains very little text' },
        { status: 400 }
      );
    }

    // Generate analysis
    let analysis: ArtifactAnalysisResult;
    let aiPowered = false;

    if (isAIEnabled()) {
      try {
        analysis = await generateAIAnalysis(artifactDefinition, documentText, useCase);
        aiPowered = true;
      } catch (error) {
        console.error('AI analysis failed, falling back to basic:', error);
        analysis = generateBasicAnalysis(artifactDefinition, documentText);
      }
    } else {
      analysis = generateBasicAnalysis(artifactDefinition, documentText);
    }

    // Build response
    const response: AnalysisResponse = {
      artifactId,
      artifactName: artifactDefinition.name,
      ...analysis,
      analysisDate: new Date().toISOString(),
      aiPowered,
      cached: false,
    };

    // Cache the analysis in Decision.aiInsights
    if (useCase.decision) {
      const existingInsights = useCase.decision.aiInsights
        ? JSON.parse(useCase.decision.aiInsights)
        : {};

      const updatedInsights = {
        ...existingInsights,
        individualArtifactAnalyses: {
          ...existingInsights.individualArtifactAnalyses,
          [artifactId]: {
            ...analysis,
            analysisDate: response.analysisDate,
            aiPowered,
          },
        },
      };

      await prisma.decision.update({
        where: { id: useCase.decision.id },
        data: { aiInsights: JSON.stringify(updatedInsights) },
      });
    }

    // Create audit event
    await prisma.auditEvent.create({
      data: {
        useCaseId,
        actor: 'system',
        eventType: 'ArtifactAnalyzed',
        details: JSON.stringify({
          artifactId,
          artifactName: artifactDefinition.name,
          score: analysis.score,
          status: analysis.status,
          aiPowered,
        }),
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Artifact analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze artifact', details: String(error) },
      { status: 500 }
    );
  }
}

// GET: Retrieve cached analysis
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; artifactId: string }> }
) {
  try {
    const { id: useCaseId, artifactId } = await params;

    const useCase = await prisma.useCase.findUnique({
      where: { id: useCaseId },
      include: { decision: true },
    });

    if (!useCase) {
      return NextResponse.json(
        { error: 'Use case not found' },
        { status: 404 }
      );
    }

    if (!useCase.decision?.aiInsights) {
      return NextResponse.json(
        { error: 'No analysis found. Run analysis first.' },
        { status: 404 }
      );
    }

    const insights = JSON.parse(useCase.decision.aiInsights);
    const cachedAnalysis = insights.individualArtifactAnalyses?.[artifactId];

    if (!cachedAnalysis) {
      return NextResponse.json(
        { error: 'No analysis found for this artifact. Run analysis first.' },
        { status: 404 }
      );
    }

    // Get artifact name
    const artifactsConfig = loadArtifactsConfig();
    const artifactDefinition = artifactsConfig.artifacts[artifactId];

    return NextResponse.json({
      artifactId,
      artifactName: artifactDefinition?.name || artifactId,
      ...cachedAnalysis,
      cached: true,
    });
  } catch (error) {
    console.error('Get analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve analysis' },
      { status: 500 }
    );
  }
}
