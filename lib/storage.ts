// Vercel Blob Storage utilities (server-only)
// For client-safe utilities like formatFileSize and validateFile, use @/lib/file-utils

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

// Client-safe utilities are in @/lib/file-utils:
// - validateFile
// - formatFileSize
