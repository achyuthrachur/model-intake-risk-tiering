'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, FileUp, Loader2, X, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/storage';

interface DropZoneProps {
  useCaseId: string;
  artifactId?: string;
  artifactName?: string;
  type?: string;
  onUploadComplete: (attachment: any) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  compact?: boolean;
}

export function DropZone({
  useCaseId,
  artifactId,
  artifactName,
  type = 'Other',
  onUploadComplete,
  onUploadError,
  className,
  compact = false,
}: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      if (artifactId) {
        formData.append('artifactId', artifactId);
      }

      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      const response = await fetch(`/api/usecases/${useCaseId}/attachments`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const attachment = await response.json();
      setUploadProgress(100);
      setUploadedFile({ name: file.name, size: file.size });
      onUploadComplete(attachment);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      onUploadError?.(message);
      setUploadedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        await uploadFile(files[0]);
      }
    },
    [useCaseId, artifactId, type]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        await uploadFile(files[0]);
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [useCaseId, artifactId, type]
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setUploadedFile(null);
    setUploadProgress(0);
  };

  if (uploadedFile) {
    return (
      <div
        className={cn(
          'border border-green-200 bg-green-50 rounded-lg p-3 flex items-center justify-between',
          className
        )}
      >
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-800">{uploadedFile.name}</p>
            <p className="text-xs text-green-600">{formatFileSize(uploadedFile.size)}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.gif"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleClick}
          disabled={isUploading}
          className="gap-2"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {isUploading ? 'Uploading...' : 'Upload'}
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative border-2 border-dashed rounded-lg p-6 transition-all cursor-pointer',
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400 bg-gray-50',
        isUploading && 'pointer-events-none opacity-70',
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.gif"
      />

      <div className="flex flex-col items-center gap-2 text-center">
        {isUploading ? (
          <>
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
            <div className="w-full max-w-xs h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </>
        ) : (
          <>
            <FileUp
              className={cn(
                'w-8 h-8',
                isDragging ? 'text-blue-500' : 'text-gray-400'
              )}
            />
            <div>
              <p className="text-sm font-medium text-gray-700">
                {isDragging ? 'Drop file here' : 'Drag and drop or click to upload'}
              </p>
              {artifactName && (
                <p className="text-xs text-gray-500 mt-1">
                  Upload evidence for: {artifactName}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                PDF, Word, Excel, PowerPoint, images (max 10MB)
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
