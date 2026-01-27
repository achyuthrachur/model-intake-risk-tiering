import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { put } from '@vercel/blob';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// Generate a synthetic PDF document
async function generateSyntheticPDF(
  title: string,
  content: string[],
  useCase: any
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([612, 792]); // Letter size
  const { width, height } = page.getSize();
  let y = height - 50;

  // Title
  page.drawText(title, {
    x: 50,
    y,
    size: 18,
    font: boldFont,
    color: rgb(0, 0, 0.5),
  });
  y -= 30;

  // Use case info
  page.drawText(`Use Case: ${useCase.title}`, {
    x: 50,
    y,
    size: 12,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 20;

  page.drawText(`Business Line: ${useCase.businessLine}`, {
    x: 50,
    y,
    size: 12,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 20;

  page.drawText(`Date: ${new Date().toLocaleDateString()}`, {
    x: 50,
    y,
    size: 12,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 40;

  // Draw a line
  page.drawLine({
    start: { x: 50, y },
    end: { x: width - 50, y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  y -= 30;

  // Content sections
  for (const section of content) {
    if (y < 100) {
      // Add new page if needed
      const newPage = pdfDoc.addPage([612, 792]);
      y = height - 50;
    }

    const lines = section.split('\n');
    for (const line of lines) {
      if (line.startsWith('## ')) {
        // Section header
        y -= 10;
        page.drawText(line.replace('## ', ''), {
          x: 50,
          y,
          size: 14,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        y -= 25;
      } else if (line.trim()) {
        // Regular text - wrap long lines
        const words = line.split(' ');
        let currentLine = '';

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const textWidth = font.widthOfTextAtSize(testLine, 11);

          if (textWidth > width - 100) {
            page.drawText(currentLine, {
              x: 50,
              y,
              size: 11,
              font,
              color: rgb(0.2, 0.2, 0.2),
            });
            y -= 16;
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }

        if (currentLine) {
          page.drawText(currentLine, {
            x: 50,
            y,
            size: 11,
            font,
            color: rgb(0.2, 0.2, 0.2),
          });
          y -= 16;
        }
      } else {
        y -= 10;
      }
    }
    y -= 15;
  }

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

// Artifact templates for synthetic generation
const artifactTemplates: Record<string, { title: string; content: string[] }> = {
  ModelDocumentation: {
    title: 'Model Documentation',
    content: [
      '## Executive Summary\nThis document provides comprehensive documentation for the model use case, including methodology, assumptions, and limitations.',
      '## Model Purpose\nThe model is designed to support business decision-making by providing accurate predictions and risk assessments based on historical data patterns.',
      '## Methodology\nThe model employs industry-standard statistical techniques and machine learning algorithms appropriate for the use case requirements. Key features include data preprocessing, feature engineering, and model validation.',
      '## Data Requirements\nThe model requires structured input data meeting quality standards. Data sources have been validated and approved by data governance.',
      '## Assumptions and Limitations\nKey assumptions include data stationarity, feature independence, and representative training samples. Limitations are documented and communicated to stakeholders.',
      '## Performance Metrics\nModel performance is measured using industry-standard metrics including accuracy, precision, recall, and AUC-ROC where applicable.',
    ],
  },
  ValidationPlan: {
    title: 'Validation Plan',
    content: [
      '## Validation Scope\nThis plan outlines the validation approach for the model, including testing methodology, success criteria, and timeline.',
      '## Testing Strategy\nValidation will include unit testing, integration testing, user acceptance testing, and performance testing across multiple scenarios.',
      '## Success Criteria\nThe model must meet defined accuracy thresholds, pass all regulatory compliance checks, and receive stakeholder approval before production deployment.',
      '## Timeline\nValidation activities are scheduled to complete within the defined project timeline with appropriate buffers for remediation.',
      '## Resource Requirements\nValidation requires dedicated testing environments, subject matter expertise, and quality assurance resources.',
    ],
  },
  DataDictionary: {
    title: 'Data Dictionary',
    content: [
      '## Overview\nThis document defines all data elements used by the model, including field definitions, data types, and business rules.',
      '## Input Variables\nAll input features are documented with clear definitions, expected formats, valid ranges, and handling of missing values.',
      '## Output Variables\nModel outputs are clearly defined with interpretation guidelines and confidence intervals where applicable.',
      '## Data Quality Rules\nData quality checks are implemented at ingestion and processing stages to ensure data integrity.',
      '## Data Lineage\nComplete data lineage is documented from source systems through transformations to model consumption.',
    ],
  },
  PerformanceReport: {
    title: 'Performance Monitoring Report',
    content: [
      '## Performance Summary\nThis report presents the model performance metrics for the current monitoring period.',
      '## Key Metrics\nAll key performance indicators are within acceptable thresholds. No significant degradation observed.',
      '## Drift Analysis\nModel drift monitoring shows stable performance with no significant input or output distribution changes.',
      '## Recommendations\nContinue current monitoring cadence. No immediate remediation actions required.',
      '## Next Review\nScheduled performance review in accordance with model risk tier requirements.',
    ],
  },
  RiskAssessment: {
    title: 'Risk Assessment',
    content: [
      '## Risk Overview\nThis document presents the comprehensive risk assessment for the model use case.',
      '## Identified Risks\nKey risks have been identified, assessed, and documented with appropriate mitigation strategies.',
      '## Risk Ratings\nEach identified risk has been rated for likelihood and impact using the enterprise risk framework.',
      '## Mitigation Controls\nControls are in place to mitigate identified risks to acceptable levels.',
      '## Residual Risk\nResidual risk after controls is within organizational risk appetite.',
    ],
  },
  ControlsDocumentation: {
    title: 'Controls Documentation',
    content: [
      '## Control Framework\nThis document outlines the control framework governing model operations.',
      '## Access Controls\nRole-based access controls are implemented with appropriate segregation of duties.',
      '## Change Management\nAll model changes follow defined change management procedures with appropriate approvals.',
      '## Monitoring Controls\nAutomated monitoring is in place for model inputs, outputs, and performance metrics.',
      '## Audit Trail\nComplete audit logging is maintained for all model activities and decisions.',
    ],
  },
};

// POST /api/usecases/[id]/synthetic-artifacts - Generate synthetic demo artifacts
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get use case with decision
    const useCase = await prisma.useCase.findUnique({
      where: { id },
      include: {
        decision: true,
        attachments: true,
      },
    });

    if (!useCase) {
      return NextResponse.json(
        { error: 'Use case not found' },
        { status: 404 }
      );
    }

    if (!useCase.decision) {
      return NextResponse.json(
        { error: 'No decision found. Generate a decision first.' },
        { status: 400 }
      );
    }

    // Parse required artifacts
    const requiredArtifacts: string[] = JSON.parse(useCase.decision.requiredArtifacts || '[]');

    // Get existing artifact IDs to avoid duplicates
    const existingArtifactIds = useCase.attachments
      .filter(a => a.artifactId)
      .map(a => a.artifactId);

    const createdAttachments = [];

    // Generate synthetic documents for each required artifact
    for (const artifactId of requiredArtifacts) {
      // Skip if already uploaded
      if (existingArtifactIds.includes(artifactId)) {
        continue;
      }

      const template = artifactTemplates[artifactId];
      if (!template) {
        // Use a generic template for unknown artifacts
        const genericTemplate = {
          title: artifactId.replace(/([A-Z])/g, ' $1').trim(),
          content: [
            '## Document Overview\nThis document provides the required information for the artifact requirement.',
            '## Content\nAll necessary details have been documented in accordance with governance requirements.',
            '## Approval\nThis document has been reviewed and approved by appropriate stakeholders.',
          ],
        };

        const pdfBuffer = await generateSyntheticPDF(
          genericTemplate.title,
          genericTemplate.content,
          useCase
        );

        const filename = `${artifactId}_${Date.now()}.pdf`;

        // Upload to blob storage
        const blob = await put(`attachments/${id}/${filename}`, pdfBuffer, {
          access: 'public',
          contentType: 'application/pdf',
        });

        // Create attachment record
        const attachment = await prisma.attachment.create({
          data: {
            useCaseId: id,
            filename,
            type: 'Model documentation',
            artifactId,
            storagePath: blob.url,
            fileSize: pdfBuffer.length,
            mimeType: 'application/pdf',
          },
        });

        createdAttachments.push(attachment);
      } else {
        const pdfBuffer = await generateSyntheticPDF(
          template.title,
          template.content,
          useCase
        );

        const filename = `${artifactId}_${Date.now()}.pdf`;

        // Upload to blob storage
        const blob = await put(`attachments/${id}/${filename}`, pdfBuffer, {
          access: 'public',
          contentType: 'application/pdf',
        });

        // Create attachment record
        const attachment = await prisma.attachment.create({
          data: {
            useCaseId: id,
            filename,
            type: 'Model documentation',
            artifactId,
            storagePath: blob.url,
            fileSize: pdfBuffer.length,
            mimeType: 'application/pdf',
          },
        });

        createdAttachments.push(attachment);
      }
    }

    // Create audit event
    await prisma.auditEvent.create({
      data: {
        useCaseId: id,
        actor: 'demo-user',
        eventType: 'SyntheticArtifactsGenerated',
        details: JSON.stringify({
          artifactsGenerated: createdAttachments.map(a => a.artifactId),
          count: createdAttachments.length,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Generated ${createdAttachments.length} synthetic artifacts`,
      attachments: createdAttachments,
    });
  } catch (error) {
    console.error('Error generating synthetic artifacts:', error);
    return NextResponse.json(
      { error: 'Failed to generate synthetic artifacts', details: String(error) },
      { status: 500 }
    );
  }
}
