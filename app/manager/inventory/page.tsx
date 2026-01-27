'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  Database,
  ChevronRight,
  Bot,
  Cpu,
  Building2,
  RefreshCw,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InventoryStats } from '@/components/inventory/InventoryStats';
import { ValidationStatusBadge } from '@/components/inventory/ValidationStatusBadge';
import { getTierBadgeColor, formatDate, type ValidationStatus } from '@/lib/utils';
import type { InventoryStats as InventoryStatsType, InventoryModelWithDetails } from '@/lib/types';

export default function InventoryDashboardPage() {
  const router = useRouter();
  const [models, setModels] = useState<InventoryModelWithDetails[]>([]);
  const [stats, setStats] = useState<InventoryStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [validationStatusFilter, setValidationStatusFilter] = useState<string>('all');
  const [showChatbot, setShowChatbot] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Build query params
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (tierFilter !== 'all') params.append('tier', tierFilter);
      if (validationStatusFilter !== 'all') params.append('validationStatus', validationStatusFilter);

      const [modelsRes, statsRes] = await Promise.all([
        fetch(`/api/inventory?${params.toString()}`),
        fetch('/api/inventory/stats'),
      ]);

      if (modelsRes.ok) {
        const modelsData = await modelsRes.json();
        setModels(modelsData.inventoryModels || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching inventory data:', error);
    } finally {
      setLoading(false);
    }
  }, [search, tierFilter, validationStatusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRowClick = (modelId: string) => {
    router.push(`/manager/inventory/${modelId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/manager/welcome">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-200" />
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-purple-600" />
                <h1 className="text-xl font-semibold text-gray-900">Model Inventory</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowChatbot(!showChatbot)}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                AI Assistant
              </Button>
              <Link href="/api/admin/seed-inventory">
                <Button variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Load Demo Data
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Alert Banner for Overdue */}
        {stats && stats.validationStatus.overdue > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">
                  {stats.validationStatus.overdue} model{stats.validationStatus.overdue !== 1 ? 's have' : ' has'} overdue validation{stats.validationStatus.overdue !== 1 ? 's' : ''}
                </p>
                <p className="text-sm text-red-600">
                  Immediate action required to maintain compliance
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-red-200 text-red-700 hover:bg-red-100"
              onClick={() => setValidationStatusFilter('overdue')}
            >
              View Overdue
            </Button>
          </div>
        )}

        {/* Stats Cards */}
        <InventoryStats stats={stats} loading={loading} />

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by model name, inventory number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Tiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="T1">T1 (Low)</SelectItem>
                <SelectItem value="T2">T2 (Medium)</SelectItem>
                <SelectItem value="T3">T3 (High)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={validationStatusFilter} onValueChange={setValidationStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Validation Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="upcoming">Due Soon</SelectItem>
                <SelectItem value="current">Current</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading inventory...</p>
            </div>
          ) : models.length === 0 ? (
            <div className="p-12 text-center">
              <Database className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No models in inventory</h3>
              <p className="text-gray-500 mb-4">
                {search || tierFilter !== 'all' || validationStatusFilter !== 'all'
                  ? 'No models match your filters. Try adjusting your search criteria.'
                  : 'Approve use cases to add them to the model inventory.'}
              </p>
              {!search && tierFilter === 'all' && validationStatusFilter === 'all' && (
                <Button onClick={() => fetch('/api/admin/seed-inventory', { method: 'POST' }).then(() => fetchData())}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Load Demo Data
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Model
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tier
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Validation
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Next Due
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Findings
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {models.map((model) => (
                    <tr
                      key={model.id}
                      onClick={() => handleRowClick(model.id)}
                      className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                        model.validationStatus === 'overdue'
                          ? 'bg-red-50 hover:bg-red-100'
                          : model.validationStatus === 'upcoming'
                          ? 'bg-amber-50 hover:bg-amber-100'
                          : ''
                      }`}
                    >
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            {model.useCase.title}
                            {model.useCase.aiType && model.useCase.aiType !== 'None' && (
                              <span title="AI-Enabled"><Bot className="w-4 h-4 text-blue-500" /></span>
                            )}
                            {model.useCase.vendorInvolved && (
                              <span title="Vendor Model"><Building2 className="w-4 h-4 text-orange-500" /></span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {model.inventoryNumber} · {model.useCase.businessLine}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge className={getTierBadgeColor(model.tier)}>
                          {model.tier}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Cpu className="w-4 h-4" />
                          {model.useCase.aiType}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {model.lastValidationDate
                          ? formatDate(model.lastValidationDate)
                          : 'Never'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {formatDate(model.nextValidationDue)}
                      </td>
                      <td className="px-4 py-4">
                        <ValidationStatusBadge status={model.validationStatus as ValidationStatus} />
                      </td>
                      <td className="px-4 py-4">
                        {model.openFindingsCount > 0 ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            {model.openFindingsCount} open
                          </Badge>
                        ) : model.totalFindingsCount > 0 ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            All resolved
                          </Badge>
                        ) : (
                          <span className="text-sm text-gray-400">None</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Chatbot Sidebar */}
        {showChatbot && (
          <div className="fixed right-0 top-0 h-full w-96 bg-white border-l shadow-lg z-50 flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold">Inventory Assistant</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowChatbot(false)}>
                ×
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src="/manager/inventory/chat"
                className="w-full h-full border-0"
                title="Inventory Chatbot"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
