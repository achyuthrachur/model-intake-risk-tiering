'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle, ChevronDown, ChevronRight, Upload, FileText, Download, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropZone } from './DropZone';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { formatFileSize } from '@/lib/storage';
import { useToast } from '@/components/ui/use-toast';

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
}

interface ArtifactUploadCardProps {
  artifact: Artifact;
  isMissing: boolean;
  useCaseId: string;
  existingAttachments?: Attachment[];
  onUploadComplete?: (attachment: Attachment) => void;
  onDeleteComplete?: (attachmentId: string) => void;
}

export function ArtifactUploadCard({
  artifact,
  isMissing,
  useCaseId,
  existingAttachments = [],
  onUploadComplete,
  onDeleteComplete,
}: ArtifactUploadCardProps) {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Filter attachments for this artifact
  const artifactAttachments = existingAttachments.filter(
    (a) => a.artifactId === artifact.id
  );
  const hasAttachments = artifactAttachments.length > 0;

  const handleUploadComplete = (attachment: Attachment) => {
    toast({
      title: 'File uploaded',
      description: `${attachment.filename} has been uploaded successfully.`,
    });
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
          {hasAttachments && (
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
              <p className="text-sm font-medium text-gray-700">Uploaded Files</p>
              {artifactAttachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {attachment.filename}
                      </p>
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
