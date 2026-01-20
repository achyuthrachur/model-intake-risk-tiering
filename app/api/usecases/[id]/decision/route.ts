import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { evaluateUseCase } from '@/lib/rules-engine';
import type { UseCaseWithRelations } from '@/lib/types';

// POST /api/usecases/[id]/decision - Generate decision for a use case
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

    // Run the rules engine
    const decisionResult = evaluateUseCase(useCase as unknown as UseCaseWithRelations);

    // Upsert decision (update if exists, create if not)
    const decision = await prisma.decision.upsert({
      where: { useCaseId: id },
      create: {
        useCaseId: id,
        isModel: decisionResult.isModel,
        tier: decisionResult.tier,
        triggeredRules: JSON.stringify(decisionResult.triggeredRules),
        rationaleSummary: decisionResult.rationaleSummary,
        requiredArtifacts: JSON.stringify(decisionResult.requiredArtifacts),
        missingEvidence: JSON.stringify(decisionResult.missingEvidence),
        riskFlags: JSON.stringify(decisionResult.riskFlags),
      },
      update: {
        isModel: decisionResult.isModel,
        tier: decisionResult.tier,
        triggeredRules: JSON.stringify(decisionResult.triggeredRules),
        rationaleSummary: decisionResult.rationaleSummary,
        requiredArtifacts: JSON.stringify(decisionResult.requiredArtifacts),
        missingEvidence: JSON.stringify(decisionResult.missingEvidence),
        riskFlags: JSON.stringify(decisionResult.riskFlags),
      },
    });

    // Create audit event
    await prisma.auditEvent.create({
      data: {
        useCaseId: id,
        actor: 'system',
        eventType: 'DecisionGenerated',
        details: JSON.stringify({
          tier: decisionResult.tier,
          isModel: decisionResult.isModel,
          triggeredRulesCount: decisionResult.triggeredRules.length,
        }),
      },
    });

    return NextResponse.json({
      decision,
      result: decisionResult,
    });
  } catch (error) {
    console.error('Error generating decision:', error);
    return NextResponse.json(
      { error: 'Failed to generate decision' },
      { status: 500 }
    );
  }
}

// GET /api/usecases/[id]/decision - Get the decision for a use case
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const decision = await prisma.decision.findUnique({
      where: { useCaseId: id },
    });

    if (!decision) {
      return NextResponse.json(
        { error: 'Decision not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(decision);
  } catch (error) {
    console.error('Error fetching decision:', error);
    return NextResponse.json(
      { error: 'Failed to fetch decision' },
      { status: 500 }
    );
  }
}
