// Policy Analyzer - Uses AI to extract rules from policy documents

import { generateText } from 'ai';
import { getModel } from '@/lib/ai/openai-client';
import { POLICY_ANALYSIS_SYSTEM_PROMPT, buildPolicyAnalysisPrompt } from '@/lib/ai/prompts/policy-analysis';
import type { PolicyExtractionResult, ValidationFrequencies } from './types';

// Default validation frequencies (matching current rules.yaml)
export const DEFAULT_VALIDATION_FREQUENCIES: ValidationFrequencies = {
  T3: 12,  // Annual
  T2: 24,  // Bi-annual
  T1: 36,  // Tri-annual
};

export async function analyzePolicyDocument(policyContent: string): Promise<PolicyExtractionResult> {
  try {
    const { text } = await generateText({
      model: getModel(),
      system: POLICY_ANALYSIS_SYSTEM_PROMPT,
      prompt: buildPolicyAnalysisPrompt(policyContent),
      temperature: 0.1, // Low temperature for consistent extraction
      maxTokens: 4000,
    });

    // Parse the JSON response
    const cleanedText = text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
    const result = JSON.parse(cleanedText) as PolicyExtractionResult;

    // Validate and set defaults
    if (!result.validationFrequencies) {
      result.validationFrequencies = DEFAULT_VALIDATION_FREQUENCIES;
    }

    if (!result.tiers) {
      result.tiers = {
        T3: { name: 'High Risk', description: 'High materiality models', severity: 3 },
        T2: { name: 'Medium Risk', description: 'Moderate impact models', severity: 2 },
        T1: { name: 'Low Risk', description: 'Low impact models', severity: 1 },
      };
    }

    if (!result.rules) {
      result.rules = [];
    }

    if (!result.newRules) {
      result.newRules = [];
    }

    if (!result.modifiedRules) {
      result.modifiedRules = [];
    }

    if (typeof result.extractionConfidence !== 'number') {
      result.extractionConfidence = 0.8;
    }

    if (!Array.isArray(result.notes)) {
      result.notes = [];
    }

    return result;
  } catch (error) {
    console.error('Error analyzing policy document:', error);
    throw new Error(`Failed to analyze policy document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Extract validation frequencies specifically (simpler extraction for known format)
export function extractValidationFrequenciesFromPolicy(policyContent: string): ValidationFrequencies {
  const frequencies: ValidationFrequencies = { ...DEFAULT_VALIDATION_FREQUENCIES };

  // Pattern to match validation frequency mentions
  const patterns = [
    // "Validation Frequency: Semi-annual (every 6 months)"
    /T3[^]*?(?:Validation Frequency|validation frequency)[:\s]*(?:Semi-annual|Annual|Bi-annual|Tri-annual)?[^]*?(?:every\s+)?(\d+)\s*months?/i,
    /T2[^]*?(?:Validation Frequency|validation frequency)[:\s]*(?:Semi-annual|Annual|Bi-annual|Tri-annual)?[^]*?(?:every\s+)?(\d+)\s*months?/i,
    /T1[^]*?(?:Validation Frequency|validation frequency)[:\s]*(?:Semi-annual|Annual|Bi-annual|Tri-annual)?[^]*?(?:every\s+)?(\d+)\s*months?/i,
  ];

  // More specific patterns
  const t3Match = policyContent.match(/Tier 3[^]*?Validation Frequency[:\s]*[^]*?(\d+)\s*months?/i);
  const t2Match = policyContent.match(/Tier 2[^]*?Validation Frequency[:\s]*[^]*?(\d+)\s*months?/i);
  const t1Match = policyContent.match(/Tier 1[^]*?Validation Frequency[:\s]*[^]*?(\d+)\s*months?/i);

  if (t3Match) frequencies.T3 = parseInt(t3Match[1], 10);
  if (t2Match) frequencies.T2 = parseInt(t2Match[1], 10);
  if (t1Match) frequencies.T1 = parseInt(t1Match[1], 10);

  // Alternative: Look for table format
  // | T3   | 6 months (Semi-annual) |
  const tablePattern = /\|\s*T([123])\s*\|\s*(\d+)\s*months?/gi;
  let match;
  while ((match = tablePattern.exec(policyContent)) !== null) {
    const tier = `T${match[1]}` as keyof ValidationFrequencies;
    frequencies[tier] = parseInt(match[2], 10);
  }

  return frequencies;
}

// Identify new rules by checking for [NEW] markers in policy
export function identifyNewRulesFromPolicy(policyContent: string): string[] {
  const newRules: string[] = [];

  // Look for [NEW] markers
  const newPattern = /\[NEW\][:\s]*([^\n]+)/gi;
  let match;
  while ((match = newPattern.exec(policyContent)) !== null) {
    newRules.push(match[1].trim());
  }

  // Also look for "### X.X [NEW]" pattern
  const headerPattern = /###\s*\d+\.\d+\s*\[NEW\]\s*([^\n]+)/gi;
  while ((match = headerPattern.exec(policyContent)) !== null) {
    if (!newRules.includes(match[1].trim())) {
      newRules.push(match[1].trim());
    }
  }

  return newRules;
}

// Quick validation frequency extraction without AI (for synthetic policies)
export function parseKnownPolicyFormat(policyContent: string): {
  frequencies: ValidationFrequencies;
  isUpdatedPolicy: boolean;
} {
  const frequencies = extractValidationFrequenciesFromPolicy(policyContent);
  const isUpdatedPolicy = policyContent.includes('Version 2.0') ||
                          policyContent.includes('[NEW]') ||
                          frequencies.T3 !== DEFAULT_VALIDATION_FREQUENCIES.T3;

  return { frequencies, isUpdatedPolicy };
}
