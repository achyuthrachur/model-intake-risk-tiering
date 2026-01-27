import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { streamText } from 'ai';
import { getModel } from '@/lib/ai/openai-client';
import { isAIEnabled } from '@/lib/ai/config';

const MEMO_SYSTEM_PROMPT = `You are a Model Risk Management documentation specialist. Generate professional memos documenting remediation efforts for validation findings.

The memo should be formatted as a formal business document with the following sections:

1. **MEMORANDUM HEADER**
   - To: Model Risk Management Committee
   - From: Model Risk Management
   - Date: [Current Date]
   - Re: Remediation Documentation - [Finding Title]

2. **EXECUTIVE SUMMARY**
   Brief overview of the finding and remediation outcome.

3. **FINDING DETAILS**
   - Finding Number
   - Severity
   - Category
   - Original Description

4. **REMEDIATION ACTIONS TAKEN**
   Detailed description of what was done to address the finding.

5. **EVIDENCE OF COMPLETION**
   List of supporting documentation and evidence.

6. **RISK ASSESSMENT POST-REMEDIATION**
   Assessment of residual risk after remediation.

7. **RECOMMENDATION**
   Recommendation for sign-off or additional actions.

Use formal business language appropriate for regulatory documentation. Be specific and detailed.`;

// POST /api/inventory/ai/memo - Generate remediation memo
export async function POST(request: NextRequest) {
  try {
    if (!isAIEnabled()) {
      return NextResponse.json(
        { error: 'AI features are not enabled. Set OPENAI_API_KEY to enable.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { findingId, additionalContext } = body;

    // Fetch finding details
    const finding = await prisma.validationFinding.findUnique({
      where: { id: findingId },
      include: {
        validation: {
          include: {
            inventoryModel: {
              include: {
                useCase: true,
              },
            },
          },
        },
      },
    });

    if (!finding) {
      return NextResponse.json(
        { error: 'Finding not found' },
        { status: 404 }
      );
    }

    const contextPrompt = `
Generate a remediation memo for the following finding:

**Model Information:**
- Model Name: ${finding.validation.inventoryModel.useCase.title}
- Inventory Number: ${finding.validation.inventoryModel.inventoryNumber}
- Risk Tier: ${finding.validation.inventoryModel.tier}
- Business Line: ${finding.validation.inventoryModel.useCase.businessLine}

**Finding Information:**
- Finding Number: ${finding.findingNumber}
- Title: ${finding.title}
- Description: ${finding.description}
- Severity: ${finding.severity}
- Category: ${finding.category || 'Not specified'}
- Status: ${finding.remediationStatus}

**Remediation Details:**
- Remediation Notes: ${finding.remediationNotes || 'Not provided'}
- Remediated By: ${finding.remediatedBy || 'Not specified'}
- Remediation Date: ${finding.remediatedAt ? new Date(finding.remediatedAt).toLocaleDateString() : 'Not completed'}

${additionalContext ? `**Additional Context:** ${additionalContext}` : ''}

Please generate a comprehensive remediation memo based on this information.`;

    const result = await streamText({
      model: getModel(),
      system: MEMO_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: contextPrompt }],
      maxTokens: 2000,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error generating memo:', error);
    return NextResponse.json(
      { error: 'Failed to generate memo', details: String(error) },
      { status: 500 }
    );
  }
}
