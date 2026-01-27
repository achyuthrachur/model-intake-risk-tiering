import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { put, del } from '@vercel/blob';
import { validateFile } from '@/lib/file-utils';

// POST: Upload a validation report
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; validationId: string }> }
) {
  try {
    const { id: inventoryModelId, validationId } = await params;

    // Verify validation exists and belongs to this inventory model
    const validation = await prisma.validation.findFirst({
      where: {
        id: validationId,
        inventoryModelId,
      },
      include: {
        inventoryModel: {
          include: {
            useCase: true,
          },
        },
      },
    });

    if (!validation) {
      return NextResponse.json(
        { error: 'Validation not found' },
        { status: 404 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file (allow PDFs, Word docs, etc.)
    const fileValidation = validateFile(file);
    if (!fileValidation.valid) {
      return NextResponse.json(
        { error: fileValidation.error },
        { status: 400 }
      );
    }

    // Delete old report if exists
    if (validation.reportStoragePath) {
      try {
        await del(validation.reportStoragePath);
      } catch (e) {
        console.warn('Could not delete old report:', e);
      }
    }

    // Upload to Vercel Blob with a structured path
    const pathname = `validation-reports/${inventoryModelId}/${validationId}/${file.name}`;
    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    // Update the validation record
    const updatedValidation = await prisma.validation.update({
      where: { id: validationId },
      data: {
        reportFilename: file.name,
        reportStoragePath: blob.url,
      },
      include: {
        findings: true,
      },
    });

    return NextResponse.json({
      success: true,
      validation: updatedValidation,
      report: {
        filename: file.name,
        url: blob.url,
        size: file.size,
        type: file.type,
      },
    });
  } catch (error) {
    console.error('Error uploading validation report:', error);
    return NextResponse.json(
      { error: 'Failed to upload validation report', details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE: Remove a validation report
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; validationId: string }> }
) {
  try {
    const { id: inventoryModelId, validationId } = await params;

    // Verify validation exists
    const validation = await prisma.validation.findFirst({
      where: {
        id: validationId,
        inventoryModelId,
      },
    });

    if (!validation) {
      return NextResponse.json(
        { error: 'Validation not found' },
        { status: 404 }
      );
    }

    if (!validation.reportStoragePath) {
      return NextResponse.json(
        { error: 'No report to delete' },
        { status: 400 }
      );
    }

    // Delete from Vercel Blob
    try {
      await del(validation.reportStoragePath);
    } catch (e) {
      console.warn('Could not delete report from storage:', e);
    }

    // Update validation record
    const updatedValidation = await prisma.validation.update({
      where: { id: validationId },
      data: {
        reportFilename: null,
        reportStoragePath: null,
      },
      include: {
        findings: true,
      },
    });

    return NextResponse.json({
      success: true,
      validation: updatedValidation,
    });
  } catch (error) {
    console.error('Error deleting validation report:', error);
    return NextResponse.json(
      { error: 'Failed to delete validation report', details: String(error) },
      { status: 500 }
    );
  }
}
