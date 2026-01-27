// Document Generation Prompt Templates

import type { UseCaseWithRelations, DecisionResult, ArtifactDefinition } from '@/lib/types';

export function buildExecutiveSummaryPrompt(
  useCase: UseCaseWithRelations,
  decision: DecisionResult
): string {
  return `You are writing an executive summary for a model risk governance memo at a financial institution.

## Use Case Information

**Title:** ${useCase.title}
**Business Line:** ${useCase.businessLine}
**Description:** ${useCase.description}
**Model Type:** ${useCase.aiType}
**Usage Type:** ${useCase.usageType}
**Customer Impact:** ${useCase.customerImpact}

## Decision

**Risk Tier:** ${decision.tier} (${decision.tier === 'T3' ? 'High Risk' : decision.tier === 'T2' ? 'Medium Risk' : 'Low Risk'})
**Model Determination:** ${decision.isModel}
**Risk Flags:** ${decision.riskFlags.join(', ') || 'None'}

## Triggered Rules
${decision.triggeredRules.map(r => `- ${r.name}: ${r.triggeredCriteria}`).join('\n')}

## Task

Write a 2-3 paragraph executive summary for this governance memo. The summary should:
1. Clearly state the purpose and scope of the use case
2. Explain the risk tier assignment and key factors that drove it
3. Highlight any critical governance requirements or concerns

Write in a professional, concise style appropriate for a model risk committee or senior leadership audience. Avoid jargon where possible.`;
}

export function buildArtifactRecommendationPrompt(
  artifact: ArtifactDefinition,
  useCase: UseCaseWithRelations,
  decision: DecisionResult
): string {
  return `You are a model risk governance advisor providing guidance on a required artifact.

## Artifact Details

**Name:** ${artifact.name}
**Category:** ${artifact.category}
**Standard Description:** ${artifact.description}
**Owner Role:** ${artifact.ownerRole}
**Standard Guidance:** ${artifact.whatGoodLooksLike}

## Use Case Context

**Title:** ${useCase.title}
**Business Line:** ${useCase.businessLine}
**Model Type:** ${useCase.aiType}
**Usage Type:** ${useCase.usageType}
**Risk Tier:** ${decision.tier}
**Risk Flags:** ${decision.riskFlags.join(', ') || 'None'}

## Task

Write a 2-3 sentence recommendation explaining:
1. Why this artifact is important for THIS specific use case
2. What specific aspects should be addressed given the use case's characteristics

Be specific to the use case context, not generic. Reference relevant risk flags or triggered rules if applicable.`;
}

export function buildRiskGuidancePrompt(
  useCase: UseCaseWithRelations,
  decision: DecisionResult
): string {
  return `You are a model risk governance advisor providing risk-specific guidance.

## Use Case

**Title:** ${useCase.title}
**Model Type:** ${useCase.aiType}
**Usage Type:** ${useCase.usageType}
**Deployment:** ${useCase.deployment}
**Customer Impact:** ${useCase.customerImpact}

## Risk Profile

**Risk Tier:** ${decision.tier}
**Risk Flags:** ${decision.riskFlags.join(', ') || 'None'}
**Triggered Rules:**
${decision.triggeredRules.map(r => `- ${r.name}`).join('\n')}

## Task

Provide 3-5 bullet points of risk-specific guidance for this use case. Each point should:
- Address a specific risk flag or triggered rule
- Provide actionable guidance
- Be appropriate for the risk tier level

Keep each point to 1-2 sentences.`;
}

export const DOCUMENT_GENERATION_SYSTEM_PROMPT = `You are a model risk management documentation specialist. Your writing is:
- Clear and professional
- Specific to the use case at hand
- Appropriate for regulatory review
- Action-oriented where relevant

Avoid generic statements. Every sentence should add specific value for the reader.`;
