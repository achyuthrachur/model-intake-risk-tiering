import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import type { RulesConfig, ArtifactsConfig } from './types';
import type { ValidationFrequencies } from './policy/types';
import { setValidationFrequencies, resetValidationFrequencies } from './utils';

let cachedRulesConfig: RulesConfig | null = null;
let cachedArtifactsConfig: ArtifactsConfig | null = null;
let cachedValidationFrequencies: Record<string, number> | null = null;

export function loadRulesConfig(): RulesConfig {
  if (cachedRulesConfig) {
    return cachedRulesConfig;
  }

  const configPath = path.join(process.cwd(), 'config', 'rules.yaml');
  const fileContents = fs.readFileSync(configPath, 'utf8');
  cachedRulesConfig = yaml.load(fileContents) as RulesConfig;
  return cachedRulesConfig;
}

export function loadArtifactsConfig(): ArtifactsConfig {
  if (cachedArtifactsConfig) {
    return cachedArtifactsConfig;
  }

  const configPath = path.join(process.cwd(), 'config', 'artifacts.yaml');
  const fileContents = fs.readFileSync(configPath, 'utf8');
  cachedArtifactsConfig = yaml.load(fileContents) as ArtifactsConfig;
  return cachedArtifactsConfig;
}

// Load synthetic policy content
export function loadSyntheticPolicy(policyType: 'current' | 'updated'): string {
  const filename = policyType === 'current' ? 'current-policy.md' : 'updated-policy.md';
  const policyPath = path.join(process.cwd(), 'config', 'synthetic-policies', filename);
  return fs.readFileSync(policyPath, 'utf8');
}

// List available synthetic policies
export function listSyntheticPolicies(): Array<{ id: string; name: string; description: string }> {
  return [
    {
      id: 'current',
      name: 'Current Policy (v1.0)',
      description: 'Current active policy matching existing tiering rules (T3=12mo, T2=24mo, T1=36mo)'
    },
    {
      id: 'updated',
      name: 'Updated Policy (v2.0)',
      description: 'Enhanced policy with stricter validation frequencies (T3=6mo, T2=12mo, T1=24mo) and new T3 elevation rules'
    }
  ];
}

// Load validation frequencies - checks database first, falls back to defaults
export async function loadValidationFrequenciesAsync(): Promise<Record<string, number>> {
  if (cachedValidationFrequencies) {
    return cachedValidationFrequencies;
  }

  // Try to load from database
  try {
    const { default: prisma } = await import('./db');
    const dbConfig = await prisma.activeConfiguration.findUnique({
      where: { configType: 'validationFrequency' },
    });

    if (dbConfig) {
      const freqs = JSON.parse(dbConfig.configData) as Record<string, number>;
      cachedValidationFrequencies = freqs;
      setValidationFrequencies(freqs);
      return freqs;
    }
  } catch (error) {
    // Database not available or error, fall back to defaults
    console.log('Using default validation frequencies (database not available or no override set)');
  }

  // Return defaults
  cachedValidationFrequencies = { T3: 12, T2: 24, T1: 36 };
  return cachedValidationFrequencies;
}

// Save validation frequencies to database
export async function saveValidationFrequencies(
  frequencies: ValidationFrequencies | Record<string, number>,
  policyVersionId?: string,
  updatedBy: string = 'system'
): Promise<void> {
  const { default: prisma } = await import('./db');

  await prisma.activeConfiguration.upsert({
    where: { configType: 'validationFrequency' },
    update: {
      configData: JSON.stringify(frequencies),
      policyVersionId,
      updatedBy,
    },
    create: {
      configType: 'validationFrequency',
      configData: JSON.stringify(frequencies),
      policyVersionId,
      updatedBy,
    },
  });

  // Update cache and runtime config
  cachedValidationFrequencies = frequencies as Record<string, number>;
  setValidationFrequencies(frequencies as Record<string, number>);
}

export function reloadConfigs(): void {
  cachedRulesConfig = null;
  cachedArtifactsConfig = null;
  cachedValidationFrequencies = null;
  resetValidationFrequencies();
  loadRulesConfig();
  loadArtifactsConfig();
}

export function validateRulesConfig(config: RulesConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check tiers exist
  if (!config.tiers || Object.keys(config.tiers).length === 0) {
    errors.push('No tiers defined in configuration');
  }

  // Check default tier exists
  if (!config.defaultTier || !config.tiers[config.defaultTier]) {
    errors.push(`Default tier "${config.defaultTier}" not found in tier definitions`);
  }

  // Check each rule
  if (config.rules) {
    config.rules.forEach((rule, index) => {
      if (!rule.id) {
        errors.push(`Rule at index ${index} missing id`);
      }
      if (!rule.tier || !config.tiers[rule.tier]) {
        errors.push(`Rule "${rule.id}" has invalid tier "${rule.tier}"`);
      }
      if (!rule.conditions) {
        errors.push(`Rule "${rule.id}" missing conditions`);
      }
      if (!rule.effects) {
        errors.push(`Rule "${rule.id}" missing effects`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

export function validateArtifactsConfig(config: ArtifactsConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.artifacts || Object.keys(config.artifacts).length === 0) {
    errors.push('No artifacts defined in configuration');
  }

  // Check each artifact
  Object.entries(config.artifacts || {}).forEach(([key, artifact]) => {
    if (!artifact.id) {
      errors.push(`Artifact "${key}" missing id`);
    }
    if (!artifact.name) {
      errors.push(`Artifact "${key}" missing name`);
    }
    if (!artifact.category) {
      errors.push(`Artifact "${key}" missing category`);
    }
  });

  return { valid: errors.length === 0, errors };
}
