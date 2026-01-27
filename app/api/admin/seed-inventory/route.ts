import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getValidationFrequency } from '@/lib/utils';

// Inventory seed data with varied scenarios
const inventorySeeds = [
  {
    useCaseTitle: 'Credit Underwriting Model Refresh',
    inventoryNumber: 'MDL-2024-001',
    tier: 'T3',
    validatedBeforeProduction: true,
    productionDate: new Date('2023-01-15'),
    // Last validation was 11 months ago - CURRENT
    lastValidationDate: new Date(Date.now() - 11 * 30 * 24 * 60 * 60 * 1000),
    validations: [
      {
        type: 'Initial',
        date: new Date('2023-01-10'),
        result: 'Satisfactory',
        validator: 'MRM Team',
        notes: 'Initial validation completed. Model meets all requirements.',
        findings: [],
      },
      {
        type: 'Periodic',
        date: new Date(Date.now() - 11 * 30 * 24 * 60 * 60 * 1000),
        result: 'Satisfactory with Findings',
        validator: 'External Validator',
        notes: 'Annual validation identified minor documentation gap.',
        findings: [
          {
            number: 'F-001',
            title: 'Documentation Gap - Feature Engineering Process',
            description: 'The feature engineering documentation lacks detail on variable transformations applied to income and debt-to-income ratios.',
            severity: 'Medium',
            category: 'Documentation',
            status: 'In Progress',
            remediationNotes: null,
            mrmSignedOff: false,
          },
        ],
      },
    ],
  },
  {
    useCaseTitle: 'Vendor Fraud Score Integration',
    inventoryNumber: 'MDL-2024-002',
    tier: 'T3',
    validatedBeforeProduction: false, // FINDING: Not validated before production
    productionDate: new Date('2023-06-01'),
    // Last validation was 14 months ago - OVERDUE for T3 annual
    lastValidationDate: new Date(Date.now() - 14 * 30 * 24 * 60 * 60 * 1000),
    validations: [
      {
        type: 'Initial',
        date: new Date('2023-06-15'),
        result: 'Satisfactory with Findings',
        validator: 'MRM Team',
        notes: 'Model deployed without initial validation - retroactive review completed.',
        findings: [
          {
            number: 'F-001',
            title: 'Pre-Production Validation Not Completed',
            description: 'Model was deployed to production without completing the required pre-production validation. This is a critical control gap.',
            severity: 'Critical',
            category: 'Controls',
            status: 'Open',
            remediationNotes: null,
            mrmSignedOff: false,
          },
        ],
      },
      {
        type: 'Periodic',
        date: new Date(Date.now() - 14 * 30 * 24 * 60 * 60 * 1000),
        result: 'Satisfactory with Findings',
        validator: 'External Validator',
        notes: 'Annual validation found vendor transparency issues.',
        findings: [
          {
            number: 'F-001',
            title: 'Vendor Model Transparency Issues',
            description: 'Unable to obtain sufficient detail from vendor on model methodology and variable definitions.',
            severity: 'High',
            category: 'Documentation',
            status: 'In Progress',
            remediationNotes: 'Working with vendor to obtain additional documentation.',
            mrmSignedOff: false,
          },
          {
            number: 'F-002',
            title: 'Monitoring Threshold Calibration',
            description: 'Alert thresholds have not been calibrated since initial deployment. May be generating excess false positives.',
            severity: 'Medium',
            category: 'Performance',
            status: 'Remediated',
            remediationNotes: 'Thresholds recalibrated based on 12-month performance analysis. False positive rate reduced by 23%.',
            remediatedBy: 'Fraud Operations Team',
            remediatedAt: new Date(Date.now() - 2 * 30 * 24 * 60 * 60 * 1000),
            mrmSignedOff: true,
            mrmSignOffBy: 'Model Risk Manager',
            mrmSignOffDate: new Date(Date.now() - 1 * 30 * 24 * 60 * 60 * 1000),
            mrmSignOffNotes: 'Verified threshold recalibration methodology and results. Approved.',
          },
        ],
      },
    ],
  },
  {
    useCaseTitle: 'AML Alert Narrative Summarizer',
    inventoryNumber: 'MDL-2024-003',
    tier: 'T2',
    validatedBeforeProduction: true,
    productionDate: new Date('2024-03-01'),
    // Last validation 10 months ago - CURRENT for T2 (24 month cycle)
    lastValidationDate: new Date(Date.now() - 10 * 30 * 24 * 60 * 60 * 1000),
    validations: [
      {
        type: 'Initial',
        date: new Date('2024-03-01'),
        result: 'Satisfactory',
        validator: 'MRM Team',
        notes: 'GenAI model validated with appropriate guardrails and human oversight.',
        findings: [],
      },
    ],
  },
  {
    useCaseTitle: 'Collections Prioritization Model',
    inventoryNumber: 'MDL-2024-004',
    tier: 'T3',
    validatedBeforeProduction: true,
    productionDate: new Date('2022-09-01'),
    // Last validation 6 months ago - UPCOMING (due in ~6 months for T3)
    lastValidationDate: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000),
    validations: [
      {
        type: 'Initial',
        date: new Date('2022-08-15'),
        result: 'Satisfactory',
        validator: 'MRM Team',
        notes: 'Initial validation passed.',
        findings: [],
      },
      {
        type: 'Periodic',
        date: new Date('2023-09-01'),
        result: 'Satisfactory',
        validator: 'MRM Team',
        notes: 'First annual review completed without findings.',
        findings: [],
      },
      {
        type: 'Periodic',
        date: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000),
        result: 'Satisfactory',
        validator: 'External Validator',
        notes: 'Model continues to perform within acceptable thresholds.',
        findings: [],
      },
    ],
  },
  {
    useCaseTitle: 'Policy RAG Assistant',
    inventoryNumber: 'MDL-2024-005',
    tier: 'T1',
    validatedBeforeProduction: true,
    productionDate: new Date('2024-06-01'),
    // Last validation 6 months ago - CURRENT for T1 (36 month cycle)
    lastValidationDate: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000),
    validations: [
      {
        type: 'Initial',
        date: new Date('2024-06-01'),
        result: 'Satisfactory',
        validator: 'MRM Team',
        notes: 'Low-risk internal tool validated. Appropriate for T1 classification.',
        findings: [],
      },
    ],
  },
  {
    useCaseTitle: 'Call Center Agent Assist',
    inventoryNumber: 'MDL-2024-006',
    tier: 'T2',
    validatedBeforeProduction: true,
    productionDate: new Date('2024-01-15'),
    // Last validation 12 months ago - UPCOMING for T2 (due in ~12 months)
    lastValidationDate: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000),
    validations: [
      {
        type: 'Initial',
        date: new Date('2024-01-15'),
        result: 'Satisfactory',
        validator: 'MRM Team',
        notes: 'Vendor GenAI model validated with appropriate guardrails.',
        findings: [],
      },
    ],
  },
  {
    useCaseTitle: 'Marketing Copy Assistant',
    inventoryNumber: 'MDL-2024-007',
    tier: 'T1',
    validatedBeforeProduction: false, // FINDING: Not validated
    productionDate: new Date('2023-03-01'),
    // Never validated - OVERDUE
    lastValidationDate: null,
    validations: [],
  },
];

