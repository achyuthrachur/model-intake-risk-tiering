import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { uploadFile } from '@/lib/storage';
import { validateFile } from '@/lib/file-utils';

// GET: List all attachments for a use case
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const attachments = await prisma.attachment.findMany({
      where: { useCaseId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(attachments);
  } catch (error) {
    console.error('Error fetching attachments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attachments' },
      { status: 500 }
    );
  }
}

// POST: Upload a new attachment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: useCaseId } = await params;

    // Verify use case exists
    const useCase = await prisma.useCase.findUnique({
      where: { id: useCaseId },
    });

    if (!useCase) {
      return NextResponse.json(
        { error: 'Use case not found' },
        { status: 404 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string || 'Other';
    const artifactId = formData.get('artifactId') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob
    const uploadResult = await uploadFile(file, useCaseId, file.name);

    // Create database record
    const attachment = await prisma.attachment.create({
      data: {
        useCaseId,
        filename: file.name,
        type,
        artifactId,
        storagePath: uploadResult.url,
        fileSize: file.size,
        mimeType: file.type,
      },
    });

    // Create audit event
    await prisma.auditEvent.create({
      data: {
        useCaseId,
        actor: 'demo-user',
        eventType: 'AttachmentUploaded',
        details: JSON.stringify({
          attachmentId: attachment.id,
          filename: file.name,
          artifactId,
          type,
        }),
      },
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    return NextResponse.json(
      { error: 'Failed to upload attachment' },
      { status: 500 }
    );
  }
}
