import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

interface ArtifactConfig {
  id: string;
  name: string;
  category: string;
  description: string;
  ownerRole: string;
  whatGoodLooksLike: string;
  requiredForTiers: string[];
}

interface ArtifactsYaml {
  artifacts: Record<string, ArtifactConfig>;
  categories: Record<string, { order: number; description: string }>;
}

async function generatePdf(artifact: ArtifactConfig, outputPath: string): Promise<void> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Letter size

  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const { width, height } = page.getSize();

  // Header background
  page.drawRectangle({
    x: 0,
    y: height - 120,
    width: width,
    height: 120,
    color: rgb(0.1, 0.1, 0.3),
  });

  // Title
  page.drawText('SAMPLE DOCUMENT', {
    x: 50,
    y: height - 50,
    size: 14,
    font: helvetica,
    color: rgb(0.7, 0.7, 0.8),
  });

  page.drawText(artifact.name, {
    x: 50,
    y: height - 80,
    size: 24,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(`Category: ${artifact.category}`, {
    x: 50,
    y: height - 105,
    size: 12,
    font: helvetica,
    color: rgb(0.8, 0.8, 0.9),
  });

  // Content area
  let yPos = height - 160;

  // Description section
  page.drawText('Purpose', {
    x: 50,
    y: yPos,
    size: 16,
    font: helveticaBold,
    color: rgb(0.1, 0.1, 0.3),
  });
  yPos -= 25;

  // Word wrap the description
  const descLines = wrapText(artifact.description, 80);
  for (const line of descLines) {
    page.drawText(line, {
      x: 50,
      y: yPos,
      size: 11,
      font: helvetica,
      color: rgb(0.2, 0.2, 0.2),
    });
    yPos -= 16;
  }
  yPos -= 20;

  // Owner section
  page.drawText('Owner Role', {
    x: 50,
    y: yPos,
    size: 16,
    font: helveticaBold,
    color: rgb(0.1, 0.1, 0.3),
  });
  yPos -= 25;

  page.drawText(artifact.ownerRole, {
    x: 50,
    y: yPos,
    size: 11,
    font: helvetica,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPos -= 40;

  // What Good Looks Like section
  page.drawText('What Good Looks Like', {
    x: 50,
    y: yPos,
    size: 16,
    font: helveticaBold,
    color: rgb(0.1, 0.1, 0.3),
  });
  yPos -= 25;

  const goodLines = wrapText(artifact.whatGoodLooksLike, 80);
  for (const line of goodLines) {
    page.drawText(line, {
      x: 50,
      y: yPos,
      size: 11,
      font: helvetica,
      color: rgb(0.2, 0.2, 0.2),
    });
    yPos -= 16;
  }
  yPos -= 40;

  // Required for tiers
  page.drawText('Required For Tiers', {
    x: 50,
    y: yPos,
    size: 16,
    font: helveticaBold,
    color: rgb(0.1, 0.1, 0.3),
  });
  yPos -= 25;

  page.drawText(artifact.requiredForTiers.join(', '), {
    x: 50,
    y: yPos,
    size: 11,
    font: helvetica,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPos -= 60;

  // Sample content placeholder
  page.drawRectangle({
    x: 50,
    y: yPos - 150,
    width: width - 100,
    height: 150,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1,
    color: rgb(0.97, 0.97, 0.97),
  });

  page.drawText('SAMPLE CONTENT PLACEHOLDER', {
    x: width / 2 - 100,
    y: yPos - 70,
    size: 14,
    font: helveticaBold,
    color: rgb(0.6, 0.6, 0.6),
  });

  page.drawText('This is a placeholder document for proof-of-concept purposes.', {
    x: width / 2 - 170,
    y: yPos - 95,
    size: 10,
    font: helvetica,
    color: rgb(0.6, 0.6, 0.6),
  });

  page.drawText('In production, this would contain actual artifact content.', {
    x: width / 2 - 160,
    y: yPos - 115,
    size: 10,
    font: helvetica,
    color: rgb(0.6, 0.6, 0.6),
  });

  // Footer
  page.drawText('Generated for Model Risk Governance POC', {
    x: 50,
    y: 40,
    size: 9,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  page.drawText(`Document ID: ${artifact.id}`, {
    x: width - 180,
    y: 40,
    size: 9,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxChars) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines;
}

async function main() {
  console.log('Generating sample artifact PDFs...\n');

  // Read artifacts config
  const configPath = path.join(__dirname, '..', 'config', 'artifacts.yaml');
  const configContent = fs.readFileSync(configPath, 'utf-8');
  const config = yaml.load(configContent) as ArtifactsYaml;

  // Create output directory
  const outputDir = path.join(__dirname, '..', 'public', 'sample-artifacts');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate PDF for each artifact
  const artifacts = Object.values(config.artifacts);
  let count = 0;

  for (const artifact of artifacts) {
    const filename = `${artifact.id}.pdf`;
    const outputPath = path.join(outputDir, filename);

    await generatePdf(artifact, outputPath);
    console.log(`  ✓ Generated: ${filename}`);
    count++;
  }

  console.log(`\n✅ Generated ${count} sample artifact PDFs in public/sample-artifacts/`);
}

main().catch(console.error);
