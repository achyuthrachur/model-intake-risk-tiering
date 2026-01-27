import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { calculateValidationStatus } from '@/lib/utils';

// GET /api/inventory/stats - Get inventory statistics
export async function GET() {
  try {
    const inventoryModels = await prisma.inventoryModel.findMany({
      include: {
        useCase: true,
        validations: {
          include: {
            findings: true,
          },
        },
      },
    });

    // Calculate statistics
    const stats = {
      totalModels: inventoryModels.length,
      byTier: {
        T1: 0,
        T2: 0,
        T3: 0,
      },
      byStatus: {
        Active: 0,
        Retired: 0,
        Suspended: 0,
      },
      validationStatus: {
        overdue: 0,
        upcoming: 0,
        current: 0,
      },
      openFindings: 0,
      aiEnabled: 0,
      vendorModels: 0,
    };

    inventoryModels.forEach(model => {
      // Count by tier
      if (model.tier === 'T1') stats.byTier.T1++;
      else if (model.tier === 'T2') stats.byTier.T2++;
      else if (model.tier === 'T3') stats.byTier.T3++;

      // Count by status
      if (model.status === 'Active') stats.byStatus.Active++;
      else if (model.status === 'Retired') stats.byStatus.Retired++;
      else if (model.status === 'Suspended') stats.byStatus.Suspended++;

      // Count by validation status
      const valStatus = calculateValidationStatus(model.nextValidationDue);
      if (valStatus === 'overdue') stats.validationStatus.overdue++;
      else if (valStatus === 'upcoming') stats.validationStatus.upcoming++;
      else stats.validationStatus.current++;

      // Count open findings
      model.validations.forEach(validation => {
        validation.findings.forEach(finding => {
          if (finding.remediationStatus === 'Open' || finding.remediationStatus === 'In Progress') {
            stats.openFindings++;
          }
        });
      });

      // Count AI-enabled models
      if (model.useCase.aiType === 'GenAI' || model.useCase.aiType === 'Hybrid') {
        stats.aiEnabled++;
      }

      // Count vendor models
      if (model.useCase.vendorInvolved) {
        stats.vendorModels++;
      }
    });

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory stats', details: String(error) },
      { status: 500 }
    );
  }
}
