'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Settings,
  FileText,
  Plus,
  Loader2,
  Sparkles,
  CheckCircle,
  Clock,
  Eye,
  Play,
  RefreshCw,
  ScrollText,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  PolicyUploadDialog,
  PolicyDiffView,
  AffectedModelsTable,
  PolicyApprovalDialog,
} from '@/components/policy';
import { formatDate } from '@/lib/utils';

interface PolicyVersion {
  id: string;
  name: string;
  description?: string;
  documentContent?: string;
  status: string;
  createdAt: string;
  analyzedAt?: string;
  approvedAt?: string;
  appliedAt?: string;
  validationFreqs?: string;
  changesSummary?: string;
}

interface ValidationFrequencies {
  T3: number;
  T2: number;
  T1: number;
}

interface PreviewData {
  diff: {
    frequencyChanges: Array<{
      tier: string;
      current: string;
      new: string;
      direction: 'increase' | 'decrease' | 'same';
    }>;
    ruleChanges: Array<{
      type: 'new' | 'removed' | 'modified';
      name: string;
      description: string;
    }>;
    summary: string;
    impact: string;
  };
  affectedModels: Array<{
    inventoryModelId: string;
    inventoryNumber: string;
    modelName: string;
    previousTier: string;
    newTier: string;
    tierChanged: boolean;
    previousFrequency: number;
    newFrequency: number;
    frequencyChanged: boolean;
    previousDueDate: string;
    newDueDate: string;
    dueDateChanged: boolean;
  }>;
  summary: {
    totalAffected: number;
    tierChanges: number;
    frequencyChanges: number;
    earlierDueDates: number;
    laterDueDates: number;
  };
}

