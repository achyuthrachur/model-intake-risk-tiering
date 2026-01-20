import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/usecases - List all use cases with stats
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const tier = searchParams.get('tier');
    const search = searchParams.get('search');

    const where: any = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { businessLine: { contains: search } },
      ];
    }

    const useCases = await prisma.useCase.findMany({
      where,
      include: {
        decision: true,
        attachments: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Filter by tier if specified (need to do this after fetching since tier is in decision)
    let filteredUseCases = useCases;
    if (tier && tier !== 'all') {
      filteredUseCases = useCases.filter(
        (uc) => uc.decision && uc.decision.tier === tier
      );
    }

    // Calculate stats
    const stats = {
      total: useCases.length,
      draft: useCases.filter((uc) => uc.status === 'Draft').length,
      submitted: useCases.filter((uc) => uc.status === 'Submitted').length,
      approved: useCases.filter((uc) => uc.status === 'Approved').length,
      highTier: useCases.filter(
        (uc) => uc.decision && uc.decision.tier === 'T3'
      ).length,
    };

    return NextResponse.json({ useCases: filteredUseCases, stats });
  } catch (error) {
    console.error('Error fetching use cases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch use cases' },
      { status: 500 }
    );
  }
}

// POST /api/usecases - Create a new use case
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const useCase = await prisma.useCase.create({
      data: {
        title: body.title,
        businessLine: body.businessLine,
        description: body.description,
        aiType: body.aiType,
        usageType: body.usageType,
        humanInLoop: body.humanInLoop,
        customerImpact: body.customerImpact,
        regulatoryDomains: JSON.stringify(body.regulatoryDomains || []),
        deployment: body.deployment,
        vendorInvolved: body.vendorInvolved || false,
        vendorName: body.vendorName,
        intendedUsers: body.intendedUsers,
        downstreamDecisions: body.downstreamDecisions,
        containsPii: body.containsPii || false,
        containsNpi: body.containsNpi || false,
        sensitiveAttributesUsed: body.sensitiveAttributesUsed || false,
        trainingDataSource: body.trainingDataSource,
        retentionPolicyDefined: body.retentionPolicyDefined || false,
        loggingRequired: body.loggingRequired || false,
        accessControlsDefined: body.accessControlsDefined || false,
        modelDefinitionTrigger: body.modelDefinitionTrigger || false,
        explainabilityRequired: body.explainabilityRequired || false,
        changeFrequency: body.changeFrequency,
        retraining: body.retraining || false,
        overridesAllowed: body.overridesAllowed || false,
        fallbackPlanDefined: body.fallbackPlanDefined || false,
        monitoringCadence: body.monitoringCadence,
        humanReviewProcess: body.humanReviewProcess,
        incidentResponseContact: body.incidentResponseContact,
        status: 'Draft',
        createdBy: body.createdBy || 'demo-user',
      },
    });

    // Create audit event
    await prisma.auditEvent.create({
      data: {
        useCaseId: useCase.id,
        actor: body.createdBy || 'demo-user',
        eventType: 'Created',
        details: JSON.stringify({ title: useCase.title }),
      },
    });

    return NextResponse.json(useCase, { status: 201 });
  } catch (error) {
    console.error('Error creating use case:', error);
    return NextResponse.json(
      { error: 'Failed to create use case' },
      { status: 500 }
    );
  }
}
