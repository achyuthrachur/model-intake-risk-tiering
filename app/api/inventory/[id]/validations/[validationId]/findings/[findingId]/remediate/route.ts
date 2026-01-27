import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// POST /api/inventory/[id]/validations/[validationId]/findings/[findingId]/remediate
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; validationId: string; findingId: string }> }
) {
  try {
    const { findingId } = await params;
    const body = await request.json();

    const {
      remediationNotes,
      remediatedBy = 'Model Owner',
    } = body;

    const finding = await prisma.validationFinding.findUnique({
      where: { id: findingId },
    });

    if (!finding) {
      return NextResponse.json(
        { error: 'Finding not found' },
        { status: 404 }
      );
    }

    if (finding.remediationStatus === 'Remediated') {
      return NextResponse.json(
        { error: 'Finding is already remediated' },
        { status: 400 }
      );
    }

    const updatedFinding = await prisma.validationFinding.update({
      where: { id: findingId },
      data: {
        remediationStatus: 'Remediated',
        remediationNotes,
        remediatedAt: new Date(),
        remediatedBy,
      },
    });

    return NextResponse.json({
      success: true,
      finding: updatedFinding,
    });
  } catch (error) {
    console.error('Error remediating finding:', error);
    return NextResponse.json(
      { error: 'Failed to remediate finding', details: String(error) },
      { status: 500 }
    );
  }
}
