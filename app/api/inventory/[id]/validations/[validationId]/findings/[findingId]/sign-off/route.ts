import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// POST /api/inventory/[id]/validations/[validationId]/findings/[findingId]/sign-off
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; validationId: string; findingId: string }> }
) {
  try {
    const { findingId } = await params;
    const body = await request.json();

    const {
      signOffNotes,
      signOffBy = 'Model Risk Manager',
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

    if (finding.mrmSignedOff) {
      return NextResponse.json(
        { error: 'Finding has already been signed off' },
        { status: 400 }
      );
    }

    if (finding.remediationStatus !== 'Remediated' && finding.remediationStatus !== 'Accepted') {
      return NextResponse.json(
        { error: 'Finding must be remediated or accepted before sign-off' },
        { status: 400 }
      );
    }

    const updatedFinding = await prisma.validationFinding.update({
      where: { id: findingId },
      data: {
        mrmSignedOff: true,
        mrmSignOffDate: new Date(),
        mrmSignOffBy: signOffBy,
        mrmSignOffNotes: signOffNotes,
      },
    });

    return NextResponse.json({
      success: true,
      finding: updatedFinding,
    });
  } catch (error) {
    console.error('Error signing off finding:', error);
    return NextResponse.json(
      { error: 'Failed to sign off finding', details: String(error) },
      { status: 500 }
    );
  }
}