// POST /api/admin/seed-inventory - Seed inventory demo data
export async function POST() {
  try {
    // Clear existing inventory data
    await prisma.validationFinding.deleteMany();
    await prisma.validation.deleteMany();
    await prisma.inventoryModel.deleteMany();

    // Get existing use cases that are approved
    const useCases = await prisma.useCase.findMany({
      include: {
        decision: true,
      },
    });

    // If no use cases exist or none are approved, first run the regular seed
    if (useCases.length === 0) {
      return NextResponse.json(
        { error: 'No use cases found. Please load the intake demo data first.' },
        { status: 400 }
      );
    }

    // Create inventory models
    const createdModels = [];

    for (const seed of inventorySeeds) {
      // Find matching use case by title
      const useCase = useCases.find(uc => uc.title === seed.useCaseTitle);
      if (!useCase) {
        console.log(`Use case not found: ${seed.useCaseTitle}`);
        continue;
      }

      // Update use case status to Approved if not already
      if (useCase.status !== 'Approved') {
        await prisma.useCase.update({
          where: { id: useCase.id },
          data: {
            status: 'Approved',
            reviewedBy: 'Model Risk Manager',
            reviewedAt: new Date(),
          },
        });
      }

      // Calculate validation frequency and next due date
      const frequencyMonths = getValidationFrequency(seed.tier);
      const lastValidation = seed.lastValidationDate;
      const nextDue = lastValidation
        ? new Date(new Date(lastValidation).setMonth(new Date(lastValidation).getMonth() + frequencyMonths))
        : new Date(new Date(seed.productionDate).setMonth(new Date(seed.productionDate).getMonth() + frequencyMonths));

      // Create inventory model
      const inventoryModel = await prisma.inventoryModel.create({
        data: {
          useCaseId: useCase.id,
          inventoryNumber: seed.inventoryNumber,
          addedBy: 'Model Risk Manager',
          tier: seed.tier,
          validationFrequencyMonths: frequencyMonths,
          productionDate: seed.productionDate,
          validatedBeforeProduction: seed.validatedBeforeProduction,
          lastValidationDate: seed.lastValidationDate,
          nextValidationDue: nextDue,
          status: 'Active',
        },
      });

      // Create validations and findings
      for (const val of seed.validations) {
        const validation = await prisma.validation.create({
          data: {
            inventoryModelId: inventoryModel.id,
            validationType: val.type,
            validationDate: val.date,
            validatedBy: val.validator,
            status: 'Completed',
            overallResult: val.result,
            summaryNotes: val.notes,
          },
        });

        // Create findings for this validation
        for (const finding of val.findings) {
          await prisma.validationFinding.create({
            data: {
              validationId: validation.id,
              findingNumber: finding.number,
              title: finding.title,
              description: finding.description,
              severity: finding.severity,
              category: finding.category,
              remediationStatus: finding.status,
              remediationNotes: finding.remediationNotes,
              remediatedBy: (finding as { remediatedBy?: string }).remediatedBy || null,
              remediatedAt: (finding as { remediatedAt?: Date }).remediatedAt || null,
              mrmSignedOff: finding.mrmSignedOff,
              mrmSignOffBy: (finding as { mrmSignOffBy?: string }).mrmSignOffBy || null,
              mrmSignOffDate: (finding as { mrmSignOffDate?: Date }).mrmSignOffDate || null,
              mrmSignOffNotes: (finding as { mrmSignOffNotes?: string }).mrmSignOffNotes || null,
            },
          });
        }
      }

      createdModels.push(inventoryModel);
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdModels.length} inventory models with validations and findings`,
      count: createdModels.length,
    });
  } catch (error) {
    console.error('Error seeding inventory data:', error);
    return NextResponse.json(
      { error: 'Failed to seed inventory data', details: String(error) },
      { status: 500 }
    );
  }
}

// GET /api/admin/seed-inventory - Redirect to POST for browser usage
export async function GET() {
  return POST();
}
