import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateChecklistHtml } from '@/lib/docgen';
import type { UseCaseWithRelations, DecisionResult } from '@/lib/types';

// GET /api/usecases/[id]/export/checklist - Export checklist as HTML
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

    // Generate HTML
    const html = generateChecklistHtml(
      useCase as unknown as UseCaseWithRelations,
      decisionResult
    );

    // Create audit event
    await prisma.auditEvent.create({
      data: {
        useCaseId: id,
        actor: 'demo-user',
        eventType: 'Exported',
        details: JSON.stringify({ type: 'checklist', format: 'html' }),
      },
    });

    // Return HTML
    const filename = `${useCase.title.replace(/[^a-z0-9]/gi, '_')}_checklist.html`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting checklist:', error);
    return NextResponse.json(
      { error: 'Failed to export checklist' },
      { status: 500 }
    );
  }
}
