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
