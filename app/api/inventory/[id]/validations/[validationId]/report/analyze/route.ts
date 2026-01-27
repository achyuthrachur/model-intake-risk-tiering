import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { streamText } from 'ai';
import { getModel } from '@/lib/ai/openai-client';
import { isAIEnabled } from '@/lib/ai/config';

// POST: Analyze and summarize a validation report using AI
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; validationId: string }> }
) {
  try {
    // Check if AI is enabled
    if (!isAIEnabled()) {
      return NextResponse.json(
        { error: 'AI features are not enabled. Please set OPENAI_API_KEY environment variable.' },
        { status: 400 }
      );
    }

    const { id: inventoryModelId, validationId } = await params;

    // Verify validation exists and has a report
    const validation = await prisma.validation.findFirst({
      where: {
        id: validationId,
        inventoryModelId,
      },
      include: {
        findings: true,
        inventoryModel: {
          include: {
            useCase: true,
          },
        },
      },
    });

    if (!validation) {
      return NextResponse.json(
        { error: 'Validation not found' },
        { status: 404 }
      );
    }

    if (!validation.reportStoragePath) {
      return NextResponse.json(
        { error: 'No report uploaded for this validation' },
        { status: 400 }
      );
    }

    // Fetch the report content
    let reportContent = '';
    try {
      const reportResponse = await fetch(validation.reportStoragePath);
      if (reportResponse.ok) {
        const contentType = reportResponse.headers.get('content-type') || '';

        // Handle text-based files
        if (contentType.includes('text') || contentType.includes('csv')) {
          reportContent = await reportResponse.text();
        } else if (contentType.includes('pdf')) {
          // For PDFs, we'll provide context based on metadata and findings
          reportContent = `[PDF Document: ${validation.reportFilename}]\n\nNote: PDF content extraction is limited. Analysis is based on available metadata and validation context.`;
        } else {
          reportContent = `[Document: ${validation.reportFilename}]\n\nNote: Document content extraction is limited for this file type. Analysis is based on available metadata and validation context.`;
        }
      }
    } catch (fetchError) {
      console.warn('Could not fetch report content:', fetchError);
      reportContent = `[Document: ${validation.reportFilename}]\n\nNote: Could not retrieve document content. Analysis is based on validation metadata.`;
    }

    // Build context for the AI
    const modelContext = validation.inventoryModel?.useCase;
    const findingsContext = validation.findings?.map((f) => ({
      number: f.findingNumber,
      title: f.title,
      severity: f.severity,
      category: f.category,
      status: f.remediationStatus,
      description: f.description,
    })) || [];

    const systemPrompt = `You are an expert Model Risk Management (MRM) analyst specializing in reviewing validation reports for AI/ML models and quantitative tools.

Your task is to analyze a validation report and provide a comprehensive summary that would be useful for MRM teams.

Context about the model being validated:
- Model Name: ${modelContext?.title || 'Unknown'}
- Business Line: ${modelContext?.businessLine || 'Unknown'}
- Model Type: ${modelContext?.aiType || 'Unknown'}
- Usage Type: ${modelContext?.usageType || 'Unknown'}
- Validation Type: ${validation.validationType}
- Validation Date: ${validation.validationDate}
- Overall Result: ${validation.overallResult || 'Not specified'}
- Number of Findings: ${findingsContext.length}

${findingsContext.length > 0 ? `
Findings from this validation:
${findingsContext.map((f) => `- ${f.number} (${f.severity}): ${f.title} - ${f.status}`).join('\n')}
` : ''}

Provide your analysis in the following structure:

## Executive Summary
A 2-3 sentence high-level summary of the validation report and its key conclusions.

## Key Findings Analysis
Summarize the most significant findings, their implications, and risk impact.

## Methodology Assessment
Comment on the validation methodology and approach used (based on available information).

## Risk Implications
Highlight any model risk concerns or areas that require attention.

## Recommendations
Provide 3-5 actionable recommendations for the model owner and MRM team.

## Compliance Notes
Any regulatory or compliance considerations based on the validation results.

Be professional, concise, and focus on actionable insights.`;

    const userPrompt = `Please analyze the following validation report and provide a comprehensive summary:

Report Filename: ${validation.reportFilename}
Validation Summary Notes: ${validation.summaryNotes || 'None provided'}

Report Content:
${reportContent.slice(0, 10000)}

${reportContent.length > 10000 ? '\n[Content truncated for length...]' : ''}

Based on this information and the context provided, generate a detailed analysis.`;

    // Stream the response
    const result = streamText({
      model: getModel(),
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens: 2000,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error analyzing validation report:', error);
    return NextResponse.json(
      { error: 'Failed to analyze validation report', details: String(error) },
      { status: 500 }
    );
  }
}

// GET: Get cached analysis if available
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; validationId: string }> }
) {
  try {
    const { id: inventoryModelId, validationId } = await params;

    const validation = await prisma.validation.findFirst({
      where: {
        id: validationId,
        inventoryModelId,
      },
      select: {
        id: true,
        reportFilename: true,
        reportStoragePath: true,
        overallResult: true,
        validationType: true,
        summaryNotes: true,
      },
    });

    if (!validation) {
      return NextResponse.json(
        { error: 'Validation not found' },
        { status: 404 }
      );
    }

    if (!validation.reportStoragePath) {
      return NextResponse.json(
        { error: 'No report uploaded', hasReport: false },
        { status: 200 }
      );
    }

    return NextResponse.json({
      hasReport: true,
      filename: validation.reportFilename,
      canAnalyze: isAIEnabled(),
    });
  } catch (error) {
    console.error('Error checking report status:', error);
    return NextResponse.json(
      { error: 'Failed to check report status' },
      { status: 500 }
    );
  }
}
