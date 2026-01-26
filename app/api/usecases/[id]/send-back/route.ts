import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { notes } = body;

    // Fetch the use case
    const useCase = await prisma.useCase.findUnique({
      where: { id },
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

    // Update the use case status to Sent Back
    const updatedUseCase = await prisma.useCase.update({
      where: { id },
      data: {
        status: 'Sent Back',
        reviewerNotes: notes || 'Please review and update your submission.',
        reviewedBy: 'Model Risk Manager', // In a real app, this would be the authenticated user
        reviewedAt: new Date(),
      },
    });

    // Create audit event
    await prisma.auditEvent.create({
      data: {
        useCaseId: id,
        actor: 'Model Risk Manager',
        eventType: 'SentBack',
        details: notes ? `Sent back with notes: ${notes.substring(0, 100)}${notes.length > 100 ? '...' : ''}` : 'Sent back for revision',
      },
    });

    return NextResponse.json(updatedUseCase);
  } catch (error) {
    console.error('Send back error:', error);
    return NextResponse.json(
      { error: 'Failed to send back use case' },
      { status: 500 }
    );
  }
}
