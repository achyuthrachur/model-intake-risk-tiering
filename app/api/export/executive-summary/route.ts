import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
} from 'docx';
import { isAIEnabled, getFastModel } from '@/lib/ai';
import { generateText } from 'ai';

// GET /api/export/executive-summary - Generate executive summary report
export async function GET(request: NextRequest) {
  try {
    // Fetch all use cases with decisions
    const useCases = await prisma.useCase.findMany({
      include: {
        decision: true,
        auditEvents: {
          orderBy: { timestamp: 'desc' },
          take: 5,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Calculate comprehensive statistics
    const stats = calculateStats(useCases);

    // Generate AI insights if available
    let aiSummary = null;
    if (isAIEnabled()) {
      aiSummary = await generateAISummary(stats, useCases);
    }

    // Generate DOCX report
    const buffer = await generateExecutiveSummaryDocx(stats, useCases, aiSummary);

    // Create audit event
    await prisma.auditEvent.create({
      data: {
        useCaseId: useCases[0]?.id || 'system',
        actor: 'mrm-user',
        eventType: 'Exported',
        details: JSON.stringify({ type: 'executive-summary', format: 'docx' }),
      },
    });

    const filename = `MRM_Executive_Summary_${new Date().toISOString().split('T')[0]}.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating executive summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate executive summary' },
      { status: 500 }
    );
  }
}

interface Stats {
  total: number;
  byStatus: Record<string, number>;
  byTier: Record<string, number>;
  byBusinessLine: Record<string, number>;
  byAiType: Record<string, number>;
  highRiskCount: number;
  pendingReview: number;
  avgDaysInQueue: number;
  missingArtifactsTotal: number;
  piiCount: number;
  npiCount: number;
  vendorModelCount: number;
  regulatoryExposure: Record<string, number>;
  recentActivity: any[];
}

function calculateStats(useCases: any[]): Stats {
  const byStatus: Record<string, number> = {};
  const byTier: Record<string, number> = {};
  const byBusinessLine: Record<string, number> = {};
  const byAiType: Record<string, number> = {};
  const regulatoryExposure: Record<string, number> = {};
  let missingArtifactsTotal = 0;
  let piiCount = 0;
  let npiCount = 0;
  let vendorModelCount = 0;
  let totalDaysInQueue = 0;
  let queuedCount = 0;

  useCases.forEach((uc) => {
    // Status distribution
    byStatus[uc.status] = (byStatus[uc.status] || 0) + 1;

    // Tier distribution
    if (uc.decision) {
      byTier[uc.decision.tier] = (byTier[uc.decision.tier] || 0) + 1;

      // Missing artifacts
      const missing = safeJsonParse(uc.decision.missingEvidence, []);
      missingArtifactsTotal += missing.length;
    }

    // Business line distribution
    byBusinessLine[uc.businessLine] = (byBusinessLine[uc.businessLine] || 0) + 1;

    // AI type distribution
    byAiType[uc.aiType] = (byAiType[uc.aiType] || 0) + 1;

    // Data sensitivity
    if (uc.containsPii) piiCount++;
    if (uc.containsNpi) npiCount++;
    if (uc.vendorInvolved) vendorModelCount++;

    // Regulatory exposure
    const domains = safeJsonParse(uc.regulatoryDomains, []);
    domains.forEach((domain: string) => {
      regulatoryExposure[domain] = (regulatoryExposure[domain] || 0) + 1;
    });

    // Days in queue for pending items
    if (uc.status === 'Submitted' || uc.status === 'Under Review') {
      const daysInQueue = Math.floor(
        (Date.now() - new Date(uc.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      totalDaysInQueue += daysInQueue;
      queuedCount++;
    }
  });

  // Recent activity (last 10 events across all use cases)
  const recentActivity = useCases
    .flatMap((uc) => uc.auditEvents.map((e: any) => ({ ...e, useCaseTitle: uc.title })))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  return {
    total: useCases.length,
    byStatus,
    byTier,
    byBusinessLine,
    byAiType,
    highRiskCount: byTier['T3'] || 0,
    pendingReview: (byStatus['Submitted'] || 0) + (byStatus['Under Review'] || 0),
    avgDaysInQueue: queuedCount > 0 ? Math.round(totalDaysInQueue / queuedCount) : 0,
    missingArtifactsTotal,
    piiCount,
    npiCount,
    vendorModelCount,
    regulatoryExposure,
    recentActivity,
  };
}

async function generateAISummary(stats: Stats, useCases: any[]): Promise<string | null> {
  try {
    if (!isAIEnabled()) return null;

    const prompt = `You are a Model Risk Management executive summarizing the model inventory for senior leadership.

Based on the following statistics, write a concise 2-3 paragraph executive summary highlighting:
1. Current state of the model inventory
2. Key risk areas requiring attention
3. Recommendations for the MRM team

Statistics:
- Total models in inventory: ${stats.total}
- Pending review: ${stats.pendingReview}
- Average days in queue: ${stats.avgDaysInQueue}
- High-risk (T3) models: ${stats.highRiskCount}
- Models with PII: ${stats.piiCount}
- Models with NPI: ${stats.npiCount}
- Vendor/3rd-party models: ${stats.vendorModelCount}
- Total missing artifacts: ${stats.missingArtifactsTotal}

Status breakdown: ${JSON.stringify(stats.byStatus)}
Tier breakdown: ${JSON.stringify(stats.byTier)}
Business line breakdown: ${JSON.stringify(stats.byBusinessLine)}
Regulatory exposure: ${JSON.stringify(stats.regulatoryExposure)}

Write in a professional tone suitable for a board or executive committee presentation. Focus on actionable insights.`;

    const { text } = await generateText({
      model: getFastModel(),
      prompt,
      maxTokens: 500,
    });

    return text || null;
  } catch (error) {
    console.error('Error generating AI summary:', error);
    return null;
  }
}

async function generateExecutiveSummaryDocx(
  stats: Stats,
  useCases: any[],
  aiSummary: string | null
): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Title
          new Paragraph({
            children: [
              new TextRun({
                text: 'Model Risk Management',
                bold: true,
                size: 36,
              }),
            ],
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Executive Summary Report',
                size: 28,
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Report Date: ${new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}`,
                size: 22,
                color: '666666',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Executive Summary (AI-generated or default)
          createHeading('Executive Summary'),
          new Paragraph({
            children: [
              new TextRun({
                text:
                  aiSummary ||
                  `This report provides an overview of the organization's model inventory as of ${new Date().toLocaleDateString()}. The inventory contains ${stats.total} use cases across ${Object.keys(stats.byBusinessLine).length} business lines. Currently, ${stats.pendingReview} items are pending MRM review, with ${stats.highRiskCount} classified as high-risk (Tier 3). Key focus areas include addressing ${stats.missingArtifactsTotal} missing artifacts and ensuring timely review of pending submissions.`,
              }),
            ],
            spacing: { after: 300 },
          }),

          // Key Metrics
          createHeading('Key Metrics'),
          createMetricsTable([
            ['Total Use Cases', String(stats.total)],
            ['Pending Review', String(stats.pendingReview)],
            ['Avg Days in Queue', String(stats.avgDaysInQueue)],
            ['High Risk (T3)', String(stats.highRiskCount)],
            ['Approved', String(stats.byStatus['Approved'] || 0)],
            ['Missing Artifacts', String(stats.missingArtifactsTotal)],
          ]),

          new Paragraph({ spacing: { before: 300 } }),

          // Risk Tier Distribution
          createHeading('Risk Tier Distribution'),
          createDistributionTable('Tier', stats.byTier),

          new Paragraph({ spacing: { before: 300 } }),

          // Status Distribution
          createHeading('Status Distribution'),
          createDistributionTable('Status', stats.byStatus),

          new Paragraph({ spacing: { before: 300 } }),

          // Business Line Coverage
          createHeading('Business Line Coverage'),
          createDistributionTable('Business Line', stats.byBusinessLine),

          new Paragraph({ spacing: { before: 300 } }),

          // Data Sensitivity Overview
          createHeading('Data Sensitivity Overview'),
          new Paragraph({
            children: [
              new TextRun({ text: `• Models processing PII: `, bold: true }),
              new TextRun({ text: `${stats.piiCount} (${percent(stats.piiCount, stats.total)}%)` }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `• Models processing NPI: `, bold: true }),
              new TextRun({ text: `${stats.npiCount} (${percent(stats.npiCount, stats.total)}%)` }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `• Vendor/Third-party models: `, bold: true }),
              new TextRun({ text: `${stats.vendorModelCount} (${percent(stats.vendorModelCount, stats.total)}%)` }),
            ],
            spacing: { after: 200 },
          }),

          // Regulatory Exposure
          ...(Object.keys(stats.regulatoryExposure).length > 0
            ? [
                createHeading('Regulatory Exposure'),
                createDistributionTable('Domain', stats.regulatoryExposure),
                new Paragraph({ spacing: { before: 300 } }),
              ]
            : []),

          // High-Risk Items Requiring Attention
          createHeading('High-Risk Items Requiring Attention'),
          ...useCases
            .filter((uc) => uc.decision?.tier === 'T3' && uc.status !== 'Approved')
            .slice(0, 10)
            .map(
              (uc) =>
                new Paragraph({
                  children: [
                    new TextRun({ text: `• ${uc.title}`, bold: true }),
                    new TextRun({ text: ` (${uc.businessLine}) - ${uc.status}` }),
                  ],
                  spacing: { after: 50 },
                })
            ),
          ...(useCases.filter((uc) => uc.decision?.tier === 'T3' && uc.status !== 'Approved').length === 0
            ? [
                new Paragraph({
                  children: [new TextRun({ text: 'No high-risk items currently pending.', italics: true })],
                }),
              ]
            : []),

          new Paragraph({ spacing: { before: 300 } }),

          // Model Type Distribution
          createHeading('Model Technology Distribution'),
          createDistributionTable('Model Type', stats.byAiType),

          // Footer
          new Paragraph({ spacing: { before: 600 } }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Generated by Model Intake & Risk Tiering System',
                size: 18,
                color: '666666',
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'CONFIDENTIAL - For Internal Use Only',
                size: 18,
                color: '666666',
                bold: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}

function createHeading(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        size: 26,
      }),
    ],
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
  });
}

function createMetricsTable(metrics: string[][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: metrics.map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: cellBorders(),
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: value })] })],
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: cellBorders(),
            }),
          ],
        })
    ),
  });
}

function createDistributionTable(label: string, data: Record<string, number>): Table {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
            borders: cellBorders(),
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'Count', bold: true })] })],
            borders: cellBorders(),
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: '%', bold: true })] })],
            borders: cellBorders(),
          }),
        ],
      }),
      ...entries.map(
        ([key, count]) =>
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: key })] })],
                borders: cellBorders(),
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: String(count) })] })],
                borders: cellBorders(),
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: `${percent(count, total)}%` })] })],
                borders: cellBorders(),
              }),
            ],
          })
      ),
    ],
  });
}

function cellBorders() {
  return {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
  };
}

function percent(value: number, total: number): string {
  if (total === 0) return '0';
  return ((value / total) * 100).toFixed(1);
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
