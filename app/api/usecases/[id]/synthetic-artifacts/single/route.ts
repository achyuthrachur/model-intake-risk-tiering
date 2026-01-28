import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { put } from '@vercel/blob';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { loadArtifactsConfig } from '@/lib/config-loader';
import OpenAI from 'openai';

// Lazy-loaded OpenAI client to avoid build-time errors
function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Generate a synthetic PDF document with AI-enhanced content
async function generateSyntheticPDF(
  title: string,
  content: string[],
  useCase: any
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let currentPage = pdfDoc.addPage([612, 792]); // Letter size
  const { width, height } = currentPage.getSize();
  let y = height - 50;

  const addNewPage = () => {
    currentPage = pdfDoc.addPage([612, 792]);
    y = height - 50;
    return currentPage;
  };

  // Title
  currentPage.drawText(title, {
    x: 50,
    y,
    size: 18,
    font: boldFont,
    color: rgb(0, 0, 0.5),
  });
  y -= 30;

  // Demo notice banner
  currentPage.drawRectangle({
    x: 50,
    y: y - 5,
    width: width - 100,
    height: 25,
    color: rgb(1, 0.95, 0.8),
    borderColor: rgb(1, 0.8, 0.4),
    borderWidth: 1,
  });
  currentPage.drawText('EXAMPLE DOCUMENT - FOR DEMONSTRATION PURPOSES ONLY', {
    x: 60,
    y: y + 3,
    size: 10,
    font: boldFont,
    color: rgb(0.8, 0.5, 0),
  });
  y -= 40;

  // Use case info
  currentPage.drawText(`Use Case: ${useCase.title}`, {
    x: 50,
    y,
    size: 12,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 20;

  currentPage.drawText(`Business Line: ${useCase.businessLine}`, {
    x: 50,
    y,
    size: 12,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 20;

  currentPage.drawText(`Model Type: ${useCase.aiType || 'Not specified'}`, {
    x: 50,
    y,
    size: 12,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 20;

  currentPage.drawText(`Date: ${new Date().toLocaleDateString()}`, {
    x: 50,
    y,
    size: 12,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 40;

  // Draw a line
  currentPage.drawLine({
    start: { x: 50, y },
    end: { x: width - 50, y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  y -= 30;

  // Content sections
  for (const section of content) {
    const lines = section.split('\n');
    for (const line of lines) {
      if (y < 80) {
        addNewPage();
      }

      if (line.startsWith('## ')) {
        // Section header
        y -= 10;
        currentPage.drawText(line.replace('## ', ''), {
          x: 50,
          y,
          size: 14,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        y -= 25;
      } else if (line.startsWith('- ')) {
        // Bullet point
        currentPage.drawText('\u2022 ' + line.replace('- ', ''), {
          x: 60,
          y,
          size: 11,
          font,
          color: rgb(0.2, 0.2, 0.2),
        });
        y -= 16;
      } else if (line.trim()) {
        // Regular text - wrap long lines
        const words = line.split(' ');
        let currentLine = '';

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const textWidth = font.widthOfTextAtSize(testLine, 11);

          if (textWidth > width - 100) {
            if (y < 80) {
              addNewPage();
            }
            currentPage.drawText(currentLine, {
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
          if (y < 80) {
            addNewPage();
          }
          currentPage.drawText(currentLine, {
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

  // Footer on all pages
  const pages = pdfDoc.getPages();
  pages.forEach((page, index) => {
    page.drawText(`SYNTHETIC DOCUMENT - FOR DEMONSTRATION PURPOSES ONLY | Page ${index + 1} of ${pages.length}`, {
      x: 50,
      y: 30,
      size: 8,
      font,
      color: rgb(0.6, 0.6, 0.6),
    });
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

// Generate AI-enhanced content for the artifact
async function generateAIContent(
  artifactId: string,
  artifactDefinition: any,
  useCase: any
): Promise<string[]> {
  // Get the OpenAI client (returns null if no API key)
  const openai = getOpenAIClient();
  if (!openai) {
    return getBasicTemplate(artifactId, artifactDefinition, useCase);
  }

  try {
    const prompt = `Generate realistic example content for a "${artifactDefinition.name}" document for a model risk management context.

Use Case Details:
- Title: ${useCase.title}
- Description: ${useCase.description}
- Business Line: ${useCase.businessLine}
- Model Type: ${useCase.aiType || 'AI/ML'}
- Usage: ${useCase.usageType}
- Customer Impact: ${useCase.customerImpact}
- Human in Loop: ${useCase.humanInLoop}

Artifact Requirements:
- Description: ${artifactDefinition.description}
- What Good Looks Like: ${artifactDefinition.whatGoodLooksLike}
- Owner Role: ${artifactDefinition.ownerRole}

Generate 4-6 sections with realistic content that demonstrates what a properly completed ${artifactDefinition.name} would contain. Each section should start with "## Section Name" on its own line, followed by detailed content. Include specific examples, metrics where appropriate, and professional language suitable for regulatory review.

This is for demonstration purposes to show what the artifact should look like when properly completed.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || '';
    // Split into sections
    const sections = content.split(/(?=## )/g).filter((s: string) => s.trim());
    return sections.length > 0 ? sections : getBasicTemplate(artifactId, artifactDefinition, useCase);
  } catch (error) {
    console.error('AI content generation failed:', error);
    return getBasicTemplate(artifactId, artifactDefinition, useCase);
  }
}

// Basic template fallback
function getBasicTemplate(artifactId: string, artifactDefinition: any, useCase: any): string[] {
  return [
    `## Document Overview\nThis ${artifactDefinition.name} provides the required documentation for the ${useCase.title} use case. It has been prepared in accordance with model risk management requirements and organizational governance standards.`,
    `## Purpose and Scope\n${artifactDefinition.description}\n\nThis document covers the ${useCase.businessLine} implementation and addresses all regulatory and compliance requirements applicable to ${useCase.aiType || 'AI/ML'} systems.`,
    `## Key Requirements\nAs outlined in the governance framework, this artifact should demonstrate:\n${artifactDefinition.whatGoodLooksLike}`,
    `## Ownership and Responsibilities\nPrimary Owner: ${artifactDefinition.ownerRole}\n\nThis document is maintained by the ${artifactDefinition.ownerRole} team and subject to periodic review and updates as part of the model lifecycle management process.`,
    `## Compliance Statement\nThis document has been prepared to meet the requirements of the model risk management framework and applicable regulatory guidance. All content has been reviewed and approved by appropriate stakeholders.`,
  ];
}

// POST /api/usecases/[id]/synthetic-artifacts/single - Generate single synthetic artifact
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { artifactId } = await request.json();

    if (!artifactId) {
      return NextResponse.json(
        { error: 'artifactId is required' },
        { status: 400 }
      );
    }

    // Get use case
    const useCase = await prisma.useCase.findUnique({
      where: { id },
      include: { attachments: true },
    });

    if (!useCase) {
      return NextResponse.json(
        { error: 'Use case not found' },
        { status: 404 }
      );
    }

    // Check if artifact already exists
    const existingAttachment = useCase.attachments.find(a => a.artifactId === artifactId);
    if (existingAttachment) {
      return NextResponse.json(
        { error: 'Artifact already exists', attachment: existingAttachment },
        { status: 409 }
      );
    }

    // Get artifact definition
    const artifactsConfig = loadArtifactsConfig();
    const artifactDefinition = artifactsConfig.artifacts[artifactId];

    if (!artifactDefinition) {
      return NextResponse.json(
        { error: 'Unknown artifact type' },
        { status: 400 }
      );
    }

    // Generate AI-enhanced content
    const content = await generateAIContent(artifactId, artifactDefinition, useCase);

    // Generate PDF
    const pdfBuffer = await generateSyntheticPDF(
      artifactDefinition.name,
      content,
      useCase
    );

    const filename = `${artifactId}_DEMO_${Date.now()}.pdf`;

    // Upload to blob storage
    const blob = await put(`attachments/${id}/${filename}`, pdfBuffer, {
      access: 'public',
      contentType: 'application/pdf',
    });

    // Create attachment record with isSynthetic flag
    const attachment = await prisma.attachment.create({
      data: {
        useCaseId: id,
        filename,
        type: 'Model documentation',
        artifactId,
        storagePath: blob.url,
        fileSize: pdfBuffer.length,
        mimeType: 'application/pdf',
        isSynthetic: true,
      },
    });

    // Create audit event
    await prisma.auditEvent.create({
      data: {
        useCaseId: id,
        actor: 'demo-user',
        eventType: 'SyntheticArtifactGenerated',
        details: JSON.stringify({
          artifactId,
          artifactName: artifactDefinition.name,
          filename,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Generated demo ${artifactDefinition.name}`,
      attachment,
    });
  } catch (error) {
    console.error('Error generating synthetic artifact:', error);
    return NextResponse.json(
      { error: 'Failed to generate synthetic artifact', details: String(error) },
      { status: 500 }
    );
  }
}
