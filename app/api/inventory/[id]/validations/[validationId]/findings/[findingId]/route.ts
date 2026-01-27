import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/inventory/[id]/validations/[validationId]/findings/[findingId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; validationId: string; findingId: string }> }
) {
  try {
    const { findingId } = await params;

    const finding = await prisma.validationFinding.findUnique({
      where: { id: findingId },
      include: {
        validation: {
          include: {
            inventoryModel: {
              include: {
                useCase: true,
              },
            },
          },
        },
      },
    });

    if (!finding) {
      return NextResponse.json(
        { error: 'Finding not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(finding);
  } catch (error) {
    console.error('Error fetching finding:', error);
    return NextResponse.json(
      { error: 'Failed to fetch finding', details: String(error) },
      { status: 500 }
    );
  }
}

// PATCH /api/inventory/[id]/validations/[validationId]/findings/[findingId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; validationId: string; findingId: string }> }
) {
  try {
    const { findingId } = await params;
    const body = await request.json();

    const finding = await prisma.validationFinding.findUnique({
      where: { id: findingId },
    });

    if (!finding) {
      return NextResponse.json(
        { error: 'Finding not found' },
        { status: 404 }
      );
    }

    const allowedFields = [
      'title',
      'description',
      'severity',
      'category',
      'remediationStatus',
      'remediationNotes',
      'remediationDueDate',
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'remediationDueDate' && body[field]) {
          updateData[field] = new Date(body[field]);
        } else {
          updateData[field] = body[field];
        }
      }
    }

    const updatedFinding = await prisma.validationFinding.update({
      where: { id: findingId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      finding: updatedFinding,
    });
  } catch (error) {
    console.error('Error updating finding:', error);
    return NextResponse.json(
      { error: 'Failed to update finding', details: String(error) },
      { status: 500 }
    );
  }
}
