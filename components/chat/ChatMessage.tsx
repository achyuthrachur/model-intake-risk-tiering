'use client';

import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  message: {
    role: 'user' | 'assistant';
    content: string;
  };
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3 p-4 rounded-lg',
        isUser ? 'bg-blue-50' : 'bg-gray-50'
      )}
    >
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-blue-500' : 'bg-gray-700'
        )}
      >
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>
      <div className="flex-1 space-y-2">
        <p className="text-sm font-medium text-gray-900">
          {isUser ? 'You' : 'AI Assistant'}
        </p>
        <div className="text-sm text-gray-700 whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    </div>
  );
}
