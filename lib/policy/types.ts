// Policy Management Types

export interface ValidationFrequencies {
  T3: number;
  T2: number;
  T1: number;
}

export interface TierDefinition {
  name: string;
  description: string;
  severity: number;
}

export interface RuleCondition {
  field?: string;
  operator?: 'eq' | 'neq' | 'in' | 'notIn' | 'contains' | 'notEmpty' | 'gt' | 'lt' | 'gte' | 'lte';
  value?: string | number | boolean | string[];
  all?: RuleCondition[];
  any?: RuleCondition[];
}

export interface RuleEffects {
  addRequiredArtifacts: string[];
  addRiskFlags: string[];
  triggeredCriteria: string;
}

export interface ExtractedRule {
  id: string;
  name: string;
  description?: string;
  tier: 'T1' | 'T2' | 'T3';
  conditions: RuleCondition;
  effects: RuleEffects;
}

export interface PolicyExtractionResult {
  validationFrequencies: ValidationFrequencies;
  tiers: Record<string, TierDefinition>;
  rules: ExtractedRule[];
  newRules: ExtractedRule[];
  modifiedRules: ExtractedRule[];
  extractionConfidence: number;
  notes: string[];
}

export interface ValidationFrequencyChange {
  current: number;
  new: number;
  changed: boolean;
}

export interface RuleChange {
  id: string;
  name: string;
  tier?: string;
  currentTier?: string;
  newTier?: string;
  description?: string;
  changes?: string[];
}

export interface PolicyDiffResult {
  validationFrequencyChanges: Record<string, ValidationFrequencyChange>;
  newRules: RuleChange[];
  removedRules: RuleChange[];
  modifiedRules: RuleChange[];
  summaryOfChanges: string;
  impactAssessment: string;
}

export interface AffectedModel {
  inventoryModelId: string;
  inventoryNumber: string;
  modelName: string;
  previousTier: string;
  newTier: string;
  tierChanged: boolean;
  previousFrequency: number;
  newFrequency: number;
  frequencyChanged: boolean;
  previousDueDate: Date;
  newDueDate: Date;
  dueDateChanged: boolean;
}

export interface PolicyPreviewResult {
  diff: PolicyDiffResult;
  affectedModels: AffectedModel[];
  totalModelsAffected: number;
  tierChanges: number;
  dueDateChanges: number;
}

export interface PolicyApplyResult {
  success: boolean;
  modelsUpdated: number;
  newValidationFrequencies: ValidationFrequencies;
  appliedAt: Date;
  errors?: string[];
}
