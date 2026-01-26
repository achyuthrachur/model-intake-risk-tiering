import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Fetch the use case
    const useCase = await prisma.useCase.findUnique({
      where: { id },
      include: { decision: true },
    });

    if (!useCase) {
      return NextResponse.json({ error: 'Use case not found' }, { status: 404 });
    }

    // Check if it's in a reviewable state
    if (useCase.status !== 'Submitted' && useCase.status !== 'Under Review') {
      return NextResponse.json(
        { error: 'Use case is not in a reviewable state' },
        { status: 400 }
      );
    }

    // Check if decision exists
    if (!useCase.decision) {
      return NextResponse.json(
        { error: 'Cannot approve without a generated decision' },
        { status: 400 }
      );
    }

    // Update the use case status to Approved
    const updatedUseCase = await prisma.useCase.update({
      where: { id },
      data: {
        status: 'Approved',
        reviewedBy: 'Model Risk Manager', // In a real app, this would be the authenticated user
        reviewedAt: new Date(),
      },
    });

    // Create audit event
    await prisma.auditEvent.create({
      data: {
        useCaseId: id,
        actor: 'Model Risk Manager',
        eventType: 'Approved',
        details: `Use case approved with tier ${useCase.decision.tier}`,
      },
    });

    return NextResponse.json(updatedUseCase);
  } catch (error) {
    console.error('Approve error:', error);
    return NextResponse.json(
      { error: 'Failed to approve use case' },
      { status: 500 }
    );
  }
}
