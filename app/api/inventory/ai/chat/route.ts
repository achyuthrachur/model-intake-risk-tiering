import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { streamText } from 'ai';
import { getModel } from '@/lib/ai/openai-client';
import { isAIEnabled } from '@/lib/ai/config';
import { calculateValidationStatus } from '@/lib/utils';

const CHATBOT_SYSTEM_PROMPT = `You are an AI assistant for the Model Risk Management team. You help answer questions about the model inventory, validations, and findings.

You have been provided with current inventory data. Use this data to answer questions accurately.

Guidelines:
1. Always reference specific model names, inventory numbers, and finding numbers when answering.
2. If asked about validation status, clearly state whether models are current, upcoming, or overdue.
3. For findings, specify the severity, remediation status, and whether MRM has signed off.
4. If you cannot find information in the provided data, say so clearly.
5. Do not make up information - only use what's in the context.
6. Be concise but thorough in your responses.
7. Format your responses clearly with bullet points or numbered lists when appropriate.

Common queries you should be able to answer:
- Which models have overdue validations?
- What are the open findings for a specific model?
- What is the remediation status for a model's findings?
- Which models are due for validation soon?
- Show me high-risk (T3) models with open findings
- What findings need MRM sign-off?`;

// Helper to build inventory context
async function buildInventoryContext() {
  const models = await prisma.inventoryModel.findMany({
    include: {
      useCase: true,
      validations: {
        include: {
          findings: true,
        },
        orderBy: { validationDate: 'desc' },
      },
    },
  });

  if (models.length === 0) {
    return 'No models are currently in the inventory.';
  }

  let context = `**CURRENT INVENTORY DATA (${models.length} models):**\n\n`;

  models.forEach(model => {
    const valStatus = calculateValidationStatus(model.nextValidationDue);
    const openFindings = model.validations.flatMap(v =>
      v.findings.filter(f => f.remediationStatus === 'Open' || f.remediationStatus === 'In Progress')
    );
    const awaitingSignOff = model.validations.flatMap(v =>
      v.findings.filter(f => f.remediationStatus === 'Remediated' && !f.mrmSignedOff)
    );

    context += `---\n`;
    context += `**${model.useCase.title}**\n`;
    context += `- Inventory #: ${model.inventoryNumber}\n`;
    context += `- Tier: ${model.tier}\n`;
    context += `- Business Line: ${model.useCase.businessLine}\n`;
    context += `- Model Type: ${model.useCase.aiType}\n`;
    context += `- Vendor: ${model.useCase.vendorInvolved ? model.useCase.vendorName || 'Yes' : 'No'}\n`;
    context += `- Status: ${model.status}\n`;
    context += `- Validation Status: ${valStatus.toUpperCase()}\n`;
    context += `- Next Validation Due: ${new Date(model.nextValidationDue).toLocaleDateString()}\n`;
    context += `- Last Validation: ${model.lastValidationDate ? new Date(model.lastValidationDate).toLocaleDateString() : 'Never'}\n`;
    context += `- Validated Before Production: ${model.validatedBeforeProduction ? 'Yes' : 'No'}\n`;
    context += `- Open Findings: ${openFindings.length}\n`;
    context += `- Awaiting MRM Sign-off: ${awaitingSignOff.length}\n`;

    if (model.validations.length > 0) {
      context += `\n  Validations:\n`;
      model.validations.forEach(val => {
        context += `  - ${val.validationType} (${new Date(val.validationDate).toLocaleDateString()}): ${val.overallResult || val.status}\n`;
        if (val.findings.length > 0) {
          context += `    Findings:\n`;
          val.findings.forEach(finding => {
            context += `    * ${finding.findingNumber}: "${finding.title}" [${finding.severity}]\n`;
            context += `      Status: ${finding.remediationStatus}`;
            if (finding.mrmSignedOff) {
              context += ` (MRM Signed Off)`;
            } else if (finding.remediationStatus === 'Remediated') {
              context += ` (Awaiting MRM Sign-off)`;
            }
            context += `\n`;
          });
        }
      });
    }
    context += `\n`;
  });

  return context;
}

// POST /api/inventory/ai/chat - Inventory chatbot
export async function POST(request: NextRequest) {
  try {
    if (!isAIEnabled()) {
      return NextResponse.json(
        { error: 'AI features are not enabled. Set OPENAI_API_KEY to enable.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'messages array is required' },
        { status: 400 }
      );
    }

    // Build current inventory context from database
    const inventoryContext = await buildInventoryContext();

    const systemPrompt = `${CHATBOT_SYSTEM_PROMPT}

${inventoryContext}

Use this data to answer the user's questions. Be specific and reference actual model names and finding numbers.`;

    const result = await streamText({
      model: getModel(),
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      maxTokens: 1500,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error in inventory chat:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message', details: String(error) },
      { status: 500 }
    );
  }
}
