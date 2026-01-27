import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

// GET /api/usecases/[id]/ai-artifact-review - Get existing AI artifact review
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const useCase = await prisma.useCase.findUnique({
      where: { id },
      include: {
        decision: true,
        attachments: true,
      },
    });

    if (!useCase) {
      return NextResponse.json({ error: 'Use case not found' }, { status: 404 });
    }

    // Check if we have a cached review in aiInsights
    if (useCase.decision?.aiInsights) {
      try {
        const insights = JSON.parse(useCase.decision.aiInsights);
        if (insights.artifactReview) {
          return NextResponse.json(insights.artifactReview);
        }
      } catch {
        // No cached review
      }
    }

    // If no cached review but we have a decision, generate a basic review on-the-fly
    if (useCase.decision) {
      const requiredArtifacts: string[] = JSON.parse(useCase.decision.requiredArtifacts || '[]');

      // Build artifact status
      const artifactStatus: Record<string, { required: boolean; uploaded: boolean; filename?: string }> = {};
      for (const artifactId of requiredArtifacts) {
        const attachment = useCase.attachments.find(a => a.artifactId === artifactId);
        artifactStatus[artifactId] = {
          required: true,
          uploaded: !!attachment,
          filename: attachment?.filename,
        };
      }

      const completedCount = Object.values(artifactStatus).filter(a => a.uploaded).length;
      const totalRequired = requiredArtifacts.length;

      const basicReview = {
        summary: totalRequired === 0
          ? 'No artifacts are required for this use case.'
          : completedCount === totalRequired
            ? `All ${totalRequired} required artifacts have been uploaded and are ready for review.`
            : `${completedCount} of ${totalRequired} required artifacts have been uploaded. ${totalRequired - completedCount} artifact(s) still pending.`,
        completionPercentage: totalRequired > 0 ? Math.round((completedCount / totalRequired) * 100) : 100,
        artifactStatus,
        recommendations: completedCount < totalRequired
          ? ['Please ensure all required artifacts are uploaded before approval.']
          : ['All required artifacts have been uploaded.'],
        readyForApproval: completedCount === totalRequired,
        generatedAt: new Date().toISOString(),
        aiPowered: false,
      };

      return NextResponse.json(basicReview);
    }

    return NextResponse.json({ message: 'No decision generated yet' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching artifact review:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artifact review' },
      { status: 500 }
    );
  }
}

