import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateAIRiskAssessment } from '@/lib/ai/risk-assessment';
import { evaluateUseCase } from '@/lib/rules-engine';
import type { UseCaseWithRelations, DecisionResult } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { useCaseId } = await request.json();

    if (!useCaseId) {
      return NextResponse.json(
        { error: 'useCaseId is required' },
        { status: 400 }
      );
    }

    // Fetch use case with decision
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

    // Get or generate decision
    let decision: DecisionResult;
    if (useCase.decision) {
      decision = {
        isModel: useCase.decision.isModel as any,
        tier: useCase.decision.tier as any,
        triggeredRules: JSON.parse(useCase.decision.triggeredRules),
        rationaleSummary: useCase.decision.rationaleSummary,
        requiredArtifacts: JSON.parse(useCase.decision.requiredArtifacts),
        missingEvidence: JSON.parse(useCase.decision.missingEvidence),
        riskFlags: JSON.parse(useCase.decision.riskFlags),
      };
    } else {
      // Generate decision if none exists
      decision = evaluateUseCase(useCase as unknown as UseCaseWithRelations);
    }

    // Generate AI risk assessment
    const aiResult = await generateAIRiskAssessment(
      useCase as unknown as UseCaseWithRelations,
      decision
    );

    if (!aiResult.aiEnhanced || !aiResult.result) {
      return NextResponse.json(
        {
          error: aiResult.error || 'AI assessment unavailable',
          aiEnhanced: false,
          fallbackAvailable: true,
        },
        { status: 503 }
      );
    }

    // Store AI insights in the decision record
    if (useCase.decision) {
      await prisma.decision.update({
        where: { id: useCase.decision.id },
        data: {
          aiInsights: JSON.stringify(aiResult.result),
        },
      });
    }

    return NextResponse.json({
      ...aiResult.result,
      aiEnhanced: true,
    });
  } catch (error) {
    console.error('AI risk assessment endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI assessment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const useCaseId = searchParams.get('useCaseId');

    if (!useCaseId) {
      return NextResponse.json(
        { error: 'useCaseId is required' },
        { status: 400 }
      );
    }

    // Fetch existing AI insights
    const decision = await prisma.decision.findUnique({
      where: { useCaseId },
      select: { aiInsights: true },
    });

    if (!decision || !decision.aiInsights) {
      return NextResponse.json(
        { error: 'No AI insights found', aiEnhanced: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...JSON.parse(decision.aiInsights),
      aiEnhanced: true,
    });
  } catch (error) {
    console.error('GET AI insights error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve AI insights' },
      { status: 500 }
    );
  }
}
