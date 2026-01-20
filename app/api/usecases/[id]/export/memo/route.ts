import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateMemoDocx } from '@/lib/docgen';
import type { UseCaseWithRelations, DecisionResult } from '@/lib/types';

// GET /api/usecases/[id]/export/memo - Export memo as DOCX
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

    // Generate DOCX
    const buffer = await generateMemoDocx(
      useCase as unknown as UseCaseWithRelations,
      decisionResult
    );

    // Create audit event
    await prisma.auditEvent.create({
      data: {
        useCaseId: id,
        actor: 'demo-user',
        eventType: 'Exported',
        details: JSON.stringify({ type: 'memo', format: 'docx' }),
      },
    });

    // Return file
    const filename = `${useCase.title.replace(/[^a-z0-9]/gi, '_')}_memo.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting memo:', error);
    return NextResponse.json(
      { error: 'Failed to export memo' },
      { status: 500 }
    );
  }
}
