import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/analytics - Get comprehensive analytics for MRM dashboard
export async function GET(request: NextRequest) {
  try {
    const useCases = await prisma.useCase.findMany({
      include: {
        decision: true,
        auditEvents: {
          orderBy: { timestamp: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Core statistics
    const totalUseCases = useCases.length;
    const withDecision = useCases.filter((uc) => uc.decision);

    // Status distribution
    const statusDistribution = useCases.reduce((acc, uc) => {
      acc[uc.status] = (acc[uc.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Tier distribution
    const tierDistribution = withDecision.reduce((acc, uc) => {
      if (uc.decision) {
        acc[uc.decision.tier] = (acc[uc.decision.tier] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Business line distribution
    const businessLineDistribution = useCases.reduce((acc, uc) => {
      acc[uc.businessLine] = (acc[uc.businessLine] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // AI type distribution
    const aiTypeDistribution = useCases.reduce((acc, uc) => {
      acc[uc.aiType] = (acc[uc.aiType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Risk heatmap: business line x tier
    const riskHeatmap: Record<string, Record<string, number>> = {};
    withDecision.forEach((uc) => {
      if (!riskHeatmap[uc.businessLine]) {
        riskHeatmap[uc.businessLine] = { T1: 0, T2: 0, T3: 0 };
      }
      if (uc.decision) {
        riskHeatmap[uc.businessLine][uc.decision.tier] =
          (riskHeatmap[uc.businessLine][uc.decision.tier] || 0) + 1;
      }
    });

    // SLA / Aging analysis
    const pendingItems = useCases.filter(
      (uc) => uc.status === 'Submitted' || uc.status === 'Under Review'
    );
    const agingAnalysis = pendingItems.map((uc) => {
      const daysInQueue = Math.floor(
        (Date.now() - new Date(uc.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        id: uc.id,
        title: uc.title,
        businessLine: uc.businessLine,
        status: uc.status,
        tier: uc.decision?.tier || 'Not Assessed',
        daysInQueue,
        createdAt: uc.createdAt,
        updatedAt: uc.updatedAt,
        owner: uc.createdBy,
        slaStatus:
          daysInQueue <= 7
            ? 'on-track'
            : daysInQueue <= 14
            ? 'at-risk'
            : 'overdue',
      };
    });

    // Aging buckets
    const agingBuckets = {
      '0-7 days': agingAnalysis.filter((a) => a.daysInQueue <= 7).length,
      '8-14 days': agingAnalysis.filter((a) => a.daysInQueue > 7 && a.daysInQueue <= 14).length,
      '15-30 days': agingAnalysis.filter((a) => a.daysInQueue > 14 && a.daysInQueue <= 30).length,
      '30+ days': agingAnalysis.filter((a) => a.daysInQueue > 30).length,
    };

    // Data sensitivity metrics
    const dataSensitivity = {
      pii: useCases.filter((uc) => uc.containsPii).length,
      npi: useCases.filter((uc) => uc.containsNpi).length,
      sensitiveAttributes: useCases.filter((uc) => uc.sensitiveAttributesUsed).length,
      vendor: useCases.filter((uc) => uc.vendorInvolved).length,
    };

    // Regulatory exposure
    const regulatoryExposure: Record<string, number> = {};
    useCases.forEach((uc) => {
      const domains = safeJsonParse(uc.regulatoryDomains, []);
      domains.forEach((domain: string) => {
        regulatoryExposure[domain] = (regulatoryExposure[domain] || 0) + 1;
      });
    });

    // Missing artifacts summary
    let totalMissingArtifacts = 0;
    let totalRequiredArtifacts = 0;
    withDecision.forEach((uc) => {
      if (uc.decision) {
        const missing = safeJsonParse(uc.decision.missingEvidence, []);
        const required = safeJsonParse(uc.decision.requiredArtifacts, []);
        totalMissingArtifacts += missing.length;
        totalRequiredArtifacts += required.length;
      }
    });

    // Recent activity (last 20 events)
    const allEvents = useCases.flatMap((uc) =>
      uc.auditEvents.map((e) => ({
        ...e,
        useCaseId: uc.id,
        useCaseTitle: uc.title,
      }))
    );
    const recentActivity = allEvents
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);

    // Approval metrics
    const approvedCases = useCases.filter((uc) => uc.status === 'Approved');
    const approvalTimes = approvedCases
      .filter((uc) => uc.reviewedAt)
      .map((uc) => {
        const submitEvent = uc.auditEvents.find((e) => e.eventType === 'Submitted');
        if (submitEvent && uc.reviewedAt) {
          return Math.floor(
            (new Date(uc.reviewedAt).getTime() - new Date(submitEvent.timestamp).getTime()) /
              (1000 * 60 * 60 * 24)
          );
        }
        return null;
      })
      .filter((t): t is number => t !== null);

    const avgApprovalTime =
      approvalTimes.length > 0
        ? Math.round(approvalTimes.reduce((a, b) => a + b, 0) / approvalTimes.length)
        : 0;

    // High-risk items needing attention
    const highRiskPending = useCases.filter(
      (uc) =>
        uc.decision?.tier === 'T3' && uc.status !== 'Approved' && uc.status !== 'Rejected'
    );

    return NextResponse.json({
      summary: {
        total: totalUseCases,
        withDecision: withDecision.length,
        pendingReview: pendingItems.length,
        approved: statusDistribution['Approved'] || 0,
        highRisk: tierDistribution['T3'] || 0,
        avgApprovalTime,
        totalMissingArtifacts,
        totalRequiredArtifacts,
        artifactCompletionRate:
          totalRequiredArtifacts > 0
            ? Math.round(
                ((totalRequiredArtifacts - totalMissingArtifacts) / totalRequiredArtifacts) * 100
              )
            : 100,
      },
      distributions: {
        status: statusDistribution,
        tier: tierDistribution,
        businessLine: businessLineDistribution,
        aiType: aiTypeDistribution,
      },
      riskHeatmap,
      agingAnalysis: {
        items: agingAnalysis.sort((a, b) => b.daysInQueue - a.daysInQueue),
        buckets: agingBuckets,
        avgDaysInQueue:
          agingAnalysis.length > 0
            ? Math.round(
                agingAnalysis.reduce((a, b) => a + b.daysInQueue, 0) / agingAnalysis.length
              )
            : 0,
      },
      dataSensitivity,
      regulatoryExposure,
      recentActivity,
      highRiskPending: highRiskPending.map((uc) => ({
        id: uc.id,
        title: uc.title,
        businessLine: uc.businessLine,
        status: uc.status,
        tier: uc.decision?.tier,
        owner: uc.createdBy,
        updatedAt: uc.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

function safeJsonParse(value: any, defaultValue: any): any {
  if (!value) return defaultValue;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return defaultValue;
  }
}
