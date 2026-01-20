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
    // Look for JSON block in the message
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      return parsed.extracted || {};
    }

    // Try to find inline JSON object
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

export default function ChatIntakePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [collectedData, setCollectedData] = useState<Partial<UseCaseFormData>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: handleChatSubmit,
    isLoading,
    setMessages,
  } = useChat({
    api: '/api/ai/chat',
    body: { collectedData },
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: `Hi! I'm here to help you register a new AI/ML use case for governance review. This will just take a few minutes.

Let's start with the basics. What's the **name** of your use case, and can you briefly describe what it does?`,
      },
    ],
    onFinish: (message) => {
      // Extract structured data from assistant response
      const extracted = extractJsonFromMessage(message.content);
      if (extracted && Object.keys(extracted).length > 0) {
        setCollectedData((prev) => ({ ...prev, ...extracted }));
      }

      // Check for completion marker
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
      const fakeEvent = {
        preventDefault: () => {},
      } as React.FormEvent<HTMLFormElement>;
      handleInputChange({ target: { value: message } } as React.ChangeEvent<HTMLInputElement>);
      setTimeout(() => handleChatSubmit(fakeEvent), 0);
    },
    [handleChatSubmit, handleInputChange]
  );

  const handleStartOver = useCallback(() => {
    setCollectedData({});
    setIsComplete(false);
    setAiError(null);
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Hi! I'm here to help you register a new AI/ML use case for governance review. This will just take a few minutes.

Let's start with the basics. What's the **name** of your use case, and can you briefly describe what it does?`,
      },
    ]);
  }, [setMessages]);

  const handleSubmitUseCase = async () => {
    setIsSubmitting(true);
    try {
      // Ensure we have minimum required data
      const dataToSubmit = {
        ...collectedData,
        // Set defaults for any missing required fields
        regulatoryDomains: collectedData.regulatoryDomains || [],
      };

      // Create the use case
      const response = await fetch('/api/usecases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSubmit),
      });

      if (!response.ok) {
        throw new Error('Failed to create use case');
      }

      const useCase = await response.json();

      // Submit for review
      await fetch(`/api/usecases/${useCase.id}/submit`, {
        method: 'POST',
      });

      toast({
        title: 'Use case submitted!',
        description: 'Your use case has been submitted for governance review.',
      });

      router.push(`/usecase/${useCase.id}`);
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit use case. Please try again.',
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
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <Link href="/intake/new">
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
          error={aiError}
        />
      </div>
    </div>
  );
}
