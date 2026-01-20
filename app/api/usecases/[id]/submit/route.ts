import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// POST /api/usecases/[id]/submit - Submit a use case for review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const useCase = await prisma.useCase.findUnique({
      where: { id },
    });

    if (!useCase) {
      return NextResponse.json(
        { error: 'Use case not found' },
        { status: 404 }
      );
    }

    if (useCase.status !== 'Draft') {
      return NextResponse.json(
        { error: 'Only draft use cases can be submitted' },
        { status: 400 }
      );
    }

    const updated = await prisma.useCase.update({
      where: { id },
      data: { status: 'Submitted' },
      include: {
        decision: true,
        attachments: true,
      },
    });

    // Create audit event
    await prisma.auditEvent.create({
      data: {
        useCaseId: id,
        actor: 'demo-user',
        eventType: 'Submitted',
        details: JSON.stringify({ previousStatus: 'Draft', newStatus: 'Submitted' }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error submitting use case:', error);
    return NextResponse.json(
      { error: 'Failed to submit use case' },
      { status: 500 }
    );
  }
}
