import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { evaluateUseCase } from '@/lib/rules-engine';
import type { UseCaseWithRelations } from '@/lib/types';
import { loadArtifactsConfig } from '@/lib/config-loader';
import { getValidationFrequency } from '@/lib/utils';

// Helper to get artifact name from config
function getArtifactName(artifactId: string): string {
  const config = loadArtifactsConfig();
  const artifact = config.artifacts[artifactId];
  return artifact?.name || artifactId;
}

// Demo use cases data
const demoUseCases = [
  {
    title: 'AML Alert Narrative Summarizer',
    businessLine: 'AML',
    description: 'GenAI-powered tool that summarizes transaction patterns and generates narrative summaries for AML alert investigations. Helps investigators quickly understand alert context and reduce investigation time.',
    aiType: 'GenAI',
    usageType: 'Advisory',
    humanInLoop: 'Required',
    customerImpact: 'Indirect',
    regulatoryDomains: ['AML', 'BSA'],
    deployment: 'Internal tool',
    vendorInvolved: false,
    containsPii: true,
    containsNpi: true,
    sensitiveAttributesUsed: false,
    trainingDataSource: 'Internal',
    retentionPolicyDefined: true,
    loggingRequired: true,
    accessControlsDefined: true,
    modelDefinitionTrigger: false,
    explainabilityRequired: true,
    changeFrequency: 'Monthly',
    retraining: false,
    overridesAllowed: true,
    fallbackPlanDefined: true,
    monitoringCadence: 'Weekly',
    humanReviewProcess: 'All summaries reviewed by investigator before use',
    incidentResponseContact: 'aml-ops@example.com',
  },
  {
    title: 'Policy RAG Assistant',
    businessLine: 'Compliance',
    description: 'Internal RAG-based assistant that helps employees find and understand compliance policies. Uses retrieval-augmented generation to provide policy citations and explanations.',
    aiType: 'GenAI',
    usageType: 'Advisory',
    humanInLoop: 'Optional',
    customerImpact: 'None',
    regulatoryDomains: ['Privacy', 'Consumer Protection'],
    deployment: 'Internal tool',
    vendorInvolved: false,
    containsPii: false,
    containsNpi: false,
    sensitiveAttributesUsed: false,
    trainingDataSource: 'Internal',
    retentionPolicyDefined: true,
    loggingRequired: true,
    accessControlsDefined: true,
    modelDefinitionTrigger: false,
    explainabilityRequired: false,
    changeFrequency: 'Quarterly',
    retraining: false,
    overridesAllowed: true,
    fallbackPlanDefined: true,
    monitoringCadence: 'Monthly',
    humanReviewProcess: 'Users verify policy citations',
    incidentResponseContact: 'compliance-tech@example.com',
  },
  {
    title: 'Credit Underwriting Model Refresh',
    businessLine: 'Credit',
    description: 'Annual refresh of the consumer credit underwriting model. ML model uses application data and bureau scores to make credit decisions. Directly impacts customer credit approvals.',
    aiType: 'Traditional ML',
    usageType: 'Decisioning',
    humanInLoop: 'Optional',
    customerImpact: 'Direct',
    regulatoryDomains: ['Lending', 'Credit', 'ECOA', 'FCRA'],
    deployment: 'Customer-facing',
    vendorInvolved: false,
    containsPii: true,
    containsNpi: true,
    sensitiveAttributesUsed: true,
    trainingDataSource: 'Internal',
    retentionPolicyDefined: true,
    loggingRequired: true,
    accessControlsDefined: true,
    modelDefinitionTrigger: true,
    explainabilityRequired: true,
    changeFrequency: 'Ad hoc',
    retraining: true,
    overridesAllowed: true,
    fallbackPlanDefined: true,
    monitoringCadence: 'Monthly',
    humanReviewProcess: 'Escalation to underwriter for edge cases',
    incidentResponseContact: 'credit-risk@example.com',
  },
  {
    title: 'Vendor Fraud Score Integration',
    businessLine: 'Fraud',
    description: 'Integration of third-party vendor fraud scoring model. Black-box model provides fraud probability scores for real-time transaction authorization decisions.',
    aiType: 'Traditional ML',
    usageType: 'Decisioning',
    humanInLoop: 'None',
    customerImpact: 'Direct',
    regulatoryDomains: ['Consumer Protection', 'UDAAP'],
    deployment: 'Customer-facing',
    vendorInvolved: true,
    vendorName: 'FraudGuard Inc.',
    containsPii: true,
    containsNpi: true,
    sensitiveAttributesUsed: false,
    trainingDataSource: 'Vendor',
    retentionPolicyDefined: true,
    loggingRequired: true,
    accessControlsDefined: true,
    modelDefinitionTrigger: true,
    explainabilityRequired: true,
    changeFrequency: 'Quarterly',
    retraining: false,
    overridesAllowed: false,
    fallbackPlanDefined: false,
    monitoringCadence: 'Daily',
    humanReviewProcess: 'None - fully automated',
    incidentResponseContact: 'fraud-ops@example.com',
  },
  {
    title: 'Collections Prioritization Model',
    businessLine: 'Operations',
    description: 'ML model that prioritizes delinquent accounts for collections outreach based on likelihood of payment and customer value. Determines contact strategy and timing.',
    aiType: 'Traditional ML',
    usageType: 'Decisioning',
    humanInLoop: 'Optional',
    customerImpact: 'Direct',
    regulatoryDomains: ['Consumer Protection', 'UDAAP', 'FCRA'],
    deployment: 'Internal tool',
    vendorInvolved: false,
    containsPii: true,
    containsNpi: true,
    sensitiveAttributesUsed: true,
    trainingDataSource: 'Internal',
    retentionPolicyDefined: true,
    loggingRequired: true,
    accessControlsDefined: true,
    modelDefinitionTrigger: true,
    explainabilityRequired: true,
    changeFrequency: 'Quarterly',
    retraining: true,
    overridesAllowed: true,
    fallbackPlanDefined: true,
    monitoringCadence: 'Weekly',
    humanReviewProcess: 'Collections manager reviews priority queue',
    incidentResponseContact: 'collections@example.com',
  },
  {
    title: 'Marketing Copy Assistant',
    businessLine: 'Marketing',
    description: 'GenAI tool to help marketing team draft promotional copy for campaigns. Generates initial drafts that are reviewed and edited by marketing staff.',
    aiType: 'GenAI',
    usageType: 'Automation',
    humanInLoop: 'Required',
    customerImpact: 'None',
    regulatoryDomains: ['Consumer Protection'],
    deployment: 'Internal tool',
    vendorInvolved: true,
    vendorName: 'OpenAI',
    containsPii: false,
    containsNpi: false,
    sensitiveAttributesUsed: false,
    trainingDataSource: 'N/A',
    retentionPolicyDefined: true,
    loggingRequired: false,
    accessControlsDefined: true,
    modelDefinitionTrigger: false,
    explainabilityRequired: false,
    changeFrequency: 'Continuous',
    retraining: false,
    overridesAllowed: true,
    fallbackPlanDefined: true,
    monitoringCadence: 'Monthly',
    humanReviewProcess: 'All content reviewed by marketing and compliance',
    incidentResponseContact: 'marketing@example.com',
  },
  {
    title: 'Call Center Agent Assist',
    businessLine: 'Customer Service',
    description: 'Real-time GenAI assistant that provides suggested responses and information retrieval for call center agents during customer interactions.',
    aiType: 'GenAI',
    usageType: 'Advisory',
    humanInLoop: 'Required',
    customerImpact: 'Direct',
    regulatoryDomains: ['Consumer Protection', 'Privacy'],
    deployment: 'Customer-facing',
    vendorInvolved: true,
    vendorName: 'ContactAI Solutions',
    containsPii: true,
    containsNpi: true,
    sensitiveAttributesUsed: false,
    trainingDataSource: 'Internal',
    retentionPolicyDefined: true,
    loggingRequired: true,
    accessControlsDefined: true,
    modelDefinitionTrigger: false,
    explainabilityRequired: true,
    changeFrequency: 'Monthly',
    retraining: false,
    overridesAllowed: true,
    fallbackPlanDefined: true,
    monitoringCadence: 'Weekly',
    humanReviewProcess: 'Agent validates all AI suggestions before use',
    incidentResponseContact: 'contact-center@example.com',
  },
  // NEW: Use cases with different statuses for demo
  {
    title: 'Customer Churn Prediction Model',
    businessLine: 'Marketing',
    description: 'ML model to predict customer churn likelihood and enable proactive retention campaigns. Currently being documented.',
    aiType: 'Traditional ML',
    usageType: 'Advisory',
    humanInLoop: 'Optional',
    customerImpact: 'Indirect',
    regulatoryDomains: ['Consumer Protection'],
    deployment: 'Internal tool',
    vendorInvolved: false,
    containsPii: true,
    containsNpi: false,
    sensitiveAttributesUsed: false,
    trainingDataSource: 'Internal',
    retentionPolicyDefined: true,
    loggingRequired: true,
    accessControlsDefined: true,
    modelDefinitionTrigger: true,
    explainabilityRequired: true,
    changeFrequency: 'Quarterly',
    retraining: true,
    overridesAllowed: true,
    fallbackPlanDefined: true,
    monitoringCadence: 'Weekly',
    humanReviewProcess: 'Marketing team reviews predictions before outreach',
    incidentResponseContact: 'marketing-analytics@example.com',
    // This will be a draft - incomplete intake
    seedStatus: 'Draft',
  },
  {
    title: 'Regulatory Document Classifier',
    businessLine: 'Compliance',
    description: 'NLP model to automatically classify and route incoming regulatory documents to appropriate teams. Sent back for additional documentation.',
    aiType: 'Traditional ML',
    usageType: 'Automation',
    humanInLoop: 'Required',
    customerImpact: 'None',
    regulatoryDomains: ['Privacy', 'Consumer Protection'],
    deployment: 'Internal tool',
    vendorInvolved: false,
    containsPii: false,
    containsNpi: false,
    sensitiveAttributesUsed: false,
    trainingDataSource: 'Internal',
    retentionPolicyDefined: true,
    loggingRequired: true,
    accessControlsDefined: true,
    modelDefinitionTrigger: true,
    explainabilityRequired: false,
    changeFrequency: 'Quarterly',
    retraining: true,
    overridesAllowed: true,
    fallbackPlanDefined: true,
    monitoringCadence: 'Monthly',
    humanReviewProcess: 'Compliance officer reviews classifications',
    incidentResponseContact: 'compliance-ops@example.com',
    // This will be sent back for revision
    seedStatus: 'Revision Requested',
    revisionNotes: 'Please provide additional documentation on the training data source and model validation approach. Also clarify the escalation process for misclassified documents.',
  },
  {
    title: 'Loan Pricing Optimization Tool',
    businessLine: 'Credit',
    description: 'Optimization model for competitive loan pricing based on risk profiles and market conditions. Under MRM review.',
    aiType: 'Traditional ML',
    usageType: 'Advisory',
    humanInLoop: 'Required',
    customerImpact: 'Indirect',
    regulatoryDomains: ['Lending', 'Credit', 'Fair Lending'],
    deployment: 'Internal tool',
    vendorInvolved: false,
    containsPii: true,
    containsNpi: true,
    sensitiveAttributesUsed: false,
    trainingDataSource: 'Internal',
    retentionPolicyDefined: true,
    loggingRequired: true,
    accessControlsDefined: true,
    modelDefinitionTrigger: true,
    explainabilityRequired: true,
    changeFrequency: 'Monthly',
    retraining: true,
    overridesAllowed: true,
    fallbackPlanDefined: true,
    monitoringCadence: 'Weekly',
    humanReviewProcess: 'Pricing committee reviews recommendations',
    incidentResponseContact: 'pricing-team@example.com',
    // This stays as Submitted (pending review)
    seedStatus: 'Submitted',
  },
];

