import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { calculateValidationStatus, getValidationFrequency, generateInventoryNumber } from '@/lib/utils';

// GET /api/inventory - List all inventory models
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tier = searchParams.get('tier');
    const status = searchParams.get('status');
    const validationStatus = searchParams.get('validationStatus');
    const search = searchParams.get('search');

    // Build filter conditions
    const where: Record<string, unknown> = {};
    if (tier) where.tier = tier;
    if (status) where.status = status;

    const inventoryModels = await prisma.inventoryModel.findMany({
      where,
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
          orderBy: {
            validationDate: 'desc',
          },
        },
      },
      orderBy: {
        addedToInventoryAt: 'desc',
      },
    });

    // Enrich with computed fields
    const enrichedModels = inventoryModels.map(model => {
      const validationStatusComputed = calculateValidationStatus(model.nextValidationDue);

      // Count open findings across all validations
      const openFindingsCount = model.validations.reduce((count, validation) => {
        return count + validation.findings.filter(f =>
          f.remediationStatus === 'Open' || f.remediationStatus === 'In Progress'
        ).length;
      }, 0);

      const totalFindingsCount = model.validations.reduce((count, validation) => {
        return count + validation.findings.length;
      }, 0);

      return {
        ...model,
        validationStatus: validationStatusComputed,
        openFindingsCount,
        totalFindingsCount,
        isAiEnabled: model.useCase.aiType === 'GenAI' || model.useCase.aiType === 'Hybrid',
        isVendorModel: model.useCase.vendorInvolved,
        vendorName: model.useCase.vendorName,
      };
    });

    // Filter by validation status if specified
    let filteredModels = enrichedModels;
    if (validationStatus) {
      filteredModels = enrichedModels.filter(m => m.validationStatus === validationStatus);
    }

    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      filteredModels = filteredModels.filter(m =>
        m.useCase.title.toLowerCase().includes(searchLower) ||
        m.inventoryNumber.toLowerCase().includes(searchLower) ||
        m.useCase.businessLine.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({
      inventoryModels: filteredModels,
      count: filteredModels.length,
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory', details: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/inventory - Add approved use case to inventory
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      useCaseId,
      productionDate,
      validatedBeforeProduction = false,
      initialValidationDate,
    } = body;

    // Verify the use case exists and is approved
    const useCase = await prisma.useCase.findUnique({
      where: { id: useCaseId },
      include: {
        decision: true,
        inventoryModel: true,
      },
    });

    if (!useCase) {
      return NextResponse.json(
        { error: 'Use case not found' },
        { status: 404 }
      );
    }

    if (useCase.status !== 'Approved') {
      return NextResponse.json(
        { error: 'Only approved use cases can be added to inventory' },
        { status: 400 }
      );
    }

    if (useCase.inventoryModel) {
      return NextResponse.json(
        { error: 'Use case is already in the inventory' },
        { status: 400 }
      );
    }

    if (!useCase.decision) {
      return NextResponse.json(
        { error: 'Use case must have a decision before being added to inventory' },
        { status: 400 }
      );
    }

    // Generate inventory number
    const count = await prisma.inventoryModel.count();
    const inventoryNumber = generateInventoryNumber(count + 1);

    // Calculate validation frequency and next due date
    const tier = useCase.decision.tier;
    const frequencyMonths = getValidationFrequency(tier);

    // If initial validation date provided, use it; otherwise use production date or now
    const lastValidation = initialValidationDate
      ? new Date(initialValidationDate)
      : productionDate
        ? new Date(productionDate)
        : new Date();

    const nextValidationDue = new Date(lastValidation);
    nextValidationDue.setMonth(nextValidationDue.getMonth() + frequencyMonths);

    // Create inventory model
    const inventoryModel = await prisma.inventoryModel.create({
      data: {
        useCaseId,
        inventoryNumber,
        addedBy: 'Model Risk Manager',
        tier,
        validationFrequencyMonths: frequencyMonths,
        productionDate: productionDate ? new Date(productionDate) : null,
        validatedBeforeProduction,
        lastValidationDate: initialValidationDate ? new Date(initialValidationDate) : null,
        nextValidationDue,
        status: 'Active',
      },
      include: {
        useCase: {
          include: {
            decision: true,
          },
        },
      },
    });

    // Create initial validation record if initialValidationDate provided
    if (initialValidationDate) {
      await prisma.validation.create({
        data: {
          inventoryModelId: inventoryModel.id,
          validationType: 'Initial',
          validationDate: new Date(initialValidationDate),
          validatedBy: 'Model Risk Manager',
          status: 'Completed',
          overallResult: 'Satisfactory',
          summaryNotes: 'Initial validation completed prior to inventory entry.',
        },
      });
    }

    return NextResponse.json({
      success: true,
      inventoryModel,
    });
  } catch (error) {
    console.error('Error adding to inventory:', error);
    return NextResponse.json(
      { error: 'Failed to add to inventory', details: String(error) },
      { status: 500 }
    );
  }
}
