'use client';

import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Download,
  Trash2,
  FileText,
  Sparkles,
  Loader2,
  AlertTriangle,
  XCircle,
  Brain,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropZone } from './DropZone';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { formatFileSize } from '@/lib/file-utils';
import { useToast } from '@/components/ui/use-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface Artifact {
  id: string;
  name: string;
  description?: string;
  category?: string;
  ownerRole?: string;
  whatGoodLooksLike?: string;
}

interface Attachment {
  id: string;
  filename: string;
  artifactId?: string;
  storagePath: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: string;
  isSynthetic?: boolean;
}

interface ArtifactAnalysis {
  artifactId: string;
  artifactName: string;
  status: 'complete' | 'partial' | 'inadequate';
  score: number;
  summary: string;
  expectedElements: string[];
  foundElements: string[];
  missingElements: string[];
  concerns: string[];
  recommendations: string[];
  analysisDate: string;
  aiPowered: boolean;
  cached?: boolean;
}

interface ArtifactUploadCardProps {
  artifact: Artifact;
  isMissing: boolean;
  useCaseId: string;
  existingAttachments?: Attachment[];
  onUploadComplete?: (attachment: Attachment) => void;
  onDeleteComplete?: (attachmentId: string) => void;
  showAnalyze?: boolean;
  cachedAnalysis?: ArtifactAnalysis | null;
}

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'complete':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'partial':
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    case 'inadequate':
      return <XCircle className="w-5 h-5 text-red-500" />;
    default:
      return null;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'complete':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'partial':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'inadequate':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-red-600';
};

