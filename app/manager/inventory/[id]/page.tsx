'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  AlertTriangle,
  Bot,
  Building2,
  Cpu,
  Mail,
  FileEdit,
  ChevronRight,
  Shield,
  XCircle,
  Download,
  ExternalLink,
  File,
  FileSpreadsheet,
  FileImage,
  Paperclip,
  Loader2,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ValidationStatusBadge } from '@/components/inventory/ValidationStatusBadge';
import { useToast } from '@/components/ui/use-toast';
import {
  getTierBadgeColor,
  formatDate,
  getSeverityColor,
  getRemediationStatusColor,
  type ValidationStatus,
} from '@/lib/utils';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import type { InventoryModelWithDetails, ValidationData, ValidationFindingData } from '@/lib/types';

export default function ModelDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const [model, setModel] = useState<InventoryModelWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [emailContent, setEmailContent] = useState<string | null>(null);
  const [generatingValidation, setGeneratingValidation] = useState(false);

  useEffect(() => {
    async function fetchModel() {
      try {
        const res = await fetch(`/api/inventory/${id}`);
        if (res.ok) {
          const data = await res.json();
          setModel(data);
        }
      } catch (error) {
        console.error('Error fetching model:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchModel();
  }, [id]);

  const handleGenerateEmail = async () => {
    if (!model || generatingEmail) return;
    setGeneratingEmail(true);
    setEmailContent(null);

    try {
      const res = await fetch('/api/inventory/ai/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventoryModelId: model.id,
          emailType: model.validationStatus,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate email');

      // Handle streaming response
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let content = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('0:')) {
            const text = line.slice(2).trim();
            if (text.startsWith('"') && text.endsWith('"')) {
              content += JSON.parse(text);
              setEmailContent(content);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error generating email:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate email',
        variant: 'destructive',
      });
    } finally {
      setGeneratingEmail(false);
    }
  };

  const handleGenerateDemoValidation = useCallback(async () => {
    if (!model || generatingValidation) return;
    setGeneratingValidation(true);

    try {
      const res = await fetch(`/api/inventory/${id}/synthetic-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          includeReport: true,
          findingsCount: 'random',
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to generate validation');
      }

      const data = await res.json();
      toast({
        title: 'Demo Validation Generated',
        description: data.message || 'A synthetic validation with findings has been created.',
      });

      // Refresh the model data
      const modelRes = await fetch(`/api/inventory/${id}`);
      if (modelRes.ok) {
        const modelData = await modelRes.json();
        setModel(modelData);
      }
    } catch (error) {
      console.error('Error generating demo validation:', error);
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate demo validation',
        variant: 'destructive',
      });
    } finally {
      setGeneratingValidation(false);
    }
  }, [model, id, generatingValidation, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Model not found</h2>
          <Link href="/manager/inventory">
            <Button variant="outline">Back to Inventory</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Get all findings across validations
  const allFindings = model.validations?.flatMap((v) => v.findings || []) || [];
  const openFindings = allFindings.filter(
    (f) => f.remediationStatus === 'Open' || f.remediationStatus === 'In Progress'
  );
  const awaitingSignOff = allFindings.filter(
    (f) => f.remediationStatus === 'Remediated' && !f.mrmSignedOff
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/manager/inventory">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Inventory
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-200" />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-gray-900">{model.useCase.title}</h1>
                  {model.useCase.aiType && model.useCase.aiType !== 'None' && (
                    <span title="AI-Enabled"><Bot className="w-5 h-5 text-blue-500" /></span>
                  )}
                  {model.useCase.vendorInvolved && (
                    <span title="Vendor Model"><Building2 className="w-5 h-5 text-orange-500" /></span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {model.inventoryNumber} · {model.useCase.businessLine}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getTierBadgeColor(model.tier)}>{model.tier}</Badge>
              <ValidationStatusBadge status={model.validationStatus as ValidationStatus} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Alert for overdue or open findings */}
        {(model.validationStatus === 'overdue' || openFindings.length > 0) && (
          <div className="mb-6 space-y-2">
            {model.validationStatus === 'overdue' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">Validation is overdue</p>
                  <p className="text-sm text-red-600">
                    Was due on {formatDate(model.nextValidationDue)}. Please schedule validation immediately.
                  </p>
                </div>
              </div>
            )}
            {openFindings.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
                <FileText className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800">
                    {openFindings.length} open finding{openFindings.length !== 1 ? 's' : ''} require attention
                  </p>
                  <p className="text-sm text-amber-600">
                    Review and remediate findings to maintain compliance.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="validations">
              Validations ({model.validations?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="findings">
              Findings ({allFindings.length})
              {openFindings.length > 0 && (
                <span className="ml-2 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {openFindings.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="ai">AI Actions</TabsTrigger>
            <TabsTrigger value="artifacts">
              Artifacts ({model.useCase.attachments?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Model Info */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Model Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">{model.useCase.description}</p>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-gray-500">Model Type</p>
                      <p className="font-medium flex items-center gap-2">
                        <Cpu className="w-4 h-4" />
                        {model.useCase.aiType}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Usage Type</p>
                      <p className="font-medium">{model.useCase.usageType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Deployment</p>
                      <p className="font-medium">{model.useCase.deployment}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Customer Impact</p>
                      <p className="font-medium">{model.useCase.customerImpact}</p>
                    </div>
                    {model.useCase.vendorInvolved && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500">Vendor</p>
                        <p className="font-medium">{model.useCase.vendorName}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Validation Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle>Validation Schedule</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Frequency</span>
                    </div>
                    <span className="font-medium">
                      Every {model.validationFrequencyMonths} months
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Last Validation</span>
                    </div>
                    <span className="font-medium">
                      {model.lastValidationDate ? formatDate(model.lastValidationDate) : 'Never'}
                    </span>
                  </div>

                  <div
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      model.validationStatus === 'overdue'
                        ? 'bg-red-50'
                        : model.validationStatus === 'upcoming'
                        ? 'bg-amber-50'
                        : 'bg-green-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Next Due</span>
                    </div>
                    <span className="font-medium">{formatDate(model.nextValidationDue)}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Pre-Prod Validated</span>
                    </div>
                    {model.validatedBeforeProduction ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Validations Tab */}
          <TabsContent value="validations">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Validation History</CardTitle>
                    <CardDescription>
                      All validation events for this model
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleGenerateDemoValidation}
                    disabled={generatingValidation}
                  >
                    {generatingValidation ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Demo Validation
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {model.validations && model.validations.length > 0 ? (
                  <div className="space-y-4">
                    {model.validations.map((validation: ValidationData) => {
                      const findingsOpen = validation.findings?.filter(
                        (f) => f.remediationStatus === 'Open' || f.remediationStatus === 'In Progress'
                      ).length || 0;

                      return (
                        <div
                          key={validation.id}
                          className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div
                              className="flex items-center gap-3 flex-1 cursor-pointer"
                              onClick={() =>
                                router.push(`/manager/inventory/${model.id}/validation/${validation.id}`)
                              }
                            >
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  validation.overallResult === 'Satisfactory'
                                    ? 'bg-green-100 text-green-600'
                                    : validation.overallResult === 'Unsatisfactory'
                                    ? 'bg-red-100 text-red-600'
                                    : 'bg-amber-100 text-amber-600'
                                }`}
                              >
                                <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-medium">{validation.validationType} Validation</p>
                                <p className="text-sm text-gray-500">
                                  {formatDate(validation.validationDate)} · {validation.validatedBy}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge
                                className={
                                  validation.overallResult === 'Satisfactory'
                                    ? 'bg-green-100 text-green-800'
                                    : validation.overallResult === 'Unsatisfactory'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-amber-100 text-amber-800'
                                }
                              >
                                {validation.overallResult || validation.status}
                              </Badge>
                              {validation.findings && validation.findings.length > 0 && (
                                <Badge
                                  variant="outline"
                                  className={findingsOpen > 0 ? 'border-red-200 text-red-700' : ''}
                                >
                                  {validation.findings.length} finding
                                  {validation.findings.length !== 1 ? 's' : ''}
                                  {findingsOpen > 0 && ` (${findingsOpen} open)`}
                                </Badge>
                              )}
                              {validation.reportStoragePath && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(validation.reportStoragePath!, '_blank');
                                  }}
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  Report
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  router.push(`/manager/inventory/${model.id}/validation/${validation.id}`)
                                }
                              >
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                              </Button>
                            </div>
                          </div>

                          {/* Validation Summary Notes */}
                          {validation.summaryNotes && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-sm text-gray-600">{validation.summaryNotes}</p>
                            </div>
                          )}

                          {/* Quick Findings Preview */}
                          {validation.findings && validation.findings.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="flex flex-wrap gap-2">
                                {validation.findings.slice(0, 4).map((finding) => (
                                  <div
                                    key={finding.id}
                                    className={`text-xs px-2 py-1 rounded-full ${
                                      finding.mrmSignedOff
                                        ? 'bg-green-100 text-green-700'
                                        : finding.remediationStatus === 'Open'
                                        ? 'bg-red-100 text-red-700'
                                        : finding.remediationStatus === 'In Progress'
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-blue-100 text-blue-700'
                                    }`}
                                  >
                                    {finding.findingNumber}: {finding.severity}
                                  </div>
                                ))}
                                {validation.findings.length > 4 && (
                                  <span className="text-xs text-gray-500 px-2 py-1">
                                    +{validation.findings.length - 4} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No validations recorded yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Findings Tab */}
          <TabsContent value="findings">
            <Card>
              <CardHeader>
                <CardTitle>All Findings</CardTitle>
                <CardDescription>
                  Findings from all validations
                  {awaitingSignOff.length > 0 && (
                    <span className="ml-2 text-amber-600">
                      ({awaitingSignOff.length} awaiting MRM sign-off)
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allFindings.length > 0 ? (
                  <div className="space-y-3">
                    {allFindings.map((finding: ValidationFindingData) => (
                      <div
                        key={finding.id}
                        className={`border rounded-lg p-4 ${
                          finding.remediationStatus === 'Open'
                            ? 'border-red-200 bg-red-50'
                            : finding.remediationStatus === 'In Progress'
                            ? 'border-amber-200 bg-amber-50'
                            : finding.remediationStatus === 'Remediated' && !finding.mrmSignedOff
                            ? 'border-blue-200 bg-blue-50'
                            : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={getSeverityColor(finding.severity)}>
                                {finding.severity}
                              </Badge>
                              <span className="text-sm text-gray-500">{finding.findingNumber}</span>
                              {finding.category && (
                                <span className="text-sm text-gray-400">· {finding.category}</span>
                              )}
                            </div>
                            <p className="font-medium">{finding.title}</p>
                            <p className="text-sm text-gray-600 mt-1">{finding.description}</p>
                            {finding.remediationNotes && (
                              <div className="mt-2 p-2 bg-white rounded border text-sm">
                                <p className="text-gray-500">Remediation Notes:</p>
                                <p>{finding.remediationNotes}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2 ml-4">
                            <Badge className={getRemediationStatusColor(finding.remediationStatus)}>
                              {finding.remediationStatus}
                            </Badge>
                            {finding.mrmSignedOff ? (
                              <span className="text-xs text-green-600 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                MRM Signed Off
                              </span>
                            ) : finding.remediationStatus === 'Remediated' ? (
                              <span className="text-xs text-amber-600">Awaiting Sign-off</span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
                    <p className="text-gray-500">No findings recorded</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Actions Tab */}
          <TabsContent value="ai">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Generate Validation Email
                  </CardTitle>
                  <CardDescription>
                    Create a professional email to notify the model owner about validation status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleGenerateEmail} disabled={generatingEmail} className="w-full">
                    {generatingEmail ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Generate {model.validationStatus === 'overdue' ? 'Overdue' : 'Reminder'} Email
                      </>
                    )}
                  </Button>
                  {emailContent && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <MarkdownRenderer content={emailContent} className="text-sm" />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileEdit className="w-5 h-5" />
                    Generate Remediation Memo
                  </CardTitle>
                  <CardDescription>
                    Create documentation for remediated findings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {awaitingSignOff.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 mb-3">
                        Select a finding to generate a remediation memo:
                      </p>
                      {awaitingSignOff.map((finding) => (
                        <Button
                          key={finding.id}
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() =>
                            router.push(
                              `/manager/inventory/${model.id}/validation/${finding.validationId}?findingId=${finding.id}`
                            )
                          }
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          {finding.findingNumber}: {finding.title}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No findings awaiting sign-off. Remediate a finding first to generate a memo.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Artifacts Tab */}
          <TabsContent value="artifacts">
            <div className="space-y-6">
              {/* Intake Documentation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Paperclip className="w-5 h-5" />
                    Intake Documentation
                  </CardTitle>
                  <CardDescription>
                    Documents submitted during the model intake process
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {model.useCase.attachments && model.useCase.attachments.length > 0 ? (
                    <div className="space-y-3">
                      {model.useCase.attachments.map((attachment) => {
                        const isPdf = attachment.mimeType?.includes('pdf');
                        const isImage = attachment.mimeType?.startsWith('image/');
                        const isSpreadsheet = attachment.mimeType?.includes('spreadsheet') ||
                          attachment.mimeType?.includes('excel') ||
                          attachment.filename.endsWith('.xlsx') ||
                          attachment.filename.endsWith('.csv');

                        const IconComponent = isPdf ? FileText : isImage ? FileImage : isSpreadsheet ? FileSpreadsheet : File;

                        return (
                          <div
                            key={attachment.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                <IconComponent className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{attachment.filename}</p>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Badge variant="outline" className="text-xs">{attachment.type}</Badge>
                                  {attachment.fileSize && (
                                    <>
                                      <span>·</span>
                                      <span>{(attachment.fileSize / 1024).toFixed(1)} KB</span>
                                    </>
                                  )}
                                  <span>·</span>
                                  <span>{formatDate(attachment.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(attachment.storagePath, '_blank')}
                              >
                                <ExternalLink className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = attachment.storagePath;
                                  link.download = attachment.filename;
                                  link.click();
                                }}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Paperclip className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No intake documents uploaded</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Validation Reports */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Validation Reports
                  </CardTitle>
                  <CardDescription>
                    Official validation reports and assessments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {model.validations && model.validations.some((v) => v.reportStoragePath) ? (
                    <div className="space-y-3">
                      {model.validations
                        .filter((v) => v.reportStoragePath)
                        .map((validation) => (
                          <div
                            key={validation.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  validation.overallResult === 'Satisfactory'
                                    ? 'bg-green-50'
                                    : validation.overallResult === 'Unsatisfactory'
                                    ? 'bg-red-50'
                                    : 'bg-amber-50'
                                }`}
                              >
                                <FileText
                                  className={`w-5 h-5 ${
                                    validation.overallResult === 'Satisfactory'
                                      ? 'text-green-600'
                                      : validation.overallResult === 'Unsatisfactory'
                                      ? 'text-red-600'
                                      : 'text-amber-600'
                                  }`}
                                />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {validation.reportFilename || `${validation.validationType} Validation Report`}
                                </p>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${
                                      validation.overallResult === 'Satisfactory'
                                        ? 'border-green-200 text-green-700'
                                        : validation.overallResult === 'Unsatisfactory'
                                        ? 'border-red-200 text-red-700'
                                        : 'border-amber-200 text-amber-700'
                                    }`}
                                  >
                                    {validation.overallResult || validation.status}
                                  </Badge>
                                  <span>·</span>
                                  <span>{formatDate(validation.validationDate)}</span>
                                  <span>·</span>
                                  <span>{validation.validatedBy}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(validation.reportStoragePath!, '_blank')}
                              >
                                <ExternalLink className="w-4 h-4 mr-1" />
                                View Report
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  router.push(`/manager/inventory/${model.id}/validation/${validation.id}`)
                                }
                              >
                                <ChevronRight className="w-4 h-4 mr-1" />
                                Details
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No validation reports uploaded yet</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Reports are attached when validations are completed
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Findings Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Findings Summary
                  </CardTitle>
                  <CardDescription>
                    Overview of validation findings and remediation status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {allFindings.length > 0 ? (
                    <div className="space-y-4">
                      {/* Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg text-center">
                          <p className="text-2xl font-bold text-gray-900">{allFindings.length}</p>
                          <p className="text-sm text-gray-500">Total Findings</p>
                        </div>
                        <div className="p-4 bg-red-50 rounded-lg text-center">
                          <p className="text-2xl font-bold text-red-600">
                            {allFindings.filter((f) => f.remediationStatus === 'Open').length}
                          </p>
                          <p className="text-sm text-red-600">Open</p>
                        </div>
                        <div className="p-4 bg-amber-50 rounded-lg text-center">
                          <p className="text-2xl font-bold text-amber-600">
                            {allFindings.filter((f) => f.remediationStatus === 'In Progress').length}
                          </p>
                          <p className="text-sm text-amber-600">In Progress</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {allFindings.filter((f) => f.mrmSignedOff).length}
                          </p>
                          <p className="text-sm text-green-600">Closed</p>
                        </div>
                      </div>

                      {/* Severity Breakdown */}
                      <div className="border rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-700 mb-3">By Severity</p>
                        <div className="grid grid-cols-4 gap-2">
                          {(['Critical', 'High', 'Medium', 'Low'] as const).map((severity) => {
                            const count = allFindings.filter((f) => f.severity === severity).length;
                            return (
                              <div key={severity} className="text-center">
                                <Badge className={`${getSeverityColor(severity)} mb-1`}>{severity}</Badge>
                                <p className="text-lg font-semibold">{count}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Recent Open Findings */}
                      {openFindings.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Open Findings Requiring Attention</p>
                          <div className="space-y-2">
                            {openFindings.slice(0, 3).map((finding) => (
                              <div
                                key={finding.id}
                                className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg"
                              >
                                <div className="flex items-center gap-2">
                                  <Badge className={getSeverityColor(finding.severity)}>{finding.severity}</Badge>
                                  <span className="text-sm font-medium">{finding.title}</span>
                                </div>
                                <span className="text-xs text-gray-500">{finding.findingNumber}</span>
                              </div>
                            ))}
                            {openFindings.length > 3 && (
                              <p className="text-sm text-gray-500 text-center mt-2">
                                +{openFindings.length - 3} more open findings
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
                      <p className="text-gray-500">No findings recorded</p>
                      <p className="text-sm text-gray-400 mt-1">
                        This model has a clean validation history
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
