// Domain types for the Model Intake Risk Tiering application

export type ModelType = 'Traditional ML' | 'GenAI' | 'Rules' | 'Hybrid';
export type UsageType = 'Decisioning' | 'Advisory' | 'Automation';
export type HumanInLoop = 'Required' | 'Optional' | 'None';
export type CustomerImpact = 'Direct' | 'Indirect' | 'None';
export type Deployment = 'Internal tool' | 'Customer-facing' | '3rd-party' | 'Embedded';
export type TrainingDataSource = 'Internal' | 'Vendor' | 'Public' | 'Unknown' | 'N/A';
export type ChangeFrequency = 'Ad hoc' | 'Quarterly' | 'Monthly' | 'Continuous';
export type MonitoringCadence = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'None';
export type UseCaseStatus = 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Sent Back';
export type Tier = 'T1' | 'T2' | 'T3';
export type IsModel = 'Yes' | 'No' | 'Model-like';

export const REGULATORY_DOMAINS = [
  'AML',
  'BSA',
  'Lending',
  'Credit',
  'Privacy',
  'Consumer Protection',
  'Securities',
  'Insurance',
  'UDAAP',
  'CRA',
  'ECOA',
  'FCRA',
  'GLBA',
] as const;

export type RegulatoryDomain = typeof REGULATORY_DOMAINS[number];

export const BUSINESS_LINES = [
  'Retail Banking',
  'Commercial Banking',
  'Wealth Management',
  'Credit',
  'Lending',
  'Underwriting',
  'AML',
  'Fraud',
  'Operations',
  'Marketing',
  'Customer Service',
  'Risk Management',
  'Compliance',
  'IT',
  'Human Resources',
] as const;

export type BusinessLine = typeof BUSINESS_LINES[number];

export const ATTACHMENT_TYPES = [
  'Business one-pager',
  'Architecture diagram',
  'Vendor doc',
  'Data dictionary',
  'Test results',
  'Model documentation',
  'Other',
] as const;

export type AttachmentType = typeof ATTACHMENT_TYPES[number];

// Form data types
export interface UseCaseFormData {
  // Overview
  title: string;
  businessLine: string;
  description: string;
  intendedUsers?: string;

  // Use & Impact
  usageType: UsageType;
  customerImpact: CustomerImpact;
  humanInLoop: HumanInLoop;
  downstreamDecisions?: string;

  // Model Details
  modelType: ModelType;
  deployment: Deployment;
  vendorInvolved: boolean;
  vendorName?: string;
  modelDefinitionTrigger: boolean;
  explainabilityRequired: boolean;
  changeFrequency?: ChangeFrequency;
  retraining: boolean;
  overridesAllowed: boolean;
  fallbackPlanDefined: boolean;

  // Data & Privacy
  containsPii: boolean;
  containsNpi: boolean;
  sensitiveAttributesUsed: boolean;
  trainingDataSource?: TrainingDataSource;
  retentionPolicyDefined: boolean;
  loggingRequired: boolean;
  accessControlsDefined: boolean;

  // Regulatory
  regulatoryDomains: string[];

  // Controls & Monitoring
  monitoringCadence?: MonitoringCadence;
  humanReviewProcess?: string;
  incidentResponseContact?: string;
}

// Rules Engine types
export interface RuleCondition {
  field?: string;
  operator?: 'eq' | 'neq' | 'in' | 'notIn' | 'contains' | 'notEmpty' | 'gt' | 'lt' | 'gte' | 'lte';
  value?: any;
  all?: RuleCondition[];
  any?: RuleCondition[];
}

export interface RuleEffects {
  addRequiredArtifacts: string[];
  addRiskFlags: string[];
  triggeredCriteria: string;
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  tier: Tier;
  conditions: RuleCondition;
  effects: RuleEffects;
}

export interface TierDefinition {
  name: string;
  description: string;
  color: string;
  severity: number;
}

export interface RulesConfig {
  tiers: Record<Tier, TierDefinition>;
  defaultTier: Tier;
  rules: Rule[];
  modelDefinitionCriteria: Array<{
    id: string;
    name: string;
    description: string;
    conditions: RuleCondition;
    result: IsModel;
  }>;
}

// Artifact types
export interface ArtifactDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  ownerRole: string;
  whatGoodLooksLike: string;
  requiredForTiers: Tier[];
}

export interface ArtifactCategory {
  order: number;
  description: string;
}

export interface ArtifactsConfig {
  artifacts: Record<string, ArtifactDefinition>;
  categories: Record<string, ArtifactCategory>;
}

