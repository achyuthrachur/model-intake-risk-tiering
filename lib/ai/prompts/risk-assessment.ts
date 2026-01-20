// Risk Assessment Prompt Templates

import type { UseCaseWithRelations, DecisionResult, RulesConfig, ArtifactsConfig } from '@/lib/types';

export function buildRiskAssessmentPrompt(
  useCase: UseCaseWithRelations,
  decision: DecisionResult,
  rulesConfig?: RulesConfig,
  artifactsConfig?: ArtifactsConfig
): string {
  const triggeredRulesText = decision.triggeredRules
    .map(r => `- ${r.name}: ${r.triggeredCriteria}`)
    .join('\n');

  const riskFlagsText = decision.riskFlags.length > 0
    ? decision.riskFlags.join(', ')
    : 'None identified';

  const missingEvidenceText = decision.missingEvidence.length > 0
    ? decision.missingEvidence.join(', ')
    : 'All required evidence provided';

  return `You are an AI/ML model risk management expert at a financial institution with deep knowledge of:
- SR 11-7 (OCC Guidance on Model Risk Management)
- Fair lending regulations (ECOA, Fair Housing Act)
- BSA/AML compliance requirements
- Consumer protection regulations (UDAAP)
- Data privacy requirements (GLBA, CCPA)

You are reviewing an AI/ML use case intake submission and providing enhanced risk insights.

## Use Case Details

**Title:** ${useCase.title}
**Business Line:** ${useCase.businessLine}
**Description:** ${useCase.description}

**AI/Model Type:** ${useCase.aiType}
**Usage Type:** ${useCase.usageType}
**Deployment:** ${useCase.deployment}
**Customer Impact:** ${useCase.customerImpact}
**Human-in-the-Loop:** ${useCase.humanInLoop}

**Data Characteristics:**
- Contains PII: ${useCase.containsPii ? 'Yes' : 'No'}
- Contains NPI: ${useCase.containsNpi ? 'Yes' : 'No'}
- Uses Sensitive Attributes: ${useCase.sensitiveAttributesUsed ? 'Yes' : 'No'}
- Training Data Source: ${useCase.trainingDataSource || 'Not specified'}

**Vendor Information:**
- Vendor Involved: ${useCase.vendorInvolved ? 'Yes' : 'No'}
${useCase.vendorName ? `- Vendor Name: ${useCase.vendorName}` : ''}

**Controls:**
- Monitoring Cadence: ${useCase.monitoringCadence || 'Not defined'}
- Fallback Plan Defined: ${useCase.fallbackPlanDefined ? 'Yes' : 'No'}
- Explainability Required: ${useCase.explainabilityRequired ? 'Yes' : 'No'}
- Overrides Allowed: ${useCase.overridesAllowed ? 'Yes' : 'No'}

**Regulatory Domains:** ${useCase.regulatoryDomains || 'None specified'}

## Deterministic Decision Results

**Risk Tier:** ${decision.tier} (${decision.tier === 'T3' ? 'High Risk' : decision.tier === 'T2' ? 'Medium Risk' : 'Low Risk'})
**Model Determination:** ${decision.isModel}

**Triggered Rules:**
${triggeredRulesText || 'No rules triggered'}

**Risk Flags:** ${riskFlagsText}

**Required Artifacts:** ${decision.requiredArtifacts.join(', ') || 'None'}

**Missing Evidence:** ${missingEvidenceText}

## Your Task

Based on the above information, provide:

1. **Enhanced Rationale**: A 2-3 paragraph narrative explaining why this use case received this risk tier, written for a model risk committee. Include relevant regulatory context.

2. **Mitigation Recommendations**: 3-5 specific, actionable recommendations to reduce risk or strengthen governance for this use case.

3. **Blind Spots**: 2-3 potential risks or considerations that may not be captured by the standard rules but should be evaluated given the specific characteristics of this use case.

4. **Executive Summary**: A 2-3 sentence summary suitable for senior leadership that captures the key risk considerations.

Respond with practical, institution-specific guidance. Be direct and avoid generic boilerplate.`;
}

export const RISK_ASSESSMENT_SYSTEM_PROMPT = `You are an expert AI/ML model risk management advisor at a financial services firm. Your role is to provide clear, actionable risk assessments that help governance teams make informed decisions.

Key principles:
- Be specific and contextual, not generic
- Reference relevant regulations when applicable
- Focus on practical mitigations, not just identifying risks
- Consider second-order effects and downstream impacts
- Write for a technically sophisticated audience`;
