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
import { loadArtifactsConfig } from './config-loader';
import type { UseCaseWithRelations, DecisionResult, ArtifactDefinition } from './types';

// Generate DOCX memo for a use case decision
export async function generateMemoDocx(
  useCase: UseCaseWithRelations,
  decision: DecisionResult
): Promise<Buffer> {
  const artifactsConfig = loadArtifactsConfig();

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Title
          new Paragraph({
            children: [
              new TextRun({
                text: 'Model Use Case Governance Review',
                bold: true,
                size: 32,
              }),
            ],
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
          }),

          // Subtitle
          new Paragraph({
            children: [
              new TextRun({
                text: useCase.title,
                size: 28,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Metadata table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              createTableRow('Use Case ID', useCase.id),
              createTableRow('Business Line', useCase.businessLine),
              createTableRow('Owner', useCase.createdBy),
              createTableRow('Date', new Date().toLocaleDateString()),
              createTableRow('Status', useCase.status),
              createTableRow('Risk Tier', `${decision.tier} (${getTierLabel(decision.tier)})`),
              createTableRow('Model Determination', decision.isModel),
            ],
          }),

          new Paragraph({ spacing: { before: 400 } }),

          // Section: Executive Summary
          createHeading('Executive Summary'),
          new Paragraph({
            children: [
              new TextRun({
                text: decision.rationaleSummary,
              }),
            ],
            spacing: { after: 200 },
          }),

          // Section: Use Case Overview
          createHeading('Use Case Overview'),
          new Paragraph({
            children: [
              new TextRun({ text: 'Description: ', bold: true }),
              new TextRun({ text: useCase.description }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Model Type: ', bold: true }),
              new TextRun({ text: useCase.aiType }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Usage Type: ', bold: true }),
              new TextRun({ text: useCase.usageType }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Human-in-the-Loop: ', bold: true }),
              new TextRun({ text: useCase.humanInLoop }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Customer Impact: ', bold: true }),
              new TextRun({ text: useCase.customerImpact }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Deployment: ', bold: true }),
              new TextRun({ text: useCase.deployment }),
            ],
            spacing: { after: 200 },
          }),

          // Section: Data & Privacy
          createHeading('Data & Privacy'),
          new Paragraph({
            children: [
              new TextRun({ text: 'Contains PII: ', bold: true }),
              new TextRun({ text: useCase.containsPii ? 'Yes' : 'No' }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Contains NPI: ', bold: true }),
              new TextRun({ text: useCase.containsNpi ? 'Yes' : 'No' }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Sensitive Attributes: ', bold: true }),
              new TextRun({ text: useCase.sensitiveAttributesUsed ? 'Yes' : 'No' }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Regulatory Domains: ', bold: true }),
              new TextRun({ text: JSON.parse(useCase.regulatoryDomains || '[]').join(', ') || 'None specified' }),
            ],
            spacing: { after: 200 },
          }),

          // Section: Tier Decision
          createHeading('Risk Tier Decision'),
          new Paragraph({
            children: [
              new TextRun({
                text: `Assigned Tier: ${decision.tier} - ${getTierLabel(decision.tier)}`,
                bold: true,
                size: 26,
              }),
            ],
            spacing: { after: 200 },
          }),

          // Triggered criteria
          createSubHeading('Triggered Criteria'),
          ...decision.triggeredRules.map(
            (rule) =>
              new Paragraph({
                children: [
                  new TextRun({ text: '• ' }),
                  new TextRun({ text: rule.name, bold: true }),
                  new TextRun({ text: `: ${rule.triggeredCriteria}` }),
                ],
                spacing: { after: 100 },
              })
          ),

          new Paragraph({ spacing: { before: 200 } }),

          // Risk flags
          ...(decision.riskFlags.length > 0
            ? [
                createSubHeading('Risk Flags'),
                new Paragraph({
                  children: [new TextRun({ text: decision.riskFlags.join(', ') })],
                  spacing: { after: 200 },
                }),
              ]
            : []),

          // Section: Required Artifacts
          createHeading('Required Artifacts'),
          ...decision.requiredArtifacts.map((artifactId) => {
            const artifact = artifactsConfig.artifacts[artifactId];
            if (!artifact) {
              return new Paragraph({
                children: [new TextRun({ text: `• ${artifactId}` })],
                spacing: { after: 50 },
              });
            }
            return new Paragraph({
              children: [
                new TextRun({ text: '• ' }),
                new TextRun({ text: artifact.name, bold: true }),
                new TextRun({ text: ` (${artifact.category})` }),
                new TextRun({ text: ` - ${artifact.description}` }),
              ],
              spacing: { after: 50 },
            });
          }),

          new Paragraph({ spacing: { before: 200 } }),

          // Section: Missing Evidence
          ...(decision.missingEvidence.length > 0
            ? [
                createHeading('Missing Evidence / Open Items'),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'The following evidence items have not been provided:',
                      italics: true,
                    }),
                  ],
                  spacing: { after: 100 },
                }),
                ...decision.missingEvidence.map((artifactId) => {
                  const artifact = artifactsConfig.artifacts[artifactId];
                  return new Paragraph({
                    children: [
                      new TextRun({ text: '☐ ' }),
                      new TextRun({
                        text: artifact?.name || artifactId,
                        bold: true,
                      }),
                    ],
                    spacing: { after: 50 },
                  });
                }),
              ]
            : []),

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
                text: new Date().toISOString(),
                size: 18,
                color: '666666',
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

// Generate checklist HTML
export function generateChecklistHtml(
  useCase: UseCaseWithRelations,
  decision: DecisionResult
): string {
  const artifactsConfig = loadArtifactsConfig();

  // Group artifacts by category
  const groupedArtifacts: Record<string, ArtifactDefinition[]> = {};
  decision.requiredArtifacts.forEach((artifactId) => {
    const artifact = artifactsConfig.artifacts[artifactId];
    if (artifact) {
      const category = artifact.category;
      if (!groupedArtifacts[category]) {
        groupedArtifacts[category] = [];
      }
      groupedArtifacts[category].push(artifact);
    }
  });

  // Sort categories by order
  const sortedCategories = Object.keys(groupedArtifacts).sort((a, b) => {
    const orderA = artifactsConfig.categories[a]?.order || 999;
    const orderB = artifactsConfig.categories[b]?.order || 999;
    return orderA - orderB;
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Artifact Checklist - ${useCase.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #333;
    }
    h1 {
      color: #1a1a1a;
      border-bottom: 2px solid #e5e5e5;
      padding-bottom: 10px;
    }
    h2 {
      color: #444;
      margin-top: 30px;
    }
    .meta {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 30px;
    }
    .meta-item {
      display: flex;
      margin-bottom: 8px;
    }
    .meta-label {
      font-weight: 600;
      width: 150px;
    }
    .tier-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 14px;
    }
    .tier-T1 { background: #dcfce7; color: #166534; }
    .tier-T2 { background: #fef3c7; color: #92400e; }
    .tier-T3 { background: #fee2e2; color: #991b1b; }
    .category {
      margin-top: 25px;
    }
    .category-header {
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 10px;
      padding: 8px 12px;
      background: #f3f4f6;
      border-radius: 4px;
    }
    .artifact {
      padding: 12px;
      border: 1px solid #e5e5e5;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    .artifact-header {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .checkbox {
      width: 18px;
      height: 18px;
      border: 2px solid #d1d5db;
      border-radius: 3px;
    }
    .artifact-name {
      font-weight: 600;
    }
    .artifact-owner {
      color: #666;
      font-size: 13px;
    }
    .artifact-desc {
      margin-top: 6px;
      font-size: 14px;
      color: #555;
    }
    .missing {
      background: #fef2f2;
      border-color: #fecaca;
    }
    .missing-badge {
      background: #fee2e2;
      color: #991b1b;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 3px;
      font-weight: 500;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e5e5;
      text-align: center;
      color: #888;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <h1>Artifact Checklist</h1>

  <div class="meta">
    <div class="meta-item">
      <span class="meta-label">Use Case:</span>
      <span>${useCase.title}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Business Line:</span>
      <span>${useCase.businessLine}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Risk Tier:</span>
      <span class="tier-badge tier-${decision.tier}">${decision.tier} - ${getTierLabel(decision.tier)}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Model Determination:</span>
      <span>${decision.isModel}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Generated:</span>
      <span>${new Date().toLocaleDateString()}</span>
    </div>
  </div>

  <h2>Required Artifacts (${decision.requiredArtifacts.length})</h2>

  ${sortedCategories
    .map(
      (category) => `
    <div class="category">
      <div class="category-header">${category} (${groupedArtifacts[category].length})</div>
      ${groupedArtifacts[category]
        .map((artifact) => {
          const isMissing = decision.missingEvidence.includes(artifact.id);
          return `
        <div class="artifact ${isMissing ? 'missing' : ''}">
          <div class="artifact-header">
            <div class="checkbox"></div>
            <span class="artifact-name">${artifact.name}</span>
            ${isMissing ? '<span class="missing-badge">Missing</span>' : ''}
            <span class="artifact-owner">Owner: ${artifact.ownerRole}</span>
          </div>
          <div class="artifact-desc">${artifact.description}</div>
        </div>
      `;
        })
        .join('')}
    </div>
  `
    )
    .join('')}

  <div class="footer">
    Generated by Model Intake & Risk Tiering System<br>
    ${new Date().toISOString()}
  </div>
</body>
</html>
  `.trim();

  return html;
}

// Generate inventory CSV row
export function generateInventoryCsv(
  useCase: UseCaseWithRelations,
  decision: DecisionResult
): string {
  const headers = [
    'ID',
    'Title',
    'Business Line',
    'Model Type',
    'Usage Type',
    'Customer Impact',
    'Human-in-Loop',
    'Deployment',
    'Vendor Involved',
    'Contains PII',
    'Contains NPI',
    'Risk Tier',
    'Model Determination',
    'Risk Flags',
    'Status',
    'Owner',
    'Created Date',
    'Last Updated',
  ];

  const regulatoryDomains = JSON.parse(useCase.regulatoryDomains || '[]');

  const values = [
    useCase.id,
    useCase.title,
    useCase.businessLine,
    useCase.aiType,
    useCase.usageType,
    useCase.customerImpact,
    useCase.humanInLoop,
    useCase.deployment,
    useCase.vendorInvolved ? 'Yes' : 'No',
    useCase.containsPii ? 'Yes' : 'No',
    useCase.containsNpi ? 'Yes' : 'No',
    decision.tier,
    decision.isModel,
    decision.riskFlags.join('; '),
    useCase.status,
    useCase.createdBy,
    new Date(useCase.createdAt).toISOString().split('T')[0],
    new Date(useCase.updatedAt).toISOString().split('T')[0],
  ];

  // Escape CSV values
  const escapeCsv = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  return headers.join(',') + '\n' + values.map(escapeCsv).join(',');
}

// Helper functions
function createHeading(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        size: 28,
      }),
    ],
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
  });
}

function createSubHeading(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        size: 24,
      }),
    ],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 100 },
  });
}

function createTableRow(label: string, value: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: label, bold: true })],
          }),
        ],
        width: { size: 30, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
          left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
          right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: value })] })],
        width: { size: 70, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
          left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
          right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        },
      }),
    ],
  });
}

function getTierLabel(tier: string): string {
  switch (tier) {
    case 'T1':
      return 'Low Risk';
    case 'T2':
      return 'Medium Risk';
    case 'T3':
      return 'High Risk';
    default:
      return tier;
  }
}
