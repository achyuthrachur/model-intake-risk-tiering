'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  Calendar,
  User,
  AlertTriangle,
  FileEdit,
  Pencil,
  Download,
  ExternalLink,
  ClipboardList,
  Upload,
  Trash2,
  RefreshCw,
  Brain,
  Wand2,
  Sparkles,
  Plus,
  Loader2,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { formatDate, getSeverityColor, getRemediationStatusColor } from '@/lib/utils';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import type { ValidationData, ValidationFindingData } from '@/lib/types';

export default function ValidationDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const id = params.id as string;
  const validationId = params.validationId as string;
  const [validation, setValidation] = useState<ValidationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFinding, setSelectedFinding] = useState<ValidationFindingData | null>(null);
  const [actionType, setActionType] = useState<'remediate' | 'signoff' | 'memo' | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [memoContent, setMemoContent] = useState<string | null>(null);
  const [generatingMemo, setGeneratingMemo] = useState(false);
  const [uploadingReport, setUploadingReport] = useState(false);
  const [deletingReport, setDeletingReport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Analysis state
  const [analyzingReport, setAnalyzingReport] = useState(false);
  const [reportAnalysis, setReportAnalysis] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Demo data generation state
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatingFindings, setGeneratingFindings] = useState(false);

  const fetchValidation = async () => {
    try {
      const res = await fetch(`/api/inventory/${id}/validations/${validationId}`);
      if (res.ok) {
        const data = await res.json();
        setValidation(data);
      }
    } catch (error) {
      console.error('Error fetching validation:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchValidation();
  }, [id, validationId]);

  const handleRemediate = async () => {
    if (!selectedFinding) return;
    setSubmitting(true);

    try {
      const res = await fetch(
        `/api/inventory/${id}/validations/${validationId}/findings/${selectedFinding.id}/remediate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            remediationNotes: notes,
            remediatedBy: 'Model Owner',
          }),
        }
      );

      if (res.ok) {
        await fetchValidation();
        setSelectedFinding(null);
        setActionType(null);
        setNotes('');
      }
    } catch (error) {
      console.error('Error remediating finding:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOff = async () => {
    if (!selectedFinding) return;
    setSubmitting(true);

    try {
      const res = await fetch(
        `/api/inventory/${id}/validations/${validationId}/findings/${selectedFinding.id}/sign-off`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signOffNotes: notes,
            signOffBy: 'Model Risk Manager',
          }),
        }
      );

      if (res.ok) {
        await fetchValidation();
        setSelectedFinding(null);
        setActionType(null);
        setNotes('');
      }
    } catch (error) {
      console.error('Error signing off finding:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateMemo = async () => {
    if (!selectedFinding) return;
    setGeneratingMemo(true);
    setMemoContent(null);

    try {
      const res = await fetch('/api/inventory/ai/memo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          findingId: selectedFinding.id,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate memo');

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
              setMemoContent(content);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error generating memo:', error);
    } finally {
      setGeneratingMemo(false);
    }
  };

  const handleReportUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingReport(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(
        `/api/inventory/${id}/validations/${validationId}/report`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (res.ok) {
        await fetchValidation();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to upload report');
      }
    } catch (error) {
      console.error('Error uploading report:', error);
      alert('Failed to upload report');
    } finally {
      setUploadingReport(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleReportDelete = async () => {
    if (!confirm('Are you sure you want to delete this validation report?')) {
      return;
    }

    setDeletingReport(true);

    try {
      const res = await fetch(
        `/api/inventory/${id}/validations/${validationId}/report`,
        {
          method: 'DELETE',
        }
      );

      if (res.ok) {
        await fetchValidation();
        setReportAnalysis(null);
        toast({ title: 'Report Deleted', description: 'The validation report has been removed.' });
      } else {
        const error = await res.json();
        toast({ title: 'Error', description: error.error || 'Failed to delete report', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({ title: 'Error', description: 'Failed to delete report', variant: 'destructive' });
    } finally {
      setDeletingReport(false);
    }
  };

  // AI Report Analysis
  const handleAnalyzeReport = useCallback(async () => {
    if (analyzingReport) return; // Prevent double-click

    setAnalyzingReport(true);
    setReportAnalysis(null);
    setShowAnalysis(true);

    try {
      const res = await fetch(
        `/api/inventory/${id}/validations/${validationId}/report/analyze`,
        { method: 'POST' }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to analyze report');
      }

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
              try {
                content += JSON.parse(text);
                setReportAnalysis(content);
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      toast({ title: 'Analysis Complete', description: 'AI report analysis has been generated.' });
    } catch (error) {
      console.error('Error analyzing report:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Failed to analyze report',
        variant: 'destructive',
      });
      setShowAnalysis(false);
    } finally {
      setAnalyzingReport(false);
    }
  }, [id, validationId, analyzingReport, toast]);

  // Generate Synthetic Report
  const handleGenerateSyntheticReport = useCallback(async () => {
    if (generatingReport) return; // Prevent double-click

    setGeneratingReport(true);

    try {
      const res = await fetch(
        `/api/inventory/${id}/validations/${validationId}/synthetic-report`,
        { method: 'POST' }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to generate report');
      }

      await fetchValidation();
      toast({ title: 'Demo Report Generated', description: 'A synthetic validation report has been created.' });
    } catch (error) {
      console.error('Error generating synthetic report:', error);
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate demo report',
        variant: 'destructive',
      });
    } finally {
      setGeneratingReport(false);
    }
  }, [id, validationId, generatingReport, toast]);

  // Generate Synthetic Findings
  const handleGenerateSyntheticFindings = useCallback(async () => {
    if (generatingFindings) return; // Prevent double-click

    setGeneratingFindings(true);

    try {
      const res = await fetch(
        `/api/inventory/${id}/validations/${validationId}/synthetic-findings`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ count: 'random' }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to generate findings');
      }

      const data = await res.json();
      await fetchValidation();
      toast({
        title: 'Demo Findings Generated',
        description: `${data.findings?.length || 0} synthetic finding(s) have been added.`,
      });
    } catch (error) {
      console.error('Error generating synthetic findings:', error);
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate demo findings',
        variant: 'destructive',
      });
    } finally {
      setGeneratingFindings(false);
    }
  }, [id, validationId, generatingFindings, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!validation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Validation not found</h2>
          <Link href={`/manager/inventory/${id}`}>
            <Button variant="outline">Back to Model</Button>
          </Link>
        </div>
      </div>
    );
  }

  const openFindings = validation.findings?.filter(
    (f) => f.remediationStatus === 'Open' || f.remediationStatus === 'In Progress'
  ) || [];
  const awaitingSignOff = validation.findings?.filter(
    (f) => f.remediationStatus === 'Remediated' && !f.mrmSignedOff
  ) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href={`/manager/inventory/${id}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Model
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-200" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {validation.validationType} Validation
                </h1>
                <p className="text-sm text-gray-500">
                  {formatDate(validation.validationDate)} · {validation.validatedBy}
                </p>
              </div>
            </div>
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
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleReportUpload}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
          className="hidden"
        />

        {/* Validation Report Banner */}
        {validation.reportStoragePath ? (
          <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {validation.reportFilename || `${validation.validationType} Validation Report`}
                    </p>
                    <p className="text-sm text-gray-600">
                      Official validation report · {formatDate(validation.validationDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handleAnalyzeReport}
                    disabled={analyzingReport}
                    className="bg-white"
                  >
                    {analyzingReport ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4 mr-2" />
                        AI Analysis
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(validation.reportStoragePath!, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Report
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = validation.reportStoragePath!;
                      link.download = validation.reportFilename || 'validation-report.pdf';
                      link.click();
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingReport}
                  >
                    {uploadingReport ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Replace
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleReportDelete}
                    disabled={deletingReport}
                  >
                    {deletingReport ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6 border-dashed border-2 border-gray-300 bg-gray-50">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">No Validation Report Uploaded</p>
                    <p className="text-sm text-gray-500">
                      Upload the official validation report (PDF, Word, Excel) or generate demo data
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handleGenerateSyntheticReport}
                    disabled={generatingReport}
                  >
                    {generatingReport ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate Demo Report
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingReport}
                  >
                    {uploadingReport ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Report
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Report Analysis Section */}
        {showAnalysis && (
          <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-blue-600" />
                  AI Report Analysis
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAnalysis(false)}
                >
                  Close
                </Button>
              </div>
              <CardDescription>
                AI-generated analysis of the validation report
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyzingReport && !reportAnalysis && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
                  <span className="text-gray-600">Analyzing report content...</span>
                </div>
              )}
              {reportAnalysis && (
                <div className="bg-white rounded-lg p-4 border">
                  <MarkdownRenderer content={reportAnalysis} className="text-sm" />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Validation Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Validation Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">{formatDate(validation.validationDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Validated By</p>
                    <p className="font-medium">{validation.validatedBy}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="font-medium">{validation.validationType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Result</p>
                    <p className="font-medium">{validation.overallResult || validation.status}</p>
                  </div>
                </div>
              </div>
              {validation.summaryNotes && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500 mb-1">Summary Notes</p>
                  <p className="text-gray-700">{validation.summaryNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Findings Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Findings</span>
                  <span className="font-medium">{validation.findings?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Open</span>
                  <Badge className="bg-red-100 text-red-800">{openFindings.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Awaiting Sign-off</span>
                  <Badge className="bg-amber-100 text-amber-800">{awaitingSignOff.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Closed</span>
                  <Badge className="bg-green-100 text-green-800">
                    {validation.findings?.filter((f) => f.mrmSignedOff).length || 0}
                  </Badge>
                </div>
              </div>

              {/* Severity breakdown */}
              {validation.findings && validation.findings.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500 mb-2">By Severity</p>
                  <div className="flex flex-wrap gap-1">
                    {(['Critical', 'High', 'Medium', 'Low'] as const).map((severity) => {
                      const count = validation.findings?.filter((f) => f.severity === severity).length || 0;
                      if (count === 0) return null;
                      return (
                        <Badge
                          key={severity}
                          className={getSeverityColor(severity)}
                        >
                          {severity}: {count}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Findings List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Findings</CardTitle>
                <CardDescription>Manage findings and remediation for this validation</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateSyntheticFindings}
                disabled={generatingFindings}
              >
                {generatingFindings ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Demo Findings
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {validation.findings && validation.findings.length > 0 ? (
              <div className="space-y-4">
                {validation.findings.map((finding: ValidationFindingData) => (
                  <div
                    key={finding.id}
                    className={`border rounded-lg p-4 ${
                      finding.remediationStatus === 'Open'
                        ? 'border-red-200 bg-red-50'
                        : finding.remediationStatus === 'In Progress'
                        ? 'border-amber-200 bg-amber-50'
                        : finding.remediationStatus === 'Remediated' && !finding.mrmSignedOff
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-green-200 bg-green-50'
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
                        <p className="font-medium text-gray-900">{finding.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{finding.description}</p>

                        {finding.remediationNotes && (
                          <div className="mt-3 p-3 bg-white rounded border">
                            <p className="text-sm font-medium text-gray-500 mb-1">
                              Remediation Notes
                            </p>
                            <p className="text-sm">{finding.remediationNotes}</p>
                            {finding.remediatedBy && finding.remediatedAt && (
                              <p className="text-xs text-gray-400 mt-2">
                                Remediated by {finding.remediatedBy} on{' '}
                                {formatDate(finding.remediatedAt)}
                              </p>
                            )}
                          </div>
                        )}

                        {finding.mrmSignedOff && finding.mrmSignOffNotes && (
                          <div className="mt-3 p-3 bg-green-100 rounded border border-green-200">
                            <p className="text-sm font-medium text-green-800 mb-1">
                              MRM Sign-off Notes
                            </p>
                            <p className="text-sm text-green-700">{finding.mrmSignOffNotes}</p>
                            <p className="text-xs text-green-600 mt-2">
                              Signed off by {finding.mrmSignOffBy} on{' '}
                              {formatDate(finding.mrmSignOffDate!)}
                            </p>
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
                            Signed Off
                          </span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {finding.remediationStatus === 'Open' ||
                            finding.remediationStatus === 'In Progress' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedFinding(finding);
                                  setActionType('remediate');
                                  setNotes(finding.remediationNotes || '');
                                }}
                              >
                                <Pencil className="w-3 h-3 mr-1" />
                                Remediate
                              </Button>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => {
                                    setSelectedFinding(finding);
                                    setActionType('signoff');
                                    setNotes('');
                                  }}
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Sign Off
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedFinding(finding);
                                    setActionType('memo');
                                    setMemoContent(null);
                                  }}
                                >
                                  <FileEdit className="w-3 h-3 mr-1" />
                                  Generate Memo
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
                <p className="text-gray-500">No findings for this validation</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Remediate Dialog */}
      <Dialog
        open={actionType === 'remediate'}
        onOpenChange={() => {
          setActionType(null);
          setSelectedFinding(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remediate Finding</DialogTitle>
            <DialogDescription>
              {selectedFinding?.findingNumber}: {selectedFinding?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Remediation Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe the remediation actions taken..."
              className="mt-2"
              rows={5}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionType(null)}>
              Cancel
            </Button>
            <Button onClick={handleRemediate} disabled={submitting || !notes.trim()}>
              {submitting ? 'Saving...' : 'Mark as Remediated'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sign-off Dialog */}
      <Dialog
        open={actionType === 'signoff'}
        onOpenChange={() => {
          setActionType(null);
          setSelectedFinding(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>MRM Sign-off</DialogTitle>
            <DialogDescription>
              Approve the remediation for: {selectedFinding?.findingNumber}: {selectedFinding?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedFinding?.remediationNotes && (
              <div className="mb-4 p-3 bg-gray-50 rounded border">
                <p className="text-sm font-medium text-gray-500 mb-1">Remediation Notes</p>
                <p className="text-sm">{selectedFinding.remediationNotes}</p>
              </div>
            )}
            <label className="text-sm font-medium">Sign-off Notes (optional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes for the sign-off..."
              className="mt-2"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionType(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSignOff}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? 'Signing...' : 'Approve & Sign Off'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Memo Dialog */}
      <Dialog
        open={actionType === 'memo'}
        onOpenChange={() => {
          setActionType(null);
          setSelectedFinding(null);
          setMemoContent(null);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Remediation Memo</DialogTitle>
            <DialogDescription>
              {selectedFinding?.findingNumber}: {selectedFinding?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {!memoContent && !generatingMemo && (
              <div className="text-center py-8">
                <FileEdit className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  Generate a formal remediation memo for this finding
                </p>
                <Button onClick={handleGenerateMemo}>
                  <FileEdit className="w-4 h-4 mr-2" />
                  Generate Memo
                </Button>
              </div>
            )}
            {generatingMemo && (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500">Generating memo...</p>
              </div>
            )}
            {memoContent && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <MarkdownRenderer content={memoContent} className="text-sm" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionType(null);
                setMemoContent(null);
              }}
            >
              Close
            </Button>
            {memoContent && (
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(memoContent);
                  toast({
                    title: 'Copied!',
                    description: 'Memo content copied to clipboard',
                  });
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy to Clipboard
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
