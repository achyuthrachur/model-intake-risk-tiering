import { loadRulesConfig, loadArtifactsConfig } from './config-loader';
import type {
  RuleCondition,
  Rule,
  Tier,
  IsModel,
  DecisionResult,
  UseCaseWithRelations,
  ArtifactDefinition,
} from './types';

// Flatten use case data for easier evaluation
function flattenUseCase(useCase: UseCaseWithRelations): Record<string, any> {
  return {
    title: useCase.title,
    businessLine: useCase.businessLine,
    description: useCase.description,
    aiType: useCase.aiType,
    usageType: useCase.usageType,
    humanInLoop: useCase.humanInLoop,
    customerImpact: useCase.customerImpact,
    regulatoryDomains: JSON.parse(useCase.regulatoryDomains || '[]'),
    deployment: useCase.deployment,
    vendorInvolved: useCase.vendorInvolved,
    vendorName: useCase.vendorName,
    intendedUsers: useCase.intendedUsers,
    downstreamDecisions: useCase.downstreamDecisions,
    containsPii: useCase.containsPii,
    containsNpi: useCase.containsNpi,
    sensitiveAttributesUsed: useCase.sensitiveAttributesUsed,
    trainingDataSource: useCase.trainingDataSource,
    retentionPolicyDefined: useCase.retentionPolicyDefined,
    loggingRequired: useCase.loggingRequired,
    accessControlsDefined: useCase.accessControlsDefined,
    modelDefinitionTrigger: useCase.modelDefinitionTrigger,
    explainabilityRequired: useCase.explainabilityRequired,
    changeFrequency: useCase.changeFrequency,
    retraining: useCase.retraining,
    overridesAllowed: useCase.overridesAllowed,
    fallbackPlanDefined: useCase.fallbackPlanDefined,
    monitoringCadence: useCase.monitoringCadence,
    humanReviewProcess: useCase.humanReviewProcess,
    incidentResponseContact: useCase.incidentResponseContact,
    status: useCase.status,
    hasAttachments: (useCase.attachments?.length || 0) > 0,
    attachmentTypes: useCase.attachments?.map(a => a.type) || [],
  };
}

