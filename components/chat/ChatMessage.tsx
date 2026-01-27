'use client';

import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';
import { parseMessageForInteractiveElements, stripInteractiveMarkup } from '@/lib/chat/parseInteractiveElements';
import { InteractiveOptions } from './InteractiveOptions';

interface ChatMessageProps {
  message: {
    role: 'user' | 'assistant';
    content: string;
  };
  onOptionSelect?: (field: string, value: string | string[]) => void;
  isLatestAssistant?: boolean;
}

export function ChatMessage({ message, onOptionSelect, isLatestAssistant }: ChatMessageProps) {
  const isUser = message.role === 'user';

  // Parse for interactive elements (only for assistant messages)
  const parsed = !isUser
    ? parseMessageForInteractiveElements(message.content)
    : null;

  // Strip JSON blocks from display content
  const displayContent = isUser
    ? message.content
    : stripJsonBlocks(parsed?.textBefore || message.content);

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
          {displayContent}
        </div>

        {/* Render interactive options if present and this is the latest assistant message */}
        {parsed?.interactiveElement && isLatestAssistant && onOptionSelect && (
          <InteractiveOptions
            type={parsed.interactiveElement.type}
            field={parsed.interactiveElement.field}
            options={parsed.interactiveElement.options}
            onSelect={onOptionSelect}
          />
        )}

        {/* Show text after options if any */}
        {parsed?.textAfter && (
          <div className="text-sm text-gray-700 whitespace-pre-wrap mt-2">
            {stripJsonBlocks(parsed.textAfter)}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper to strip JSON code blocks from message display
function stripJsonBlocks(content: string): string {
  return content
    .replace(/```json\s*[\s\S]*?```/g, '')
    .replace(/\{[^{}]*"extracted"[^{}]*\}/g, '')
    .trim();
}
