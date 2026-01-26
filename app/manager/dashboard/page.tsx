'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Search,
  Filter,
  ChevronRight,
  BarChart3,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ArrowLeft,
  Inbox,
  Eye,
  Settings,
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
import type { UseCaseWithRelations } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';

interface DashboardStats {
  total: number;
  pendingReview: number;
  approved: number;
  sentBack: number;
  highTier: number;
}

export default function ManagerDashboard() {
  const router = useRouter();
  const { toast } = useToast();
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

      // For manager view, exclude drafts (only show submitted and beyond)
      const managerCases = (data.useCases || []).filter(
        (uc: UseCaseWithRelations) => uc.status !== 'Draft'
      );
      setUseCases(managerCases);

      // Calculate stats for manager view
      setStats({
        total: managerCases.length,
        pendingReview: managerCases.filter((uc: UseCaseWithRelations) =>
          uc.status === 'Submitted' || uc.status === 'Under Review'
        ).length,
        approved: managerCases.filter((uc: UseCaseWithRelations) => uc.status === 'Approved').length,
        sentBack: managerCases.filter((uc: UseCaseWithRelations) => uc.status === 'Sent Back').length,
        highTier: managerCases.filter((uc: UseCaseWithRelations) =>
          uc.decision && uc.decision.tier === 'T3'
        ).length,
      });
    } catch (error) {
      console.error('Failed to fetch use cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const seedDemoData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/seed', { method: 'POST' });
      if (!response.ok) {
        const error = await response.json();
        console.error('Seed API error:', error);
        toast({ title: 'Error', description: 'Failed to load demo data', variant: 'destructive' });
        return;
      }
      toast({ title: 'Success', description: 'Demo data loaded successfully' });
      await fetchUseCases();
    } catch (error) {
      console.error('Failed to seed demo data:', error);
      toast({ title: 'Error', description: 'Failed to load demo data', variant: 'destructive' });
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

  // Sort by status priority: Submitted first, then Under Review, then others
  const sortedUseCases = [...filteredUseCases].sort((a, b) => {
    const statusPriority: Record<string, number> = {
      'Submitted': 0,
      'Under Review': 1,
      'Sent Back': 2,
      'Approved': 3,
      'Rejected': 4,
    };
    return (statusPriority[a.status] || 5) - (statusPriority[b.status] || 5);
  });

  const pendingCases = useCases.filter(uc => uc.status === 'Submitted' || uc.status === 'Under Review');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-200" />
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    Model Risk Manager Dashboard
                  </h1>
                  <p className="text-sm text-gray-500">
                    Review and approve AI/ML use cases
                  </p>
                </div>
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
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pending Review Banner */}
        {pendingCases.length > 0 && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Inbox className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-medium text-blue-900">
                  {pendingCases.length} intake{pendingCases.length > 1 ? 's' : ''} awaiting your review
                </h3>
                <p className="text-sm text-blue-700">
                  Click on any intake below to review and take action.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Total Submitted
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

          <Card className={pendingCases.length > 0 ? 'ring-2 ring-blue-300' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Pending Review
              </CardTitle>
              <Clock className="w-4 h-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-blue-600">{stats?.pendingReview || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Approved
              </CardTitle>
              <CheckCircle className="w-4 h-4 text-green-400" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-green-600">{stats?.approved || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Sent Back
              </CardTitle>
              <AlertTriangle className="w-4 h-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-orange-600">{stats?.sentBack || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                High Risk (T3)
              </CardTitle>
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-red-600">{stats?.highTier || 0}</div>
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
                  placeholder="Search intakes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-44">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Submitted">Submitted</SelectItem>
                    <SelectItem value="Under Review">Under Review</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                    <SelectItem value="Sent Back">Sent Back</SelectItem>
                  </SelectContent>
                </Select>

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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Review Queue */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-lg">Review Queue</CardTitle>
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
            ) : sortedUseCases.length === 0 ? (
              <div className="p-12 text-center">
                <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No intakes to review
                </h3>
                <p className="text-gray-500 mb-4">
                  Submitted intakes will appear here for your review.
                </p>
                <Button variant="outline" onClick={seedDemoData}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Load Demo Data
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Business Line</th>
                      <th>AI Type</th>
                      <th>Tier</th>
                      <th>Status</th>
                      <th>Submitted By</th>
                      <th>Updated</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedUseCases.map((uc) => (
                      <tr
                        key={uc.id}
                        className={`cursor-pointer ${
                          uc.status === 'Submitted' || uc.status === 'Under Review'
                            ? 'bg-blue-50 hover:bg-blue-100'
                            : ''
                        }`}
                        onClick={() => router.push(`/manager/usecase/${uc.id}`)}
                      >
                        <td>
                          <div className="flex items-center gap-2">
                            {(uc.status === 'Submitted' || uc.status === 'Under Review') && (
                              <Eye className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            )}
                            <div>
                              <div className="font-medium text-gray-900">
                                {truncate(uc.title, 40)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {truncate(uc.description, 60)}
                              </div>
                            </div>
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
                        <td className="text-gray-600 text-sm">{uc.createdBy}</td>
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
