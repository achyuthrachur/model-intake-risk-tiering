import { NextResponse } from 'next/server';
import { loadRulesConfig, loadArtifactsConfig } from '@/lib/config-loader';
import type { UseCaseFormData, RuleCondition, Rule, Tier, IsModel, ArtifactDefinition } from '@/lib/types';

// Flatten form data for evaluation (similar to flattenUseCase but works with form data)
function flattenFormData(formData: UseCaseFormData): Record<string, any> {
  return {
    title: formData.title,
    businessLine: formData.businessLine,
    description: formData.description,
    aiType: formData.modelType, // Map modelType to aiType for rules evaluation
    usageType: formData.usageType,
    humanInLoop: formData.humanInLoop,
    customerImpact: formData.customerImpact,
    regulatoryDomains: formData.regulatoryDomains || [],
    deployment: formData.deployment,
    vendorInvolved: formData.vendorInvolved,
    vendorName: formData.vendorName || '',
    intendedUsers: formData.intendedUsers || '',
    downstreamDecisions: formData.downstreamDecisions || '',
    containsPii: formData.containsPii,
    containsNpi: formData.containsNpi,
    sensitiveAttributesUsed: formData.sensitiveAttributesUsed,
    trainingDataSource: formData.trainingDataSource || 'Internal',
    retentionPolicyDefined: formData.retentionPolicyDefined,
    loggingRequired: formData.loggingRequired,
    accessControlsDefined: formData.accessControlsDefined,
    modelDefinitionTrigger: formData.modelDefinitionTrigger,
    explainabilityRequired: formData.explainabilityRequired,
    changeFrequency: formData.changeFrequency || 'Quarterly',
    retraining: formData.retraining,
    overridesAllowed: formData.overridesAllowed,
    fallbackPlanDefined: formData.fallbackPlanDefined,
    monitoringCadence: formData.monitoringCadence || 'Monthly',
    humanReviewProcess: formData.humanReviewProcess || '',
    incidentResponseContact: formData.incidentResponseContact || '',
    hasAttachments: false,
    attachmentTypes: [],
  };
}

// Evaluate a single condition against the data
function evaluateCondition(condition: RuleCondition, data: Record<string, any>): boolean {
  if (condition.all) {
    return condition.all.every(subCondition => evaluateCondition(subCondition, data));
  }

  if (condition.any) {
    return condition.any.some(subCondition => evaluateCondition(subCondition, data));
  }

  if (!condition.field || !condition.operator) {
    return false;
  }

  const fieldValue = data[condition.field];
  const targetValue = condition.value;

  switch (condition.operator) {
    case 'eq':
      return fieldValue === targetValue;
    case 'neq':
      return fieldValue !== targetValue;
    case 'in':
      return Array.isArray(targetValue) ? targetValue.includes(fieldValue) : false;
    case 'notIn':
      return Array.isArray(targetValue) ? !targetValue.includes(fieldValue) : true;
    case 'contains':
      if (Array.isArray(fieldValue)) return fieldValue.includes(targetValue);
      if (typeof fieldValue === 'string') return fieldValue.includes(targetValue);
      return false;
    case 'notEmpty':
      if (Array.isArray(fieldValue)) return fieldValue.length > 0;
      if (typeof fieldValue === 'string') return fieldValue.trim().length > 0;
      return fieldValue !== null && fieldValue !== undefined;
    case 'gt':
      return typeof fieldValue === 'number' && fieldValue > targetValue;
    case 'lt':
      return typeof fieldValue === 'number' && fieldValue < targetValue;
    case 'gte':
      return typeof fieldValue === 'number' && fieldValue >= targetValue;
    case 'lte':
      return typeof fieldValue === 'number' && fieldValue <= targetValue;
    default:
      return false;
  }
}

// Evaluate all rules and return triggered ones
function evaluateRules(data: Record<string, any>, rules: Rule[]): Rule[] {
  return rules.filter(rule => evaluateCondition(rule.conditions, data));
}

// Determine the highest severity tier from triggered rules
function resolveTier(triggeredRules: Rule[], config: any, defaultTier: Tier): Tier {
  let maxSeverity = config.tiers[defaultTier].severity;
  let resolvedTier = defaultTier;

  triggeredRules.forEach(rule => {
    const tierDef = config.tiers[rule.tier];
    if (tierDef && tierDef.severity > maxSeverity) {
      maxSeverity = tierDef.severity;
      resolvedTier = rule.tier;
    }
  });

  return resolvedTier;
}

// Determine if use case qualifies as a "model"
function determineIsModel(data: Record<string, any>, config: any): IsModel {
  let isModel: IsModel = 'No';

  for (const criterion of config.modelDefinitionCriteria || []) {
    if (evaluateCondition(criterion.conditions, data)) {
      if (criterion.result === 'Yes') {
        return 'Yes';
      }
      if (criterion.result === 'Model-like') {
        isModel = 'Model-like';
      }
    }
  }

  return isModel;
}

// Collect all required artifacts from triggered rules and tier
function collectRequiredArtifacts(
  triggeredRules: Rule[],
  tier: Tier,
  artifactsConfig: any
): ArtifactDefinition[] {
  const artifactSet = new Set<string>();

  // Add artifacts from triggered rules
  triggeredRules.forEach(rule => {
    rule.effects.addRequiredArtifacts?.forEach(artifactId => {
      artifactSet.add(artifactId);
    });
  });

  // Add artifacts required by tier
  Object.values(artifactsConfig.artifacts).forEach((artifact: any) => {
    if (artifact.requiredForTiers?.includes(tier)) {
      artifactSet.add(artifact.id);
    }
  });

  // Convert IDs to full artifact definitions
  return Array.from(artifactSet)
    .map(id => artifactsConfig.artifacts[id])
    .filter(Boolean);
}

// Collect all risk flags from triggered rules
function collectRiskFlags(triggeredRules: Rule[]): string[] {
  const flagSet = new Set<string>();

  triggeredRules.forEach(rule => {
    rule.effects.addRiskFlags?.forEach(flag => {
      flagSet.add(flag);
    });
  });

  return Array.from(flagSet);
}

export async function POST(request: Request) {
  try {
    const formData: UseCaseFormData = await request.json();

    const rulesConfig = loadRulesConfig();
    const artifactsConfig = loadArtifactsConfig();

    // Flatten the form data for evaluation
    const data = flattenFormData(formData);

    // Evaluate rules
    const triggeredRules = evaluateRules(data, rulesConfig.rules);

    // Determine tier
    const tier = resolveTier(triggeredRules, rulesConfig, rulesConfig.defaultTier);

    // Determine model status
    const isModel = determineIsModel(data, rulesConfig);

    // Collect risk flags
    const riskFlags = collectRiskFlags(triggeredRules);

    // Collect required artifacts with full definitions
    const requiredArtifacts = collectRequiredArtifacts(triggeredRules, tier, artifactsConfig);

    // Get tier info
    const tierInfo = rulesConfig.tiers[tier];

    return NextResponse.json({
      tier,
      tierInfo: {
        name: tierInfo.name,
        description: tierInfo.description,
        color: tierInfo.color,
      },
      isModel,
      triggeredRules: triggeredRules.map(rule => ({
        id: rule.id,
        name: rule.name,
        tier: rule.tier,
        triggeredCriteria: rule.effects.triggeredCriteria,
      })),
      requiredArtifacts,
      riskFlags,
      isPreview: true,
    });
  } catch (error) {
    console.error('Tier preview error:', error);
    return NextResponse.json(
      { error: 'Failed to generate tier preview' },
      { status: 500 }
    );
  }
}
