'use client';

import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface InteractiveOptionsProps {
  type: 'radio' | 'checkbox';
  field: string;
  options: string[];
  onSelect: (field: string, value: string | string[]) => void;
  disabled?: boolean;
}

export function InteractiveOptions({
  type,
  field,
  options,
  onSelect,
  disabled = false,
}: InteractiveOptionsProps) {
  const [selectedRadio, setSelectedRadio] = useState<string>('');
  const [selectedCheckboxes, setSelectedCheckboxes] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const handleRadioSelect = (value: string) => {
    if (disabled || submitted) return;
    setSelectedRadio(value);
    setSubmitted(true);
    onSelect(field, value);
  };

  const handleCheckboxToggle = (option: string, checked: boolean) => {
    if (disabled || submitted) return;
    setSelectedCheckboxes(prev =>
      checked ? [...prev, option] : prev.filter(v => v !== option)
    );
  };

  const handleCheckboxSubmit = () => {
    if (selectedCheckboxes.length === 0) return;
    setSubmitted(true);
    onSelect(field, selectedCheckboxes);
  };

  if (type === 'radio') {
    return (
      <div className="my-3 p-3 bg-white rounded-lg border border-gray-200">
        <RadioGroup
          value={selectedRadio}
          onValueChange={handleRadioSelect}
          disabled={disabled || submitted}
          className="space-y-2"
        >
          {options.map((option) => (
            <div
              key={option}
              className={cn(
                'flex items-center space-x-3 p-2 rounded-md transition-colors',
                !submitted && !disabled && 'hover:bg-gray-50 cursor-pointer',
                selectedRadio === option && 'bg-blue-50 border border-blue-200'
              )}
              onClick={() => !submitted && !disabled && handleRadioSelect(option)}
            >
              <RadioGroupItem
                value={option}
                id={`${field}-${option}`}
                className={cn(
                  submitted && selectedRadio !== option && 'opacity-50'
                )}
              />
              <Label
                htmlFor={`${field}-${option}`}
                className={cn(
                  'cursor-pointer flex-1',
                  submitted && selectedRadio !== option && 'text-gray-400'
                )}
              >
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>
        {submitted && (
          <p className="text-xs text-gray-500 mt-2">
            Selected: {selectedRadio}
          </p>
        )}
      </div>
    );
  }

  // Checkbox (multi-select)
  return (
    <div className="my-3 p-3 bg-white rounded-lg border border-gray-200">
      <div className="space-y-2">
        {options.map((option) => (
          <div
            key={option}
            className={cn(
              'flex items-center space-x-3 p-2 rounded-md transition-colors',
              !submitted && !disabled && 'hover:bg-gray-50 cursor-pointer',
              selectedCheckboxes.includes(option) && 'bg-blue-50 border border-blue-200'
            )}
            onClick={() => {
              if (submitted || disabled) return;
              handleCheckboxToggle(option, !selectedCheckboxes.includes(option));
            }}
          >
            <Checkbox
              id={`${field}-${option}`}
              checked={selectedCheckboxes.includes(option)}
              onCheckedChange={(checked) => handleCheckboxToggle(option, !!checked)}
              disabled={disabled || submitted}
              className={cn(
                submitted && !selectedCheckboxes.includes(option) && 'opacity-50'
              )}
            />
            <Label
              htmlFor={`${field}-${option}`}
              className={cn(
                'cursor-pointer flex-1',
                submitted && !selectedCheckboxes.includes(option) && 'text-gray-400'
              )}
            >
              {option}
            </Label>
          </div>
        ))}
      </div>

      {!submitted && (
        <Button
          onClick={handleCheckboxSubmit}
          disabled={selectedCheckboxes.length === 0 || disabled}
          size="sm"
          className="mt-3"
        >
          Confirm Selection ({selectedCheckboxes.length} selected)
        </Button>
      )}

      {submitted && (
        <p className="text-xs text-gray-500 mt-2">
          Selected: {selectedCheckboxes.join(', ')}
        </p>
      )}
    </div>
  );
}
