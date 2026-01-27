import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/inventory/[id]/validations/[validationId]/findings - List findings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; validationId: string }> }
) {
  try {
    const { validationId } = await params;

    const findings = await prisma.validationFinding.findMany({
      where: { validationId },
      orderBy: {
        findingNumber: 'asc',
      },
    });

    return NextResponse.json({
      findings,
      count: findings.length,
    });
  } catch (error) {
    console.error('Error fetching findings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch findings', details: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/inventory/[id]/validations/[validationId]/findings - Create finding
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; validationId: string }> }
) {
  try {
    const { validationId } = await params;
    const body = await request.json();

    const {
      title,
      description,
      severity,
      category,
      remediationDueDate,
    } = body;

    // Verify validation exists
    const validation = await prisma.validation.findUnique({
      where: { id: validationId },
      include: {
        findings: true,
      },
    });

    if (!validation) {
      return NextResponse.json(
        { error: 'Validation not found' },
        { status: 404 }
      );
    }

    // Generate finding number
    const existingCount = validation.findings.length;
    const findingNumber = `F-${String(existingCount + 1).padStart(3, '0')}`;

    const finding = await prisma.validationFinding.create({
      data: {
        validationId,
        findingNumber,
        title,
        description,
        severity: severity || 'Medium',
        category: category || null,
        remediationStatus: 'Open',
        remediationDueDate: remediationDueDate ? new Date(remediationDueDate) : null,
      },
    });

    // Update validation result if it was Satisfactory
    if (validation.overallResult === 'Satisfactory') {
      await prisma.validation.update({
        where: { id: validationId },
        data: {
          overallResult: 'Satisfactory with Findings',
        },
      });
    }

    return NextResponse.json({
      success: true,
      finding,
    });
  } catch (error) {
    console.error('Error creating finding:', error);
    return NextResponse.json(
      { error: 'Failed to create finding', details: String(error) },
      { status: 500 }
    );
  }
}
