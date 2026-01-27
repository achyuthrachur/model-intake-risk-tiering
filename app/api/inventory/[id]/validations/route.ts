import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getValidationFrequency } from '@/lib/utils';

// GET /api/inventory/[id]/validations - List validations for a model
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const validations = await prisma.validation.findMany({
      where: { inventoryModelId: id },
      include: {
        findings: true,
      },
      orderBy: {
        validationDate: 'desc',
      },
    });

    return NextResponse.json({
      validations,
      count: validations.length,
    });
  } catch (error) {
    console.error('Error fetching validations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch validations', details: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/inventory/[id]/validations - Create a new validation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      validationType = 'Periodic',
      validationDate,
      validatedBy,
      overallResult,
      summaryNotes,
      reportFilename,
      reportStoragePath,
    } = body;

    // Verify the inventory model exists
    const inventoryModel = await prisma.inventoryModel.findUnique({
      where: { id },
    });

    if (!inventoryModel) {
      return NextResponse.json(
        { error: 'Inventory model not found' },
        { status: 404 }
      );
    }

    // Create the validation
    const validation = await prisma.validation.create({
      data: {
        inventoryModelId: id,
        validationType,
        validationDate: new Date(validationDate || new Date()),
        validatedBy: validatedBy || 'Model Risk Manager',
        status: 'Completed',
        overallResult,
        summaryNotes,
        reportFilename,
        reportStoragePath,
      },
      include: {
        findings: true,
      },
    });

    // Update the inventory model's last validation date and next due date
    const newValidationDate = new Date(validationDate || new Date());
    const frequencyMonths = getValidationFrequency(inventoryModel.tier);
    const nextDue = new Date(newValidationDate);
    nextDue.setMonth(nextDue.getMonth() + frequencyMonths);

    await prisma.inventoryModel.update({
      where: { id },
      data: {
        lastValidationDate: newValidationDate,
        nextValidationDue: nextDue,
      },
    });

    return NextResponse.json({
      success: true,
      validation,
    });
  } catch (error) {
    console.error('Error creating validation:', error);
    return NextResponse.json(
      { error: 'Failed to create validation', details: String(error) },
      { status: 500 }
    );
  }
}
