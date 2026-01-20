// Chatbot Service for Intake

import { streamText, generateObject } from 'ai';
import { z } from 'zod';
import { getModel } from './openai-client';
import { isAIEnabled } from './config';
import {
  CHATBOT_SYSTEM_PROMPT,
  buildChatbotContextPrompt,
  getMissingRequiredFields,
  isIntakeComplete,
} from './prompts/chatbot';
import type { ChatMessage, ChatState, ExtractedFields } from './types';
import type { UseCaseFormData } from '@/lib/types';

// Schema for extracting structured data from chat
const FieldExtractionSchema = z.object({
  extractedFields: z.record(z.any()).describe('Fields extracted from the user message'),
  isComplete: z.boolean().describe('Whether all required fields have been collected'),
  nextQuestion: z.string().optional().describe('The next question to ask'),
  clarificationNeeded: z.string().optional().describe('Clarification needed from user'),
});

export function createInitialChatState(): ChatState {
  return {
    messages: [
      {
        role: 'assistant',
        content: `Hi! I'm here to help you register a new AI/ML use case for governance review. This will just take a few minutes.

Let's start with the basics. What's the **name** of your use case, and can you briefly describe what it does?`,
      },
    ],
    collectedData: {},
    isComplete: false,
  };
}

export async function processUserMessage(
  userMessage: string,
  currentState: ChatState
): Promise<{
  response: string;
  updatedData: Partial<UseCaseFormData>;
  isComplete: boolean;
  error?: string;
}> {
  if (!isAIEnabled()) {
    return {
      response: 'AI features are not enabled. Please use the standard intake form instead.',
      updatedData: currentState.collectedData,
      isComplete: false,
      error: 'AI not enabled',
    };
  }

  try {
    const missingFields = getMissingRequiredFields(currentState.collectedData);
    const contextPrompt = buildChatbotContextPrompt(currentState.collectedData, missingFields);

    // Build message history for context
    const messages: { role: 'user' | 'assistant'; content: string }[] = [
      ...currentState.messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      { role: 'user' as const, content: userMessage },
    ];

    // Generate response with extraction
    const { object } = await generateObject({
      model: getModel(),
      schema: z.object({
        response: z.string().describe('Conversational response to the user'),
        extractedFields: z.record(z.any()).describe('Fields extracted from this message'),
        isComplete: z.boolean().describe('Whether all required fields are now collected'),
      }),
      system: CHATBOT_SYSTEM_PROMPT + '\n\n' + contextPrompt,
      messages,
      maxTokens: 800,
    });

    // Merge extracted fields with existing data
    const updatedData = {
      ...currentState.collectedData,
      ...object.extractedFields,
    };

    // Verify completion
    const actuallyComplete = isIntakeComplete(updatedData);

    return {
      response: object.response,
      updatedData,
      isComplete: actuallyComplete,
    };
  } catch (error) {
    console.error('Chatbot processing failed:', error);
    return {
      response: "I'm sorry, I had trouble processing that. Could you try rephrasing?",
      updatedData: currentState.collectedData,
      isComplete: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Streaming version for real-time responses
export function createChatStream(
  messages: ChatMessage[],
  collectedData: Partial<UseCaseFormData>
) {
  if (!isAIEnabled()) {
    throw new Error('AI features are not enabled');
  }

  const missingFields = getMissingRequiredFields(collectedData);
  const contextPrompt = buildChatbotContextPrompt(collectedData, missingFields);

  return streamText({
    model: getModel(),
    system: CHATBOT_SYSTEM_PROMPT + '\n\n' + contextPrompt,
    messages: messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    maxTokens: 800,
  });
}

// Extract fields from a completed conversation
export async function extractFieldsFromConversation(
  messages: ChatMessage[]
): Promise<ExtractedFields> {
  if (!isAIEnabled()) {
    return {
      extractedFields: {},
      isComplete: false,
    };
  }

  try {
    const extractionPrompt = `Based on the conversation below, extract all the use case intake fields that were provided.

CONVERSATION:
${messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')}

Extract all fields mentioned in the conversation and determine if the intake is complete.`;

    const { object } = await generateObject({
      model: getModel(),
      schema: FieldExtractionSchema,
      prompt: extractionPrompt,
      maxTokens: 1000,
    });

    return object;
  } catch (error) {
    console.error('Field extraction failed:', error);
    return {
      extractedFields: {},
      isComplete: false,
    };
  }
}

// Validate and normalize extracted data
export function normalizeExtractedData(
  data: Partial<UseCaseFormData>
): Partial<UseCaseFormData> {
  const normalized: Partial<UseCaseFormData> = { ...data };

  // Ensure booleans are actual booleans
  const booleanFields: (keyof UseCaseFormData)[] = [
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
  ];

  for (const field of booleanFields) {
    if (field in normalized) {
      const value = normalized[field];
      if (typeof value === 'string') {
        (normalized as any)[field] = value.toLowerCase() === 'true' || value.toLowerCase() === 'yes';
      }
    }
  }

  // Ensure regulatoryDomains is an array
  if (normalized.regulatoryDomains && !Array.isArray(normalized.regulatoryDomains)) {
    normalized.regulatoryDomains = [normalized.regulatoryDomains as unknown as string];
  }

  return normalized;
}
