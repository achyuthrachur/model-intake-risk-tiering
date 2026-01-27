import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { calculateValidationStatus } from '@/lib/utils';

// GET /api/inventory/[id] - Get single inventory model
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const inventoryModel = await prisma.inventoryModel.findUnique({
      where: { id },
      include: {
        useCase: {
          include: {
            decision: true,
            attachments: true,
          },
        },
        validations: {
          include: {
            findings: true,
          },
          orderBy: {
            validationDate: 'desc',
          },
        },
      },
    });

    if (!inventoryModel) {
      return NextResponse.json(
        { error: 'Inventory model not found' },
        { status: 404 }
      );
    }

    // Enrich with computed fields
    const validationStatusComputed = calculateValidationStatus(inventoryModel.nextValidationDue);
    const openFindingsCount = inventoryModel.validations.reduce((count, validation) => {
      return count + validation.findings.filter(f =>
        f.remediationStatus === 'Open' || f.remediationStatus === 'In Progress'
      ).length;
    }, 0);

    const totalFindingsCount = inventoryModel.validations.reduce((count, validation) => {
      return count + validation.findings.length;
    }, 0);

    return NextResponse.json({
      ...inventoryModel,
      validationStatus: validationStatusComputed,
      openFindingsCount,
      totalFindingsCount,
      isAiEnabled: inventoryModel.useCase.aiType === 'GenAI' || inventoryModel.useCase.aiType === 'Hybrid',
      isVendorModel: inventoryModel.useCase.vendorInvolved,
      vendorName: inventoryModel.useCase.vendorName,
    });
  } catch (error) {
    console.error('Error fetching inventory model:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory model', details: String(error) },
      { status: 500 }
    );
  }
}

// PATCH /api/inventory/[id] - Update inventory model
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const inventoryModel = await prisma.inventoryModel.findUnique({
      where: { id },
    });

    if (!inventoryModel) {
      return NextResponse.json(
        { error: 'Inventory model not found' },
        { status: 404 }
      );
    }

    // Only allow updating certain fields
    const allowedFields = [
      'status',
      'productionDate',
      'validatedBeforeProduction',
      'nextValidationDue',
      'lastValidationDate',
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field.includes('Date') && body[field]) {
          updateData[field] = new Date(body[field]);
        } else {
          updateData[field] = body[field];
        }
      }
    }

    const updatedModel = await prisma.inventoryModel.update({
      where: { id },
      data: updateData,
      include: {
        useCase: {
          include: {
            decision: true,
          },
        },
        validations: {
          include: {
            findings: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      inventoryModel: updatedModel,
    });
  } catch (error) {
    console.error('Error updating inventory model:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory model', details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory/[id] - Retire inventory model
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const inventoryModel = await prisma.inventoryModel.findUnique({
      where: { id },
    });

    if (!inventoryModel) {
      return NextResponse.json(
        { error: 'Inventory model not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting status to Retired
    const updatedModel = await prisma.inventoryModel.update({
      where: { id },
      data: {
        status: 'Retired',
      },
    });

    return NextResponse.json({
      success: true,
      inventoryModel: updatedModel,
    });
  } catch (error) {
    console.error('Error retiring inventory model:', error);
    return NextResponse.json(
      { error: 'Failed to retire inventory model', details: String(error) },
      { status: 500 }
    );
  }
}
