'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  Sparkles,
  ClipboardList,
  History,
  FileDown,
  Brain,
  Lightbulb,
  Eye,
  Loader2,
  ThumbsUp,
  RotateCcw,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { HelpTooltip, HelpCard } from '@/components/ui/help-tooltip';
import {
  formatDate,
  formatDateTime,
  getTierBadgeColor,
  getStatusColor,
  parseJsonSafe,
} from '@/lib/utils';
import type { UseCaseWithRelations } from '@/lib/types';

export default function ManagerUseCaseReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [useCase, setUseCase] = useState<UseCaseWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [artifactsConfig, setArtifactsConfig] = useState<any>(null);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [generatingAI, setGeneratingAI] = useState(false);

  // Review action states
  const [showSendBackDialog, setShowSendBackDialog] = useState(false);
  const [sendBackNotes, setSendBackNotes] = useState('');
  const [approving, setApproving] = useState(false);
  const [sendingBack, setSendingBack] = useState(false);

  // AI Artifact Review state
  const [artifactReview, setArtifactReview] = useState<any>(null);
  const [generatingArtifactReview, setGeneratingArtifactReview] = useState(false);

  const id = params.id as string;

  useEffect(() => {
    fetchUseCase();
    fetchConfig();
  }, [id]);

  useEffect(() => {
    if (useCase?.decision) {
      fetchAIInsights();
      fetchArtifactReview();
    }
  }, [useCase?.decision?.id]);

  const fetchArtifactReview = async () => {
    try {
      const response = await fetch(`/api/usecases/${id}/ai-artifact-review`);
      if (response.ok) {
        const data = await response.json();
        setArtifactReview(data);
      }
    } catch (error) {
      console.log('No artifact review available');
    }
  };

  const generateArtifactReview = async () => {
    try {
      setGeneratingArtifactReview(true);
      const response = await fetch(`/api/usecases/${id}/ai-artifact-review`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate artifact review');
      }

      const data = await response.json();
      setArtifactReview(data);
      toast({ title: 'Artifact Review Generated', description: 'AI has analyzed the uploaded artifacts' });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate artifact review',
        variant: 'destructive',
      });
    } finally {
      setGeneratingArtifactReview(false);
    }
  };

  const fetchAIInsights = async () => {
    try {
      const response = await fetch(`/api/ai/risk-assessment?useCaseId=${id}`);
      if (response.ok) {
        const data = await response.json();
        setAiInsights(data);
      }
    } catch (error) {
      console.log('No AI insights available');
    }
  };

  const generateAIInsights = async () => {
    try {
      setGeneratingAI(true);
      const response = await fetch('/api/ai/risk-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useCaseId: id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate AI insights');
      }

      const data = await response.json();
      setAiInsights(data);
      toast({ title: 'AI Insights Generated', description: 'Enhanced risk assessment is ready' });
    } catch (error) {
      toast({
        title: 'AI Insights Unavailable',
        description: error instanceof Error ? error.message : 'Set OPENAI_API_KEY to enable AI features',
        variant: 'destructive',
      });
    } finally {
      setGeneratingAI(false);
    }
  };

  const fetchUseCase = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/usecases/${id}`);
      if (!response.ok) throw new Error('Not found');
      const data = await response.json();
      setUseCase(data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load use case', variant: 'destructive' });
      router.push('/manager/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/config');
      const data = await response.json();
      setArtifactsConfig(data.artifacts);
    } catch (error) {
      console.error('Failed to load config');
    }
  };

  const generateDecision = async () => {
    try {
      setGenerating(true);
      const response = await fetch(`/api/usecases/${id}/decision`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to generate');

      toast({ title: 'Decision Generated', description: 'Risk tier and requirements have been calculated' });
      await fetchUseCase();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate decision', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async () => {
    try {
      setApproving(true);
      const response = await fetch(`/api/usecases/${id}/approve`, {
        method: 'POST',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve');
      }

      toast({ title: 'Approved', description: 'Use case has been approved' });
      await fetchUseCase();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve',
        variant: 'destructive',
      });
    } finally {
      setApproving(false);
    }
  };

  const handleSendBack = async () => {
    try {
      setSendingBack(true);
      const response = await fetch(`/api/usecases/${id}/send-back`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: sendBackNotes }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send back');
      }

      toast({ title: 'Sent Back', description: 'Use case has been sent back to the owner' });
      setShowSendBackDialog(false);
      setSendBackNotes('');
      await fetchUseCase();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send back',
        variant: 'destructive',
      });
    } finally {
      setSendingBack(false);
    }
  };

  const downloadExport = async (type: 'memo' | 'checklist' | 'inventory') => {
    try {
      const response = await fetch(`/api/usecases/${id}/export/${type}`);
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const filename =
        type === 'memo'
          ? `${useCase?.title.replace(/[^a-z0-9]/gi, '_')}_memo.docx`
          : type === 'checklist'
          ? `${useCase?.title.replace(/[^a-z0-9]/gi, '_')}_checklist.html`
          : `${useCase?.title.replace(/[^a-z0-9]/gi, '_')}_inventory.csv`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: 'Downloaded', description: `${type} exported successfully` });
    } catch (error) {
      toast({ title: 'Error', description: 'Export failed', variant: 'destructive' });
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
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  if (!useCase) return null;

  const decision = useCase.decision;
  const triggeredRules = decision ? parseJsonSafe<string[]>(decision.triggeredRules, []) : [];
  const requiredArtifacts = decision ? parseJsonSafe<string[]>(decision.requiredArtifacts, []) : [];
  const missingEvidence = decision ? parseJsonSafe<string[]>(decision.missingEvidence, []) : [];
  const riskFlags = decision ? parseJsonSafe<string[]>(decision.riskFlags, []) : [];
  const regulatoryDomains = parseJsonSafe<string[]>(useCase.regulatoryDomains, []);

  const groupedArtifacts: Record<string, any[]> = {};
  if (artifactsConfig) {
    requiredArtifacts.forEach((artifactId: string) => {
      const artifact = artifactsConfig.artifacts[artifactId];
      if (artifact) {
        const category = artifact.category;
        if (!groupedArtifacts[category]) {
          groupedArtifacts[category] = [];
        }
        groupedArtifacts[category].push({ ...artifact, isMissing: missingEvidence.includes(artifactId) });
      }
    });
  }

  const canTakeAction = useCase.status === 'Submitted' || useCase.status === 'Under Review';

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
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">{useCase.title}</h1>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>{useCase.businessLine}</span>
                    <span>•</span>
                    <span>{useCase.aiType}</span>
                    <span>•</span>
                    <span>by {useCase.createdBy}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className={getStatusColor(useCase.status)}>
                {useCase.status}
              </Badge>
              {decision && (
                <Badge className={getTierBadgeColor(decision.tier)}>
                  {decision.tier} - {decision.tier === 'T1' ? 'Low' : decision.tier === 'T2' ? 'Medium' : 'High'} Risk
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Manager Review Help Card */}
        <HelpCard
          id="manager-review-help"
          title="How to Review a Use Case"
          icon={<Lightbulb className="w-5 h-5" />}
          variant="tip"
          className="mb-6"
          content={
            <div className="space-y-2">
              <p>As an MRM reviewer, follow these steps:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Review the <strong>Summary</strong> tab for use case details</li>
                <li>Go to <strong>Decision</strong> tab and click "Generate Decision" to run the rules engine</li>
                <li>Review the assigned tier, triggered rules, and risk flags</li>
                <li>Check <strong>Required Artifacts</strong> tab for missing documentation</li>
                <li>Either <strong>Approve</strong> or <strong>Send Back</strong> with specific feedback</li>
              </ol>
            </div>
          }
        />

        {/* Review Actions Card */}
        {canTakeAction && (
          <Card className="mb-6 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center text-purple-800">
                <Eye className="w-5 h-5 mr-2" />
                Review Actions
                <HelpTooltip
                  className="ml-2"
                  title="Taking Action on a Use Case"
                  content={
                    <div>
                      <p className="mb-2">You can take two actions:</p>
                      <ul className="space-y-1">
                        <li><strong>Approve:</strong> The use case meets requirements and can proceed. Requires a generated decision.</li>
                        <li><strong>Send Back:</strong> Returns to the owner with feedback. Use for missing information, incomplete artifacts, or concerns.</li>
                      </ul>
                    </div>
                  }
                />
              </CardTitle>
              <CardDescription>
                Review the submission details below and take action.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button
                  onClick={handleApprove}
                  disabled={approving || !decision}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  {approving ? 'Approving...' : 'Approve'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowSendBackDialog(true)}
                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Send Back with Notes
                </Button>
                {!decision && (
                  <p className="text-sm text-purple-700 self-center ml-4">
                    Generate a decision before approving.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Previously Sent Back Info */}
        {useCase.status === 'Sent Back' && useCase.reviewerNotes && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-800">
                <RotateCcw className="w-5 h-5 mr-2" />
                Previously Sent Back
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-4 rounded-lg border border-orange-200">
                <p className="text-gray-800 whitespace-pre-wrap">{useCase.reviewerNotes}</p>
                {useCase.reviewedBy && (
                  <p className="text-sm text-gray-500 mt-2">
                    — {useCase.reviewedBy}, {useCase.reviewedAt ? formatDate(useCase.reviewedAt) : ''}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList>
            <TabsTrigger value="summary" className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="decision" className="flex items-center">
              <Sparkles className="w-4 h-4 mr-2" />
              Decision
            </TabsTrigger>
            <TabsTrigger value="artifacts" className="flex items-center">
              <ClipboardList className="w-4 h-4 mr-2" />
              Required Artifacts
            </TabsTrigger>
            <TabsTrigger value="exports" className="flex items-center">
              <FileDown className="w-4 h-4 mr-2" />
              Exports
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center">
              <History className="w-4 h-4 mr-2" />
              Audit Trail
            </TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
                      <p className="text-gray-900">{useCase.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Intended Users</h4>
                        <p className="text-gray-900">{useCase.intendedUsers || '-'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Owner</h4>
                        <p className="text-gray-900">{useCase.createdBy}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Use & Impact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Usage Type</dt>
                        <dd className="text-gray-900">{useCase.usageType}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Customer Impact</dt>
                        <dd className="text-gray-900">{useCase.customerImpact}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Human-in-the-Loop</dt>
                        <dd className="text-gray-900">{useCase.humanInLoop}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Deployment</dt>
                        <dd className="text-gray-900">{useCase.deployment}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Data & Privacy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className={`p-3 rounded-lg ${useCase.containsPii ? 'bg-amber-50' : 'bg-green-50'}`}>
                        <div className="text-sm font-medium">PII</div>
                        <div className={useCase.containsPii ? 'text-amber-700' : 'text-green-700'}>
                          {useCase.containsPii ? 'Yes' : 'No'}
                        </div>
                      </div>
                      <div className={`p-3 rounded-lg ${useCase.containsNpi ? 'bg-amber-50' : 'bg-green-50'}`}>
                        <div className="text-sm font-medium">NPI</div>
                        <div className={useCase.containsNpi ? 'text-amber-700' : 'text-green-700'}>
                          {useCase.containsNpi ? 'Yes' : 'No'}
                        </div>
                      </div>
                      <div className={`p-3 rounded-lg ${useCase.sensitiveAttributesUsed ? 'bg-amber-50' : 'bg-green-50'}`}>
                        <div className="text-sm font-medium">Sensitive Attributes</div>
                        <div className={useCase.sensitiveAttributesUsed ? 'text-amber-700' : 'text-green-700'}>
                          {useCase.sensitiveAttributesUsed ? 'Yes' : 'No'}
                        </div>
                      </div>
                    </div>
                    {regulatoryDomains.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Regulatory Domains</h4>
                        <div className="flex flex-wrap gap-2">
                          {regulatoryDomains.map((domain: string) => (
                            <Badge key={domain} variant="outline">{domain}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {canTakeAction && (
                      <>
                        <Button
                          className="w-full bg-green-600 hover:bg-green-700"
                          onClick={handleApprove}
                          disabled={approving || !decision}
                        >
                          <ThumbsUp className="w-4 h-4 mr-2" />
                          {approving ? 'Approving...' : 'Approve'}
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                          onClick={() => setShowSendBackDialog(true)}
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Send Back
                        </Button>
                      </>
                    )}
                    <Button
                      className="w-full"
                      variant={canTakeAction ? 'outline' : 'default'}
                      onClick={generateDecision}
                      disabled={generating}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {generating ? 'Generating...' : decision ? 'Regenerate Decision' : 'Generate Decision'}
                    </Button>
                    {decision && (
                      <Button variant="outline" className="w-full" onClick={() => downloadExport('memo')}>
                        <Download className="w-4 h-4 mr-2" />
                        Download Memo
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {decision && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Decision Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Risk Tier</span>
                        <Badge className={getTierBadgeColor(decision.tier)}>
                          {decision.tier}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Model Status</span>
                        <span className="text-sm font-medium">{decision.isModel}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Triggered Rules</span>
                        <span className="text-sm font-medium">{triggeredRules.length}</span>
                      </div>

                      {/* Artifacts Summary with expandable list */}
                      <div className="border-t pt-3 mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Required Artifacts</span>
                          <Badge variant="outline">{requiredArtifacts.length}</Badge>
                        </div>

                        {/* Show artifact names grouped by status */}
                        {artifactsConfig && requiredArtifacts.length > 0 && (
                          <div className="space-y-2">
                            {/* Missing artifacts first (highlighted) */}
                            {missingEvidence.length > 0 && (
                              <div className="bg-amber-50 rounded-md p-2">
                                <div className="flex items-center gap-1.5 text-amber-700 text-xs font-medium mb-1.5">
                                  <AlertCircle className="w-3 h-3" />
                                  Missing ({missingEvidence.length})
                                </div>
                                <ul className="space-y-0.5">
                                  {missingEvidence.slice(0, 5).map((id: string) => {
                                    const artifact = artifactsConfig.artifacts[id];
                                    return (
                                      <li key={id} className="text-xs text-amber-800 flex items-start">
                                        <span className="mr-1">•</span>
                                        <span>{artifact?.name || id}</span>
                                      </li>
                                    );
                                  })}
                                  {missingEvidence.length > 5 && (
                                    <li className="text-xs text-amber-600 italic">
                                      +{missingEvidence.length - 5} more...
                                    </li>
                                  )}
                                </ul>
                              </div>
                            )}

                            {/* Provided artifacts */}
                            {requiredArtifacts.length > missingEvidence.length && (
                              <div className="bg-green-50 rounded-md p-2">
                                <div className="flex items-center gap-1.5 text-green-700 text-xs font-medium mb-1.5">
                                  <CheckCircle className="w-3 h-3" />
                                  Provided ({requiredArtifacts.length - missingEvidence.length})
                                </div>
                                <ul className="space-y-0.5">
                                  {requiredArtifacts
                                    .filter((id: string) => !missingEvidence.includes(id))
                                    .slice(0, 5)
                                    .map((id: string) => {
                                      const artifact = artifactsConfig.artifacts[id];
                                      return (
                                        <li key={id} className="text-xs text-green-800 flex items-start">
                                          <span className="mr-1">•</span>
                                          <span>{artifact?.name || id}</span>
                                        </li>
                                      );
                                    })}
                                  {requiredArtifacts.length - missingEvidence.length > 5 && (
                                    <li className="text-xs text-green-600 italic">
                                      +{requiredArtifacts.length - missingEvidence.length - 5} more...
                                    </li>
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Metadata</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Submitted By</span>
                      <span>{useCase.createdBy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Created</span>
                      <span>{formatDate(useCase.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Updated</span>
                      <span>{formatDate(useCase.updatedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">ID</span>
                      <span className="font-mono text-xs">{useCase.id.slice(0, 8)}...</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Decision Tab */}
          <TabsContent value="decision" className="space-y-6">
            {!decision ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Decision Generated</h3>
                  <p className="text-gray-500 mb-4">
                    Generate a decision to see risk tier assignment and required artifacts.
                  </p>
                  <Button onClick={generateDecision} disabled={generating}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {generating ? 'Generating...' : 'Generate Decision'}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className={`border-l-4 ${
                  decision.tier === 'T3' ? 'border-l-red-500' :
                  decision.tier === 'T2' ? 'border-l-amber-500' : 'border-l-green-500'
                }`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center">
                          Risk Tier: {decision.tier}
                          <Badge className={`ml-3 ${getTierBadgeColor(decision.tier)}`}>
                            {decision.tier === 'T1' ? 'Low Risk' : decision.tier === 'T2' ? 'Medium Risk' : 'High Risk'}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Model Determination: {decision.isModel}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Rationale</h4>
                      <div className="whitespace-pre-wrap text-gray-600 bg-gray-50 p-4 rounded-lg">
                        {decision.rationaleSummary}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {riskFlags.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
                        Risk Flags ({riskFlags.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {riskFlags.map((flag: string) => (
                          <Badge key={flag} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            {flag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Triggered Criteria ({triggeredRules.length})</CardTitle>
                    <CardDescription>
                      Rules that contributed to the risk tier assignment
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {triggeredRules.map((rule: any) => (
                        <AccordionItem key={rule.id} value={rule.id}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center">
                              <Badge className={`mr-3 ${getTierBadgeColor(rule.tier)}`}>
                                {rule.tier}
                              </Badge>
                              <span>{rule.name}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <p className="text-gray-600">{rule.triggeredCriteria}</p>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Artifacts Tab */}
          <TabsContent value="artifacts" className="space-y-6">
            {!decision ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Decision Generated</h3>
                  <p className="text-gray-500">
                    Generate a decision to see required artifacts.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* AI Artifact Review Summary */}
                <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center text-blue-800">
                          <Brain className="w-5 h-5 mr-2" />
                          AI Artifact Review
                        </CardTitle>
                        <p className="text-xs text-gray-500 mt-1">
                          Checks if required documentation is uploaded and ready for approval
                        </p>
                      </div>
                      <Button
                        onClick={generateArtifactReview}
                        disabled={generatingArtifactReview}
                        size="sm"
                        variant="outline"
                      >
                        {generatingArtifactReview ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            {artifactReview ? 'Re-analyze' : 'Analyze Artifacts'}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {artifactReview ? (
                      <div className="space-y-4">
                        {/* Completion Progress */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Documentation Completion</span>
                            <span className="text-sm font-bold text-blue-700">
                              {artifactReview.completionPercentage}%
                            </span>
                          </div>
                          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                artifactReview.completionPercentage === 100
                                  ? 'bg-green-500'
                                  : artifactReview.completionPercentage >= 70
                                  ? 'bg-blue-500'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${artifactReview.completionPercentage}%` }}
                            />
                          </div>
                        </div>

                        {/* AI Summary */}
                        <div className="p-3 bg-white rounded-lg border">
                          <p className="text-sm text-gray-700">{artifactReview.summary}</p>
                        </div>

                        {/* Ready for Approval Badge */}
                        <div className="flex items-center gap-2">
                          {artifactReview.readyForApproval ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Ready for Approval
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Additional Documentation Required
                            </Badge>
                          )}
                          {artifactReview.aiPowered && (
                            <Badge variant="outline" className="text-xs">
                              AI-Powered
                            </Badge>
                          )}
                        </div>

                        {/* Recommendations */}
                        {artifactReview.recommendations && artifactReview.recommendations.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">Recommendations</h4>
                            <ul className="space-y-1">
                              {artifactReview.recommendations.map((rec: string, i: number) => (
                                <li key={i} className="text-sm text-gray-600 flex items-start">
                                  <ChevronRight className="w-4 h-4 mr-1 mt-0.5 text-blue-500" />
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6 space-y-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                          <Brain className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Check Documentation Readiness
                          </p>
                          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                            Reviews which required artifacts have been uploaded, calculates completion percentage,
                            and determines if the use case is ready for MRM approval.
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Uploaded Files */}
                {useCase.attachments && useCase.attachments.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileText className="w-5 h-5 mr-2" />
                        Uploaded Documentation ({useCase.attachments.length})
                      </CardTitle>
                      <CardDescription>
                        Files uploaded by the model owner
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {useCase.attachments.map((attachment: any) => {
                          const artifact = attachment.artifactId
                            ? artifactsConfig?.artifacts[attachment.artifactId]
                            : null;
                          return (
                            <div
                              key={attachment.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{attachment.filename}</p>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span>{attachment.type}</span>
                                    {artifact && (
                                      <>
                                        <span>•</span>
                                        <span className="text-green-600">{artifact.name}</span>
                                      </>
                                    )}
                                    <span>•</span>
                                    <span>{formatDate(attachment.createdAt)}</span>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(attachment.storagePath, '_blank')}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Missing Evidence Alert */}
                {missingEvidence.length > 0 && (
                  <Card className="border-amber-200 bg-amber-50">
                    <CardHeader>
                      <CardTitle className="flex items-center text-amber-800">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        Missing Evidence ({missingEvidence.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {missingEvidence.map((id: string) => {
                          const artifact = artifactsConfig?.artifacts[id];
                          return (
                            <li key={id} className="flex items-center text-amber-800">
                              <ChevronRight className="w-4 h-4 mr-1" />
                              {artifact?.name || id}
                            </li>
                          );
                        })}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Required Artifacts Checklist */}
                {Object.entries(groupedArtifacts).map(([category, artifacts]) => (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className="text-base">{category}</CardTitle>
                      <CardDescription>
                        {artifactsConfig?.categories[category]?.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {artifacts.map((artifact: any) => {
                          const uploadedFile = useCase.attachments?.find(
                            (a: any) => a.artifactId === artifact.id
                          );
                          return (
                            <div
                              key={artifact.id}
                              className={`p-4 rounded-lg border ${
                                artifact.isMissing ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start">
                                  {artifact.isMissing ? (
                                    <AlertCircle className="w-5 h-5 text-amber-500 mr-3 mt-0.5" />
                                  ) : (
                                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                                  )}
                                  <div>
                                    <h4 className="font-medium">{artifact.name}</h4>
                                    <p className="text-sm text-gray-600 mt-1">{artifact.description}</p>
                                    {uploadedFile && (
                                      <p className="text-xs text-green-600 mt-2 flex items-center">
                                        <FileText className="w-3 h-3 mr-1" />
                                        {uploadedFile.filename}
                                      </p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">Owner: {artifact.ownerRole}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {uploadedFile && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => window.open(uploadedFile.storagePath, '_blank')}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  )}
                                  <Badge
                                    variant="outline"
                                    className={
                                      artifact.isMissing
                                        ? 'bg-amber-100 text-amber-700 border-amber-200'
                                        : 'bg-green-100 text-green-700 border-green-200'
                                    }
                                  >
                                    {artifact.isMissing ? 'Missing' : 'Provided'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </TabsContent>

          {/* Exports Tab */}
          <TabsContent value="exports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Export Documents</CardTitle>
                <CardDescription>
                  Download audit-ready documentation for this use case
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!decision ? (
                  <div className="text-center py-8 text-gray-500">
                    Generate a decision first to enable exports
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => downloadExport('memo')}>
                      <CardContent className="p-6 text-center">
                        <FileText className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                        <h4 className="font-medium mb-1">Governance Memo</h4>
                        <p className="text-sm text-gray-500 mb-3">DOCX format</p>
                        <Button size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => downloadExport('checklist')}>
                      <CardContent className="p-6 text-center">
                        <ClipboardList className="w-12 h-12 text-green-500 mx-auto mb-3" />
                        <h4 className="font-medium mb-1">Artifact Checklist</h4>
                        <p className="text-sm text-gray-500 mb-3">HTML format</p>
                        <Button size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => downloadExport('inventory')}>
                      <CardContent className="p-6 text-center">
                        <FileDown className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                        <h4 className="font-medium mb-1">Inventory Row</h4>
                        <p className="text-sm text-gray-500 mb-3">CSV format</p>
                        <Button size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Trail Tab */}
          <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Audit Trail</CardTitle>
                <CardDescription>
                  History of all actions taken on this use case
                </CardDescription>
              </CardHeader>
              <CardContent>
                {useCase.auditEvents && useCase.auditEvents.length > 0 ? (
                  <div className="space-y-4">
                    {useCase.auditEvents.map((event) => (
                      <div key={event.id} className="flex items-start border-l-2 border-gray-200 pl-4 pb-4">
                        <div className="flex-1">
                          <div className="flex items-center">
                            {event.eventType === 'Created' && <FileText className="w-4 h-4 text-blue-500 mr-2" />}
                            {event.eventType === 'Updated' && <Clock className="w-4 h-4 text-gray-500 mr-2" />}
                            {event.eventType === 'Submitted' && <CheckCircle className="w-4 h-4 text-blue-500 mr-2" />}
                            {event.eventType === 'DecisionGenerated' && <Sparkles className="w-4 h-4 text-purple-500 mr-2" />}
                            {event.eventType === 'Exported' && <Download className="w-4 h-4 text-gray-500 mr-2" />}
                            {event.eventType === 'SentBack' && <RotateCcw className="w-4 h-4 text-orange-500 mr-2" />}
                            {event.eventType === 'Approved' && <ThumbsUp className="w-4 h-4 text-green-500 mr-2" />}
                            <span className="font-medium">{event.eventType}</span>
                            <span className="text-gray-400 mx-2">•</span>
                            <span className="text-sm text-gray-500">{event.actor}</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDateTime(event.timestamp)}
                          </p>
                          {event.details && (
                            <p className="text-sm text-gray-600 mt-1">
                              {event.details}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No audit events recorded
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Send Back Dialog */}
      <Dialog open={showSendBackDialog} onOpenChange={setShowSendBackDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Back to Owner</DialogTitle>
            <DialogDescription>
              Provide feedback for the model owner explaining what changes or additional information is needed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Feedback Notes</Label>
              <Textarea
                id="notes"
                placeholder="Please provide the following additional information..."
                value={sendBackNotes}
                onChange={(e) => setSendBackNotes(e.target.value)}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendBackDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendBack}
              disabled={sendingBack || !sendBackNotes.trim()}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Send className="w-4 h-4 mr-2" />
              {sendingBack ? 'Sending...' : 'Send Back'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
