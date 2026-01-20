import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import {
  generateAIExecutiveSummary,
  generateDocumentEnhancements,
  generateRiskGuidance,
} from '@/lib/ai/document-generator';
import { loadArtifactsConfig } from '@/lib/config-loader';
import type { UseCaseWithRelations, DecisionResult, ArtifactDefinition } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { useCaseId, type = 'all' } = await request.json();

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

    if (!useCase.decision) {
      return NextResponse.json(
        { error: 'Decision not found. Generate a decision first.' },
        { status: 400 }
      );
    }

    // Parse decision data
    const decision: DecisionResult = {
      isModel: useCase.decision.isModel as any,
      tier: useCase.decision.tier as any,
      triggeredRules: JSON.parse(useCase.decision.triggeredRules),
      rationaleSummary: useCase.decision.rationaleSummary,
      requiredArtifacts: JSON.parse(useCase.decision.requiredArtifacts),
      missingEvidence: JSON.parse(useCase.decision.missingEvidence),
      riskFlags: JSON.parse(useCase.decision.riskFlags),
    };

    // Load artifacts config
    const artifactsConfig = loadArtifactsConfig();

    // Get missing artifact definitions
    const missingArtifacts: ArtifactDefinition[] = decision.missingEvidence
      .map(id => artifactsConfig.artifacts[id])
      .filter(Boolean);

    // Generate requested content
    switch (type) {
      case 'summary': {
        const result = await generateAIExecutiveSummary(
          useCase as unknown as UseCaseWithRelations,
          decision
        );
        return NextResponse.json({
          executiveSummary: result.result,
          aiEnhanced: result.aiEnhanced,
          error: result.error,
        });
      }

      case 'guidance': {
        const result = await generateRiskGuidance(
          useCase as unknown as UseCaseWithRelations,
          decision
        );
        return NextResponse.json({
          riskGuidance: result.result,
          aiEnhanced: result.aiEnhanced,
          error: result.error,
        });
      }

      case 'all':
      default: {
        const result = await generateDocumentEnhancements(
          useCase as unknown as UseCaseWithRelations,
          decision,
          missingArtifacts
        );
        return NextResponse.json({
          ...result.result,
          aiEnhanced: result.aiEnhanced,
          error: result.error,
        });
      }
    }
  } catch (error) {
    console.error('AI document endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI document content' },
      { status: 500 }
    );
  }
}
