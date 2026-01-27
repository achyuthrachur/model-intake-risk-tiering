// Vercel Blob Storage utilities

import { put, del, list } from '@vercel/blob';

export interface UploadResult {
  url: string;
  pathname: string;
  contentType: string;
  contentDisposition: string;
}

/**
 * Upload a file to Vercel Blob storage
 */
export async function uploadFile(
  file: File | Blob,
  useCaseId: string,
  filename: string
): Promise<UploadResult> {
  const pathname = `attachments/${useCaseId}/${filename}`;

  const blob = await put(pathname, file, {
    access: 'public',
    addRandomSuffix: true, // Prevents overwriting existing files
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
    contentType: blob.contentType,
    contentDisposition: blob.contentDisposition,
  };
}

/**
 * Delete a file from Vercel Blob storage
 */
export async function deleteFile(url: string): Promise<void> {
  await del(url);
}

/**
 * List all files for a use case
 */
export async function listFiles(useCaseId: string) {
  const { blobs } = await list({
    prefix: `attachments/${useCaseId}/`,
  });

  return blobs;
}

/**
 * Get file URL - Vercel Blob URLs are already public
 */
export function getFileUrl(storagePath: string): string {
  return storagePath;
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  options?: {
    maxSizeBytes?: number;
    allowedTypes?: string[];
  }
): { valid: boolean; error?: string } {
  const maxSize = options?.maxSizeBytes ?? 10 * 1024 * 1024; // 10MB default
  const allowedTypes = options?.allowedTypes ?? [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'image/png',
    'image/jpeg',
    'image/gif',
  ];

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`,
    };
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: PDF, Word, Excel, PowerPoint, text, CSV, images`,
    };
  }

  return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
