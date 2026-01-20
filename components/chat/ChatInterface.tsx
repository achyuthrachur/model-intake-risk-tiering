'use client';

import { useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  isComplete: boolean;
  onSendMessage: (message: string) => void;
  onSubmit: () => void;
  onStartOver: () => void;
  error?: string | null;
}

export function ChatInterface({
  messages,
  isLoading,
  isComplete,
  onSendMessage,
  onSubmit,
  onStartOver,
  error,
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="border-b p-4">
        <h1 className="text-lg font-semibold text-gray-900">
          AI-Assisted Use Case Intake
        </h1>
        <p className="text-sm text-gray-500">
          Chat with our AI assistant to register your use case
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
            </div>
            <span className="text-sm text-gray-500">AI is thinking...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {isComplete && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-700 mb-3">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">All required information collected!</span>
            </div>
            <p className="text-sm text-green-600 mb-4">
              Ready to submit your use case for governance review.
            </p>
            <div className="flex gap-2">
              <Button onClick={onSubmit} className="bg-green-600 hover:bg-green-700">
                Submit Use Case
              </Button>
              <Button variant="outline" onClick={onStartOver}>
                Start Over
              </Button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <ChatInput
          onSend={onSendMessage}
          isLoading={isLoading}
          disabled={isComplete}
          placeholder={
            isComplete
              ? 'Intake complete - click Submit to continue'
              : 'Type your response...'
          }
        />
      </div>
    </div>
  );
}
