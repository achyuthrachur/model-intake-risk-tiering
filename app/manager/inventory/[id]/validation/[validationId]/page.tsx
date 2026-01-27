'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  Calendar,
  User,
  AlertTriangle,
  FileEdit,
  Pencil,
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
import { formatDate, getSeverityColor, getRemediationStatusColor } from '@/lib/utils';
import type { ValidationData, ValidationFindingData } from '@/lib/types';

interface PageProps {
  params: Promise<{ id: string; validationId: string }>;
}

export default function ValidationDetailPage({ params }: PageProps) {
  const { id, validationId } = use(params);
  const [validation, setValidation] = useState<ValidationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFinding, setSelectedFinding] = useState<ValidationFindingData | null>(null);
  const [actionType, setActionType] = useState<'remediate' | 'signoff' | 'memo' | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [memoContent, setMemoContent] = useState<string | null>(null);
  const [generatingMemo, setGeneratingMemo] = useState(false);

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
                  <FileText className="w-4 h-4 text-gray-400" />
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
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Findings List */}
        <Card>
          <CardHeader>
            <CardTitle>Findings</CardTitle>
            <CardDescription>Manage findings and remediation for this validation</CardDescription>
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
                <pre className="whitespace-pre-wrap text-sm font-mono">{memoContent}</pre>
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
                }}
              >
                Copy to Clipboard
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
