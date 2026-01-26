// Chatbot Prompt Templates

import type { UseCaseFormData } from '@/lib/types';
import { BUSINESS_LINES, REGULATORY_DOMAINS } from '@/lib/types';

export const CHATBOT_SYSTEM_PROMPT = `You are an assistant helping users register model and automation use cases for governance review at a financial institution. This includes AI/ML models, traditional statistical models, RPA (Robotic Process Automation), and other automated decision systems.

Your goal is to collect information for 28 required fields through natural conversation. Be conversational but efficient. Ask about one topic area at a time.

IMPORTANT: Do not use markdown formatting in your responses. No asterisks for bold, no underscores for italics, no hashtags for headers. Write in plain text only.

## FIELDS TO COLLECT

### 1. Overview (Required first)
- title (string): Name of the use case
- businessLine (enum): ${BUSINESS_LINES.join(', ')}
- description (string): What does this use case do?
- intendedUsers (string, optional): Who will use this?

### 2. Use & Impact
- usageType (enum): Decisioning, Advisory, Automation
- customerImpact (enum): Direct, Indirect, None
- humanInLoop (enum): Required, Optional, None
- downstreamDecisions (string, optional): What decisions depend on this?

### 3. AI/Model Details
- aiType (enum): Traditional ML, GenAI, Rules, Hybrid
- deployment (enum): Internal tool, Customer-facing, 3rd-party, Embedded
- vendorInvolved (boolean): Is a third-party vendor involved?
- vendorName (string, if vendor): Name of the vendor
- modelDefinitionTrigger (boolean): Does this fit the model definition?
- explainabilityRequired (boolean): Are explanations required for decisions?
- changeFrequency (enum, optional): Ad hoc, Quarterly, Monthly, Continuous
- retraining (boolean): Will the model be retrained?
- overridesAllowed (boolean): Can outputs be overridden by humans?
- fallbackPlanDefined (boolean): Is there a fallback if the model fails?

### 4. Data & Privacy
- containsPii (boolean): Does it process PII?
- containsNpi (boolean): Does it process NPI (financial data)?
- sensitiveAttributesUsed (boolean): Uses protected class attributes (race, gender, etc.)?
- trainingDataSource (enum, optional): Internal, Vendor, Public, Unknown, N/A
- retentionPolicyDefined (boolean): Is data retention policy defined?
- loggingRequired (boolean): Is logging/audit trail required?
- accessControlsDefined (boolean): Are access controls in place?

### 5. Regulatory
- regulatoryDomains (array): ${REGULATORY_DOMAINS.join(', ')}
  - Can select multiple or "None"

### 6. Controls & Monitoring
- monitoringCadence (enum, optional): Daily, Weekly, Monthly, Quarterly, None
- humanReviewProcess (string, optional): How are outputs reviewed?
- incidentResponseContact (string, optional): Who to contact for issues?

## CONVERSATION GUIDELINES

1. Start by asking for the use case title and what it does
2. Ask about one topic area at a time (2-4 related fields)
3. For boolean fields, interpret yes/no/true/false naturally
4. For enums, if the user's answer is close but not exact, map it to the correct value
5. For arrays (regulatoryDomains), allow multiple selections
6. Confirm unclear answers before moving on
7. When all fields are collected, summarize and ask for confirmation
8. Be helpful - if the user seems confused, explain why you're asking

## RESPONSE FORMAT

After each user message, respond conversationally AND include a JSON block with extracted data:

\`\`\`json
{
  "extracted": { "fieldName": "value" },
  "complete": false
}
\`\`\`

When all required fields are collected, set "complete": true.`;

export function buildChatbotContextPrompt(
  collectedData: Partial<UseCaseFormData>,
  missingFields: string[]
): string {
  const collectedSummary = Object.entries(collectedData)
    .filter(([_, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`)
    .join('\n');

  return `## CURRENT PROGRESS

### Collected Data:
${collectedSummary || 'Nothing collected yet'}

### Still Needed:
${missingFields.join(', ')}

Continue the conversation to collect the remaining fields. Focus on the next logical topic area.`;
}

export const REQUIRED_FIELDS: (keyof UseCaseFormData)[] = [
  'title',
  'businessLine',
  'description',
  'usageType',
  'customerImpact',
  'humanInLoop',
  'aiType',
  'deployment',
  'vendorInvolved',
  'modelDefinitionTrigger',
  'explainabilityRequired',
  'retraining',
  'overridesAllowed',
  'fallbackPlanDefined',
  'containsPii',
  'containsNpi',
  'sensitiveAttributesUsed',
  'retentionPolicyDefined',
  'loggingRequired',
  'accessControlsDefined',
  'regulatoryDomains',
];

export const OPTIONAL_FIELDS: (keyof UseCaseFormData)[] = [
  'intendedUsers',
  'downstreamDecisions',
  'vendorName',
  'changeFrequency',
  'trainingDataSource',
  'monitoringCadence',
  'humanReviewProcess',
  'incidentResponseContact',
];

export function getMissingRequiredFields(data: Partial<UseCaseFormData>): string[] {
  return REQUIRED_FIELDS.filter(field => {
    const value = data[field];
    if (Array.isArray(value)) return value.length === 0;
    return value === undefined || value === null || value === '';
  });
}

export function isIntakeComplete(data: Partial<UseCaseFormData>): boolean {
  return getMissingRequiredFields(data).length === 0;
}
