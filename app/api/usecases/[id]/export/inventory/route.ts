import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateInventoryCsv } from '@/lib/docgen';
import type { UseCaseWithRelations, DecisionResult } from '@/lib/types';

// GET /api/usecases/[id]/export/inventory - Export inventory row as CSV
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const useCase = await prisma.useCase.findUnique({
      where: { id },
      include: {
        decision: true,
        attachments: true,
      },
    });

    if (!useCase) {
      return NextResponse.json(
        { error: 'Use case not found' },
        { status: 404 }
      );
    }

    if (!useCase.decision) {
      return NextResponse.json(
        { error: 'Decision not generated yet. Please generate a decision first.' },
        { status: 400 }
      );
    }

    // Parse decision data
    const decisionResult: DecisionResult = {
      isModel: useCase.decision.isModel as any,
      tier: useCase.decision.tier as any,
      triggeredRules: JSON.parse(useCase.decision.triggeredRules),
      rationaleSummary: useCase.decision.rationaleSummary,
      requiredArtifacts: JSON.parse(useCase.decision.requiredArtifacts),
      missingEvidence: JSON.parse(useCase.decision.missingEvidence),
      riskFlags: JSON.parse(useCase.decision.riskFlags),
    };

    // Generate CSV
    const csv = generateInventoryCsv(
      useCase as unknown as UseCaseWithRelations,
      decisionResult
    );

    // Create audit event
    await prisma.auditEvent.create({
      data: {
        useCaseId: id,
        actor: 'demo-user',
        eventType: 'Exported',
        details: JSON.stringify({ type: 'inventory', format: 'csv' }),
      },
    });

    // Return CSV
    const filename = `${useCase.title.replace(/[^a-z0-9]/gi, '_')}_inventory.csv`;

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