// POST /api/usecases/[id]/ai-artifact-review - Generate AI artifact review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const useCase = await prisma.useCase.findUnique({
      where: { id },
      include: {
        decision: true,
        attachments: true,
      },
    });

    if (!useCase) {
      return NextResponse.json({ error: 'Use case not found' }, { status: 404 });
    }

    if (!useCase.decision) {
      return NextResponse.json(
        { error: 'No decision found. Generate a decision first.' },
        { status: 400 }
      );
    }

    // Parse required artifacts and risk flags
    const requiredArtifacts: string[] = JSON.parse(useCase.decision.requiredArtifacts || '[]');
    const riskFlags: string[] = JSON.parse(useCase.decision.riskFlags || '[]');

    // Map uploaded attachments to artifact IDs
    const uploadedArtifactIds = useCase.attachments
      .filter(a => a.artifactId)
      .map(a => a.artifactId as string);

    // Build artifact status
    const artifactStatus: Record<string, {
      required: boolean;
      uploaded: boolean;
      filename?: string;
      aiAnalysis?: string;
      meetsRequirement?: boolean;
    }> = {};

    for (const artifactId of requiredArtifacts) {
      const attachment = useCase.attachments.find(a => a.artifactId === artifactId);
      artifactStatus[artifactId] = {
        required: true,
        uploaded: !!attachment,
        filename: attachment?.filename,
      };
    }

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      // Return basic analysis without AI
      const completedCount = Object.values(artifactStatus).filter(a => a.uploaded).length;
      const totalRequired = requiredArtifacts.length;

      const basicReview = {
        summary: totalRequired === 0
          ? 'No artifacts are required for this use case.'
          : completedCount === totalRequired
            ? `All ${totalRequired} required artifacts have been uploaded and are ready for review.`
            : `${completedCount} of ${totalRequired} required artifacts have been uploaded. ${totalRequired - completedCount} artifact(s) still pending.`,
        completionPercentage: totalRequired > 0 ? Math.round((completedCount / totalRequired) * 100) : 100,
        artifactStatus,
        recommendations: completedCount < totalRequired
          ? ['Please ensure all required artifacts are uploaded before approval.']
          : ['All required artifacts have been uploaded.'],
        readyForApproval: completedCount === totalRequired,
        generatedAt: new Date().toISOString(),
        aiPowered: false,
      };

      // Cache the basic review too
      let existingInsights = {};
      try {
        existingInsights = useCase.decision.aiInsights ? JSON.parse(useCase.decision.aiInsights) : {};
      } catch {
        existingInsights = {};
      }

      await prisma.decision.update({
        where: { id: useCase.decision.id },
        data: {
          aiInsights: JSON.stringify({
            ...existingInsights,
            artifactReview: basicReview,
          }),
        },
      });

      return NextResponse.json(basicReview);
    }

    // Generate AI analysis of uploaded artifacts
    const artifactSummary = Object.entries(artifactStatus)
      .map(([id, status]) => `- ${id}: ${status.uploaded ? `Uploaded (${status.filename})` : 'Missing'}`)
      .join('\n');

    const prompt = `You are a Model Risk Management analyst reviewing documentation for a model use case.

Use Case: ${useCase.title}
Description: ${useCase.description}
Business Line: ${useCase.businessLine}
Model Type: ${useCase.aiType}
Risk Tier: ${useCase.decision.tier}
Risk Flags: ${riskFlags.join(', ') || 'None'}

Required Artifacts Status:
${artifactSummary}

Based on this information, provide a JSON response with the following structure:
{
  "summary": "A 2-3 sentence summary of the documentation status",
  "artifactAnalysis": {
    "<artifactId>": {
      "status": "complete" | "partial" | "missing",
      "assessment": "Brief assessment of the artifact",
      "concerns": ["Any concerns or issues noted"],
      "meetsRequirement": true | false
    }
  },
  "overallReadiness": "ready" | "needs_work" | "incomplete",
  "recommendations": ["List of specific recommendations"],
  "keyFindings": ["List of key findings from the review"],
  "riskConsiderations": ["Any risk considerations based on uploaded documentation"]
}

Focus on whether the uploaded documentation adequately addresses the requirements for a ${useCase.decision.tier} risk tier model.`;

    const { text } = await generateText({
      model: openai('gpt-4o'),
      prompt,
      maxTokens: 2000,
    });

    // Parse AI response
    let aiAnalysis;
    try {
      // Clean up response - remove markdown code blocks if present
      let cleanedText = text.trim();

      // Remove ```json or ``` wrapper if present
      const codeBlockMatch = cleanedText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        cleanedText = codeBlockMatch[1].trim();
      }

      // Extract JSON object from response
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        console.error('No JSON found in AI response:', cleanedText.substring(0, 500));
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI artifact review response:', parseError);
      console.error('Raw response:', text.substring(0, 500));
      aiAnalysis = {
        summary: 'AI analysis could not be parsed. Manual review recommended.',
        recommendations: ['Please review documentation manually.'],
      };
    }

    // Calculate completion percentage
    const completedCount = Object.values(artifactStatus).filter(a => a.uploaded).length;
    const totalRequired = requiredArtifacts.length;
    const completionPercentage = totalRequired > 0 ? Math.round((completedCount / totalRequired) * 100) : 100;

    // Build final review
    const review = {
      summary: aiAnalysis.summary,
      completionPercentage,
      artifactStatus,
      artifactAnalysis: aiAnalysis.artifactAnalysis || {},
      overallReadiness: aiAnalysis.overallReadiness || (completedCount === totalRequired ? 'ready' : 'incomplete'),
      recommendations: aiAnalysis.recommendations || [],
      keyFindings: aiAnalysis.keyFindings || [],
      riskConsiderations: aiAnalysis.riskConsiderations || [],
      readyForApproval: completedCount === totalRequired && aiAnalysis.overallReadiness === 'ready',
      generatedAt: new Date().toISOString(),
      aiPowered: true,
    };

    // Cache the review in the decision's aiInsights
    let existingInsights = {};
    try {
      existingInsights = useCase.decision.aiInsights ? JSON.parse(useCase.decision.aiInsights) : {};
    } catch {
      existingInsights = {};
    }

    await prisma.decision.update({
      where: { id: useCase.decision.id },
      data: {
        aiInsights: JSON.stringify({
          ...existingInsights,
          artifactReview: review,
        }),
      },
    });

    // Create audit event
    await prisma.auditEvent.create({
      data: {
        useCaseId: id,
        actor: 'AI Artifact Review',
        eventType: 'AIArtifactReview',
        details: JSON.stringify({
          completionPercentage,
          readyForApproval: review.readyForApproval,
        }),
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error('Error generating artifact review:', error);
    return NextResponse.json(
      { error: 'Failed to generate artifact review', details: String(error) },
      { status: 500 }
    );
  }
}
