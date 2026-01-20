import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/audit/[usecaseId] - Get audit trail for a use case
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ usecaseId: string }> }
) {
  try {
    const { usecaseId } = await params;

    const auditEvents = await prisma.auditEvent.findMany({
      where: { useCaseId: usecaseId },
      orderBy: { timestamp: 'desc' },
    });

    return NextResponse.json(auditEvents);
  } catch (error) {
    console.error('Error fetching audit trail:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit trail' },
      { status: 500 }
    );
  }
}
