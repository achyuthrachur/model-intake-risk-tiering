import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import type { UseCaseWithRelations } from '@/lib/types';

// Force dynamic rendering since this route uses searchParams
export const dynamic = 'force-dynamic';

// GET /api/export/inventory - Export all use cases as CSV for full model inventory
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const tier = searchParams.get('tier');
    const format = searchParams.get('format') || 'csv';

    const where: any = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    const useCases = await prisma.useCase.findMany({
      where,
      include: {
        decision: true,
        auditEvents: {
          orderBy: { timestamp: 'asc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter by tier if specified
    let filteredUseCases = useCases;
    if (tier && tier !== 'all') {
      filteredUseCases = useCases.filter(
        (uc) => uc.decision && uc.decision.tier === tier
      );
    }

    // Generate CSV
    const headers = [
      'ID',
      'Title',
      'Business Line',
      'Description',
      'Model Type',
      'Usage Type',
      'Customer Impact',
      'Human-in-Loop',
      'Deployment',
      'Vendor Involved',
      'Vendor Name',
      'Contains PII',
      'Contains NPI',
      'Sensitive Attributes',
      'Regulatory Domains',
      'Risk Tier',
      'Model Determination',
      'Risk Flags',
      'Triggered Rules',
      'Required Artifacts Count',
      'Missing Artifacts Count',
      'Status',
      'Owner',
      'Created Date',
      'Last Updated',
      'Days Since Created',
      'Days Since Updated',
      'Reviewed By',
      'Reviewed Date',
    ];

    const rows = filteredUseCases.map((uc) => {
      const decision = uc.decision;
      const regulatoryDomains = safeJsonParse(uc.regulatoryDomains, []);
      const triggeredRules = decision ? safeJsonParse(decision.triggeredRules, []) : [];
      const requiredArtifacts = decision ? safeJsonParse(decision.requiredArtifacts, []) : [];
      const missingEvidence = decision ? safeJsonParse(decision.missingEvidence, []) : [];
      const riskFlags = decision ? safeJsonParse(decision.riskFlags, []) : [];

      const daysSinceCreated = Math.floor(
        (Date.now() - new Date(uc.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysSinceUpdated = Math.floor(
        (Date.now() - new Date(uc.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      return [
        uc.id,
        uc.title,
        uc.businessLine,
        uc.description,
        uc.aiType,
        uc.usageType,
        uc.customerImpact,
        uc.humanInLoop,
        uc.deployment,
        uc.vendorInvolved ? 'Yes' : 'No',
        uc.vendorName || '',
        uc.containsPii ? 'Yes' : 'No',
        uc.containsNpi ? 'Yes' : 'No',
        uc.sensitiveAttributesUsed ? 'Yes' : 'No',
        regulatoryDomains.join('; '),
        decision?.tier || 'Not Assessed',
        decision?.isModel || 'Not Assessed',
        riskFlags.join('; '),
        triggeredRules.map((r: any) => r.name || r).join('; '),
        requiredArtifacts.length,
        missingEvidence.length,
        uc.status,
        uc.createdBy,
        formatDate(uc.createdAt),
        formatDate(uc.updatedAt),
        daysSinceCreated,
        daysSinceUpdated,
        uc.reviewedBy || '',
        uc.reviewedAt ? formatDate(uc.reviewedAt) : '',
      ];
    });

    // Escape CSV values
    const escapeCsv = (val: any) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map(escapeCsv).join(',')),
    ].join('\n');

    // Create audit event for export
    await prisma.auditEvent.create({
      data: {
        useCaseId: filteredUseCases[0]?.id || 'system',
        actor: 'mrm-user',
        eventType: 'Exported',
        details: JSON.stringify({
          type: 'batch-inventory',
          format: 'csv',
          count: filteredUseCases.length,
          filters: { status, tier },
        }),
      },
    });

    const filename = `model_inventory_${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting inventory:', error);
    return NextResponse.json(
      { error: 'Failed to export inventory' },
      { status: 500 }
    );
  }
}

function safeJsonParse(value: any, defaultValue: any): any {
  if (!value) return defaultValue;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return defaultValue;
  }
}

function formatDate(date: Date | string): string {
  return new Date(date).toISOString().split('T')[0];
}
