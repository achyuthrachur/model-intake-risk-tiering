import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { deleteFile } from '@/lib/storage';

// GET: Get attachment details or redirect to download
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const { id: useCaseId, attachmentId } = await params;

    const attachment = await prisma.attachment.findFirst({
      where: {
        id: attachmentId,
        useCaseId,
      },
    });

    if (!attachment) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      );
    }

    // Check if this is a download request
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'download') {
      // Redirect to the blob URL for download
      return NextResponse.redirect(attachment.storagePath);
    }

    // Return attachment metadata
    return NextResponse.json(attachment);
  } catch (error) {
    console.error('Error fetching attachment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attachment' },
      { status: 500 }
    );
  }
}

// DELETE: Delete an attachment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const { id: useCaseId, attachmentId } = await params;

    const attachment = await prisma.attachment.findFirst({
      where: {
        id: attachmentId,
        useCaseId,
      },
    });

    if (!attachment) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      );
    }

    // Delete from Vercel Blob storage
    try {
      await deleteFile(attachment.storagePath);
    } catch (storageError) {
      console.error('Error deleting from storage:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    await prisma.attachment.delete({
      where: { id: attachmentId },
    });

    // Create audit event
    await prisma.auditEvent.create({
      data: {
        useCaseId,
        actor: 'demo-user',
        eventType: 'AttachmentDeleted',
        details: JSON.stringify({
          attachmentId,
          filename: attachment.filename,
          artifactId: attachment.artifactId,
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return NextResponse.json(
      { error: 'Failed to delete attachment' },
      { status: 500 }
    );
  }
}
