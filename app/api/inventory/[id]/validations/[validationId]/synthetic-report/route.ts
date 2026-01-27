import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { put, del } from '@vercel/blob';
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
  addText(`Business Line: ${model.useCase.businessLine}`, { size: 12 });
  addText(`Validation Type: ${validation.validationType}`, { size: 12 });
  addText(`Validation Date: ${new Date(validation.validationDate).toLocaleDateString()}`, { size: 12 });
  addText(`Validated By: ${validation.validatedBy}`, { size: 12 });
  addText(`Overall Result: ${validation.overallResult || 'Pending'}`, { size: 12 });
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
    `This ${validation.validationType.toLowerCase()} validation was conducted to assess the ongoing performance`,
    `and risk profile of ${model.useCase.title}. The validation covered model conceptual soundness,`,
    `implementation verification, ongoing monitoring, and outcomes analysis.`,
    '',
    `Model Type: ${model.useCase.aiType}`,
    `Usage Type: ${model.useCase.usageType}`,
    `Risk Tier: ${model.tier}`,
    '',
    `Overall Assessment: The model is rated "${validation.overallResult || 'Satisfactory'}".`,
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
    '  - Implementation verification testing',
    '  - Performance and outcomes analysis',
    '  - Model governance and documentation review',
    '  - Operational risk assessment',
    '',
    'Testing was conducted using a combination of:',
    '  - Historical backtesting with out-of-sample data',
    '  - Sensitivity and stress testing scenarios',
    '  - Benchmark comparison against industry standards',
    '  - Code review and implementation verification',
  ];
  methodology.forEach((line) => addText(line));
  y -= 10;

  // Performance Analysis
  addSection('3. PERFORMANCE ANALYSIS');
  const performance = [
    'Model performance metrics were evaluated against established thresholds:',
    '',
    '  - Accuracy: Within acceptable range',
    '  - Stability (PSI): Below monitoring threshold',
    '  - Discrimination: Meets minimum requirements',
    '  - Calibration: Properly calibrated for target population',
    '',
    'No significant performance degradation was observed during the review period.',
  ];
  performance.forEach((line) => addText(line));
  y -= 10;

  // Findings
  addSection('4. VALIDATION FINDINGS');
  if (findings.length > 0) {
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
    addText('No findings were identified during this validation.');
    addText('');
    addText('The model continues to perform within established parameters and meets');
    addText('all governance requirements.');
  }
  y -= 10;

  // Recommendations
  addSection('5. RECOMMENDATIONS');
  const recommendations = [
    findings.length > 0
      ? '- Address all identified findings per the remediation timeline'
      : '- Continue current model monitoring practices',
    '- Maintain documentation currency with any model changes',
    '- Conduct next periodic validation per the established schedule',
    '- Review and update model risk rating if business conditions change',
    '- Ensure ongoing monitoring metrics remain within thresholds',
  ];
  recommendations.forEach((line) => addText(line));
  y -= 10;

  // Conclusion
  addSection('6. CONCLUSION');
  addText(`Based on the validation activities performed, the model ${model.useCase.title}`);
  addText(`is rated "${validation.overallResult || 'Satisfactory'}" and is approved for continued use`);
  addText(findings.length > 0
    ? 'contingent on remediation of identified findings within specified timelines.'
    : 'with no material concerns noted.');
  y -= 20;

  // Signature block
  addText('Validation Team Approval:', { bold: true });
  y -= 30;
  addText(`_____________________________`, { size: 10 });
  addText(`${validation.validatedBy}`, { size: 10 });
  addText(`Date: ${new Date(validation.validationDate).toLocaleDateString()}`, { size: 10 });

  // Footer on all pages
  const pages = pdfDoc.getPages();
  pages.forEach((p, i) => {
    p.drawText('SYNTHETIC DOCUMENT - FOR DEMONSTRATION PURPOSES ONLY', {
      x: 50,
      y: 30,
      size: 8,
      font,
      color: rgb(0.6, 0.6, 0.6),
    });
    p.drawText(`Page ${i + 1} of ${pages.length}`, {
      x: width - 100,
      y: 30,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

// POST: Generate synthetic report for existing validation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; validationId: string }> }
) {
  try {
    const { id: inventoryModelId, validationId } = await params;

    // Get the validation with related data
    const validation = await prisma.validation.findFirst({
      where: {
        id: validationId,
        inventoryModelId,
      },
      include: {
        findings: true,
        inventoryModel: {
          include: {
            useCase: true,
          },
        },
      },
    });

    if (!validation) {
      return NextResponse.json(
        { error: 'Validation not found' },
        { status: 404 }
      );
    }

    // Delete existing report if present
    if (validation.reportStoragePath) {
      try {
        await del(validation.reportStoragePath);
      } catch (e) {
        console.warn('Could not delete old report:', e);
      }
    }

    // Generate the synthetic report
    const reportBuffer = await generateSyntheticReport(
      validation,
      validation.inventoryModel,
      validation.findings || []
    );

    const filename = `ValidationReport_${validation.inventoryModel!.inventoryNumber}_${validation.validationType}_${Date.now()}.pdf`;
    const pathname = `validation-reports/${inventoryModelId}/${validationId}/${filename}`;

    // Upload to blob storage
    const blob = await put(pathname, reportBuffer, {
      access: 'public',
      contentType: 'application/pdf',
    });

    // Update validation with report
    const updatedValidation = await prisma.validation.update({
      where: { id: validationId },
      data: {
        reportFilename: filename,
        reportStoragePath: blob.url,
      },
      include: {
        findings: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Synthetic validation report generated',
      validation: updatedValidation,
      report: {
        filename,
        url: blob.url,
        size: reportBuffer.length,
      },
    });
  } catch (error) {
    console.error('Error generating synthetic report:', error);
    return NextResponse.json(
      { error: 'Failed to generate synthetic report', details: String(error) },
      { status: 500 }
    );
  }
}
