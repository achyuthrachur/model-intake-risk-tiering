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
import { HelpTooltip, HelpCard } from '@/components/ui/help-tooltip';
import {
  formatDate,
  formatDateTime,
  getTierBadgeColor,
  getStatusColor,
  parseJsonSafe,
} from '@/lib/utils';
import type { UseCaseWithRelations, DecisionResult } from '@/lib/types';

export default function UseCaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [useCase, setUseCase] = useState<UseCaseWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [artifactsConfig, setArtifactsConfig] = useState<any>(null);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [generatingAI, setGeneratingAI] = useState(false);

  const id = params.id as string;

  useEffect(() => {
    fetchUseCase();
    fetchConfig();
  }, [id]);

  // Fetch existing AI insights when use case loads
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
      // AI insights are optional, don't show error
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
      router.push('/');
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

  // Group artifacts by category
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-200" />
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
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
              {/* Main Info */}
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
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      className="w-full"
                      onClick={generateDecision}
                      disabled={generating}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {generating ? 'Generating...' : decision ? 'Regenerate Decision' : 'Generate Decision'}
                    </Button>
                    {decision && (
                      <>
                        <Button variant="outline" className="w-full" onClick={() => downloadExport('memo')}>
                          <Download className="w-4 h-4 mr-2" />
                          Download Memo
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Decision Summary */}
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

                {/* Metadata */}
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
                {/* Tier Card */}
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
                          <HelpTooltip
                            className="ml-2"
                            title={`Tier ${decision.tier} - ${decision.tier === 'T1' ? 'Low' : decision.tier === 'T2' ? 'Medium' : 'High'} Risk`}
                            content={
                              decision.tier === 'T1' ? (
                                <div>
                                  <p className="mb-2">T1 (Low Risk) use cases typically:</p>
                                  <ul className="list-disc list-inside space-y-1">
                                    <li>Are internal productivity tools</li>
                                    <li>Have no direct customer impact</li>
                                    <li>Use rules-based or simple automation</li>
                                    <li>Require basic monitoring only</li>
                                  </ul>
                                </div>
                              ) : decision.tier === 'T2' ? (
                                <div>
                                  <p className="mb-2">T2 (Medium Risk) use cases typically:</p>
                                  <ul className="list-disc list-inside space-y-1">
                                    <li>Provide advisory recommendations</li>
                                    <li>Have indirect customer impact</li>
                                    <li>Require human oversight before action</li>
                                    <li>Need model cards and monitoring plans</li>
                                  </ul>
                                </div>
                              ) : (
                                <div>
                                  <p className="mb-2">T3 (High Risk) use cases typically:</p>
                                  <ul className="list-disc list-inside space-y-1">
                                    <li>Make automated decisions</li>
                                    <li>Directly impact customers</li>
                                    <li>Fall under regulatory requirements</li>
                                    <li>Require full validation, fairness testing, and governance approval</li>
                                  </ul>
                                </div>
                              )
                            }
                          />
                        </CardTitle>
                        <CardDescription className="mt-1 inline-flex items-center gap-1">
                          Model Determination: {decision.isModel}
                          <HelpTooltip
                            title="Model Determination"
                            content={
                              <div>
                                <p className="mb-2">Under SR 11-7 guidance, a "model" is defined as:</p>
                                <p className="italic text-sm">"A quantitative method, system, or approach that applies statistical, economic, financial, or mathematical theories, techniques, and assumptions to process input data into quantitative estimates."</p>
                                <p className="mt-2">This determination affects the level of governance oversight required.</p>
                              </div>
                            }
                          />
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

                {/* AI Insights Section */}
                <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center text-purple-800">
                        <Brain className="w-5 h-5 mr-2" />
                        AI-Enhanced Risk Insights
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={generateAIInsights}
                        disabled={generatingAI}
                        className="border-purple-300 text-purple-700 hover:bg-purple-100"
                      >
                        {generatingAI ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : aiInsights ? (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Regenerate
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate AI Insights
                          </>
                        )}
                      </Button>
                    </div>
                    <CardDescription>
                      AI-powered analysis of risks, blind spots, and mitigation recommendations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!aiInsights ? (
                      <div className="text-center py-8">
                        <Brain className="w-12 h-12 text-purple-300 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">
                          Click "Generate AI Insights" to get enhanced risk analysis
                        </p>
                        <p className="text-sm text-gray-500">
                          Requires OpenAI API key to be configured
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Executive Summary */}
                        {aiInsights.executiveSummary && (
                          <div>
                            <h4 className="text-sm font-semibold text-purple-800 mb-2 flex items-center">
                              <FileText className="w-4 h-4 mr-2" />
                              Executive Summary
                            </h4>
                            <p className="text-gray-700 bg-white p-4 rounded-lg border border-purple-100">
                              {aiInsights.executiveSummary}
                            </p>
                          </div>
                        )}

                        {/* Enhanced Rationale */}
                        {aiInsights.enhancedRationale && (
                          <div>
                            <h4 className="text-sm font-semibold text-purple-800 mb-2 flex items-center">
                              <Eye className="w-4 h-4 mr-2" />
                              Enhanced Analysis
                            </h4>
                            <div className="text-gray-700 bg-white p-4 rounded-lg border border-purple-100 whitespace-pre-wrap">
                              {aiInsights.enhancedRationale}
                            </div>
                          </div>
                        )}

                        {/* Mitigation Recommendations */}
                        {aiInsights.mitigationRecommendations && aiInsights.mitigationRecommendations.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-purple-800 mb-2 flex items-center">
                              <Lightbulb className="w-4 h-4 mr-2" />
                              Mitigation Recommendations
                            </h4>
                            <ul className="space-y-2">
                              {aiInsights.mitigationRecommendations.map((rec: string, i: number) => (
                                <li key={i} className="flex items-start bg-white p-3 rounded-lg border border-purple-100">
                                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                  <span className="text-gray-700">{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Blind Spots */}
                        {aiInsights.blindSpots && aiInsights.blindSpots.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-purple-800 mb-2 flex items-center">
                              <AlertTriangle className="w-4 h-4 mr-2" />
                              Potential Blind Spots
                            </h4>
                            <ul className="space-y-2">
                              {aiInsights.blindSpots.map((spot: string, i: number) => (
                                <li key={i} className="flex items-start bg-amber-50 p-3 rounded-lg border border-amber-200">
                                  <Eye className="w-4 h-4 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                                  <span className="text-gray-700">{spot}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Confidence Notes */}
                        {aiInsights.confidenceNotes && (
                          <div className="text-xs text-gray-500 italic border-t border-purple-100 pt-4">
                            Note: {aiInsights.confidenceNotes}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Risk Flags */}
                {riskFlags.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
                        Risk Flags ({riskFlags.length})
                        <HelpTooltip
                          className="ml-2"
                          title="What are Risk Flags?"
                          content="Risk flags highlight specific characteristics of this use case that warrant attention. These may require additional controls, documentation, or review depending on the flag type."
                        />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {riskFlags.map((flag: string) => {
                          const flagDescriptions: Record<string, string> = {
                            'Materiality': 'This use case has material impact on business decisions or customer outcomes',
                            'NoHumanOversight': 'No required human review of outputs - consider adding oversight controls',
                            'CustomerImpact': 'Directly affects customers - enhanced testing and monitoring recommended',
                            'GenAI': 'Uses generative AI - requires additional guardrails and hallucination testing',
                            'SensitiveData': 'Processes sensitive data - ensure privacy controls are in place',
                            'Regulated': 'Falls under regulatory requirements - ensure compliance documentation',
                            'VendorModel': 'Third-party vendor involvement - requires vendor due diligence',
                            'FairLending': 'May impact fair lending compliance - requires bias testing',
                          };
                          return (
                            <div key={flag} className="inline-flex items-center gap-1">
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                {flag}
                              </Badge>
                              <HelpTooltip content={flagDescriptions[flag] || `This flag indicates: ${flag}`} />
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Triggered Rules */}
                <Card>
                  <CardHeader>
                    <CardTitle className="inline-flex items-center gap-2">
                      Triggered Criteria ({triggeredRules.length})
                      <HelpTooltip
                        title="How Risk Tier is Determined"
                        content="The risk tier is assigned based on rules that evaluate characteristics of your use case. Each rule contributes to the final tier. The highest triggered tier becomes the assigned tier (e.g., if any T3 rule triggers, the use case is T3)."
                      />
                    </CardTitle>
                    <CardDescription>
                      Rules that contributed to the risk tier assignment
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {triggeredRules.map((rule: any, index: number) => (
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
                {/* Artifacts Help Card */}
                <HelpCard
                  id="artifacts-tab-help"
                  title="Understanding Required Artifacts"
                  icon={<Lightbulb className="w-5 h-5" />}
                  variant="info"
                  content={
                    <div className="space-y-2">
                      <p>Artifacts are the documentation required before this use case can be approved:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong className="text-green-700">Green checkmark:</strong> Evidence has been provided</li>
                        <li><strong className="text-amber-700">Amber alert:</strong> Missing - needs to be provided</li>
                      </ul>
                      <p className="text-xs">Click the help icon on each artifact to see "What Good Looks Like" guidance.</p>
                    </div>
                  }
                />

                {/* Missing Evidence Alert */}
                {missingEvidence.length > 0 && (
                  <Card className="border-amber-200 bg-amber-50">
                    <CardHeader>
                      <CardTitle className="flex items-center text-amber-800">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        Missing Evidence ({missingEvidence.length})
                        <HelpTooltip
                          className="ml-2 text-amber-600"
                          content="These artifacts must be provided before the use case can be approved. Work with the listed owner roles to gather this documentation."
                        />
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

                {/* Artifacts by Category */}
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
                          <div
                            key={artifact.id}
                            className={`p-4 rounded-lg border ${
                              artifact.isMissing ? 'bg-amber-50 border-amber-200' : 'bg-gray-50'
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
                                  <h4 className="font-medium inline-flex items-center gap-1.5">
                                    {artifact.name}
                                    {artifact.whatGoodLooksLike && (
                                      <HelpTooltip
                                        title="What Good Looks Like"
                                        content={artifact.whatGoodLooksLike}
                                      />
                                    )}
                                  </h4>
                                  <p className="text-sm text-gray-600 mt-1">{artifact.description}</p>
                                  <p className="text-xs text-gray-500 mt-2 inline-flex items-center gap-1">
                                    Owner: {artifact.ownerRole}
                                    <HelpTooltip content={`The ${artifact.ownerRole} team is responsible for providing this documentation.`} />
                                  </p>
                                </div>
                              </div>
                              {artifact.isMissing && (
                                <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                                  Missing
                                </Badge>
                              )}
                            </div>
                          </div>
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
