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
  Send,
  MessageSquare,
  Upload,
  Wand2,
  FileUp,
  Trash2,
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
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import {
  formatDate,
  formatDateTime,
  getTierBadgeColor,
  getStatusColor,
  parseJsonSafe,
} from '@/lib/utils';
import type { UseCaseWithRelations } from '@/lib/types';
import { DropZone } from '@/components/artifacts/DropZone';
import { ArtifactUploadCard } from '@/components/artifacts/ArtifactUploadCard';

export default function OwnerUseCaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [useCase, setUseCase] = useState<UseCaseWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);
  const [artifactsConfig, setArtifactsConfig] = useState<any>(null);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [generatingSynthetic, setGeneratingSynthetic] = useState(false);
  const [uploadedArtifacts, setUploadedArtifacts] = useState<string[]>([]);

  const id = params.id as string;

  useEffect(() => {
    fetchUseCase();
    fetchConfig();
  }, [id]);

  useEffect(() => {
    if (useCase?.decision) {
      fetchAIInsights();
    }
  }, [useCase?.decision?.id]);

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
      router.push('/owner/dashboard');
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

  const resubmitForReview = async () => {
    try {
      setResubmitting(true);
      const response = await fetch(`/api/usecases/${id}/submit`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to resubmit');

      toast({ title: 'Resubmitted', description: 'Use case has been resubmitted for review' });
      await fetchUseCase();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to resubmit', variant: 'destructive' });
    } finally {
      setResubmitting(false);
    }
  };

  // Track uploaded artifact IDs from attachments
  useEffect(() => {
    if (useCase?.attachments) {
      const ids = useCase.attachments
        .filter((a: any) => a.artifactId)
        .map((a: any) => a.artifactId);
      setUploadedArtifacts(ids);
    }
  }, [useCase?.attachments]);

  const generateSyntheticData = async () => {
    try {
      setGeneratingSynthetic(true);
      const response = await fetch(`/api/usecases/${id}/synthetic-artifacts`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate synthetic data');
      }

      toast({ title: 'Synthetic Data Generated', description: 'Demo artifacts have been created for this use case' });
      await fetchUseCase();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate synthetic data',
        variant: 'destructive',
      });
    } finally {
      setGeneratingSynthetic(false);
    }
  };

  const handleArtifactUpload = async (attachment: any) => {
    toast({ title: 'Uploaded', description: `${attachment.filename} has been uploaded successfully` });
    await fetchUseCase();
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      const response = await fetch(`/api/usecases/${id}/attachments/${attachmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      toast({ title: 'Deleted', description: 'Attachment has been removed' });
      await fetchUseCase();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete attachment', variant: 'destructive' });
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

  const isSentBack = useCase.status === 'Sent Back';
  const isDraft = useCase.status === 'Draft';
  const canSubmit = isDraft || isSentBack;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/owner/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-200" />
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">{useCase.title}</h1>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>{useCase.businessLine}</span>
                    <span>•</span>
                    <span>{useCase.aiType}</span>
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
        {/* Draft Submission Banner */}
        {isDraft && (
          <div className="mb-6">
            <Card className="border-blue-300 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-800">
                  <FileText className="w-5 h-5 mr-2" />
                  Ready to Submit?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">
                  {decision
                    ? 'Your use case has been evaluated. Review the decision details and submit for MRM review when ready.'
                    : 'Generate a decision first to evaluate risk tier and required artifacts, then submit for MRM review.'}
                </p>
                <div className="flex items-center gap-3">
                  {!decision ? (
                    <Button onClick={generateDecision} disabled={generating}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      {generating ? 'Generating...' : 'Generate Decision'}
                    </Button>
                  ) : (
                    <Button onClick={resubmitForReview} disabled={resubmitting}>
                      <Send className="w-4 h-4 mr-2" />
                      {resubmitting ? 'Submitting...' : 'Submit for Review'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sent Back Feedback Banner with Artifact Upload */}
        {isSentBack && (
          <div className="mb-6 space-y-4">
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center text-orange-800">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Feedback from Model Risk Manager
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white p-4 rounded-lg border border-orange-200 mb-4">
                  <p className="text-gray-800 whitespace-pre-wrap">
                    {useCase.reviewerNotes || 'No specific notes provided. Please review and update your submission.'}
                  </p>
                  {useCase.reviewedBy && (
                    <p className="text-sm text-gray-500 mt-2">
                      — {useCase.reviewedBy}, {useCase.reviewedAt ? formatDate(useCase.reviewedAt) : ''}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Required Documentation Upload */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Upload className="w-5 h-5 mr-2" />
                      Upload Required Documentation
                    </CardTitle>
                    <CardDescription>
                      Upload the required artifacts for your use case. Drag and drop files or click to browse.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateSyntheticData}
                    disabled={generatingSynthetic}
                    className="gap-2"
                  >
                    {generatingSynthetic ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4" />
                    )}
                    {generatingSynthetic ? 'Generating...' : 'Generate Demo Data'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {decision && requiredArtifacts.length > 0 ? (
                  <div className="space-y-4">
                    {/* Show current uploads */}
                    {useCase.attachments && useCase.attachments.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Uploaded Files</h4>
                        <div className="space-y-2">
                          {useCase.attachments.map((attachment: any) => (
                            <div
                              key={attachment.id}
                              className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <div>
                                  <p className="text-sm font-medium">{attachment.filename}</p>
                                  <p className="text-xs text-gray-500">
                                    {attachment.type} • {formatDate(attachment.createdAt)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(attachment.storagePath, '_blank')}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteAttachment(attachment.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Required artifacts with upload */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {requiredArtifacts.slice(0, 6).map((artifactId: string) => {
                        const artifact = artifactsConfig?.artifacts[artifactId];
                        const isUploaded = uploadedArtifacts.includes(artifactId);
                        const existingAttachment = useCase.attachments?.find(
                          (a: any) => a.artifactId === artifactId
                        );

                        return (
                          <div
                            key={artifactId}
                            className={`p-4 rounded-lg border ${
                              isUploaded ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {isUploaded ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                  <AlertCircle className="w-5 h-5 text-amber-500" />
                                )}
                                <h4 className="font-medium text-sm">{artifact?.name || artifactId}</h4>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mb-3">{artifact?.description}</p>
                            {!isUploaded && (
                              <DropZone
                                useCaseId={id}
                                artifactId={artifactId}
                                artifactName={artifact?.name}
                                type={artifact?.category || 'Other'}
                                onUploadComplete={handleArtifactUpload}
                                onUploadError={(error) => toast({ title: 'Upload Error', description: error, variant: 'destructive' })}
                                compact
                              />
                            )}
                            {existingAttachment && (
                              <div className="flex items-center gap-2 text-xs text-green-600 mt-2">
                                <FileText className="w-3 h-3" />
                                {existingAttachment.filename}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* General upload for additional documents */}
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Upload Additional Documents</h4>
                      <DropZone
                        useCaseId={id}
                        type="Other"
                        onUploadComplete={handleArtifactUpload}
                        onUploadError={(error) => toast({ title: 'Upload Error', description: error, variant: 'destructive' })}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <FileUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-3">Generate a decision first to see required artifacts</p>
                    <Button onClick={generateDecision} disabled={generating} size="sm">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Decision
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resubmit Button */}
            <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <Button onClick={resubmitForReview} disabled={resubmitting} size="lg">
                <Send className="w-4 h-4 mr-2" />
                {resubmitting ? 'Resubmitting...' : 'Resubmit for Review'}
              </Button>
              <p className="text-sm text-blue-700">
                Once you've uploaded the required documentation, resubmit for MRM review.
              </p>
            </div>
          </div>
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
                    {canSubmit && (
                      <Button
                        className="w-full"
                        onClick={resubmitForReview}
                        disabled={resubmitting || !decision}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {resubmitting ? 'Submitting...' : isDraft ? 'Submit for Review' : 'Resubmit for Review'}
                      </Button>
                    )}
                    <Button
                      className="w-full"
                      variant={canSubmit ? 'outline' : 'default'}
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
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Required Artifacts</span>
                        <span className="text-sm font-medium">{requiredArtifacts.length}</span>
                      </div>
                      {missingEvidence.length > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Missing Evidence</span>
                          <span className="text-sm font-medium text-amber-600">{missingEvidence.length}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Metadata</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
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
                        {artifacts.map((artifact: any) => (
                          <ArtifactUploadCard
                            key={artifact.id}
                            artifact={{
                              id: artifact.id,
                              name: artifact.name,
                              description: artifact.description,
                              category: artifact.category,
                              ownerRole: artifact.ownerRole,
                              whatGoodLooksLike: artifact.whatGoodLooksLike,
                            }}
                            isMissing={artifact.isMissing}
                            useCaseId={id}
                            existingAttachments={useCase?.attachments?.map((a: any) => ({
                              ...a,
                              createdAt: a.createdAt.toString(),
                            }))}
                            showAnalyze={true}
                            onUploadComplete={() => fetchUseCase()}
                            onDeleteComplete={() => fetchUseCase()}
                          />
                        ))}
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
                            {event.eventType === 'Submitted' && <CheckCircle className="w-4 h-4 text-green-500 mr-2" />}
                            {event.eventType === 'DecisionGenerated' && <Sparkles className="w-4 h-4 text-purple-500 mr-2" />}
                            {event.eventType === 'Exported' && <Download className="w-4 h-4 text-gray-500 mr-2" />}
                            {event.eventType === 'SentBack' && <AlertTriangle className="w-4 h-4 text-orange-500 mr-2" />}
                            {event.eventType === 'Approved' && <CheckCircle className="w-4 h-4 text-green-500 mr-2" />}
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
    </div>
  );
}