// Inventory seed data with varied scenarios
const inventorySeeds = [
  {
    useCaseTitle: 'Credit Underwriting Model Refresh',
    inventoryNumber: 'MDL-2024-001',
    tier: 'T3',
    validatedBeforeProduction: true,
    productionDate: new Date('2023-01-15'),
    lastValidationDate: new Date(Date.now() - 11 * 30 * 24 * 60 * 60 * 1000),
    validations: [
      {
        type: 'Initial',
        date: new Date('2023-01-10'),
        result: 'Satisfactory',
        validator: 'MRM Team',
        notes: 'Initial validation completed. Model meets all requirements.',
        findings: [],
      },
      {
        type: 'Periodic',
        date: new Date(Date.now() - 11 * 30 * 24 * 60 * 60 * 1000),
        result: 'Satisfactory with Findings',
        validator: 'External Validator',
        notes: 'Annual validation identified minor documentation gap.',
        findings: [
          {
            number: 'F-001',
            title: 'Documentation Gap - Feature Engineering Process',
            description: 'The feature engineering documentation lacks detail on variable transformations applied to income and debt-to-income ratios.',
            severity: 'Medium',
            category: 'Documentation',
            status: 'In Progress',
            remediationNotes: null,
            mrmSignedOff: false,
          },
        ],
      },
    ],
  },
  {
    useCaseTitle: 'Vendor Fraud Score Integration',
    inventoryNumber: 'MDL-2024-002',
    tier: 'T3',
    validatedBeforeProduction: false,
    productionDate: new Date('2023-06-01'),
    lastValidationDate: new Date(Date.now() - 14 * 30 * 24 * 60 * 60 * 1000),
    validations: [
      {
        type: 'Initial',
        date: new Date('2023-06-15'),
        result: 'Satisfactory with Findings',
        validator: 'MRM Team',
        notes: 'Model deployed without initial validation - retroactive review completed.',
        findings: [
          {
            number: 'F-001',
            title: 'Pre-Production Validation Not Completed',
            description: 'Model was deployed to production without completing the required pre-production validation. This is a critical control gap.',
            severity: 'Critical',
            category: 'Controls',
            status: 'Open',
            remediationNotes: null,
            mrmSignedOff: false,
          },
        ],
      },
      {
        type: 'Periodic',
        date: new Date(Date.now() - 14 * 30 * 24 * 60 * 60 * 1000),
        result: 'Satisfactory with Findings',
        validator: 'External Validator',
        notes: 'Annual validation found vendor transparency issues.',
        findings: [
          {
            number: 'F-001',
            title: 'Vendor Model Transparency Issues',
            description: 'Unable to obtain sufficient detail from vendor on model methodology and variable definitions.',
            severity: 'High',
            category: 'Documentation',
            status: 'In Progress',
            remediationNotes: 'Working with vendor to obtain additional documentation.',
            mrmSignedOff: false,
          },
          {
            number: 'F-002',
            title: 'Monitoring Threshold Calibration',
            description: 'Alert thresholds have not been calibrated since initial deployment. May be generating excess false positives.',
            severity: 'Medium',
            category: 'Performance',
            status: 'Remediated',
            remediationNotes: 'Thresholds recalibrated based on 12-month performance analysis. False positive rate reduced by 23%.',
            remediatedBy: 'Fraud Operations Team',
            remediatedAt: new Date(Date.now() - 2 * 30 * 24 * 60 * 60 * 1000),
            mrmSignedOff: true,
            mrmSignOffBy: 'Model Risk Manager',
            mrmSignOffDate: new Date(Date.now() - 1 * 30 * 24 * 60 * 60 * 1000),
            mrmSignOffNotes: 'Verified threshold recalibration methodology and results. Approved.',
          },
        ],
      },
    ],
  },
  {
    useCaseTitle: 'AML Alert Narrative Summarizer',
    inventoryNumber: 'MDL-2024-003',
    tier: 'T2',
    validatedBeforeProduction: true,
    productionDate: new Date('2024-03-01'),
    lastValidationDate: new Date(Date.now() - 10 * 30 * 24 * 60 * 60 * 1000),
    validations: [
      {
        type: 'Initial',
        date: new Date('2024-03-01'),
        result: 'Satisfactory',
        validator: 'MRM Team',
        notes: 'GenAI model validated with appropriate guardrails and human oversight.',
        findings: [],
      },
    ],
  },
  {
    useCaseTitle: 'Collections Prioritization Model',
    inventoryNumber: 'MDL-2024-004',
    tier: 'T3',
    validatedBeforeProduction: true,
    productionDate: new Date('2022-09-01'),
    lastValidationDate: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000),
    validations: [
      {
        type: 'Initial',
        date: new Date('2022-08-15'),
        result: 'Satisfactory',
        validator: 'MRM Team',
        notes: 'Initial validation passed.',
        findings: [],
      },
      {
        type: 'Periodic',
        date: new Date('2023-09-01'),
        result: 'Satisfactory',
        validator: 'MRM Team',
        notes: 'First annual review completed without findings.',
        findings: [],
      },
      {
        type: 'Periodic',
        date: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000),
        result: 'Satisfactory',
        validator: 'External Validator',
        notes: 'Model continues to perform within acceptable thresholds.',
        findings: [],
      },
    ],
  },
  {
    useCaseTitle: 'Policy RAG Assistant',
    inventoryNumber: 'MDL-2024-005',
    tier: 'T1',
    validatedBeforeProduction: true,
    productionDate: new Date('2024-06-01'),
    lastValidationDate: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000),
    validations: [
      {
        type: 'Initial',
        date: new Date('2024-06-01'),
        result: 'Satisfactory',
        validator: 'MRM Team',
        notes: 'Low-risk internal tool validated. Appropriate for T1 classification.',
        findings: [],
      },
    ],
  },
  {
    useCaseTitle: 'Call Center Agent Assist',
    inventoryNumber: 'MDL-2024-006',
    tier: 'T2',
    validatedBeforeProduction: true,
    productionDate: new Date('2024-01-15'),
    lastValidationDate: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000),
    validations: [
      {
        type: 'Initial',
        date: new Date('2024-01-15'),
        result: 'Satisfactory',
        validator: 'MRM Team',
        notes: 'Vendor GenAI model validated with appropriate guardrails.',
        findings: [],
      },
    ],
  },
  {
    useCaseTitle: 'Marketing Copy Assistant',
    inventoryNumber: 'MDL-2024-007',
    tier: 'T1',
    validatedBeforeProduction: false,
    productionDate: new Date('2023-03-01'),
    lastValidationDate: null,
    validations: [],
  },
];

