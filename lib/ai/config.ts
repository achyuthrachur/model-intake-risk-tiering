// AI Configuration for the Model Intake & Risk Tiering application

export const AI_CONFIG = {
  enabled: process.env.OPENAI_API_KEY ? true : false,
  primaryModel: process.env.OPENAI_MODEL_PRIMARY || 'gpt-4o',
  fastModel: process.env.OPENAI_MODEL_FAST || 'gpt-4o-mini',
  maxRetries: parseInt(process.env.AI_MAX_RETRIES || '3'),
  timeoutMs: parseInt(process.env.AI_TIMEOUT_MS || '30000'),
};

export function isAIEnabled(): boolean {
  return AI_CONFIG.enabled && !!process.env.OPENAI_API_KEY;
}

export function getModelId(preferFast: boolean = false): string {
  return preferFast ? AI_CONFIG.fastModel : AI_CONFIG.primaryModel;
}