// Evaluate a single condition against the data
function evaluateCondition(condition: RuleCondition, data: Record<string, any>): boolean {
  // Handle logical operators
  if (condition.all) {
    return condition.all.every(subCondition => evaluateCondition(subCondition, data));
  }

  if (condition.any) {
    return condition.any.some(subCondition => evaluateCondition(subCondition, data));
  }

  // Handle field-based conditions
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
      if (Array.isArray(targetValue)) {
        return targetValue.includes(fieldValue);
      }
      return false;

    case 'notIn':
      if (Array.isArray(targetValue)) {
        return !targetValue.includes(fieldValue);
      }
      return true;

    case 'contains':
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(targetValue);
      }
      if (typeof fieldValue === 'string') {
        return fieldValue.includes(targetValue);
      }
      return false;

    case 'notEmpty':
      if (Array.isArray(fieldValue)) {
        return fieldValue.length > 0;
      }
      if (typeof fieldValue === 'string') {
        return fieldValue.trim().length > 0;
      }
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
function resolveTier(triggeredRules: Rule[], defaultTier: Tier): Tier {
  const config = loadRulesConfig();
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
function determineIsModel(data: Record<string, any>): IsModel {
  const config = loadRulesConfig();
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
  tier: Tier
): string[] {
  const artifactsConfig = loadArtifactsConfig();
  const artifactSet = new Set<string>();

  // Add artifacts from triggered rules
  triggeredRules.forEach(rule => {
    rule.effects.addRequiredArtifacts?.forEach(artifactId => {
      artifactSet.add(artifactId);
    });
  });

  // Add artifacts required by tier
  Object.values(artifactsConfig.artifacts).forEach(artifact => {
    if (artifact.requiredForTiers?.includes(tier)) {
      artifactSet.add(artifact.id);
    }
  });

  return Array.from(artifactSet);
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

// Detect missing evidence based on required artifacts and available data/attachments
function detectMissingEvidence(
  data: Record<string, any>,
  requiredArtifacts: string[]
): string[] {
  const artifactsConfig = loadArtifactsConfig();
  const missing: string[] = [];

  // Map artifact requirements to data checks
  const evidenceChecks: Record<string, () => boolean> = {
    DataRetentionPolicy: () => data.retentionPolicyDefined === true,
    AccessControlMatrix: () => data.accessControlsDefined === true,
    FallbackProcedure: () => data.fallbackPlanDefined === true,
    MonitoringPlan: () => data.monitoringCadence && data.monitoringCadence !== 'None',
    BasicMonitoringPlan: () => data.monitoringCadence && data.monitoringCadence !== 'None',
    VendorDueDiligence: () => !data.vendorInvolved || data.attachmentTypes.includes('Vendor doc'),
  };

  requiredArtifacts.forEach(artifactId => {
    const artifact = artifactsConfig.artifacts[artifactId];
    if (!artifact) return;

    // Check if we have a specific evidence check for this artifact
    const check = evidenceChecks[artifactId];
    if (check && !check()) {
      missing.push(artifactId);
    }

    // Check for attachment-based evidence
    const attachmentBasedArtifacts = [
      'ValidationPlan',
      'ModelCard',
      'FairnessAssessment',
      'BiasTestingResults',
      'LLMEvalSuite',
      'GuardrailsDesign',
      'HallucinationTestResults',
      'PromptInjectionTests',
    ];

    if (attachmentBasedArtifacts.includes(artifactId) && !data.hasAttachments) {
      missing.push(artifactId);
    }
  });

  // Remove duplicates
  return Array.from(new Set(missing));
}

// Generate rationale summary
function generateRationale(
  tier: Tier,
  isModel: IsModel,
  triggeredRules: Rule[],
  riskFlags: string[]
): string {
  const config = loadRulesConfig();
  const tierDef = config.tiers[tier];

  const parts: string[] = [];

  // Model determination
  if (isModel === 'Yes') {
    parts.push('This use case qualifies as a model under MRM policy.');
  } else if (isModel === 'Model-like') {
    parts.push('This use case exhibits model-like characteristics and requires enhanced oversight.');
  } else {
    parts.push('This use case does not meet the model definition criteria.');
  }

  // Tier assignment
  parts.push(`Risk tier assigned: ${tier} (${tierDef.name}) - ${tierDef.description}.`);

  // Triggered criteria
  if (triggeredRules.length > 0) {
    parts.push('Triggered criteria:');
    triggeredRules.forEach(rule => {
      parts.push(`- ${rule.effects.triggeredCriteria}`);
    });
  }

  // Risk flags
  if (riskFlags.length > 0) {
    parts.push(`Risk flags identified: ${riskFlags.join(', ')}.`);
  }

  return parts.join('\n');
}

// Main decision engine function
export function evaluateUseCase(useCase: UseCaseWithRelations): DecisionResult {
  const config = loadRulesConfig();
  const data = flattenUseCase(useCase);

  // Evaluate rules
  const triggeredRules = evaluateRules(data, config.rules);

  // Determine tier
  const tier = resolveTier(triggeredRules, config.defaultTier);

  // Determine model status
  const isModel = determineIsModel(data);

  // Collect risk flags
  const riskFlags = collectRiskFlags(triggeredRules);

  // Collect required artifacts
  const requiredArtifacts = collectRequiredArtifacts(triggeredRules, tier);

  // Detect missing evidence
  const missingEvidence = detectMissingEvidence(data, requiredArtifacts);

  // Generate rationale
  const rationaleSummary = generateRationale(tier, isModel, triggeredRules, riskFlags);

  return {
    isModel,
    tier,
    triggeredRules: triggeredRules.map(rule => ({
      id: rule.id,
      name: rule.name,
      tier: rule.tier,
      triggeredCriteria: rule.effects.triggeredCriteria,
    })),
    rationaleSummary,
    requiredArtifacts,
    missingEvidence,
    riskFlags,
  };
}

// Get artifact details by IDs
export function getArtifactDetails(artifactIds: string[]): ArtifactDefinition[] {
  const config = loadArtifactsConfig();
  return artifactIds
    .map(id => config.artifacts[id])
    .filter(Boolean);
}

// Get tier information
export function getTierInfo(tier: Tier) {
  const config = loadRulesConfig();
  return config.tiers[tier];
}

// Export config for UI use
export function getConfig() {
  return {
    rules: loadRulesConfig(),
    artifacts: loadArtifactsConfig(),
  };
}
