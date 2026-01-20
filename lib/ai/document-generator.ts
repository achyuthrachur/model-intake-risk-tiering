// AI Document Generation Service

import { generateText, generateObject } from 'ai';
import { z } from 'zod';
import { getModel, getFastModel } from './openai-client';
import { isAIEnabled } from './config';
import {
  buildExecutiveSummaryPrompt,
  buildArtifactRecommendationPrompt,
  buildRiskGuidancePrompt,
  DOCUMENT_GENERATION_SYSTEM_PROMPT,
} from './prompts/document-generation';
import type { AIDocumentEnhancement, AIResponse } from './types';
import type { UseCaseWithRelations, DecisionResult, ArtifactDefinition } from '@/lib/types';

export async function generateAIExecutiveSummary(
  useCase: UseCaseWithRelations,
  decision: DecisionResult
): Promise<AIResponse<string>> {
  if (!isAIEnabled()) {
    return {
      result: decision.rationaleSummary, // Fallback to deterministic rationale
      aiEnhanced: false,
    };
  }

  try {
    const { text } = await generateText({
      model: getModel(),
      system: DOCUMENT_GENERATION_SYSTEM_PROMPT,
      prompt: buildExecutiveSummaryPrompt(useCase, decision),
      maxTokens: 500,
    });

    return {
      result: text,
      aiEnhanced: true,
    };
  } catch (error) {
    console.error('AI Executive Summary failed:', error);
    return {
      result: decision.rationaleSummary,
      aiEnhanced: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function generateArtifactRecommendation(
  artifact: ArtifactDefinition,
  useCase: UseCaseWithRelations,
  decision: DecisionResult
): Promise<AIResponse<string>> {
  if (!isAIEnabled()) {
    return {
      result: artifact.whatGoodLooksLike, // Fallback to static guidance
      aiEnhanced: false,
    };
  }

  try {
    const { text } = await generateText({
      model: getFastModel(), // Use faster model for bulk operations
      system: DOCUMENT_GENERATION_SYSTEM_PROMPT,
      prompt: buildArtifactRecommendationPrompt(artifact, useCase, decision),
      maxTokens: 200,
    });

    return {
      result: text,
      aiEnhanced: true,
    };
  } catch (error) {
    console.error(`AI Artifact Recommendation failed for ${artifact.id}:`, error);
    return {
      result: artifact.whatGoodLooksLike,
      aiEnhanced: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function generateArtifactRecommendations(
  artifacts: ArtifactDefinition[],
  useCase: UseCaseWithRelations,
  decision: DecisionResult
): Promise<Record<string, AIResponse<string>>> {
  const recommendations: Record<string, AIResponse<string>> = {};

  // Process in parallel with concurrency limit
  const batchSize = 5;
  for (let i = 0; i < artifacts.length; i += batchSize) {
    const batch = artifacts.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(artifact => generateArtifactRecommendation(artifact, useCase, decision))
    );

    batch.forEach((artifact, index) => {
      recommendations[artifact.id] = results[index];
    });
  }

  return recommendations;
}

export async function generateRiskGuidance(
  useCase: UseCaseWithRelations,
  decision: DecisionResult
): Promise<AIResponse<string[]>> {
  if (!isAIEnabled()) {
    // Generate basic guidance from risk flags
    const basicGuidance = decision.riskFlags.map(flag =>
      `Address ${flag} risk with appropriate controls and documentation.`
    );
    return {
      result: basicGuidance,
      aiEnhanced: false,
    };
  }

  try {
    const RiskGuidanceSchema = z.object({
      guidance: z.array(z.string()).describe('3-5 bullet points of risk-specific guidance'),
    });

    const { object } = await generateObject({
      model: getModel(),
      schema: RiskGuidanceSchema,
      system: DOCUMENT_GENERATION_SYSTEM_PROMPT,
      prompt: buildRiskGuidancePrompt(useCase, decision),
      maxTokens: 400,
    });

    return {
      result: object.guidance,
      aiEnhanced: true,
    };
  } catch (error) {
    console.error('AI Risk Guidance failed:', error);
    const basicGuidance = decision.riskFlags.map(flag =>
      `Address ${flag} risk with appropriate controls and documentation.`
    );
    return {
      result: basicGuidance,
      aiEnhanced: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Generate all document enhancements in one call
export async function generateDocumentEnhancements(
  useCase: UseCaseWithRelations,
  decision: DecisionResult,
  missingArtifacts: ArtifactDefinition[]
): Promise<AIResponse<AIDocumentEnhancement>> {
  if (!isAIEnabled()) {
    return {
      result: {
        executiveSummary: decision.rationaleSummary,
        artifactRecommendations: Object.fromEntries(
          missingArtifacts.map(a => [a.id, a.whatGoodLooksLike])
        ),
        riskGuidance: decision.riskFlags.map(flag =>
          `Address ${flag} risk with appropriate controls.`
        ),
      },
      aiEnhanced: false,
    };
  }

  try {
    // Run all AI generations in parallel
    const [summaryResult, guidanceResult, recommendationsResult] = await Promise.all([
      generateAIExecutiveSummary(useCase, decision),
      generateRiskGuidance(useCase, decision),
      generateArtifactRecommendations(missingArtifacts, useCase, decision),
    ]);

    return {
      result: {
        executiveSummary: summaryResult.result,
        artifactRecommendations: Object.fromEntries(
          Object.entries(recommendationsResult).map(([id, res]) => [id, res.result])
        ),
        riskGuidance: guidanceResult.result,
      },
      aiEnhanced: summaryResult.aiEnhanced || guidanceResult.aiEnhanced,
    };
  } catch (error) {
    console.error('AI Document Enhancements failed:', error);
    return {
      result: {
        executiveSummary: decision.rationaleSummary,
        artifactRecommendations: Object.fromEntries(
          missingArtifacts.map(a => [a.id, a.whatGoodLooksLike])
        ),
        riskGuidance: decision.riskFlags.map(flag =>
          `Address ${flag} risk with appropriate controls.`
        ),
      },
      aiEnhanced: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
