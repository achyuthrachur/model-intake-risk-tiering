'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ValidationStatusBadge } from '@/components/inventory/ValidationStatusBadge';
import {
  getTierBadgeColor,
  formatDate,
  getSeverityColor,
  getRemediationStatusColor,
  type ValidationStatus,
} from '@/lib/utils';
import type { InventoryModelWithDetails, ValidationData, ValidationFindingData } from '@/lib/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ModelDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [model, setModel] = useState<InventoryModelWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [emailContent, setEmailContent] = useState<string | null>(null);

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
    if (!model) return;
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
    } finally {
      setGeneratingEmail(false);
    }
  };

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
                <CardTitle>Validation History</CardTitle>
                <CardDescription>
                  All validation events for this model
                </CardDescription>
              </CardHeader>
              <CardContent>
                {model.validations && model.validations.length > 0 ? (
                  <div className="space-y-4">
                    {model.validations.map((validation: ValidationData) => (
                      <div
                        key={validation.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() =>
                          router.push(`/manager/inventory/${model.id}/validation/${validation.id}`)
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
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
                              <Badge variant="outline">
                                {validation.findings.length} finding
                                {validation.findings.length !== 1 ? 's' : ''}
                              </Badge>
                            )}
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    ))}
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
                      <pre className="whitespace-pre-wrap text-sm font-mono">{emailContent}</pre>
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
        </Tabs>
      </main>
    </div>
  );
}
