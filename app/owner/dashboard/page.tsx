'use client';

import { useEffect, useState, useCallback } from 'react';
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
  MessageSquare,
  ArrowLeft,
  AlertCircle,
  RotateCcw,
  Wand2,
  Loader2,
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
import { useToast } from '@/components/ui/use-toast';
import { formatDate, getTierBadgeColor, getStatusColor, truncate } from '@/lib/utils';
import type { UseCaseWithRelations } from '@/lib/types';

interface DashboardStats {
  total: number;
  draft: number;
  submitted: number;
  approved: number;
  sentBack: number;
}

export default function OwnerDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [useCases, setUseCases] = useState<UseCaseWithRelations[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [generatingDemo, setGeneratingDemo] = useState(false);

  useEffect(() => {
    fetchUseCases();
  }, []);

  const handleGenerateDemoUseCase = useCallback(async () => {
    if (generatingDemo) return; // Prevent double-click
    setGeneratingDemo(true);

    try {
      const res = await fetch('/api/usecases/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'random' }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create demo use case');
      }

      const data = await res.json();
      toast({
        title: 'Demo Use Case Created',
        description: `Created: ${data.useCase.title}`,
      });

      // Navigate to the new use case
      router.push(`/owner/usecase/${data.useCase.id}`);
    } catch (error) {
      console.error('Error creating demo use case:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create demo use case',
        variant: 'destructive',
      });
    } finally {
      setGeneratingDemo(false);
    }
  }, [generatingDemo, toast, router]);

  const fetchUseCases = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/usecases');
      const data = await response.json();
      setUseCases(data.useCases || []);

      // Calculate stats for owner view
      const cases = data.useCases || [];
      setStats({
        total: cases.length,
        draft: cases.filter((uc: UseCaseWithRelations) => uc.status === 'Draft').length,
        submitted: cases.filter((uc: UseCaseWithRelations) =>
          uc.status === 'Submitted' || uc.status === 'Under Review'
        ).length,
        approved: cases.filter((uc: UseCaseWithRelations) => uc.status === 'Approved').length,
        sentBack: cases.filter((uc: UseCaseWithRelations) => uc.status === 'Sent Back').length,
      });
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

    return matchesSearch && matchesStatus;
  });

  const sentBackCases = useCases.filter(uc => uc.status === 'Sent Back');

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
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    Model Owner Dashboard
                  </h1>
                  <p className="text-sm text-gray-500">
                    Submit and track your use cases
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleGenerateDemoUseCase}
                disabled={generatingDemo}
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                {generatingDemo ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Demo Data
                  </>
                )}
              </Button>
              <Link href="/owner/intake/chat">
                <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat Intake
                </Button>
              </Link>
              <Link href="/owner/intake/new">
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
        {/* Alert Banner for Sent Back Items */}
        {sentBackCases.length > 0 && (
          <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-orange-900">
                  {sentBackCases.length} intake{sentBackCases.length > 1 ? 's' : ''} sent back for revision
                </h3>
                <p className="text-sm text-orange-700 mt-1">
                  The Model Risk Manager has requested changes to the following intake{sentBackCases.length > 1 ? 's' : ''}:
                </p>
                <div className="mt-2 space-y-1">
                  {sentBackCases.map(uc => (
                    <button
                      key={uc.id}
                      onClick={() => router.push(`/owner/usecase/${uc.id}`)}
                      className="flex items-center gap-2 text-sm text-orange-800 hover:text-orange-900 hover:underline"
                    >
                      <RotateCcw className="w-3 h-3" />
                      {uc.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Total Intakes
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
              <CardTitle className="text-sm font-medium text-gray-500">
                Drafts
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
              <CardTitle className="text-sm font-medium text-gray-500">
                Pending Review
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

          <Card className={sentBackCases.length > 0 ? 'ring-2 ring-orange-300' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Needs Revision
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
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search your intakes..."
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
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Submitted">Submitted</SelectItem>
                    <SelectItem value="Under Review">Under Review</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                    <SelectItem value="Sent Back">Sent Back</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Use Cases Table */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-lg">Your Intakes</CardTitle>
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
                  No intakes found
                </h3>
                <p className="text-gray-500 mb-4">
                  Get started by creating a new intake using our form or AI assistant.
                </p>
                <div className="flex justify-center gap-3">
                  <Link href="/owner/intake/chat">
                    <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Chat Intake
                    </Button>
                  </Link>
                  <Link href="/owner/intake/new">
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
                        className={`cursor-pointer ${uc.status === 'Sent Back' ? 'bg-orange-50' : ''}`}
                        onClick={() => router.push(`/owner/usecase/${uc.id}`)}
                      >
                        <td>
                          <div className="flex items-center gap-2">
                            {uc.status === 'Sent Back' && (
                              <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
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