export function ArtifactUploadCard({
  artifact,
  isMissing,
  useCaseId,
  existingAttachments = [],
  onUploadComplete,
  onDeleteComplete,
  showAnalyze = true,
  cachedAnalysis = null,
}: ArtifactUploadCardProps) {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ArtifactAnalysis | null>(cachedAnalysis);

  // Filter attachments for this artifact
  const artifactAttachments = existingAttachments.filter(
    (a) => a.artifactId === artifact.id
  );
  const hasAttachments = artifactAttachments.length > 0;
  const hasSyntheticAttachment = artifactAttachments.some(a => a.isSynthetic);

  const handleUploadComplete = (attachment: Attachment) => {
    toast({
      title: 'File uploaded',
      description: `${attachment.filename} has been uploaded successfully.`,
    });
    // Clear analysis when new file is uploaded
    setAnalysis(null);
    onUploadComplete?.(attachment);
  };

  const handleUploadError = (error: string) => {
    toast({
      title: 'Upload failed',
      description: error,
      variant: 'destructive',
    });
  };

  const handleDelete = async (attachmentId: string, filename: string) => {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) {
      return;
    }

    setIsDeleting(attachmentId);
    try {
      const response = await fetch(
        `/api/usecases/${useCaseId}/attachments/${attachmentId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Delete failed');
      }

      toast({
        title: 'File deleted',
        description: `${filename} has been deleted.`,
      });
      // Clear analysis when file is deleted
      setAnalysis(null);
      onDeleteComplete?.(attachmentId);
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Failed to delete file',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch(
        `/api/usecases/${useCaseId}/artifacts/${artifact.id}/analyze`,
        { method: 'POST' }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Analysis failed');
      }

      const result = await response.json();
      setAnalysis(result);
      toast({
        title: 'Analysis complete',
        description: `${artifact.name} scored ${result.score}/100`,
      });
    } catch (error) {
      toast({
        title: 'Analysis failed',
        description: error instanceof Error ? error.message : 'Failed to analyze artifact',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-colors',
        isMissing && !hasAttachments
          ? 'bg-amber-50 border-amber-200'
          : 'bg-white border-gray-200'
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className="flex items-start cursor-pointer flex-1"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center mr-3 mt-0.5">
            {hasAttachments ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : isMissing ? (
              <AlertCircle className="w-5 h-5 text-amber-500" />
            ) : (
              <CheckCircle className="w-5 h-5 text-gray-300" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900">{artifact.name}</h4>
              {artifact.whatGoodLooksLike && (
                <HelpTooltip
                  title="What Good Looks Like"
                  content={artifact.whatGoodLooksLike}
                />
              )}
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </div>
            {artifact.description && (
              <p className="text-sm text-gray-600 mt-1">{artifact.description}</p>
            )}
            {artifact.ownerRole && (
              <p className="text-xs text-gray-500 mt-1">Owner: {artifact.ownerRole}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          {analysis && (
            <Badge variant="outline" className={cn('font-medium', getStatusColor(analysis.status))}>
              {analysis.score}/100
            </Badge>
          )}
          {hasSyntheticAttachment && (
            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
              <Sparkles className="w-3 h-3 mr-1" />
              Demo
            </Badge>
          )}
          {hasAttachments && !hasSyntheticAttachment && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {artifactAttachments.length} file{artifactAttachments.length > 1 ? 's' : ''}
            </Badge>
          )}
          {isMissing && !hasAttachments && (
            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
              Missing
            </Badge>
          )}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-4 ml-8 space-y-4">
          {/* Existing attachments */}
          {artifactAttachments.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">Uploaded Files</p>
                {showAnalyze && hasAttachments && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="gap-2"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Brain className="w-4 h-4" />
                    )}
                    {isAnalyzing ? 'Analyzing...' : analysis ? 'Re-analyze' : 'Analyze'}
                  </Button>
                )}
              </div>
              {artifactAttachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {attachment.filename}
                        </p>
                        {attachment.isSynthetic && (
                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-600 border-amber-200">
                            Demo
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {attachment.fileSize && formatFileSize(attachment.fileSize)} •{' '}
                        {new Date(attachment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(attachment.storagePath, '_blank')}
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(attachment.id, attachment.filename)}
                      disabled={isDeleting === attachment.id}
                      title="Delete"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Analysis Results */}
          {analysis && (
            <div className="border rounded-lg overflow-hidden">
              <div className={cn('p-4', getStatusColor(analysis.status).replace('text-', 'bg-').split(' ')[0])}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={analysis.status} />
                    <span className="font-medium capitalize">{analysis.status}</span>
                    {analysis.aiPowered && (
                      <Badge variant="outline" className="text-xs bg-white/50">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI Powered
                      </Badge>
                    )}
                  </div>
                  <span className={cn('text-2xl font-bold', getScoreColor(analysis.score))}>
                    {analysis.score}/100
                  </span>
                </div>
                <p className="text-sm mt-2 opacity-90">{analysis.summary}</p>
              </div>

              <div className="p-4 bg-white">
                <Accordion type="multiple" className="space-y-2">
                  {/* Expected vs Found */}
                  {(analysis.expectedElements.length > 0 || analysis.foundElements.length > 0) && (
                    <AccordionItem value="expected-found" className="border rounded-lg px-3">
                      <AccordionTrigger className="text-sm hover:no-underline py-2">
                        Expected vs Found Elements
                      </AccordionTrigger>
                      <AccordionContent className="pb-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-2">EXPECTED</p>
                            <ul className="text-sm space-y-1">
                              {analysis.expectedElements.map((item, i) => (
                                <li key={i} className="text-gray-600 flex items-start gap-1">
                                  <span className="text-gray-400">•</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-green-600 mb-2">FOUND</p>
                            <ul className="text-sm space-y-1">
                              {analysis.foundElements.map((item, i) => (
                                <li key={i} className="text-green-700 flex items-start gap-1">
                                  <CheckCircle className="w-3 h-3 mt-1 flex-shrink-0" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Missing Elements */}
                  {analysis.missingElements.length > 0 && (
                    <AccordionItem value="missing" className="border rounded-lg px-3 border-red-200">
                      <AccordionTrigger className="text-sm hover:no-underline py-2 text-red-700">
                        Missing Elements ({analysis.missingElements.length})
                      </AccordionTrigger>
                      <AccordionContent className="pb-3">
                        <ul className="text-sm space-y-1">
                          {analysis.missingElements.map((item, i) => (
                            <li key={i} className="text-red-600 flex items-start gap-1">
                              <XCircle className="w-3 h-3 mt-1 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Concerns */}
                  {analysis.concerns.length > 0 && (
                    <AccordionItem value="concerns" className="border rounded-lg px-3 border-yellow-200">
                      <AccordionTrigger className="text-sm hover:no-underline py-2 text-yellow-700">
                        Concerns ({analysis.concerns.length})
                      </AccordionTrigger>
                      <AccordionContent className="pb-3">
                        <ul className="text-sm space-y-1">
                          {analysis.concerns.map((item, i) => (
                            <li key={i} className="text-yellow-700 flex items-start gap-1">
                              <AlertTriangle className="w-3 h-3 mt-1 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Recommendations */}
                  {analysis.recommendations.length > 0 && (
                    <AccordionItem value="recommendations" className="border rounded-lg px-3 border-blue-200">
                      <AccordionTrigger className="text-sm hover:no-underline py-2 text-blue-700">
                        Recommendations ({analysis.recommendations.length})
                      </AccordionTrigger>
                      <AccordionContent className="pb-3">
                        <ul className="text-sm space-y-1">
                          {analysis.recommendations.map((item, i) => (
                            <li key={i} className="text-blue-700 flex items-start gap-1">
                              <span className="text-blue-400">→</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>

                <p className="text-xs text-gray-400 mt-3">
                  Analyzed {new Date(analysis.analysisDate).toLocaleString()}
                  {analysis.cached && ' (cached)'}
                </p>
              </div>
            </div>
          )}

          {/* Upload zone */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              {hasAttachments ? 'Upload Additional File' : 'Upload Evidence'}
            </p>
            <DropZone
              useCaseId={useCaseId}
              artifactId={artifact.id}
              artifactName={artifact.name}
              type="Model documentation"
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
            />
          </div>
        </div>
      )}
    </div>
  );
}
