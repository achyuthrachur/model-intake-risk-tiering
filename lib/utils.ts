import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getTierColor(tier: string): string {
  switch (tier) {
    case 'T1':
      return 'bg-tier1-light text-tier1 border-tier1';
    case 'T2':
      return 'bg-tier2-light text-tier2 border-tier2';
    case 'T3':
      return 'bg-tier3-light text-tier3 border-tier3';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300';
  }
}

export function getTierBadgeColor(tier: string): string {
  switch (tier) {
    case 'T1':
      return 'bg-green-100 text-green-800';
    case 'T2':
      return 'bg-amber-100 text-amber-800';
    case 'T3':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'Draft':
      return 'bg-gray-100 text-gray-700';
    case 'Submitted':
      return 'bg-blue-100 text-blue-700';
    case 'Under Review':
      return 'bg-purple-100 text-purple-700';
    case 'Approved':
      return 'bg-green-100 text-green-700';
    case 'Rejected':
      return 'bg-red-100 text-red-700';
    case 'Sent Back':
      return 'bg-orange-100 text-orange-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function parseJsonSafe<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

// =============================================
// INVENTORY VALIDATION UTILITIES
// =============================================

export type ValidationStatus = 'overdue' | 'upcoming' | 'current';

export function getValidationFrequency(tier: string): number {
  switch (tier) {
    case 'T3': return 12;  // Annual
    case 'T2': return 24;  // Bi-annual
    case 'T1': return 36;  // Tri-annual
    default: return 12;
  }
}

export function calculateValidationStatus(nextDue: Date | string): ValidationStatus {
  const now = new Date();
  const dueDate = typeof nextDue === 'string' ? new Date(nextDue) : nextDue;
  const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) return 'overdue';
  if (daysUntil <= 30) return 'upcoming';
  return 'current';
}

export function calculateNextValidationDate(lastValidationDate: Date | string, tier: string): Date {
  const frequency = getValidationFrequency(tier);
  const last = typeof lastValidationDate === 'string' ? new Date(lastValidationDate) : lastValidationDate;
  const next = new Date(last);
  next.setMonth(next.getMonth() + frequency);
  return next;
}

export function getValidationStatusColor(status: ValidationStatus): string {
  switch (status) {
    case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
    case 'upcoming': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'current': return 'bg-green-100 text-green-800 border-green-200';
  }
}

export function getValidationStatusLabel(status: ValidationStatus): string {
  switch (status) {
    case 'overdue': return 'Overdue';
    case 'upcoming': return 'Due Soon';
    case 'current': return 'Current';
  }
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'Critical': return 'bg-red-600 text-white';
    case 'High': return 'bg-red-100 text-red-800';
    case 'Medium': return 'bg-amber-100 text-amber-800';
    case 'Low': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function getRemediationStatusColor(status: string): string {
  switch (status) {
    case 'Open': return 'bg-red-100 text-red-700';
    case 'In Progress': return 'bg-amber-100 text-amber-700';
    case 'Remediated': return 'bg-green-100 text-green-700';
    case 'Accepted': return 'bg-blue-100 text-blue-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

export function generateInventoryNumber(sequence: number): string {
  const year = new Date().getFullYear();
  const paddedSeq = sequence.toString().padStart(3, '0');
  return `MDL-${year}-${paddedSeq}`;
}
