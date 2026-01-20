// OpenAI client setup using Vercel AI SDK

import { createOpenAI } from '@ai-sdk/openai';
import { AI_CONFIG } from './config';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  compatibility: 'strict',
});

export function getModel(modelId?: string) {
  return openai(modelId || AI_CONFIG.primaryModel);
}

export function getFastModel() {
  return openai(AI_CONFIG.fastModel);
}

export { openai };
