import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { evaluateUseCase } from '@/lib/rules-engine';
import type { UseCaseWithRelations } from '@/lib/types';
import { loadArtifactsConfig } from '@/lib/config-loader';

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
  {
    title: 'Transaction Monitoring Rule Optimization',
    businessLine: 'AML',
    description: 'ML-enhanced optimization of transaction monitoring rules to improve alert quality. Analyzes historical alert dispositions to suggest threshold adjustments.',
    aiType: 'Hybrid',
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
    modelDefinitionTrigger: true,
    explainabilityRequired: true,
    changeFrequency: 'Quarterly',
    retraining: true,
    overridesAllowed: true,
    fallbackPlanDefined: true,
    monitoringCadence: 'Monthly',
    humanReviewProcess: 'All tuning changes approved by BSA Officer',
    incidentResponseContact: 'aml-technology@example.com',
  },
];

// POST /api/admin/seed - Seed demo data
export async function POST() {
  try {
    // Clear existing data
    await prisma.auditEvent.deleteMany();
    await prisma.decision.deleteMany();
    await prisma.attachment.deleteMany();
    await prisma.useCase.deleteMany();

    // Create use cases
    const createdUseCases = [];
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
          status: 'Submitted',
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
      await prisma.decision.create({
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

      // Create sample attachments for some of the required artifacts
      // Simulate that some artifacts have been submitted
      const requiredArtifacts = decisionResult.requiredArtifacts || [];

      // Submit 40-70% of required artifacts randomly
      const submitRatio = 0.4 + Math.random() * 0.3;
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
            fileSize: 15000 + Math.floor(Math.random() * 10000), // Random size 15-25KB
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

      createdUseCases.push(useCase);
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdUseCases.length} demo use cases with ${totalAttachments} sample artifacts`,
      count: createdUseCases.length,
      attachments: totalAttachments,
    });
  } catch (error) {
    console.error('Error seeding demo data:', error);
    return NextResponse.json(
      { error: 'Failed to seed demo data', details: String(error) },
      { status: 500 }
    );
  }
}
