// Policy Diff - Compare current configuration with new policy

import type { PolicyDiffResult, ValidationFrequencies, ValidationFrequencyChange } from './types';
import { DEFAULT_VALIDATION_FREQUENCIES } from './analyzer';
import { getValidationFrequencies } from '@/lib/utils';

export function diffValidationFrequencies(
  currentFreqs: ValidationFrequencies,
  newFreqs: ValidationFrequencies
): Record<string, ValidationFrequencyChange> {
  const tiers = ['T3', 'T2', 'T1'] as const;
  const changes: Record<string, ValidationFrequencyChange> = {};

  for (const tier of tiers) {
    const current = currentFreqs[tier];
    const newVal = newFreqs[tier];
    changes[tier] = {
      current,
      new: newVal,
      changed: current !== newVal,
    };
  }

  return changes;
}

export function generatePolicyDiff(
  newValidationFrequencies: ValidationFrequencies,
  newRuleIds: string[] = [],
  elevatedRules: Array<{ id: string; name: string; from: string; to: string }> = []
): PolicyDiffResult {
  // Get current validation frequencies from runtime config
  const currentFreqs = getValidationFrequencies() as ValidationFrequencies;

  const validationFrequencyChanges = diffValidationFrequencies(currentFreqs, newValidationFrequencies);

  // Calculate summary
  const freqChanges = Object.entries(validationFrequencyChanges)
    .filter(([, change]) => change.changed)
    .map(([tier, change]) => `${tier}: ${change.current}mo -> ${change.new}mo`);

  let summaryOfChanges = '';
  if (freqChanges.length > 0) {
    summaryOfChanges += `Validation frequency changes: ${freqChanges.join(', ')}. `;
  }
  if (newRuleIds.length > 0) {
    summaryOfChanges += `${newRuleIds.length} new tiering rule(s) added. `;
  }
  if (elevatedRules.length > 0) {
    summaryOfChanges += `${elevatedRules.length} rule(s) now elevate to higher tiers. `;
  }

  // Generate impact assessment
  let impactAssessment = '';
  const hasFreqDecrease = Object.values(validationFrequencyChanges).some(
    c => c.changed && c.new < c.current
  );
  if (hasFreqDecrease) {
    impactAssessment += 'Shorter validation cycles will require more frequent reviews. ';
  }
  if (newRuleIds.length > 0 || elevatedRules.length > 0) {
    impactAssessment += 'New or modified rules may cause some models to be assigned higher tiers. ';
  }
  if (!summaryOfChanges) {
    summaryOfChanges = 'No significant changes detected.';
    impactAssessment = 'Policy is consistent with current configuration.';
  }

  return {
    validationFrequencyChanges,
    newRules: newRuleIds.map(id => ({
      id,
      name: id.replace('R_', '').replace(/_/g, ' ').toLowerCase(),
      tier: 'T3', // New rules typically are T3
    })),
    removedRules: [],
    modifiedRules: elevatedRules.map(r => ({
      id: r.id,
      name: r.name,
      currentTier: r.from,
      newTier: r.to,
      changes: [`Elevated from ${r.from} to ${r.to}`],
    })),
    summaryOfChanges: summaryOfChanges.trim(),
    impactAssessment: impactAssessment.trim(),
  };
}

// Generate a human-readable summary of policy changes
export function formatPolicyDiffForDisplay(diff: PolicyDiffResult): {
  frequencyChanges: Array<{ tier: string; current: string; new: string; direction: 'increase' | 'decrease' | 'same' }>;
  ruleChanges: Array<{ type: 'new' | 'removed' | 'modified'; name: string; description: string }>;
  summary: string;
  impact: string;
} {
  const frequencyChanges = Object.entries(diff.validationFrequencyChanges).map(([tier, change]) => ({
    tier,
    current: `${change.current} months`,
    new: `${change.new} months`,
    direction: change.new < change.current ? 'decrease' as const :
               change.new > change.current ? 'increase' as const : 'same' as const,
  }));

  const ruleChanges: Array<{ type: 'new' | 'removed' | 'modified'; name: string; description: string }> = [];

  for (const rule of diff.newRules) {
    ruleChanges.push({
      type: 'new',
      name: rule.name,
      description: rule.description || `New ${rule.tier} rule added`,
    });
  }

  for (const rule of diff.removedRules) {
    ruleChanges.push({
      type: 'removed',
      name: rule.name,
      description: `${rule.tier} rule removed`,
    });
  }

  for (const rule of diff.modifiedRules) {
    ruleChanges.push({
      type: 'modified',
      name: rule.name,
      description: rule.changes?.join('; ') || `Changed from ${rule.currentTier} to ${rule.newTier}`,
    });
  }

  return {
    frequencyChanges,
    ruleChanges,
    summary: diff.summaryOfChanges,
    impact: diff.impactAssessment,
  };
}

// Check if there are any meaningful changes
export function hasSignificantChanges(diff: PolicyDiffResult): boolean {
  const hasFreqChanges = Object.values(diff.validationFrequencyChanges).some(c => c.changed);
  const hasRuleChanges = diff.newRules.length > 0 ||
                         diff.removedRules.length > 0 ||
                         diff.modifiedRules.length > 0;
  return hasFreqChanges || hasRuleChanges;
}
