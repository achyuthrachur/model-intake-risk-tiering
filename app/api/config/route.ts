import { NextResponse } from 'next/server';
import { loadRulesConfig, loadArtifactsConfig, validateRulesConfig, validateArtifactsConfig } from '@/lib/config-loader';

// GET /api/config - Get the current configuration
export async function GET() {
  try {
    const rulesConfig = loadRulesConfig();
    const artifactsConfig = loadArtifactsConfig();

    // Validate configs
    const rulesValidation = validateRulesConfig(rulesConfig);
    const artifactsValidation = validateArtifactsConfig(artifactsConfig);

    return NextResponse.json({
      rules: rulesConfig,
      artifacts: artifactsConfig,
      validation: {
        rules: rulesValidation,
        artifacts: artifactsValidation,
      },
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error loading config:', error);
    return NextResponse.json(
      { error: 'Failed to load configuration' },
      { status: 500 }
    );
  }
}
