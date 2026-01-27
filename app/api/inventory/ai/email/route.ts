import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { streamText } from 'ai';
import { getModel } from '@/lib/ai/openai-client';
import { isAIEnabled } from '@/lib/ai/config';
import { calculateValidationStatus } from '@/lib/utils';

const EMAIL_SYSTEM_PROMPT = `You are a Model Risk Management communication specialist. Generate professional emails to model owners regarding validation schedules.

The email should be professional and clear. Include:
1. A clear, action-oriented subject line
2. Greeting addressing the model owner
3. Purpose of the email (why you're reaching out)
4. Key details about the model and validation
5. Required actions and deadlines
6. Consequences of non-compliance (if overdue)
7. Contact information for questions
8. Professional closing

Tone guidelines by email type:
- **upcoming_30**: Professional and informative. Emphasize preparation time.
- **upcoming_7**: Slightly more urgent. Emphasize the approaching deadline.
- **overdue**: Firm but professional. Emphasize compliance requirements and immediate action needed.

Do not be alarmist, but be clear about the importance of model validation for regulatory compliance.`;

// POST /api/inventory/ai/email - Generate validation reminder email
export async function POST(request: NextRequest) {
  try {
    if (!isAIEnabled()) {
      return NextResponse.json(
        { error: 'AI features are not enabled. Set OPENAI_API_KEY to enable.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { inventoryModelId, emailType } = body;

    // Fetch model details
    const model = await prisma.inventoryModel.findUnique({
      where: { id: inventoryModelId },
      include: {
        useCase: true,
        validations: {
          orderBy: { validationDate: 'desc' },
          take: 1,
        },
      },
    });

    if (!model) {
      return NextResponse.json(
        { error: 'Inventory model not found' },
        { status: 404 }
      );
    }

    const validationStatus = calculateValidationStatus(model.nextValidationDue);
    const daysUntilDue = Math.ceil(
      (new Date(model.nextValidationDue).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    // Determine email type if not provided
    const type = emailType || validationStatus;

    let urgencyContext = '';
    if (type === 'overdue') {
      urgencyContext = `This validation is OVERDUE by ${Math.abs(daysUntilDue)} days. Immediate action is required.`;
    } else if (type === 'upcoming_7' || (daysUntilDue <= 7 && daysUntilDue >= 0)) {
      urgencyContext = `This validation is due in ${daysUntilDue} days. Please prioritize scheduling.`;
    } else if (type === 'upcoming_30' || (daysUntilDue <= 30 && daysUntilDue > 7)) {
      urgencyContext = `This validation is due in ${daysUntilDue} days. Please begin preparation.`;
    } else {
      urgencyContext = `This validation is due on ${new Date(model.nextValidationDue).toLocaleDateString()}.`;
    }

    const contextPrompt = `
Generate a validation reminder email for the following model:

**Model Information:**
- Model Name: ${model.useCase.title}
- Inventory Number: ${model.inventoryNumber}
- Risk Tier: ${model.tier} (${model.tier === 'T3' ? 'High Risk - Annual Validation' : model.tier === 'T2' ? 'Medium Risk - Bi-annual Validation' : 'Low Risk - Tri-annual Validation'})
- Business Line: ${model.useCase.businessLine}
- Model Type: ${model.useCase.aiType}
- Model Owner Contact: ${model.useCase.incidentResponseContact || 'model-owner@example.com'}

**Validation Details:**
- Last Validation: ${model.lastValidationDate ? new Date(model.lastValidationDate).toLocaleDateString() : 'No previous validation'}
- Next Validation Due: ${new Date(model.nextValidationDue).toLocaleDateString()}
- ${urgencyContext}

**Email Type:** ${type}

Please generate an appropriate email based on the urgency level. The email should come from the Model Risk Management team.`;

    const result = await streamText({
      model: getModel(),
      system: EMAIL_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: contextPrompt }],
      maxTokens: 1000,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error generating email:', error);
    return NextResponse.json(
      { error: 'Failed to generate email', details: String(error) },
      { status: 500 }
    );
  }
}
