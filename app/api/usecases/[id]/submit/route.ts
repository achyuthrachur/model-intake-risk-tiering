import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { evaluateUseCase } from '@/lib/rules-engine';
import type { UseCaseWithRelations } from '@/lib/types';

// POST /api/usecases/[id]/submit - Submit a use case for review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const useCase = await prisma.useCase.findUnique({
      where: { id },
      include: {
        attachments: true,
      },
    });

    if (!useCase) {
      return NextResponse.json(
        { error: 'Use case not found' },
        { status: 404 }
      );
    }

    // Allow submission from Draft, Revision Requested, or Sent Back status
    if (useCase.status !== 'Draft' && useCase.status !== 'Revision Requested' && useCase.status !== 'Sent Back') {
      return NextResponse.json(
        { error: 'Only draft, revision requested, or sent back use cases can be submitted' },
        { status: 400 }
      );
    }

    const previousStatus = useCase.status;

    // Update status to Submitted
    const updated = await prisma.useCase.update({
      where: { id },
      data: { status: 'Submitted' },
      include: {
        decision: true,
        attachments: true,
      },
    });

    // Auto-generate decision if not exists
    if (!updated.decision) {
      const decisionResult = evaluateUseCase(useCase as unknown as UseCaseWithRelations);
      await prisma.decision.create({
        data: {
          useCaseId: id,
          isModel: decisionResult.isModel,
          tier: decisionResult.tier,
          triggeredRules: JSON.stringify(decisionResult.triggeredRules),
          rationaleSummary: decisionResult.rationaleSummary,
          requiredArtifacts: JSON.stringify(decisionResult.requiredArtifacts),
          missingEvidence: JSON.stringify(decisionResult.missingEvidence),
          riskFlags: JSON.stringify(decisionResult.riskFlags),
        },
      });

      // Create audit event for decision
      await prisma.auditEvent.create({
        data: {
          useCaseId: id,
          actor: 'system',
          eventType: 'DecisionGenerated',
          details: JSON.stringify({
            tier: decisionResult.tier,
            isModel: decisionResult.isModel,
          }),
        },
      });
    }

    // Create audit event for submission
    await prisma.auditEvent.create({
      data: {
        useCaseId: id,
        actor: 'demo-user',
        eventType: 'Submitted',
        details: JSON.stringify({ previousStatus, newStatus: 'Submitted' }),
      },
    });

    // Refetch to include the decision
    const finalResult = await prisma.useCase.findUnique({
      where: { id },
      include: {
        decision: true,
        attachments: true,
      },
    });

    return NextResponse.json(finalResult);
  } catch (error) {
    console.error('Error submitting use case:', error);
    return NextResponse.json(
      { error: 'Failed to submit use case' },
      { status: 500 }
    );
  }
}
