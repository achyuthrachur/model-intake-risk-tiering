import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/usecases/[id] - Get a single use case
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
        auditEvents: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!useCase) {
      return NextResponse.json(
        { error: 'Use case not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(useCase);
  } catch (error) {
    console.error('Error fetching use case:', error);
    return NextResponse.json(
      { error: 'Failed to fetch use case' },
      { status: 500 }
    );
  }
}

// PUT /api/usecases/[id] - Update a use case
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Get current state for diff
    const current = await prisma.useCase.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json(
        { error: 'Use case not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    // Only update fields that are provided
    const fields = [
      'title', 'businessLine', 'description', 'aiType', 'usageType',
      'humanInLoop', 'customerImpact', 'deployment', 'vendorInvolved',
      'vendorName', 'intendedUsers', 'downstreamDecisions', 'containsPii',
      'containsNpi', 'sensitiveAttributesUsed', 'trainingDataSource',
      'retentionPolicyDefined', 'loggingRequired', 'accessControlsDefined',
      'modelDefinitionTrigger', 'explainabilityRequired', 'changeFrequency',
      'retraining', 'overridesAllowed', 'fallbackPlanDefined',
      'monitoringCadence', 'humanReviewProcess', 'incidentResponseContact',
    ];

    fields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    // Handle regulatoryDomains array
    if (body.regulatoryDomains !== undefined) {
      updateData.regulatoryDomains = JSON.stringify(body.regulatoryDomains);
    }

    const useCase = await prisma.useCase.update({
      where: { id },
      data: updateData,
      include: {
        decision: true,
        attachments: true,
      },
    });

    // Create audit event
    await prisma.auditEvent.create({
      data: {
        useCaseId: useCase.id,
        actor: body.updatedBy || 'demo-user',
        eventType: 'Updated',
        details: JSON.stringify(Object.keys(updateData)),
      },
    });

    return NextResponse.json(useCase);
  } catch (error) {
    console.error('Error updating use case:', error);
    return NextResponse.json(
      { error: 'Failed to update use case' },
      { status: 500 }
    );
  }
}

// DELETE /api/usecases/[id] - Delete a use case
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.useCase.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting use case:', error);
    return NextResponse.json(
      { error: 'Failed to delete use case' },
      { status: 500 }
    );
  }
}