// Decision output
export interface DecisionResult {
  isModel: IsModel;
  tier: Tier;
  triggeredRules: Array<{
    id: string;
    name: string;
    tier: Tier;
    triggeredCriteria: string;
  }>;
  rationaleSummary: string;
  requiredArtifacts: string[];
  missingEvidence: string[];
  riskFlags: string[];
}

// API response types
export interface UseCaseWithRelations {
  id: string;
  title: string;
  businessLine: string;
  description: string;
  aiType: string;
  usageType: string;
  humanInLoop: string;
  customerImpact: string;
  regulatoryDomains: string;
  deployment: string;
  vendorInvolved: boolean;
  vendorName: string | null;
  intendedUsers: string | null;
  downstreamDecisions: string | null;
  containsPii: boolean;
  containsNpi: boolean;
  sensitiveAttributesUsed: boolean;
  trainingDataSource: string | null;
  retentionPolicyDefined: boolean;
  loggingRequired: boolean;
  accessControlsDefined: boolean;
  modelDefinitionTrigger: boolean;
  explainabilityRequired: boolean;
  changeFrequency: string | null;
  retraining: boolean;
  overridesAllowed: boolean;
  fallbackPlanDefined: boolean;
  monitoringCadence: string | null;
  humanReviewProcess: string | null;
  incidentResponseContact: string | null;
  status: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  reviewerNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  decision?: {
    id: string;
    isModel: string;
    tier: string;
    triggeredRules: string;
    rationaleSummary: string;
    requiredArtifacts: string;
    missingEvidence: string;
    riskFlags: string;
    generatedDocuments: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  attachments?: Array<{
    id: string;
    filename: string;
    type: string;
    storagePath: string;
    fileSize: number | null;
    mimeType: string | null;
    createdAt: Date;
  }>;
  auditEvents?: Array<{
    id: string;
    actor: string;
    eventType: string;
    details: string | null;
    diffSummary: string | null;
    timestamp: Date;
  }>;
}

// =============================================
// INVENTORY MANAGEMENT TYPES
// =============================================

export type InventoryStatus = 'Active' | 'Retired' | 'Suspended';
export type ValidationType = 'Initial' | 'Periodic' | 'Triggered' | 'Ad-hoc';
export type ValidationResult = 'Satisfactory' | 'Satisfactory with Findings' | 'Unsatisfactory';
export type ValidationStatusType = 'In Progress' | 'Completed' | 'Cancelled';
export type FindingSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
export type FindingCategory = 'Performance' | 'Documentation' | 'Controls' | 'Data Quality' | 'Other';
export type RemediationStatus = 'Open' | 'In Progress' | 'Remediated' | 'Accepted';

export interface ValidationFindingData {
  id: string;
  validationId: string;
  findingNumber: string;
  title: string;
  description: string;
  severity: FindingSeverity;
  category: FindingCategory | null;
  remediationStatus: RemediationStatus;
  remediationNotes: string | null;
  remediationDueDate: Date | null;
  remediatedAt: Date | null;
  remediatedBy: string | null;
  mrmSignedOff: boolean;
  mrmSignOffDate: Date | null;
  mrmSignOffBy: string | null;
  mrmSignOffNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ValidationData {
  id: string;
  inventoryModelId: string;
  validationType: ValidationType;
  validationDate: Date;
  validatedBy: string;
  status: ValidationStatusType;
  overallResult: ValidationResult | null;
  summaryNotes: string | null;
  reportFilename: string | null;
  reportStoragePath: string | null;
  createdAt: Date;
  updatedAt: Date;
  findings?: ValidationFindingData[];
}

export interface InventoryModelData {
  id: string;
  useCaseId: string;
  inventoryNumber: string;
  addedToInventoryAt: Date;
  addedBy: string;
  tier: Tier;
  validationFrequencyMonths: number;
  productionDate: Date | null;
  validatedBeforeProduction: boolean;
  lastValidationDate: Date | null;
  nextValidationDue: Date;
  status: InventoryStatus;
  createdAt: Date;
  updatedAt: Date;
  useCase?: UseCaseWithRelations;
  validations?: ValidationData[];
}

export interface InventoryModelWithDetails extends InventoryModelData {
  useCase: UseCaseWithRelations;
  validations: ValidationData[];
  // Computed fields
  validationStatus: 'overdue' | 'upcoming' | 'current';
  openFindingsCount: number;
  totalFindingsCount: number;
}

export interface InventoryStats {
  totalModels: number;
  byTier: {
    T1: number;
    T2: number;
    T3: number;
  };
  byStatus: {
    Active: number;
    Retired: number;
    Suspended: number;
  };
  validationStatus: {
    overdue: number;
    upcoming: number;
    current: number;
  };
  openFindings: number;
  aiEnabled: number;
  vendorModels: number;
}