export default function PolicyManagementPage() {
  const [policies, setPolicies] = useState<PolicyVersion[]>([]);
  const [currentFrequencies, setCurrentFrequencies] = useState<ValidationFrequencies>({
    T3: 12,
    T2: 24,
    T1: 36,
  });
  const [loading, setLoading] = useState(true);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyVersion | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Dialogs
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
  const [documentContent, setDocumentContent] = useState<string | null>(null);
  const [loadingDocument, setLoadingDocument] = useState(false);

  const fetchPolicies = useCallback(async () => {
    try {
      const res = await fetch('/api/policy');
      if (res.ok) {
        const data = await res.json();
        setPolicies(data.policies.filter((p: PolicyVersion) => p.status !== 'Archived'));
        setCurrentFrequencies(data.currentFrequencies);
      }
    } catch (error) {
      console.error('Failed to fetch policies:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const handlePolicyLoaded = async (policyId: string) => {
    await fetchPolicies();
    // Select the newly loaded policy
    const policy = policies.find(p => p.id === policyId);
    if (policy) {
      setSelectedPolicy(policy);
    } else {
      // Refetch to get the new policy
      const res = await fetch(`/api/policy/${policyId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedPolicy(data.policy);
        await fetchPolicies();
      }
    }
  };

  const handleAnalyze = async () => {
    if (!selectedPolicy) return;

    setAnalyzing(true);
    try {
      const res = await fetch(`/api/policy/${selectedPolicy.id}/analyze`, {
        method: 'POST',
      });

      if (res.ok) {
        await fetchPolicies();
        // Update selected policy
        const policyRes = await fetch(`/api/policy/${selectedPolicy.id}`);
        if (policyRes.ok) {
          const data = await policyRes.json();
          setSelectedPolicy(data.policy);
        }
      }
    } catch (error) {
      console.error('Failed to analyze policy:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePreview = async () => {
    if (!selectedPolicy) return;

    setLoadingPreview(true);
    try {
      const res = await fetch(`/api/policy/${selectedPolicy.id}/preview`);
      if (res.ok) {
        const data = await res.json();
        setPreviewData(data);
      }
    } catch (error) {
      console.error('Failed to load preview:', error);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleViewDocument = async () => {
    if (!selectedPolicy) return;

    setLoadingDocument(true);
    try {
      const res = await fetch(`/api/policy/${selectedPolicy.id}`);
      if (res.ok) {
        const data = await res.json();
        setDocumentContent(data.policy.documentContent || 'No document content available.');
        setDocumentViewerOpen(true);
      }
    } catch (error) {
      console.error('Failed to fetch document:', error);
    } finally {
      setLoadingDocument(false);
    }
  };

  const handleApply = async () => {
    if (!selectedPolicy) return;

    const res = await fetch(`/api/policy/${selectedPolicy.id}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvedBy: 'mrm-user' }),
    });

    if (!res.ok) {
      throw new Error('Failed to apply policy');
    }

    // Refresh data
    await fetchPolicies();
    setSelectedPolicy(null);
    setPreviewData(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'Analyzed':
        return <Badge className="bg-blue-100 text-blue-800">Analyzed</Badge>;
      case 'Approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'Applied':
        return <Badge className="bg-purple-100 text-purple-800">Active</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/manager/welcome">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Policy Management</h1>
                  <p className="text-sm text-gray-500">Update MRM policy and tiering rules</p>
                </div>
              </div>
            </div>
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Load New Policy
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Current Config & Policy List */}
          <div className="space-y-6">
            {/* Current Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Current Validation Frequencies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-2 bg-red-50 rounded border border-red-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-red-900">T3 (High Risk)</span>
                    <Badge variant="outline" className="bg-white">{currentFrequencies.T3} months</Badge>
                  </div>
                  <p className="text-xs text-red-700 mt-1">Decisioning + Customer Impact, No HITL, GenAI Customer-Facing, Lending/Credit, AML/BSA</p>
                </div>
                <div className="p-2 bg-amber-50 rounded border border-amber-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-amber-900">T2 (Medium Risk)</span>
                    <Badge variant="outline" className="bg-white">{currentFrequencies.T2} months</Badge>
                  </div>
                  <p className="text-xs text-amber-700 mt-1">Advisory + Regulatory, PII/NPI Processing, Sensitive Attributes, Vendor Models, GenAI Internal</p>
                </div>
                <div className="p-2 bg-green-50 rounded border border-green-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-green-900">T1 (Low Risk)</span>
                    <Badge variant="outline" className="bg-white">{currentFrequencies.T1} months</Badge>
                  </div>
                  <p className="text-xs text-green-700 mt-1">Internal Automation (No Customer Impact), Rules-Based Systems</p>
                </div>
              </CardContent>
            </Card>

            {/* Policy Versions List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Policy Versions
                </CardTitle>
                <CardDescription>Select a policy to review or apply</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : policies.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No policies loaded yet</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => setUploadDialogOpen(true)}
                    >
                      Load Demo Policy
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {policies.map((policy) => (
                      <div
                        key={policy.id}
                        onClick={() => {
                          setSelectedPolicy(policy);
                          setPreviewData(null);
                        }}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedPolicy?.id === policy.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm truncate flex-1">
                            {policy.name}
                          </span>
                          {getStatusBadge(policy.status)}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Created {formatDate(policy.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Policy Details & Preview */}
          <div className="lg:col-span-2 space-y-6">
            {!selectedPolicy ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select or Load a Policy
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Load a new policy document or select an existing one from the list
                    to review changes and apply updates.
                  </p>
                  <Button onClick={() => setUploadDialogOpen(true)}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Load Demo Policy
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Selected Policy Actions */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{selectedPolicy.name}</CardTitle>
                        <CardDescription>{selectedPolicy.description}</CardDescription>
                      </div>
                      {getStatusBadge(selectedPolicy.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {selectedPolicy.status === 'Draft' && (
                        <Button onClick={handleAnalyze} disabled={analyzing}>
                          {analyzing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Analyze Policy
                            </>
                          )}
                        </Button>
                      )}

                      {(selectedPolicy.status === 'Analyzed' ||
                        selectedPolicy.status === 'Approved') && (
                        <>
                          <Button
                            variant="outline"
                            onClick={handlePreview}
                            disabled={loadingPreview}
                          >
                            {loadingPreview ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Loading...
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                Preview Impact
                              </>
                            )}
                          </Button>
                          <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => setApprovalDialogOpen(true)}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Apply Policy
                          </Button>
                        </>
                      )}

                      {selectedPolicy.status === 'Applied' && (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">Currently Active</span>
                        </div>
                      )}

                      {/* View Document Button - always visible */}
                      <Button
                        variant="outline"
                        onClick={handleViewDocument}
                        disabled={loadingDocument}
                      >
                        {loadingDocument ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <ScrollText className="h-4 w-4 mr-2" />
                            View Document
                          </>
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPolicy(null);
                          setPreviewData(null);
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Clear Selection
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Preview Data - Diff View */}
                {previewData?.diff && (
                  <PolicyDiffView
                    frequencyChanges={previewData.diff.frequencyChanges}
                    ruleChanges={previewData.diff.ruleChanges}
                    summary={previewData.diff.summary}
                    impact={previewData.diff.impact}
                  />
                )}

                {/* Preview Data - Affected Models */}
                {previewData?.affectedModels && (
                  <AffectedModelsTable
                    affectedModels={previewData.affectedModels}
                    summary={previewData.summary}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Dialogs */}
      <PolicyUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onPolicyLoaded={handlePolicyLoaded}
      />

      {selectedPolicy && previewData && (
        <PolicyApprovalDialog
          open={approvalDialogOpen}
          onOpenChange={setApprovalDialogOpen}
          policyName={selectedPolicy.name}
          summary={{
            totalAffected: previewData.summary.totalAffected,
            earlierDueDates: previewData.summary.earlierDueDates,
            frequencyChanges: previewData.summary.frequencyChanges,
          }}
          frequencyChanges={previewData.diff.frequencyChanges
            .filter(c => c.direction !== 'same')
            .map(c => `${c.tier}: ${c.current} -> ${c.new}`)}
          onApprove={handleApply}
        />
      )}

      {/* Document Viewer Dialog */}
      <Dialog open={documentViewerOpen} onOpenChange={setDocumentViewerOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <ScrollText className="h-5 w-5" />
                {selectedPolicy?.name || 'Policy Document'}
              </DialogTitle>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto mt-4">
            <div className="bg-gray-50 rounded-lg p-6 border">
              <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 leading-relaxed">
                {documentContent}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
