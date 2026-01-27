'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface PolicyApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policyName: string;
  summary: {
    totalAffected: number;
    earlierDueDates: number;
    frequencyChanges: number;
  };
  frequencyChanges: string[];
  onApprove: () => Promise<void>;
}

export function PolicyApprovalDialog({
  open,
  onOpenChange,
  policyName,
  summary,
  frequencyChanges,
  onApprove,
}: PolicyApprovalDialogProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    if (!confirmed) return;

    setLoading(true);
    setError(null);

    try {
      await onApprove();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply policy');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      setConfirmed(false);
      setError(null);
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Confirm Policy Application
          </DialogTitle>
          <DialogDescription>
            Review the impact before applying <strong>{policyName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Impact Summary */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-amber-800">Impact Summary</h4>
            <ul className="space-y-2 text-sm text-amber-700">
              {frequencyChanges.length > 0 && (
                <li className="flex items-start gap-2">
                  <span className="font-medium">Validation frequencies:</span>
                  <span>{frequencyChanges.join(', ')}</span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <span className="font-medium">Models affected:</span>
                <span>
                  {summary.totalAffected} model{summary.totalAffected !== 1 ? 's' : ''} will have updated validation schedules
                </span>
              </li>
              {summary.earlierDueDates > 0 && (
                <li className="flex items-start gap-2 text-red-700">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>
                    {summary.earlierDueDates} model{summary.earlierDueDates !== 1 ? 's' : ''} will have
                    <strong> earlier </strong> validation due dates
                  </span>
                </li>
              )}
            </ul>
          </div>

          {/* What happens */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-gray-800">What will happen:</h4>
            <ul className="space-y-1 text-sm text-gray-600 list-disc list-inside">
              <li>Current validation frequency settings will be replaced</li>
              <li>Inventory model validation schedules will be recalculated</li>
              <li>Next validation due dates will be updated accordingly</li>
              <li>This action will be logged in the audit trail</li>
            </ul>
          </div>

          {/* Confirmation checkbox */}
          <div className="flex items-start space-x-3 pt-2">
            <Checkbox
              id="confirm"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked === true)}
            />
            <Label
              htmlFor="confirm"
              className="text-sm font-medium leading-tight cursor-pointer"
            >
              I understand these changes will take effect immediately and may
              require rescheduling upcoming validations
            </Label>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            disabled={!confirmed || loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve & Apply
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
