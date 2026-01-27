'use client';

import { ArrowRight, Calendar, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

interface AffectedModel {
  inventoryModelId: string;
  inventoryNumber: string;
  modelName: string;
  previousTier: string;
  newTier: string;
  tierChanged: boolean;
  previousFrequency: number;
  newFrequency: number;
  frequencyChanged: boolean;
  previousDueDate: Date | string;
  newDueDate: Date | string;
  dueDateChanged: boolean;
}

interface AffectedModelsTableProps {
  affectedModels: AffectedModel[];
  summary: {
    totalAffected: number;
    tierChanges: number;
    frequencyChanges: number;
    earlierDueDates: number;
    laterDueDates: number;
  };
}

export function AffectedModelsTable({
  affectedModels,
  summary,
}: AffectedModelsTableProps) {
  if (affectedModels.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4" />
            Affected Inventory Models
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Database className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No models will be affected by these policy changes.</p>
            <p className="text-sm mt-1">
              This could be because the inventory is empty or all models already meet the new requirements.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Database className="h-4 w-4" />
          Affected Inventory Models
        </CardTitle>
        <CardDescription>
          {summary.totalAffected} model{summary.totalAffected !== 1 ? 's' : ''} will be affected.
          {summary.earlierDueDates > 0 && (
            <span className="text-amber-600 ml-2">
              {summary.earlierDueDates} will have earlier validation due dates.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-900">{summary.totalAffected}</div>
            <div className="text-xs text-gray-500">Total Affected</div>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-amber-700">{summary.earlierDueDates}</div>
            <div className="text-xs text-gray-500">Earlier Due Dates</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-700">{summary.frequencyChanges}</div>
            <div className="text-xs text-gray-500">Frequency Changes</div>
          </div>
        </div>

        {/* Models Table */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 font-medium">Model</th>
                <th className="text-left p-3 font-medium">Tier</th>
                <th className="text-left p-3 font-medium">Validation Frequency</th>
                <th className="text-left p-3 font-medium">Next Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {affectedModels.map((model) => (
                <tr key={model.inventoryModelId} className="hover:bg-gray-50">
                  <td className="p-3">
                    <div className="font-medium">{model.modelName}</div>
                    <div className="text-xs text-gray-500">{model.inventoryNumber}</div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          model.previousTier === 'T3'
                            ? 'bg-red-100 text-red-800'
                            : model.previousTier === 'T2'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-green-100 text-green-800'
                        }
                      >
                        {model.previousTier}
                      </Badge>
                      {model.tierChanged && (
                        <>
                          <ArrowRight className="h-3 w-3 text-gray-400" />
                          <Badge
                            className={
                              model.newTier === 'T3'
                                ? 'bg-red-100 text-red-800'
                                : model.newTier === 'T2'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-green-100 text-green-800'
                            }
                          >
                            {model.newTier}
                          </Badge>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className={model.frequencyChanged ? 'line-through text-gray-400' : ''}>
                        {model.previousFrequency}mo
                      </span>
                      {model.frequencyChanged && (
                        <>
                          <ArrowRight className="h-3 w-3 text-gray-400" />
                          <span className="font-medium text-amber-700">
                            {model.newFrequency}mo
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      <span className={model.dueDateChanged ? 'line-through text-gray-400' : ''}>
                        {formatDate(model.previousDueDate)}
                      </span>
                      {model.dueDateChanged && (
                        <>
                          <ArrowRight className="h-3 w-3 text-gray-400" />
                          <span
                            className={`font-medium ${
                              new Date(model.newDueDate) < new Date(model.previousDueDate)
                                ? 'text-amber-700'
                                : 'text-green-700'
                            }`}
                          >
                            {formatDate(model.newDueDate)}
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
