'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  Download,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle,
  TrendingUp,
  Shield,
  Users,
  Database,
  Loader2,
  FileSpreadsheet,
  Building2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { HelpTooltip, HelpCard } from '@/components/ui/help-tooltip';
import { getTierBadgeColor, getStatusColor, formatDate } from '@/lib/utils';

interface Analytics {
  summary: {
    total: number;
    withDecision: number;
    pendingReview: number;
    approved: number;
    highRisk: number;
    avgApprovalTime: number;
    totalMissingArtifacts: number;
    totalRequiredArtifacts: number;
    artifactCompletionRate: number;
  };
  distributions: {
    status: Record<string, number>;
    tier: Record<string, number>;
    businessLine: Record<string, number>;
    aiType: Record<string, number>;
  };
  riskHeatmap: Record<string, Record<string, number>>;
  agingAnalysis: {
    items: Array<{
      id: string;
      title: string;
      businessLine: string;
      status: string;
      tier: string;
      daysInQueue: number;
      owner: string;
      slaStatus: string;
    }>;
    buckets: Record<string, number>;
    avgDaysInQueue: number;
  };
  dataSensitivity: {
    pii: number;
    npi: number;
    sensitiveAttributes: number;
    vendor: number;
  };
  regulatoryExposure: Record<string, number>;
  highRiskPending: Array<{
    id: string;
    title: string;
    businessLine: string;
    status: string;
    tier: string;
    owner: string;
  }>;
}

