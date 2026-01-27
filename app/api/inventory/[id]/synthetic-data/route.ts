import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { put } from '@vercel/blob';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// Generate a synthetic validation report PDF
async function generateSyntheticReport(
  validation: any,
  model: any,
  findings: any[]
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();
  let y = height - 50;

  const addText = (text: string, options: { bold?: boolean; size?: number; color?: any } = {}) => {
    const { bold = false, size = 11, color = rgb(0.2, 0.2, 0.2) } = options;
    if (y < 80) {
      page = pdfDoc.addPage([612, 792]);
      y = height - 50;
    }
    page.drawText(text, {
      x: 50,
      y,
      size,
      font: bold ? boldFont : font,
      color,
    });
    y -= size + 6;
  };

  const addSection = (title: string) => {
    y -= 10;
    addText(title, { bold: true, size: 14, color: rgb(0, 0, 0.5) });
    y -= 5;
  };

  // Title
  addText('MODEL VALIDATION REPORT', { bold: true, size: 18, color: rgb(0, 0, 0.5) });
  y -= 10;

  // Model info
  addText(`Model: ${model.useCase.title}`, { size: 12 });
  addText(`Inventory Number: ${model.inventoryNumber}`, { size: 12 });
  addText(`Validation Type: ${validation.validationType}`, { size: 12 });
  addText(`Validation Date: ${new Date(validation.validationDate).toLocaleDateString()}`, { size: 12 });
  addText(`Validated By: ${validation.validatedBy}`, { size: 12 });
  addText(`Overall Result: ${validation.overallResult}`, { size: 12 });
  y -= 20;

  // Draw line
  page.drawLine({
    start: { x: 50, y },
    end: { x: width - 50, y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  y -= 20;

  // Executive Summary
  addSection('1. EXECUTIVE SUMMARY');
  const summaries = [
    `This ${validation.validationType.toLowerCase()} validation was conducted to assess the ongoing performance and risk`,
    `profile of ${model.useCase.title}. The validation covered model conceptual soundness,`,
    `implementation verification, ongoing monitoring, and outcomes analysis.`,
    '',
    `Overall Assessment: The model is rated "${validation.overallResult}".`,
    findings.length > 0
      ? `A total of ${findings.length} finding(s) were identified during this validation.`
      : 'No significant findings were identified during this validation.',
  ];
  summaries.forEach((line) => addText(line));
  y -= 10;

  // Scope and Methodology
  addSection('2. SCOPE AND METHODOLOGY');
  const methodology = [
    'The validation scope included the following assessments:',
    '  - Conceptual soundness review',
    '  - Data quality and integrity assessment',
    '  - Implementation verification',
    '  - Performance and outcomes analysis',
    '  - Model governance and documentation review',
    '',
    'Testing was conducted using a combination of:',
    '  - Historical backtesting with out-of-sample data',
    '  - Sensitivity and stress testing',
    '  - Benchmark comparison against industry standards',
  ];
  methodology.forEach((line) => addText(line));
  y -= 10;

  // Findings
  if (findings.length > 0) {
    addSection('3. VALIDATION FINDINGS');

    findings.forEach((finding, index) => {
      if (y < 150) {
        page = pdfDoc.addPage([612, 792]);
        y = height - 50;
      }

      addText(`Finding ${finding.findingNumber}: ${finding.title}`, {
        bold: true,
        size: 12,
        color: finding.severity === 'Critical' ? rgb(0.8, 0, 0) :
          finding.severity === 'High' ? rgb(0.8, 0.4, 0) :
            finding.severity === 'Medium' ? rgb(0.7, 0.5, 0) : rgb(0, 0.5, 0),
      });
      addText(`Severity: ${finding.severity} | Category: ${finding.category || 'General'}`);
      addText(`Status: ${finding.remediationStatus}`);

      // Word wrap description
      const words = finding.description.split(' ');
      let line = '';
      words.forEach((word: string) => {
        const testLine = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(testLine, 11) > width - 100) {
          addText(line);
          line = word;
        } else {
          line = testLine;
        }
      });
      if (line) addText(line);
      y -= 15;
    });
  } else {
    addSection('3. VALIDATION FINDINGS');
    addText('No findings were identified during this validation.');
  }
  y -= 10;

  // Recommendations
  addSection('4. RECOMMENDATIONS');
  const recommendations = [
    findings.length > 0
      ? '- Address all identified findings per the remediation timeline'
      : '- Continue current model monitoring practices',
    '- Maintain documentation currency with any model changes',
    '- Conduct next periodic validation per the established schedule',
    '- Review and update model risk rating if business conditions change',
  ];
  recommendations.forEach((line) => addText(line));
  y -= 10;

  // Conclusion
  addSection('5. CONCLUSION');
  addText(`Based on the validation activities performed, the model ${model.useCase.title}`);
  addText(`is rated "${validation.overallResult}" and is approved for continued use`);
  addText(findings.length > 0
    ? 'contingent on remediation of identified findings.'
    : 'with no material concerns noted.');

  // Footer
  page.drawText('SYNTHETIC DOCUMENT - FOR DEMONSTRATION PURPOSES ONLY', {
    x: 50,
    y: 30,
    size: 8,
    font,
    color: rgb(0.6, 0.6, 0.6),
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

// Sample finding templates
const findingTemplates = [
  {
    title: 'Model Documentation Gaps',
    description: 'The model documentation does not fully describe the feature engineering process and variable transformations. This limits the ability to independently replicate model results.',
    severity: 'Medium',
    category: 'Documentation',
  },
  {
    title: 'Performance Monitoring Threshold Exceedance',
    description: 'The model PSI (Population Stability Index) exceeded the established threshold of 0.25, indicating potential input data drift that may impact model accuracy.',
    severity: 'High',
    category: 'Performance',
  },
  {
    title: 'Missing Backtesting Results',
    description: 'Quarterly backtesting results for Q3 were not available during the validation review. Regular backtesting is required per model governance policy.',
    severity: 'Medium',
    category: 'Controls',
  },
  {
    title: 'Data Quality Issues Identified',
    description: 'Several input variables showed higher than expected missing value rates (>5%). Data imputation methodology should be documented and validated.',
    severity: 'Medium',
    category: 'Data Quality',
  },
  {
    title: 'Model Override Rate Exceeded',
    description: 'The manual override rate of 15% exceeds the policy threshold of 10%. Override reasons should be documented and patterns analyzed for potential model improvement opportunities.',
    severity: 'Low',
    category: 'Controls',
  },
  {
    title: 'Conceptual Soundness Concern',
    description: 'The model methodology assumes linear relationships between key variables. Non-linear testing revealed potential underestimation of risk in certain segments.',
    severity: 'High',
    category: 'Performance',
  },
  {
    title: 'Access Control Deficiency',
    description: 'Model production environment access is not restricted to authorized personnel only. Segregation of duties between development and production is not enforced.',
    severity: 'Critical',
    category: 'Controls',
  },
  {
    title: 'Vendor Model Transparency Gap',
    description: 'Limited visibility into the vendor model internals restricts the ability to fully validate model conceptual soundness and assumptions.',
    severity: 'Medium',
    category: 'Documentation',
  },
];

// POST: Generate synthetic validation data with findings
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: inventoryModelId } = await params;
    const body = await request.json().catch(() => ({}));
    const { includeReport = true, findingsCount = 'random' } = body;

    // Get the inventory model
    const model = await prisma.inventoryModel.findUnique({
      where: { id: inventoryModelId },
      include: {
        useCase: true,
        validations: true,
      },
    });

    if (!model) {
      return NextResponse.json(
        { error: 'Inventory model not found' },
        { status: 404 }
      );
    }

    // Determine validation type based on existing validations
    const hasInitial = model.validations.some((v) => v.validationType === 'Initial');
    const validationType = hasInitial ? 'Periodic' : 'Initial';

    // Generate validation date (recent past)
    const validationDate = new Date();
    validationDate.setDate(validationDate.getDate() - Math.floor(Math.random() * 30));

    // Determine number of findings
    let numFindings: number;
    if (findingsCount === 'none') {
      numFindings = 0;
    } else if (findingsCount === 'few') {
      numFindings = Math.floor(Math.random() * 2) + 1;
    } else if (findingsCount === 'many') {
      numFindings = Math.floor(Math.random() * 4) + 3;
    } else {
      // Random - 0-4 findings
      numFindings = Math.floor(Math.random() * 5);
    }

    // Determine overall result based on findings
    let overallResult = 'Satisfactory';
    if (numFindings > 0) {
      overallResult = 'Satisfactory with Findings';
    }

    // Select random findings
    const shuffledFindings = [...findingTemplates].sort(() => Math.random() - 0.5);
    const selectedFindings = shuffledFindings.slice(0, numFindings);

    // Check for critical findings
    if (selectedFindings.some((f) => f.severity === 'Critical')) {
      overallResult = 'Unsatisfactory';
    }

    // Create the validation
    const validation = await prisma.validation.create({
      data: {
        inventoryModelId,
        validationType,
        validationDate,
        validatedBy: 'Model Validation Team',
        status: 'Completed',
        overallResult,
        summaryNotes: `${validationType} validation completed with ${numFindings} finding(s) identified. ${numFindings === 0 ? 'Model continues to perform within acceptable parameters.' : 'See findings for required remediation actions.'}`,
      },
    });

    // Create findings
    const createdFindings = [];
    for (let i = 0; i < selectedFindings.length; i++) {
      const findingTemplate = selectedFindings[i];
      const finding = await prisma.validationFinding.create({
        data: {
          validationId: validation.id,
          findingNumber: `F-${String(i + 1).padStart(3, '0')}`,
          title: findingTemplate.title,
          description: findingTemplate.description,
          severity: findingTemplate.severity,
          category: findingTemplate.category,
          remediationStatus: 'Open',
          remediationDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });
      createdFindings.push(finding);
    }

    // Generate and upload synthetic report if requested
    let reportInfo = null;
    if (includeReport) {
      const reportBuffer = await generateSyntheticReport(
        validation,
        model,
        createdFindings
      );

      const filename = `ValidationReport_${model.inventoryNumber}_${validationType}_${Date.now()}.pdf`;
      const pathname = `validation-reports/${inventoryModelId}/${validation.id}/${filename}`;

      const blob = await put(pathname, reportBuffer, {
        access: 'public',
        contentType: 'application/pdf',
      });

      // Update validation with report
      await prisma.validation.update({
        where: { id: validation.id },
        data: {
          reportFilename: filename,
          reportStoragePath: blob.url,
        },
      });

      reportInfo = {
        filename,
        url: blob.url,
        size: reportBuffer.length,
      };
    }

    // Update model's last validation date
    await prisma.inventoryModel.update({
      where: { id: inventoryModelId },
      data: {
        lastValidationDate: validationDate,
        nextValidationDue: new Date(
          validationDate.getTime() + model.validationFrequencyMonths * 30 * 24 * 60 * 60 * 1000
        ),
      },
    });

    // Get final validation with all data
    const finalValidation = await prisma.validation.findUnique({
      where: { id: validation.id },
      include: { findings: true },
    });

    return NextResponse.json({
      success: true,
      message: `Generated ${validationType} validation with ${numFindings} finding(s)`,
      validation: finalValidation,
      report: reportInfo,
    });
  } catch (error) {
    console.error('Error generating synthetic data:', error);
    return NextResponse.json(
      { error: 'Failed to generate synthetic data', details: String(error) },
      { status: 500 }
    );
  }
}
