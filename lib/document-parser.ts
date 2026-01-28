/**
 * Document Parser Utility
 * Extracts text content from PDF and Word documents for AI analysis
 */

// Using dynamic imports since these are heavy libraries
type PdfParseResult = {
  text: string;
  numpages: number;
  info: any;
};

/**
 * Extract text content from a PDF file
 */
async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import to avoid bundling issues
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParse = require('pdf-parse');
    const data: PdfParseResult = await pdfParse(buffer);
    return data.text || '';
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Extract text content from a Word document (.docx)
 */
async function extractWordText(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import to avoid bundling issues
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch (error) {
    console.error('Word extraction error:', error);
    throw new Error('Failed to extract text from Word document');
  }
}

/**
 * Extract text from plain text files
 */
function extractPlainText(buffer: Buffer): string {
  return buffer.toString('utf-8');
}

/**
 * Supported MIME types for text extraction
 */
export const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'text/csv',
  'text/markdown',
];

/**
 * Check if a MIME type is supported for text extraction
 */
export function isSupported(mimeType: string): boolean {
  return SUPPORTED_MIME_TYPES.some(supported =>
    mimeType.toLowerCase().includes(supported.split('/')[1])
  );
}

/**
 * Extract text content from a document based on MIME type
 * @param buffer - The document content as a Buffer
 * @param mimeType - The MIME type of the document
 * @returns Extracted text content
 */
export async function extractDocumentText(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const normalizedMime = mimeType.toLowerCase();

  if (normalizedMime.includes('pdf')) {
    return extractPdfText(buffer);
  }

  if (
    normalizedMime.includes('wordprocessingml') ||
    normalizedMime.includes('msword') ||
    normalizedMime.includes('docx')
  ) {
    return extractWordText(buffer);
  }

  if (
    normalizedMime.includes('text/plain') ||
    normalizedMime.includes('text/csv') ||
    normalizedMime.includes('text/markdown')
  ) {
    return extractPlainText(buffer);
  }

  throw new Error(`Unsupported document type: ${mimeType}`);
}

/**
 * Fetch a document from a URL and extract its text content
 * @param url - The URL of the document (e.g., Vercel Blob storage URL)
 * @param mimeType - The MIME type of the document
 * @returns Extracted text content
 */
export async function fetchAndExtractText(
  url: string,
  mimeType: string
): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return extractDocumentText(buffer, mimeType);
  } catch (error) {
    console.error('Document fetch/extract error:', error);
    throw error;
  }
}

/**
 * Truncate text to a maximum length while preserving word boundaries
 * @param text - The text to truncate
 * @param maxLength - Maximum character length (default 10000)
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number = 10000): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Find the last space before maxLength
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + '... [truncated]';
  }

  return truncated + '... [truncated]';
}

/**
 * Clean and normalize extracted text
 * @param text - Raw extracted text
 * @returns Cleaned text
 */
export function cleanText(text: string): string {
  return text
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove excessive newlines
    .replace(/\n{3,}/g, '\n\n')
    // Trim
    .trim();
}

/**
 * Extract and prepare document text for AI analysis
 * @param url - Document URL
 * @param mimeType - Document MIME type
 * @param maxLength - Maximum text length (default 10000)
 * @returns Prepared text content
 */
export async function prepareDocumentForAnalysis(
  url: string,
  mimeType: string,
  maxLength: number = 10000
): Promise<string> {
  const rawText = await fetchAndExtractText(url, mimeType);
  const cleanedText = cleanText(rawText);
  return truncateText(cleanedText, maxLength);
}
