// AI Risk Assessment Service

import { generateObject } from 'ai';
import { z } from 'zod';
import { getModel } from './openai-client';
import { isAIEnabled } from './config';
import { buildRiskAssessmentPrompt, RISK_ASSESSMENT_SYSTEM_PROMPT } from './prompts/risk-assessment';
import type { AIRiskAssessmentResult, AIResponse } from './types';
import type { UseCaseWithRelations, DecisionResult } from '@/lib/types';

// Schema for structured AI output
const RiskAssessmentSchema = z.object({
  enhancedRationale: z.string().describe('A 2-3 paragraph narrative explaining the risk tier assignment'),
  mitigationRecommendations: z.array(z.string()).describe('3-5 specific, actionable recommendations'),
  blindSpots: z.array(z.string()).describe('2-3 potential risks not captured by standard rules'),
  executiveSummary: z.string().describe('2-3 sentence summary for senior leadership'),
  confidenceNotes: z.string().optional().describe('Any caveats or limitations in the assessment'),
});

export async function generateAIRiskAssessment(
  useCase: UseCaseWithRelations,
  decision: DecisionResult
): Promise<AIResponse<AIRiskAssessmentResult | null>> {
  // Check if AI is enabled
  if (!isAIEnabled()) {
    return {
      result: null,
      aiEnhanced: false,
      error: 'AI features are not enabled. Set OPENAI_API_KEY to enable.',
    };
  }

  try {
    const prompt = buildRiskAssessmentPrompt(useCase, decision);

    const { object } = await generateObject({
      model: getModel(),
      schema: RiskAssessmentSchema,
      system: RISK_ASSESSMENT_SYSTEM_PROMPT,
      prompt,
      maxTokens: 2000,
    });

    return {
      result: object,
      aiEnhanced: true,
    };
  } catch (error) {
    console.error('AI Risk Assessment failed:', error);
    return {
      result: null,
      aiEnhanced: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Helper to merge AI assessment with existing decision
export function mergeAIAssessment(
  decision: DecisionResult,
  aiAssessment: AIRiskAssessmentResult | null
): DecisionResult & { aiInsights?: AIRiskAssessmentResult } {
  if (!aiAssessment) {
    return decision;
  }

  return {
    ...decision,
    aiInsights: aiAssessment,
  };
}
