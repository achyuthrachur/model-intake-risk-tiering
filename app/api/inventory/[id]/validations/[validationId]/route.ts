import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/inventory/[id]/validations/[validationId] - Get single validation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; validationId: string }> }
) {
  try {
    const { validationId } = await params;

    const validation = await prisma.validation.findUnique({
      where: { id: validationId },
      include: {
        findings: {
          orderBy: {
            findingNumber: 'asc',
          },
        },
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

    return NextResponse.json(validation);
  } catch (error) {
    console.error('Error fetching validation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch validation', details: String(error) },
      { status: 500 }
    );
  }
}

// PATCH /api/inventory/[id]/validations/[validationId] - Update validation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; validationId: string }> }
) {
  try {
    const { validationId } = await params;
    const body = await request.json();

    const validation = await prisma.validation.findUnique({
      where: { id: validationId },
    });

    if (!validation) {
      return NextResponse.json(
        { error: 'Validation not found' },
        { status: 404 }
      );
    }

    const allowedFields = [
      'validationType',
      'validationDate',
      'validatedBy',
      'status',
      'overallResult',
      'summaryNotes',
      'reportFilename',
      'reportStoragePath',
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'validationDate' && body[field]) {
          updateData[field] = new Date(body[field]);
        } else {
          updateData[field] = body[field];
        }
      }
    }

    const updatedValidation = await prisma.validation.update({
      where: { id: validationId },
      data: updateData,
      include: {
        findings: true,
      },
    });

    return NextResponse.json({
      success: true,
      validation: updatedValidation,
    });
  } catch (error) {
    console.error('Error updating validation:', error);
    return NextResponse.json(
      { error: 'Failed to update validation', details: String(error) },
      { status: 500 }
    );
  }
}
