'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useChat } from 'ai/react';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { IntakeProgress } from '@/components/chat/IntakeProgress';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';
import type { UseCaseFormData } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';

// Helper to extract JSON from assistant messages
function extractJsonFromMessage(content: string): Partial<UseCaseFormData> | null {
  try {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      return parsed.extracted || {};
    }

    const inlineMatch = content.match(/\{[^{}]*"extracted"[^{}]*\}/);
    if (inlineMatch) {
      const parsed = JSON.parse(inlineMatch[0]);
      return parsed.extracted || {};
    }

    return null;
  } catch {
    return null;
  }
}

export default function OwnerChatIntakePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [collectedData, setCollectedData] = useState<Partial<UseCaseFormData>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const {
    messages,
    isLoading,
    setMessages,
    append,
  } = useChat({
    api: '/api/ai/chat',
    body: { collectedData },
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: `Hi! I'm here to help you register a new model or automation use case for governance review. This covers all types of models including traditional statistical models, machine learning, GenAI, RPA, and other automated decision systems.

This will just take a few minutes. Let's start with the basics - what's the name of your use case, and can you briefly describe what it does?`,
      },
    ],
    onFinish: (message) => {
      const extracted = extractJsonFromMessage(message.content);
      if (extracted && Object.keys(extracted).length > 0) {
        setCollectedData((prev) => ({ ...prev, ...extracted }));
      }

      if (message.content.includes('"complete": true') || message.content.includes('"isComplete": true')) {
        setIsComplete(true);
      }
    },
    onError: (error) => {
      console.error('Chat error:', error);
      setAiError(error.message || 'Failed to get AI response');
    },
  });

  const handleSendMessage = useCallback(
    (message: string) => {
      setAiError(null);
      append({
        role: 'user',
        content: message,
      });
    },
    [append]
  );

  const handleOptionSelect = useCallback(
    (field: string, value: string | string[]) => {
      // Convert "Yes"/"No" to boolean for boolean fields
      const booleanFields = [
        'vendorInvolved', 'modelDefinitionTrigger', 'explainabilityRequired',
        'retraining', 'overridesAllowed', 'fallbackPlanDefined', 'containsPii',
        'containsNpi', 'sensitiveAttributesUsed', 'retentionPolicyDefined',
        'loggingRequired', 'accessControlsDefined'
      ];

      let processedValue: string | string[] | boolean = value;
      if (booleanFields.includes(field) && typeof value === 'string') {
        processedValue = value === 'Yes';
      }

      // Update collected data
      setCollectedData((prev) => ({ ...prev, [field]: processedValue }));

      // Send the selection as a user message
      const displayValue = Array.isArray(value) ? value.join(', ') : value;
      setAiError(null);
      append({
        role: 'user',
        content: displayValue,
      });
    },
    [append]
  );

  const handleStartOver = useCallback(() => {
    setCollectedData({});
    setIsComplete(false);
    setAiError(null);
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Hi! I'm here to help you register a new model or automation use case for governance review. This covers all types of models including traditional statistical models, machine learning, GenAI, RPA, and other automated decision systems.

This will just take a few minutes. Let's start with the basics - what's the name of your use case, and can you briefly describe what it does?`,
      },
    ]);
  }, [setMessages]);

  const handleSubmitUseCase = async () => {
    setIsSubmitting(true);
    try {
      // The chatbot uses 'modelType' but the API expects 'aiType'
      const requiredFields = ['title', 'businessLine', 'description', 'modelType', 'usageType', 'humanInLoop', 'customerImpact', 'deployment'];
      const missing = requiredFields.filter(field => !collectedData[field as keyof typeof collectedData]);

      if (missing.length > 0) {
        toast({
          title: 'Missing Information',
          description: `Please provide: ${missing.join(', ')}`,
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Map modelType to aiType for the API
      const dataToSubmit = {
        ...collectedData,
        aiType: collectedData.modelType, // Map modelType -> aiType for database
        regulatoryDomains: collectedData.regulatoryDomains || [],
      };

      const response = await fetch('/api/usecases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSubmit),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create use case');
      }

      const useCase = await response.json();

      const submitResponse = await fetch(`/api/usecases/${useCase.id}/submit`, {
        method: 'POST',
      });

      if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        throw new Error(errorData.error || 'Failed to submit for review');
      }

      toast({
        title: 'Use case submitted!',
        description: 'Your use case has been submitted for governance review.',
      });

      router.push(`/owner/usecase/${useCase.id}`);
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit use case. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Navigation */}
      <div className="border-b bg-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/owner/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <Link href="/owner/intake/new">
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Use Standard Form
          </Button>
        </Link>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        <IntakeProgress data={collectedData} />
        <ChatInterface
          messages={messages.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }))}
          isLoading={isLoading || isSubmitting}
          isComplete={isComplete}
          onSendMessage={handleSendMessage}
          onSubmit={handleSubmitUseCase}
          onStartOver={handleStartOver}
          onOptionSelect={handleOptionSelect}
          error={aiError}
        />
      </div>
    </div>
  );
}
