import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Sample demo use cases
const demoUseCases = [
  {
    title: 'Credit Risk Scoring Model',
    businessLine: 'Consumer Lending',
    description: 'Machine learning model that predicts the probability of default for consumer loan applications. Uses historical payment data, credit bureau information, and application features to generate a risk score.',
    aiType: 'Traditional ML',
    usageType: 'Decisioning',
    humanInLoop: 'Required',
    customerImpact: 'Direct',
    regulatoryDomains: JSON.stringify(['Fair Lending', 'Privacy', 'Consumer Protection']),
    deployment: 'Customer-facing',
    vendorInvolved: false,
    intendedUsers: 'Credit Analysts, Loan Officers',
    downstreamDecisions: 'Loan approval/denial, pricing, credit limits',
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
    monitoringCadence: 'Daily',
    humanReviewProcess: 'Manual review required for edge cases and high-value applications',
    incidentResponseContact: 'model-risk-team@company.com',
  },
  {
    title: 'Customer Churn Prediction',
    businessLine: 'Marketing Analytics',
    description: 'Predictive model identifying customers at high risk of churning within the next 90 days. Used to trigger retention campaigns and personalized offers.',
    aiType: 'Traditional ML',
    usageType: 'Advisory',
    humanInLoop: 'Optional',
    customerImpact: 'Indirect',
    regulatoryDomains: JSON.stringify(['Privacy']),
    deployment: 'Internal tool',
    vendorInvolved: false,
    intendedUsers: 'Marketing Team, Customer Success',
    downstreamDecisions: 'Retention campaign targeting, offer personalization',
    containsPii: true,
    containsNpi: false,
    sensitiveAttributesUsed: false,
    trainingDataSource: 'Internal',
    retentionPolicyDefined: true,
    loggingRequired: false,
    accessControlsDefined: true,
    modelDefinitionTrigger: false,
    explainabilityRequired: false,
    changeFrequency: 'Monthly',
    retraining: true,
    overridesAllowed: true,
    fallbackPlanDefined: false,
    monitoringCadence: 'Weekly',
    humanReviewProcess: 'Marketing team reviews recommendations weekly',
    incidentResponseContact: 'analytics@company.com',
  },
  {
    title: 'Document Classification GenAI',
    businessLine: 'Operations',
    description: 'Large language model that automatically classifies and routes incoming documents to appropriate processing queues based on content analysis.',
    aiType: 'GenAI',
    usageType: 'Automation',
    humanInLoop: 'Required',
    customerImpact: 'None',
    regulatoryDomains: JSON.stringify(['Privacy']),
    deployment: 'Internal tool',
    vendorInvolved: true,
    vendorName: 'OpenAI',
    intendedUsers: 'Operations Staff',
    downstreamDecisions: 'Document routing, processing priority',
    containsPii: true,
    containsNpi: true,
    sensitiveAttributesUsed: false,
    trainingDataSource: 'Vendor',
    retentionPolicyDefined: true,
    loggingRequired: true,
    accessControlsDefined: true,
    modelDefinitionTrigger: true,
    explainabilityRequired: false,
    changeFrequency: 'Ad hoc',
    retraining: false,
    overridesAllowed: true,
    fallbackPlanDefined: true,
    monitoringCadence: 'Daily',
    humanReviewProcess: 'Operators verify classification before final routing',
    incidentResponseContact: 'ops-support@company.com',
  },
  {
    title: 'Fraud Detection System',
    businessLine: 'Risk Management',
    description: 'Real-time transaction monitoring system using ensemble ML models to detect potentially fraudulent activities. Generates alerts for investigation team.',
    aiType: 'Hybrid',
    usageType: 'Decisioning',
    humanInLoop: 'Required',
    customerImpact: 'Direct',
    regulatoryDomains: JSON.stringify(['AML/BSA', 'Consumer Protection']),
    deployment: 'Customer-facing',
    vendorInvolved: false,
    intendedUsers: 'Fraud Analysts, Risk Team',
    downstreamDecisions: 'Transaction block/allow, account holds, investigation triggers',
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
    monitoringCadence: 'Daily',
    humanReviewProcess: 'All high-risk alerts require analyst review within 24 hours',
    incidentResponseContact: 'fraud-ops@company.com',
  },
  {
    title: 'Invoice Processing RPA',
    businessLine: 'Finance',
    description: 'Robotic process automation bot that extracts data from vendor invoices, validates against purchase orders, and routes for approval.',
    aiType: 'Rules',
    usageType: 'Automation',
    humanInLoop: 'Optional',
    customerImpact: 'None',
    regulatoryDomains: JSON.stringify([]),
    deployment: 'Internal tool',
    vendorInvolved: true,
    vendorName: 'UiPath',
    intendedUsers: 'Accounts Payable Team',
    downstreamDecisions: 'Invoice approval routing, payment scheduling',
    containsPii: false,
    containsNpi: false,
    sensitiveAttributesUsed: false,
    trainingDataSource: 'N/A',
    retentionPolicyDefined: true,
    loggingRequired: false,
    accessControlsDefined: true,
    modelDefinitionTrigger: false,
    explainabilityRequired: false,
    changeFrequency: 'Ad hoc',
    retraining: false,
    overridesAllowed: true,
    fallbackPlanDefined: true,
    monitoringCadence: 'Weekly',
    humanReviewProcess: 'Exceptions and mismatches require manual review',
    incidentResponseContact: 'ap-team@company.com',
  },
];

// POST /api/usecases/demo - Generate a random demo use case
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { type = 'random' } = body;

    // Select a demo use case
    let selectedDemo;
    if (type === 'random') {
      selectedDemo = demoUseCases[Math.floor(Math.random() * demoUseCases.length)];
    } else {
      selectedDemo = demoUseCases.find((d) =>
        d.title.toLowerCase().includes(type.toLowerCase()) ||
        d.aiType.toLowerCase() === type.toLowerCase()
      ) || demoUseCases[0];
    }

    // Create the use case
    const useCase = await prisma.useCase.create({
      data: {
        ...selectedDemo,
        status: 'Draft',
        createdBy: 'demo-user',
      },
    });

    // Create audit event
    await prisma.auditEvent.create({
      data: {
        useCaseId: useCase.id,
        actor: 'demo-user',
        eventType: 'Created',
        details: JSON.stringify({ synthetic: true, template: selectedDemo.title }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Created demo use case: ${useCase.title}`,
      useCase,
    });
  } catch (error) {
    console.error('Error creating demo use case:', error);
    return NextResponse.json(
      { error: 'Failed to create demo use case', details: String(error) },
      { status: 500 }
    );
  }
}
