'use client';

import { useState, KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  isLoading,
  disabled = false,
  placeholder = 'Type your response...',
}: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && !isLoading && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2 items-end">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isLoading || disabled}
        className="min-h-[60px] max-h-[200px] resize-none"
        rows={2}
      />
      <Button
        onClick={handleSend}
        disabled={isLoading || disabled || !input.trim()}
        className="h-[60px] px-4"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Send className="w-5 h-5" />
        )}
      </Button>
    </div>
  );
}
