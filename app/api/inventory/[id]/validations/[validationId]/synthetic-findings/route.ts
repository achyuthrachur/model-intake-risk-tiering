import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Sample finding templates organized by severity
const findingTemplates = {
  Critical: [
    {
      title: 'Access Control Deficiency',
      description: 'Model production environment access is not restricted to authorized personnel only. Segregation of duties between development and production is not enforced, creating significant operational risk.',
      category: 'Controls',
    },
    {
      title: 'Regulatory Compliance Gap',
      description: 'Model outputs are being used for fair lending decisions without required adverse action documentation. This creates regulatory compliance risk under ECOA and FCRA requirements.',
      category: 'Controls',
    },
    {
      title: 'Severe Model Degradation',
      description: 'Model performance has degraded significantly below minimum thresholds. Current accuracy is 15% below baseline, indicating fundamental issues with model assumptions or data inputs.',
      category: 'Performance',
    },
  ],
  High: [
    {
      title: 'Performance Monitoring Threshold Exceedance',
      description: 'The model PSI (Population Stability Index) exceeded the established threshold of 0.25, indicating potential input data drift that may impact model accuracy. Immediate investigation required.',
      category: 'Performance',
    },
    {
      title: 'Conceptual Soundness Concern',
      description: 'The model methodology assumes linear relationships between key variables. Non-linear testing revealed potential underestimation of risk in certain high-exposure segments.',
      category: 'Performance',
    },
    {
      title: 'Incomplete Model Documentation',
      description: 'Critical model documentation is missing or outdated, including variable definitions, model assumptions, and limitation disclosures. This impairs effective model governance oversight.',
      category: 'Documentation',
    },
    {
      title: 'Vendor Model Opacity',
      description: 'Limited visibility into vendor model internals prevents complete validation of model conceptual soundness. Vendor has not provided sufficient documentation of methodology.',
      category: 'Documentation',
    },
  ],
  Medium: [
    {
      title: 'Model Documentation Gaps',
      description: 'The model documentation does not fully describe the feature engineering process and variable transformations. This limits the ability to independently replicate model results.',
      category: 'Documentation',
    },
    {
      title: 'Missing Backtesting Results',
      description: 'Quarterly backtesting results for the most recent quarter were not available during the validation review. Regular backtesting is required per model governance policy.',
      category: 'Controls',
    },
    {
      title: 'Data Quality Issues Identified',
      description: 'Several input variables showed higher than expected missing value rates (>5%). Data imputation methodology should be documented and validated for appropriateness.',
      category: 'Data Quality',
    },
    {
      title: 'Model Change Management Gap',
      description: 'Recent model parameter updates were not documented in the change log. All model changes must be recorded per the change management policy.',
      category: 'Controls',
    },
    {
      title: 'Insufficient Testing Coverage',
      description: 'Unit test coverage for model code is below the 80% threshold at 62%. Additional test cases are needed for edge cases and error handling scenarios.',
      category: 'Controls',
    },
  ],
  Low: [
    {
      title: 'Model Override Rate Elevated',
      description: 'The manual override rate of 12% exceeds the policy threshold of 10%. Override reasons should be documented and patterns analyzed for potential model improvement opportunities.',
      category: 'Controls',
    },
    {
      title: 'Documentation Formatting Issues',
      description: 'Model documentation contains inconsistent formatting and some outdated references. While content is accurate, readability and maintenance could be improved.',
      category: 'Documentation',
    },
    {
      title: 'Minor Performance Variance',
      description: 'Model performance shows minor variance from baseline in low-volume segments. Continue monitoring and investigate if variance persists in future periods.',
      category: 'Performance',
    },
    {
      title: 'Monitoring Dashboard Enhancement',
      description: 'Current monitoring dashboards lack real-time alerting for threshold breaches. Enhancement to add automated alerts would improve operational efficiency.',
      category: 'Controls',
    },
  ],
};

// POST: Generate synthetic findings for existing validation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; validationId: string }> }
) {
  try {
    const { id: inventoryModelId, validationId } = await params;
    const body = await request.json().catch(() => ({}));
    const { count = 'random', clearExisting = false } = body;

    // Get the validation
    const validation = await prisma.validation.findFirst({
      where: {
        id: validationId,
        inventoryModelId,
      },
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

    // Clear existing findings if requested
    if (clearExisting && validation.findings.length > 0) {
      await prisma.validationFinding.deleteMany({
        where: { validationId },
      });
    }

    // Get existing finding count for numbering
    const existingCount = clearExisting ? 0 : validation.findings.length;

    // Determine number of findings to generate
    let numFindings: number;
    if (count === 'none') {
      numFindings = 0;
    } else if (count === 'few') {
      numFindings = Math.floor(Math.random() * 2) + 1;
    } else if (count === 'several') {
      numFindings = Math.floor(Math.random() * 3) + 2;
    } else if (count === 'many') {
      numFindings = Math.floor(Math.random() * 4) + 4;
    } else if (typeof count === 'number') {
      numFindings = Math.min(count, 8);
    } else {
      // Random - 1-4 findings
      numFindings = Math.floor(Math.random() * 4) + 1;
    }

    if (numFindings === 0) {
      return NextResponse.json({
        success: true,
        message: 'No findings generated',
        findings: [],
        overallResult: 'Satisfactory',
      });
    }

    // Collect all templates into a pool
    const allTemplates: Array<{ template: any; severity: string }> = [];
    Object.entries(findingTemplates).forEach(([severity, templates]) => {
      templates.forEach((template) => {
        allTemplates.push({ template, severity });
      });
    });

    // Shuffle and select
    const shuffled = allTemplates.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, numFindings);

    // Create findings
    const createdFindings = [];
    for (let i = 0; i < selected.length; i++) {
      const { template, severity } = selected[i];
      const findingNumber = `F-${String(existingCount + i + 1).padStart(3, '0')}`;

      const finding = await prisma.validationFinding.create({
        data: {
          validationId,
          findingNumber,
          title: template.title,
          description: template.description,
          severity,
          category: template.category,
          remediationStatus: 'Open',
          remediationDueDate: new Date(Date.now() + (severity === 'Critical' ? 14 : severity === 'High' ? 30 : 60) * 24 * 60 * 60 * 1000),
        },
      });
      createdFindings.push(finding);
    }

    // Determine overall result based on findings
    const hasCritical = createdFindings.some((f) => f.severity === 'Critical');
    const hasHighOrCritical = createdFindings.some((f) => f.severity === 'Critical' || f.severity === 'High');

    let overallResult = 'Satisfactory with Findings';
    if (hasCritical) {
      overallResult = 'Unsatisfactory';
    }

    // Update validation overall result
    await prisma.validation.update({
      where: { id: validationId },
      data: {
        overallResult,
        summaryNotes: `Validation completed with ${existingCount + createdFindings.length} finding(s). ${hasCritical ? 'Critical findings require immediate attention.' : hasHighOrCritical ? 'High-priority findings require remediation.' : 'Findings should be addressed per standard timeline.'}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Generated ${createdFindings.length} finding(s)`,
      findings: createdFindings,
      overallResult,
    });
  } catch (error) {
    console.error('Error generating synthetic findings:', error);
    return NextResponse.json(
      { error: 'Failed to generate synthetic findings', details: String(error) },
      { status: 500 }
    );
  }
}
