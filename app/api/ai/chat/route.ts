import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { getModel } from '@/lib/ai/openai-client';
import { isAIEnabled } from '@/lib/ai/config';
import {
  CHATBOT_SYSTEM_PROMPT,
  buildChatbotContextPrompt,
  getMissingRequiredFields,
} from '@/lib/ai/prompts/chatbot';
import type { UseCaseFormData } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { messages, collectedData = {} } = await request.json();

    if (!isAIEnabled()) {
      return new Response(
        JSON.stringify({
          error: 'AI features are not enabled. Set OPENAI_API_KEY to enable.',
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'messages array is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Build context with current progress
    const missingFields = getMissingRequiredFields(collectedData as Partial<UseCaseFormData>);
    const contextPrompt = buildChatbotContextPrompt(
      collectedData as Partial<UseCaseFormData>,
      missingFields
    );

    // Create streaming response
    const result = streamText({
      model: getModel(),
      system: CHATBOT_SYSTEM_PROMPT + '\n\n' + contextPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      maxTokens: 800,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat message' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
