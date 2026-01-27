'use client';

import { ArrowRight, Clock, Plus, Minus, Edit2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface FrequencyChange {
  tier: string;
  current: string;
  new: string;
  direction: 'increase' | 'decrease' | 'same';
}

interface RuleChange {
  type: 'new' | 'removed' | 'modified';
  name: string;
  description: string;
}

interface PolicyDiffViewProps {
  frequencyChanges: FrequencyChange[];
  ruleChanges: RuleChange[];
  summary: string;
  impact: string;
}

export function PolicyDiffView({
  frequencyChanges,
  ruleChanges,
  summary,
  impact,
}: PolicyDiffViewProps) {
  const hasFrequencyChanges = frequencyChanges.some(c => c.direction !== 'same');
  const hasRuleChanges = ruleChanges.length > 0;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Policy Change Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-700">{summary}</p>
          <p className="text-sm text-gray-600 italic">{impact}</p>
        </CardContent>
      </Card>

      {/* Validation Frequency Changes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Validation Frequency Changes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasFrequencyChanges ? (
            <p className="text-sm text-gray-500">No changes to validation frequencies.</p>
          ) : (
            <div className="space-y-3">
              {frequencyChanges.map((change) => (
                <div
                  key={change.tier}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    change.direction === 'same'
                      ? 'bg-gray-50'
                      : change.direction === 'decrease'
                      ? 'bg-amber-50 border border-amber-200'
                      : 'bg-green-50 border border-green-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      className={
                        change.tier === 'T3'
                          ? 'bg-red-100 text-red-800'
                          : change.tier === 'T2'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-green-100 text-green-800'
                      }
                    >
                      {change.tier}
                    </Badge>
                    <span className="text-sm font-medium">
                      {change.tier === 'T3'
                        ? 'High Risk'
                        : change.tier === 'T2'
                        ? 'Medium Risk'
                        : 'Low Risk'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={change.direction !== 'same' ? 'line-through text-gray-400' : ''}>
                      {change.current}
                    </span>
                    {change.direction !== 'same' && (
                      <>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                        <span
                          className={`font-medium ${
                            change.direction === 'decrease'
                              ? 'text-amber-700'
                              : 'text-green-700'
                          }`}
                        >
                          {change.new}
                        </span>
                        {change.direction === 'decrease' && (
                          <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                            More frequent
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rule Changes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Edit2 className="h-4 w-4" />
            Tiering Rule Changes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasRuleChanges ? (
            <p className="text-sm text-gray-500">No changes to tiering rules.</p>
          ) : (
            <div className="space-y-3">
              {ruleChanges.map((change, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    change.type === 'new'
                      ? 'bg-green-50 border border-green-200'
                      : change.type === 'removed'
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-blue-50 border border-blue-200'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {change.type === 'new' && (
                      <Plus className="h-4 w-4 text-green-600" />
                    )}
                    {change.type === 'removed' && (
                      <Minus className="h-4 w-4 text-red-600" />
                    )}
                    {change.type === 'modified' && (
                      <Edit2 className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{change.name}</span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          change.type === 'new'
                            ? 'text-green-600 border-green-300'
                            : change.type === 'removed'
                            ? 'text-red-600 border-red-300'
                            : 'text-blue-600 border-blue-300'
                        }`}
                      >
                        {change.type === 'new'
                          ? 'New Rule'
                          : change.type === 'removed'
                          ? 'Removed'
                          : 'Modified'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{change.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
