'use client';

import { FileText, Download, Trash2, Eye, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatFileSize } from '@/lib/storage';

interface Attachment {
  id: string;
  filename: string;
  type: string;
  artifactId?: string;
  storagePath: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: string;
}

interface ArtifactConfig {
  id: string;
  name: string;
  description?: string;
  category?: string;
}

interface ProvidedArtifactsListProps {
  attachments: Attachment[];
  artifactsConfig?: Record<string, ArtifactConfig>;
  useCaseId: string;
  onDelete?: (attachmentId: string) => Promise<void>;
  showDeleteButton?: boolean;
}

export function ProvidedArtifactsList({
  attachments,
  artifactsConfig,
  useCaseId,
  onDelete,
  showDeleteButton = true,
}: ProvidedArtifactsListProps) {
  if (attachments.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No artifacts have been uploaded yet.</p>
          <p className="text-sm mt-2">
            Upload evidence in the Artifacts tab to see them here.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group by artifact ID
  const groupedByArtifact = attachments.reduce((acc, attachment) => {
    const key = attachment.artifactId || 'other';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(attachment);
    return acc;
  }, {} as Record<string, Attachment[]>);

  const handleDownload = (attachment: Attachment) => {
    window.open(attachment.storagePath, '_blank');
  };

  const handlePreview = (attachment: Attachment) => {
    // For PDFs and images, open in new tab
    // For others, trigger download
    const previewableTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/gif'];
    if (attachment.mimeType && previewableTypes.includes(attachment.mimeType)) {
      window.open(attachment.storagePath, '_blank');
    } else {
      handleDownload(attachment);
    }
  };

  const getFileIcon = (mimeType?: string) => {
    // Could expand this to show different icons based on file type
    return <FileText className="w-5 h-5 text-gray-400" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          Provided Artifacts ({attachments.length})
        </CardTitle>
        <CardDescription>
          Evidence and documentation uploaded for this use case
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(groupedByArtifact).map(([artifactId, files]) => {
            const artifactName = artifactId !== 'other' && artifactsConfig?.[artifactId]
              ? artifactsConfig[artifactId].name
              : 'Other Documents';

            return (
              <div key={artifactId}>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  {artifactName}
                </h4>
                <div className="space-y-2">
                  {files.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getFileIcon(attachment.mimeType)}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {attachment.filename}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {attachment.fileSize && (
                              <span>{formatFileSize(attachment.fileSize)}</span>
                            )}
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(attachment.createdAt).toLocaleDateString()}
                            </span>
                            {attachment.type && (
                              <>
                                <span>•</span>
                                <Badge variant="outline" className="text-xs">
                                  {attachment.type}
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(attachment)}
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(attachment)}
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        {showDeleteButton && onDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(attachment.id)}
                            title="Delete"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
