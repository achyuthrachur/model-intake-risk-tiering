'use client';

import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { getValidationStatusColor, getValidationStatusLabel, type ValidationStatus } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ValidationStatusBadgeProps {
  status: ValidationStatus;
  showIcon?: boolean;
  className?: string;
}

export function ValidationStatusBadge({ status, showIcon = true, className }: ValidationStatusBadgeProps) {
  const Icon = status === 'overdue' ? AlertTriangle : status === 'upcoming' ? Clock : CheckCircle;
  const colorClass = getValidationStatusColor(status);
  const label = getValidationStatusLabel(status);

  return (
    <Badge className={cn(colorClass, 'font-medium', className)} variant="outline">
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {label}
    </Badge>
  );
}