export default function ManagerReportsPage() {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load analytics', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: 'inventory' | 'executive-summary') => {
    try {
      setExporting(type);
      const endpoint = type === 'inventory' ? '/api/export/inventory' : '/api/export/executive-summary';
      const response = await fetch(endpoint);

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const filename = type === 'inventory'
        ? `model_inventory_${new Date().toISOString().split('T')[0]}.csv`
        : `MRM_Executive_Summary_${new Date().toISOString().split('T')[0]}.docx`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: 'Downloaded', description: `${type === 'inventory' ? 'Inventory' : 'Executive Summary'} exported successfully` });
    } catch (error) {
      toast({ title: 'Error', description: 'Export failed', variant: 'destructive' });
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Skeleton className="h-8 w-64" />
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </main>
      </div>
    );
  }

  if (!analytics) return null;

  const { summary, distributions, riskHeatmap, agingAnalysis, dataSensitivity, regulatoryExposure, highRiskPending } = analytics;

  // Calculate percentages for bar charts
  const tierTotal = Object.values(distributions.tier).reduce((a, b) => a + b, 0) || 1;
  const statusTotal = Object.values(distributions.status).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/manager/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-200" />
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    MRM Reports & Analytics
                  </h1>
                  <p className="text-sm text-gray-500">
                    Model inventory insights and executive reporting
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => handleExport('inventory')}
                disabled={exporting !== null}
              >
                {exporting === 'inventory' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                )}
                Export Inventory (CSV)
              </Button>
              <Button
                onClick={() => handleExport('executive-summary')}
                disabled={exporting !== null}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {exporting === 'executive-summary' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                Executive Summary (DOCX)
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Help Card */}
        <HelpCard
          id="mrm-reports-intro"
          title="MRM Analytics Dashboard"
          variant="info"
          className="mb-6"
          content={
            <div className="space-y-2">
              <p>This dashboard provides comprehensive analytics for Model Risk Management:</p>
              <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                <li><strong>Key Metrics:</strong> Portfolio summary and KPIs</li>
                <li><strong>Risk Distribution:</strong> Tier and status breakdowns</li>
                <li><strong>SLA Tracking:</strong> Review queue aging analysis</li>
                <li><strong>Export Reports:</strong> Download inventory and executive summaries</li>
              </ul>
            </div>
          }
        />

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 inline-flex items-center gap-1">
                Total Models
                <HelpTooltip content="All AI/ML use cases in the governance inventory" />
              </CardTitle>
              <Database className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.total}</div>
              <p className="text-xs text-gray-500 mt-1">
                {summary.withDecision} assessed
              </p>
            </CardContent>
          </Card>

          <Card className={summary.pendingReview > 0 ? 'ring-2 ring-blue-300' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 inline-flex items-center gap-1">
                Pending Review
                <HelpTooltip content="Use cases awaiting MRM review and decision" />
              </CardTitle>
              <Clock className="w-4 h-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{summary.pendingReview}</div>
              <p className="text-xs text-gray-500 mt-1">
                Avg {agingAnalysis.avgDaysInQueue} days in queue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 inline-flex items-center gap-1">
                High Risk (T3)
                <HelpTooltip content="Models classified as high-risk requiring enhanced oversight" />
              </CardTitle>
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{summary.highRisk}</div>
              <p className="text-xs text-gray-500 mt-1">
                {highRiskPending.length} pending action
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 inline-flex items-center gap-1">
                Artifact Completion
                <HelpTooltip content="Percentage of required documentation that has been provided" />
              </CardTitle>
              <CheckCircle className="w-4 h-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{summary.artifactCompletionRate}%</div>
              <p className="text-xs text-gray-500 mt-1">
                {summary.totalMissingArtifacts} artifacts missing
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Risk Tier Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base inline-flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-500" />
                Risk Tier Distribution
              </CardTitle>
              <CardDescription>Breakdown of models by risk classification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(['T1', 'T2', 'T3'] as const).map((tier) => {
                  const count = distributions.tier[tier] || 0;
                  const percent = tierTotal > 0 ? (count / tierTotal) * 100 : 0;
                  return (
                    <div key={tier}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">
                          {tier} - {tier === 'T1' ? 'Low' : tier === 'T2' ? 'Medium' : 'High'} Risk
                        </span>
                        <span className="text-sm text-gray-500">{count} ({percent.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${
                            tier === 'T1' ? 'bg-green-500' : tier === 'T2' ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base inline-flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Status Distribution
              </CardTitle>
              <CardDescription>Current status of all use cases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(distributions.status)
                  .sort((a, b) => b[1] - a[1])
                  .map(([status, count]) => {
                    const percent = statusTotal > 0 ? (count / statusTotal) * 100 : 0;
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getStatusColor(status)}>
                            {status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-100 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-purple-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Risk Heatmap */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base inline-flex items-center gap-2">
              <Building2 className="w-5 h-5 text-orange-500" />
              Risk Heatmap by Business Line
              <HelpTooltip content="Visual representation of risk distribution across business units" />
            </CardTitle>
            <CardDescription>Shows concentration of risk tiers per business line</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(riskHeatmap).length === 0 ? (
              <p className="text-gray-500 text-center py-8">No data available. Generate decisions for use cases to populate the heatmap.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium text-gray-600">Business Line</th>
                      <th className="text-center py-2 px-3 font-medium text-green-600">T1 (Low)</th>
                      <th className="text-center py-2 px-3 font-medium text-amber-600">T2 (Medium)</th>
                      <th className="text-center py-2 px-3 font-medium text-red-600">T3 (High)</th>
                      <th className="text-center py-2 px-3 font-medium text-gray-600">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(riskHeatmap)
                      .sort((a, b) => {
                        const totalA = (a[1].T1 || 0) + (a[1].T2 || 0) + (a[1].T3 || 0);
                        const totalB = (b[1].T1 || 0) + (b[1].T2 || 0) + (b[1].T3 || 0);
                        return totalB - totalA;
                      })
                      .map(([businessLine, tiers]) => {
                        const total = (tiers.T1 || 0) + (tiers.T2 || 0) + (tiers.T3 || 0);
                        return (
                          <tr key={businessLine} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-3 font-medium">{businessLine}</td>
                            <td className="text-center py-3 px-3">
                              {tiers.T1 > 0 && (
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 font-medium">
                                  {tiers.T1}
                                </span>
                              )}
                            </td>
                            <td className="text-center py-3 px-3">
                              {tiers.T2 > 0 && (
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-medium">
                                  {tiers.T2}
                                </span>
                              )}
                            </td>
                            <td className="text-center py-3 px-3">
                              {tiers.T3 > 0 && (
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-700 font-medium">
                                  {tiers.T3}
                                </span>
                              )}
                            </td>
                            <td className="text-center py-3 px-3 text-gray-600">{total}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* SLA / Aging Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base inline-flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                Review Queue Aging
                <HelpTooltip content="Track how long items have been waiting for MRM review" />
              </CardTitle>
              <CardDescription>Days pending by age bucket</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(agingAnalysis.buckets).map(([bucket, count]) => {
                  const total = Object.values(agingAnalysis.buckets).reduce((a, b) => a + b, 0) || 1;
                  const percent = (count / total) * 100;
                  const isOverdue = bucket === '30+ days' || bucket === '15-30 days';
                  return (
                    <div key={bucket}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                          {bucket}
                        </span>
                        <span className="text-sm text-gray-500">{count}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            bucket === '0-7 days'
                              ? 'bg-green-500'
                              : bucket === '8-14 days'
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              {agingAnalysis.avgDaysInQueue > 14 && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Average review time ({agingAnalysis.avgDaysInQueue} days) exceeds SLA target
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data Sensitivity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base inline-flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-500" />
                Data Sensitivity Overview
                <HelpTooltip content="Models processing sensitive data types" />
              </CardTitle>
              <CardDescription>Privacy and vendor exposure metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-amber-50 rounded-lg">
                  <div className="text-2xl font-bold text-amber-700">{dataSensitivity.pii}</div>
                  <div className="text-sm text-amber-600">Models with PII</div>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg">
                  <div className="text-2xl font-bold text-amber-700">{dataSensitivity.npi}</div>
                  <div className="text-sm text-amber-600">Models with NPI</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-700">{dataSensitivity.sensitiveAttributes}</div>
                  <div className="text-sm text-purple-600">Sensitive Attributes</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">{dataSensitivity.vendor}</div>
                  <div className="text-sm text-blue-600">Vendor Models</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Regulatory Exposure */}
        {Object.keys(regulatoryExposure).length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-base inline-flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                Regulatory Domain Exposure
                <HelpTooltip content="Count of models falling under each regulatory domain" />
              </CardTitle>
              <CardDescription>Models subject to specific regulatory requirements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {Object.entries(regulatoryExposure)
                  .sort((a, b) => b[1] - a[1])
                  .map(([domain, count]) => (
                    <div key={domain} className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-lg">
                      <span className="font-medium text-indigo-700">{domain}</span>
                      <Badge className="bg-indigo-600">{count}</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* High-Risk Items Requiring Attention */}
        {highRiskPending.length > 0 && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-base inline-flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                High-Risk Items Requiring Attention
              </CardTitle>
              <CardDescription>T3 models that are not yet approved</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {highRiskPending.map((item) => (
                  <Link
                    key={item.id}
                    href={`/manager/usecase/${item.id}`}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <div>
                        <div className="font-medium text-gray-900">{item.title}</div>
                        <div className="text-sm text-gray-500">
                          {item.businessLine} • Owner: {item.owner}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getTierBadgeColor(item.tier)}>{item.tier}</Badge>
                      <Badge variant="outline" className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
