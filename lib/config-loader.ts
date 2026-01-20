import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import type { RulesConfig, ArtifactsConfig } from './types';

let cachedRulesConfig: RulesConfig | null = null;
let cachedArtifactsConfig: ArtifactsConfig | null = null;

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

export function reloadConfigs(): void {
  cachedRulesConfig = null;
  cachedArtifactsConfig = null;
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
