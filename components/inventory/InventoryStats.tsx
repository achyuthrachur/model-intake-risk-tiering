'use client';

import { Database, AlertTriangle, Clock, FileWarning, CheckCircle, Layers } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { InventoryStats as InventoryStatsType } from '@/lib/types';

interface InventoryStatsProps {
  stats: InventoryStatsType | null;
  loading?: boolean;
}

export function InventoryStats({ stats, loading }: InventoryStatsProps) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Models',
      value: stats.totalModels,
      icon: Database,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      label: 'High Risk (T3)',
      value: stats.byTier.T3,
      icon: Layers,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
    },
    {
      label: 'Overdue',
      value: stats.validationStatus.overdue,
      icon: AlertTriangle,
      iconBg: stats.validationStatus.overdue > 0 ? 'bg-red-100' : 'bg-green-100',
      iconColor: stats.validationStatus.overdue > 0 ? 'text-red-600' : 'text-green-600',
      highlight: stats.validationStatus.overdue > 0,
    },
    {
      label: 'Due Soon',
      value: stats.validationStatus.upcoming,
      icon: Clock,
      iconBg: stats.validationStatus.upcoming > 0 ? 'bg-amber-100' : 'bg-green-100',
      iconColor: stats.validationStatus.upcoming > 0 ? 'text-amber-600' : 'text-green-600',
    },
    {
      label: 'Open Findings',
      value: stats.openFindings,
      icon: FileWarning,
      iconBg: stats.openFindings > 0 ? 'bg-amber-100' : 'bg-green-100',
      iconColor: stats.openFindings > 0 ? 'text-amber-600' : 'text-green-600',
    },
    {
      label: 'Current',
      value: stats.validationStatus.current,
      icon: CheckCircle,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {statCards.map((stat) => (
        <Card
          key={stat.label}
          className={stat.highlight ? 'border-red-200 ring-1 ring-red-200' : ''}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              <div>
                <div className={`text-2xl font-bold ${stat.highlight ? 'text-red-600' : 'text-gray-900'}`}>
                  {stat.value}
                </div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
