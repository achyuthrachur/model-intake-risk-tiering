'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Search,
  Filter,
  ChevronRight,
  BarChart3,
  Clock,
  AlertTriangle,
  CheckCircle,
  Settings,
  RefreshCw,
  MessageSquare,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, getTierBadgeColor, getStatusColor, truncate } from '@/lib/utils';
import { HelpTooltip, HelpCard } from '@/components/ui/help-tooltip';
import type { UseCaseWithRelations } from '@/lib/types';

interface DashboardStats {
  total: number;
  draft: number;
  submitted: number;
  approved: number;
  highTier: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [useCases, setUseCases] = useState<UseCaseWithRelations[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');

  useEffect(() => {
    fetchUseCases();
  }, []);

  const fetchUseCases = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/usecases');
      const data = await response.json();
      setUseCases(data.useCases || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Failed to fetch use cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUseCases = useCases.filter((uc) => {
    const matchesSearch =
      searchQuery === '' ||
      uc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      uc.businessLine.toLowerCase().includes(searchQuery.toLowerCase()) ||
      uc.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || uc.status === statusFilter;

    const matchesTier =
      tierFilter === 'all' || (uc.decision && uc.decision.tier === tierFilter);

    return matchesSearch && matchesStatus && matchesTier;
  });

  const seedDemoData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/seed', { method: 'POST' });
      if (!response.ok) {
        const error = await response.json();
        console.error('Seed API error:', error);
        return;
      }
      await fetchUseCases();
    } catch (error) {
      console.error('Failed to seed demo data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Model Use Case Governance
                </h1>
                <p className="text-sm text-gray-500">
                  Model Intake & Risk Tiering
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" onClick={seedDemoData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Load Demo Data
              </Button>
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              </Link>
              <Link href="/intake/chat">
                <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat Intake
                </Button>
              </Link>
              <Link href="/intake/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Intake
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Help Card */}
        <HelpCard
          id="dashboard-intro"
          title="Dashboard Overview"
          icon={<Lightbulb className="w-5 h-5" />}
          variant="info"
          className="mb-6"
          content={
            <div className="space-y-2">
              <p>This dashboard shows all use cases in the governance pipeline.</p>
              <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                <li><strong>Stats cards</strong> show counts by status and risk tier</li>
                <li><strong>Filters</strong> let you narrow down by status or tier</li>
                <li><strong>Click any row</strong> to view details and take action</li>
              </ul>
              <p className="text-xs mt-2">Use "Load Demo Data" to populate sample use cases for testing.</p>
            </div>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 inline-flex items-center gap-1">
                Total Use Cases
                <HelpTooltip content="All use cases in the system regardless of status" />
              </CardTitle>
              <FileText className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.total || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 inline-flex items-center gap-1">
                Draft
                <HelpTooltip content="Use cases that are being prepared but have not yet been submitted for review" />
              </CardTitle>
              <Clock className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.draft || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 inline-flex items-center gap-1">
                Submitted
                <HelpTooltip content="Use cases that have been submitted and are awaiting MRM review" />
              </CardTitle>
              <FileText className="w-4 h-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.submitted || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 inline-flex items-center gap-1">
                Approved
                <HelpTooltip content="Use cases that have completed review and received approval to proceed" />
              </CardTitle>
              <CheckCircle className="w-4 h-4 text-green-400" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.approved || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 inline-flex items-center gap-1">
                High Tier (T3)
                <HelpTooltip
                  title="High Risk Use Cases"
                  content="T3 use cases require the most rigorous governance: full validation, senior approval, enhanced monitoring, and comprehensive documentation. These typically involve customer-facing decisions, regulated activities, or significant financial impact."
                />
              </CardTitle>
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-red-600">
                  {stats?.highTier || 0}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by title, business line, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-3 items-center">
                <div className="flex items-center gap-1">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Submitted">Submitted</SelectItem>
                      <SelectItem value="Under Review">Under Review</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Sent Back">Sent Back</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <HelpTooltip
                    title="Status Filter"
                    content={
                      <div>
                        <ul className="space-y-1">
                          <li><strong>Draft:</strong> Not yet submitted</li>
                          <li><strong>Submitted:</strong> Awaiting review</li>
                          <li><strong>Under Review:</strong> Being evaluated</li>
                          <li><strong>Sent Back:</strong> Needs revision</li>
                          <li><strong>Approved:</strong> Cleared for use</li>
                          <li><strong>Rejected:</strong> Not approved</li>
                        </ul>
                      </div>
                    }
                  />
                </div>

                <div className="flex items-center gap-1">
                  <Select value={tierFilter} onValueChange={setTierFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tiers</SelectItem>
                      <SelectItem value="T1">T1 - Low</SelectItem>
                      <SelectItem value="T2">T2 - Medium</SelectItem>
                      <SelectItem value="T3">T3 - High</SelectItem>
                    </SelectContent>
                  </Select>
                  <HelpTooltip
                    title="Risk Tier Filter"
                    content={
                      <div>
                        <ul className="space-y-1">
                          <li><strong>T1 (Low):</strong> Internal tools, minimal risk</li>
                          <li><strong>T2 (Medium):</strong> Advisory, moderate oversight</li>
                          <li><strong>T3 (High):</strong> Decisions, regulated, customer-facing</li>
                        </ul>
                      </div>
                    }
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Use Cases Table */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-lg">Use Cases</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredUseCases.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No use cases found
                </h3>
                <p className="text-gray-500 mb-4">
                  Get started by creating a new intake or loading demo data.
                </p>
                <div className="flex justify-center gap-3">
                  <Button variant="outline" onClick={seedDemoData}>
                    Load Demo Data
                  </Button>
                  <Link href="/intake/chat">
                    <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Chat Intake
                    </Button>
                  </Link>
                  <Link href="/intake/new">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      New Intake
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Business Line</th>
                      <th>Model Type</th>
                      <th>Tier</th>
                      <th>Status</th>
                      <th>Updated</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUseCases.map((uc) => (
                      <tr
                        key={uc.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/usecase/${uc.id}`)}
                      >
                        <td>
                          <div className="font-medium text-gray-900">
                            {truncate(uc.title, 40)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {truncate(uc.description, 60)}
                          </div>
                        </td>
                        <td className="text-gray-600">{uc.businessLine}</td>
                        <td className="text-gray-600">{uc.aiType}</td>
                        <td>
                          {uc.decision ? (
                            <Badge className={getTierBadgeColor(uc.decision.tier)}>
                              {uc.decision.tier}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td>
                          <Badge variant="outline" className={getStatusColor(uc.status)}>
                            {uc.status}
                          </Badge>
                        </td>
                        <td className="text-gray-500 text-sm">
                          {formatDate(uc.updatedAt)}
                        </td>
                        <td>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
