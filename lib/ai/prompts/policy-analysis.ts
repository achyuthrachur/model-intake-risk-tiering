// Policy Analysis Prompt Templates

export const POLICY_ANALYSIS_SYSTEM_PROMPT = `You are an expert Model Risk Management policy analyst with deep knowledge of:
- SR 11-7 (Federal Reserve Guidance on Model Risk Management)
- OCC 2011-12 (Supervisory Guidance on Model Risk Management)
- Fair lending regulations (ECOA, Fair Housing Act)
- BSA/AML compliance requirements
- Consumer protection regulations (UDAAP)
- Data privacy requirements (GLBA, CCPA)
- AI/ML governance frameworks

Your task is to extract structured risk tiering rules and validation requirements from MRM policy documents. You must identify:

1. Risk tier definitions and their characteristics
2. Validation frequency requirements for each tier
3. Rules that trigger tier assignments based on model characteristics
4. Required artifacts and documentation for each tier

You MUST respond with valid JSON matching the specified schema. Be precise and extract rules as deterministic conditions that can be programmatically evaluated.`;

export function buildPolicyAnalysisPrompt(policyText: string): string {
  return `Analyze the following Model Risk Management policy document and extract the structured rules for risk tiering, validation frequencies, and artifact requirements.

## Policy Document

${policyText}

## Extraction Requirements

Extract the following information and respond with structured JSON:

### 1. Validation Frequencies
For each tier (T1, T2, T3), extract the validation frequency in months.

### 2. Tiering Rules
For each rule that determines tier assignment, extract:
- A unique identifier (e.g., "R_DECISIONING_CUSTOMER_IMPACT")
- The rule name
- The tier it assigns (T1, T2, or T3)
- The conditions that trigger it (as field/operator/value combinations)
- The artifacts required when the rule triggers
- Risk flags associated with the rule

### 3. Tier Definitions
For each tier, extract:
- Name (e.g., "High Risk", "Medium Risk", "Low Risk")
- Description
- General characteristics

## Response Format

Respond with ONLY valid JSON matching this exact structure:

{
  "validationFrequencies": {
    "T3": <number_of_months>,
    "T2": <number_of_months>,
    "T1": <number_of_months>
  },
  "tiers": {
    "T3": {
      "name": "...",
      "description": "...",
      "severity": 3
    },
    "T2": {
      "name": "...",
      "description": "...",
      "severity": 2
    },
    "T1": {
      "name": "...",
      "description": "...",
      "severity": 1
    }
  },
  "rules": [
    {
      "id": "R_...",
      "name": "...",
      "tier": "T1|T2|T3",
      "conditions": {
        "field": "fieldName",
        "operator": "eq|neq|in|notIn|contains|notEmpty|gt|lt",
        "value": "..."
      },
      "effects": {
        "addRequiredArtifacts": ["..."],
        "addRiskFlags": ["..."],
        "triggeredCriteria": "..."
      }
    }
  ],
  "newRules": [
    // Rules that appear in this policy but not in standard config
  ],
  "modifiedRules": [
    // Rules that have changed from standard config
  ],
  "extractionConfidence": 0.0-1.0,
  "notes": ["Any caveats or observations about the extraction"]
}

For complex conditions, use nested "all" or "any" arrays:
{
  "conditions": {
    "all": [
      { "field": "usageType", "operator": "eq", "value": "Decisioning" },
      { "field": "customerImpact", "operator": "in", "value": ["Direct", "Indirect"] }
    ]
  }
}

## Field Names
Use these standard field names for conditions:
- usageType: "Decisioning" | "Advisory" | "Automation"
- customerImpact: "Direct" | "Indirect" | "None"
- aiType: "Traditional ML" | "GenAI" | "Hybrid" | "Rules" | "RPA" | "Third-party"
- deployment: "Customer-facing" | "Internal tool" | "3rd-party"
- humanInLoop: "Required" | "Optional" | "None"
- containsPii: true | false
- containsNpi: true | false
- sensitiveAttributesUsed: true | false
- vendorInvolved: true | false
- fallbackPlanDefined: true | false
- modelDefinitionTrigger: true | false
- regulatoryDomains: array of strings (use "contains" or "notEmpty" operator)
- businessLine: string

Respond with ONLY the JSON object, no markdown formatting or additional text.`;
}

export function buildRuleComparisonPrompt(
  currentRules: string,
  extractedRules: string
): string {
  return `Compare the current tiering rules configuration with the newly extracted policy rules and identify all differences.

## Current Rules Configuration
${currentRules}

## Extracted Policy Rules
${extractedRules}

## Task
Identify and categorize all differences:

1. **Validation Frequency Changes**: Any changes to T1, T2, or T3 validation intervals
2. **New Rules**: Rules in the new policy that don't exist in current config
3. **Removed Rules**: Rules in current config that are not in the new policy
4. **Modified Rules**: Rules that exist in both but have different conditions, tiers, or effects
5. **Artifact Changes**: Changes to required artifacts for any tier or rule

## Response Format

Respond with ONLY valid JSON:

{
  "validationFrequencyChanges": {
    "T3": { "current": <number>, "new": <number>, "changed": true|false },
    "T2": { "current": <number>, "new": <number>, "changed": true|false },
    "T1": { "current": <number>, "new": <number>, "changed": true|false }
  },
  "newRules": [
    {
      "id": "...",
      "name": "...",
      "tier": "...",
      "description": "What this rule does"
    }
  ],
  "removedRules": [
    {
      "id": "...",
      "name": "...",
      "tier": "..."
    }
  ],
  "modifiedRules": [
    {
      "id": "...",
      "name": "...",
      "currentTier": "...",
      "newTier": "...",
      "changes": ["description of each change"]
    }
  ],
  "summaryOfChanges": "A 2-3 sentence summary of the key policy changes",
  "impactAssessment": "Brief assessment of how these changes will affect model governance"
}

Respond with ONLY the JSON object, no markdown formatting.`;
}