// POST /api/admin/seed-all - Seed ALL demo data at once
export async function POST() {
  try {
    // Step 1: Clear ALL existing data
    await prisma.validationFinding.deleteMany();
    await prisma.validation.deleteMany();
    await prisma.inventoryModel.deleteMany();
    await prisma.auditEvent.deleteMany();
    await prisma.decision.deleteMany();
    await prisma.attachment.deleteMany();
    await prisma.useCase.deleteMany();

    // Step 2: Create use cases with attachments
    const createdUseCases: Map<string, { id: string; decision: { requiredArtifacts: string } | null }> = new Map();
    let totalAttachments = 0;

    for (const data of demoUseCases) {
      const useCase = await prisma.useCase.create({
        data: {
          title: data.title,
          businessLine: data.businessLine,
          description: data.description,
          aiType: data.aiType,
          usageType: data.usageType,
          humanInLoop: data.humanInLoop,
          customerImpact: data.customerImpact,
          regulatoryDomains: JSON.stringify(data.regulatoryDomains),
          deployment: data.deployment,
          vendorInvolved: data.vendorInvolved,
          vendorName: data.vendorName || null,
          containsPii: data.containsPii,
          containsNpi: data.containsNpi,
          sensitiveAttributesUsed: data.sensitiveAttributesUsed,
          trainingDataSource: data.trainingDataSource,
          retentionPolicyDefined: data.retentionPolicyDefined,
          loggingRequired: data.loggingRequired,
          accessControlsDefined: data.accessControlsDefined,
          modelDefinitionTrigger: data.modelDefinitionTrigger,
          explainabilityRequired: data.explainabilityRequired,
          changeFrequency: data.changeFrequency,
          retraining: data.retraining,
          overridesAllowed: data.overridesAllowed,
          fallbackPlanDefined: data.fallbackPlanDefined,
          monitoringCadence: data.monitoringCadence,
          humanReviewProcess: data.humanReviewProcess,
          incidentResponseContact: data.incidentResponseContact,
          status: (data as { seedStatus?: string }).seedStatus || 'Submitted',
          createdBy: 'demo-user',
        },
        include: {
          attachments: true,
        },
      });

      // Create audit event for creation
      await prisma.auditEvent.create({
        data: {
          useCaseId: useCase.id,
          actor: 'demo-user',
          eventType: 'Created',
          details: JSON.stringify({ source: 'demo-seed' }),
        },
      });

      // Run decision engine
      const decisionResult = evaluateUseCase(useCase as unknown as UseCaseWithRelations);

      // Save decision
      const decision = await prisma.decision.create({
        data: {
          useCaseId: useCase.id,
          isModel: decisionResult.isModel,
          tier: decisionResult.tier,
          triggeredRules: JSON.stringify(decisionResult.triggeredRules),
          rationaleSummary: decisionResult.rationaleSummary,
          requiredArtifacts: JSON.stringify(decisionResult.requiredArtifacts),
          missingEvidence: JSON.stringify(decisionResult.missingEvidence),
          riskFlags: JSON.stringify(decisionResult.riskFlags),
        },
      });

      // Create audit event for decision
      await prisma.auditEvent.create({
        data: {
          useCaseId: useCase.id,
          actor: 'system',
          eventType: 'DecisionGenerated',
          details: JSON.stringify({
            tier: decisionResult.tier,
            isModel: decisionResult.isModel,
          }),
        },
      });

      // Create sample attachments for ALL required artifacts (100% completion for better demo)
      const requiredArtifacts = decisionResult.requiredArtifacts || [];

      // For inventory models, submit 100% of artifacts. For others, submit 40-70%
      const inventorySeed = inventorySeeds.find(s => s.useCaseTitle === data.title);
      const submitRatio = inventorySeed ? 1.0 : (0.4 + Math.random() * 0.3);
      const numToSubmit = Math.floor(requiredArtifacts.length * submitRatio);

      // Shuffle and take a subset
      const shuffled = [...requiredArtifacts].sort(() => Math.random() - 0.5);
      const artifactsToSubmit = shuffled.slice(0, numToSubmit);

      for (const artifactId of artifactsToSubmit) {
        const artifactName = getArtifactName(artifactId);
        const filename = `${artifactId}.pdf`;

        await prisma.attachment.create({
          data: {
            useCaseId: useCase.id,
            filename: filename,
            type: artifactName,
            artifactId: artifactId,
            storagePath: `/sample-artifacts/${filename}`,
            fileSize: 15000 + Math.floor(Math.random() * 10000),
            mimeType: 'application/pdf',
          },
        });

        // Create audit event for attachment
        await prisma.auditEvent.create({
          data: {
            useCaseId: useCase.id,
            actor: 'demo-user',
            eventType: 'AttachmentUploaded',
            details: JSON.stringify({
              artifactId,
              filename,
              type: artifactName,
            }),
          },
        });

        totalAttachments++;
      }

      // Update missingEvidence based on actual uploads and cache artifact review
      const actualMissing = requiredArtifacts.filter(
        (artifactId: string) => !artifactsToSubmit.includes(artifactId)
      );

      const completedCount = artifactsToSubmit.length;
      const totalRequired = requiredArtifacts.length;

      const artifactReview = {
        summary: totalRequired === 0
          ? 'No artifacts are required for this use case.'
          : completedCount === totalRequired
            ? `All ${totalRequired} required artifacts have been uploaded and are ready for review.`
            : `${completedCount} of ${totalRequired} required artifacts have been uploaded. ${totalRequired - completedCount} artifact(s) still pending.`,
        completionPercentage: totalRequired > 0 ? Math.round((completedCount / totalRequired) * 100) : 100,
        artifactStatus: Object.fromEntries(
          requiredArtifacts.map((id: string) => [id, {
            required: true,
            uploaded: artifactsToSubmit.includes(id),
            filename: artifactsToSubmit.includes(id) ? `${id}.pdf` : undefined,
          }])
        ),
        recommendations: completedCount < totalRequired
          ? ['Please ensure all required artifacts are uploaded before approval.']
          : ['All required artifacts have been uploaded.'],
        readyForApproval: completedCount === totalRequired,
        generatedAt: new Date().toISOString(),
        aiPowered: false,
      };

      // Update decision with correct missingEvidence and cached artifact review
      await prisma.decision.update({
        where: { id: decision.id },
        data: {
          missingEvidence: JSON.stringify(actualMissing),
          aiInsights: JSON.stringify({ artifactReview }),
        },
      });

      createdUseCases.set(data.title, { id: useCase.id, decision });
    }

    // Step 3: Create inventory models with validations and findings
    const createdModels = [];

    for (const seed of inventorySeeds) {
      const useCaseData = createdUseCases.get(seed.useCaseTitle);
      if (!useCaseData) {
        console.log(`Use case not found: ${seed.useCaseTitle}`);
        continue;
      }

      // Update use case status to Approved
      await prisma.useCase.update({
        where: { id: useCaseData.id },
        data: {
          status: 'Approved',
          reviewedBy: 'Model Risk Manager',
          reviewedAt: new Date(),
        },
      });

      // Calculate validation frequency and next due date
      const frequencyMonths = getValidationFrequency(seed.tier);
      const lastValidation = seed.lastValidationDate;
      const nextDue = lastValidation
        ? new Date(new Date(lastValidation).setMonth(new Date(lastValidation).getMonth() + frequencyMonths))
        : new Date(new Date(seed.productionDate).setMonth(new Date(seed.productionDate).getMonth() + frequencyMonths));

      // Create inventory model
      const inventoryModel = await prisma.inventoryModel.create({
        data: {
          useCaseId: useCaseData.id,
          inventoryNumber: seed.inventoryNumber,
          addedBy: 'Model Risk Manager',
          tier: seed.tier,
          validationFrequencyMonths: frequencyMonths,
          productionDate: seed.productionDate,
          validatedBeforeProduction: seed.validatedBeforeProduction,
          lastValidationDate: seed.lastValidationDate,
          nextValidationDue: nextDue,
          status: 'Active',
        },
      });

      // Create validations and findings
      for (const val of seed.validations) {
        const validation = await prisma.validation.create({
          data: {
            inventoryModelId: inventoryModel.id,
            validationType: val.type,
            validationDate: val.date,
            validatedBy: val.validator,
            status: 'Completed',
            overallResult: val.result,
            summaryNotes: val.notes,
          },
        });

        // Create findings for this validation
        for (const finding of val.findings) {
          await prisma.validationFinding.create({
            data: {
              validationId: validation.id,
              findingNumber: finding.number,
              title: finding.title,
              description: finding.description,
              severity: finding.severity,
              category: finding.category,
              remediationStatus: finding.status,
              remediationNotes: finding.remediationNotes,
              remediatedBy: (finding as { remediatedBy?: string }).remediatedBy || null,
              remediatedAt: (finding as { remediatedAt?: Date }).remediatedAt || null,
              mrmSignedOff: finding.mrmSignedOff,
              mrmSignOffBy: (finding as { mrmSignOffBy?: string }).mrmSignOffBy || null,
              mrmSignOffDate: (finding as { mrmSignOffDate?: Date }).mrmSignOffDate || null,
              mrmSignOffNotes: (finding as { mrmSignOffNotes?: string }).mrmSignOffNotes || null,
            },
          });
        }
      }

      createdModels.push(inventoryModel);
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${createdUseCases.size} use cases, ${createdModels.length} inventory models, and ${totalAttachments} artifacts`,
      useCases: createdUseCases.size,
      inventoryModels: createdModels.length,
      artifacts: totalAttachments,
    });
  } catch (error) {
    console.error('Error seeding all demo data:', error);
    return NextResponse.json(
      { error: 'Failed to seed demo data', details: String(error) },
      { status: 500 }
    );
  }
}

// GET /api/admin/seed-all - Redirect to POST for browser usage
export async function GET() {
  return POST();
}
