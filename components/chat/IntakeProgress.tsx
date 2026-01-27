'use client';

import { Check, Circle, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { UseCaseFormData } from '@/lib/types';

const FIELD_GROUPS = [
  {
    name: 'Overview',
    fields: ['title', 'businessLine', 'description', 'intendedUsers'] as const,
    required: ['title', 'businessLine', 'description'] as const,
  },
  {
    name: 'Use & Impact',
    fields: ['usageType', 'customerImpact', 'humanInLoop', 'downstreamDecisions'] as const,
    required: ['usageType', 'customerImpact', 'humanInLoop'] as const,
  },
  {
    name: 'Model Details',
    fields: [
      'aiType',
      'deployment',
      'vendorInvolved',
      'vendorName',
      'modelDefinitionTrigger',
      'explainabilityRequired',
      'changeFrequency',
      'retraining',
      'overridesAllowed',
      'fallbackPlanDefined',
    ] as const,
    required: [
      'aiType',
      'deployment',
      'vendorInvolved',
      'modelDefinitionTrigger',
      'explainabilityRequired',
      'retraining',
      'overridesAllowed',
      'fallbackPlanDefined',
    ] as const,
  },
  {
    name: 'Data & Privacy',
    fields: [
      'containsPii',
      'containsNpi',
      'sensitiveAttributesUsed',
      'trainingDataSource',
      'retentionPolicyDefined',
      'loggingRequired',
      'accessControlsDefined',
    ] as const,
    required: [
      'containsPii',
      'containsNpi',
      'sensitiveAttributesUsed',
      'retentionPolicyDefined',
      'loggingRequired',
      'accessControlsDefined',
    ] as const,
  },
  {
    name: 'Regulatory',
    fields: ['regulatoryDomains'] as const,
    required: ['regulatoryDomains'] as const,
  },
  {
    name: 'Controls & Monitoring',
    fields: ['monitoringCadence', 'humanReviewProcess', 'incidentResponseContact'] as const,
    required: [] as const,
  },
];

interface IntakeProgressProps {
  data: Partial<UseCaseFormData>;
}

export function IntakeProgress({ data }: IntakeProgressProps) {
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Overview']);

  const toggleGroup = (name: string) => {
    setExpandedGroups((prev) =>
      prev.includes(name)
        ? prev.filter((n) => n !== name)
        : [...prev, name]
    );
  };

  const isFieldCollected = (field: string) => {
    const value = data[field as keyof UseCaseFormData];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'boolean') return true; // Booleans are considered collected once set
    return value !== undefined && value !== null && value !== '';
  };

  const getTotalProgress = () => {
    let collected = 0;
    let required = 0;
    FIELD_GROUPS.forEach((group) => {
      group.required.forEach((field) => {
        required++;
        if (isFieldCollected(field)) collected++;
      });
    });
    return { collected, required };
  };

  const { collected, required } = getTotalProgress();
  const progressPercent = required > 0 ? Math.round((collected / required) * 100) : 0;

  return (
    <div className="w-72 bg-gray-50 border-r flex flex-col">
      <div className="p-4 border-b bg-white">
        <h2 className="font-semibold text-gray-900">Intake Progress</h2>
        <div className="mt-2">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{collected} of {required} required fields</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={cn(
                'h-2 rounded-full transition-all',
                progressPercent === 100 ? 'bg-green-500' : 'bg-blue-500'
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {FIELD_GROUPS.map((group) => {
          const collectedCount = group.required.filter((f) =>
            isFieldCollected(f)
          ).length;
          const isComplete = collectedCount === group.required.length;
          const isExpanded = expandedGroups.includes(group.name);

          return (
            <div key={group.name} className="mb-1">
              <button
                onClick={() => toggleGroup(group.name)}
                className={cn(
                  'w-full flex items-center justify-between p-2 rounded-md text-left text-sm',
                  'hover:bg-gray-100 transition-colors',
                  isComplete && 'text-green-700'
                )}
              >
                <div className="flex items-center gap-2">
                  {isComplete ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-300" />
                  )}
                  <span className="font-medium">{group.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {collectedCount}/{group.required.length}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  {group.fields.map((field) => {
                    const isCollected = isFieldCollected(field);
                    const isRequired = (group.required as readonly string[]).includes(field);

                    return (
                      <div
                        key={field}
                        className={cn(
                          'flex items-center gap-2 text-xs py-1 px-2 rounded',
                          isCollected ? 'text-green-600' : 'text-gray-500'
                        )}
                      >
                        {isCollected ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Circle className="w-3 h-3" />
                        )}
                        <span>
                          {field}
                          {isRequired && !isCollected && (
                            <span className="text-red-400 ml-1">*</span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
