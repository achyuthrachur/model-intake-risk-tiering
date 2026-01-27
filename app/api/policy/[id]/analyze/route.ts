// Policy Analyze API - Analyze policy document with AI

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import {
  analyzePolicyDocument,
  parseKnownPolicyFormat,
  DEFAULT_VALIDATION_FREQUENCIES,
} from '@/lib/policy/analyzer';
import { generatePolicyDiff } from '@/lib/policy/diff';
import { isAIEnabled } from '@/lib/ai/config';

// POST /api/policy/[id]/analyze - Analyze policy and extract rules
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get the policy
    const policy = await prisma.policyVersion.findUnique({
      where: { id },
    });

    if (!policy) {
      return NextResponse.json(
        { error: 'Policy not found' },
        { status: 404 }
      );
    }

    if (!policy.documentContent) {
      return NextResponse.json(
        { error: 'Policy has no document content to analyze' },
        { status: 400 }
      );
    }

    let analysisResult;
    let validationFrequencies;

    // Try AI analysis first, fall back to simple parsing
    if (isAIEnabled()) {
      try {
        analysisResult = await analyzePolicyDocument(policy.documentContent);
        validationFrequencies = analysisResult.validationFrequencies;
      } catch (aiError) {
        console.error('AI analysis failed, using simple parsing:', aiError);
        // Fall back to simple parsing
        const parsed = parseKnownPolicyFormat(policy.documentContent);
        validationFrequencies = parsed.frequencies;
        analysisResult = {
          validationFrequencies: parsed.frequencies,
          tiers: {},
          rules: [],
          newRules: [],
          modifiedRules: [],
          extractionConfidence: 0.7,
          notes: ['Used simple parsing (AI not available)'],
        };
      }
    } else {
      // No AI, use simple parsing
      const parsed = parseKnownPolicyFormat(policy.documentContent);
      validationFrequencies = parsed.frequencies;
      analysisResult = {
        validationFrequencies: parsed.frequencies,
        tiers: {},
        rules: [],
        newRules: [],
        modifiedRules: [],
        extractionConfidence: 0.7,
        notes: ['Used simple parsing (AI not enabled)'],
      };
    }

    // Identify new rules markers in the document
    const newRuleMarkers: string[] = [];
    const elevatedRules: Array<{ id: string; name: string; from: string; to: string }> = [];

    // Check for [NEW] markers
    if (policy.documentContent.includes('[NEW]')) {
      // PII + Customer-facing elevated to T3
      if (policy.documentContent.includes('PII with Customer-Facing') ||
          policy.documentContent.includes('PII + Customer-Facing')) {
        newRuleMarkers.push('R_PII_CUSTOMER_FACING');
        elevatedRules.push({
          id: 'R_PII_PROCESSING',
          name: 'PII Processing',
          from: 'T2',
          to: 'T3 (when customer-facing)',
        });
      }

      // Vendor + Regulated elevated to T3
      if (policy.documentContent.includes('Vendor Model in Regulated') ||
          policy.documentContent.includes('Vendor + Regulated')) {
        newRuleMarkers.push('R_VENDOR_REGULATED');
        elevatedRules.push({
          id: 'R_VENDOR_MODEL',
          name: 'Vendor Model',
          from: 'T2',
          to: 'T3 (when in regulated domain)',
        });
      }

      // High-volume customer transactions
      if (policy.documentContent.includes('High-Volume Customer')) {
        newRuleMarkers.push('R_HIGH_VOLUME_CUSTOMER');
      }
    }

    // Generate diff with current config
    const diff = generatePolicyDiff(validationFrequencies, newRuleMarkers, elevatedRules);

    // Update the policy with analysis results
    await prisma.policyVersion.update({
      where: { id },
      data: {
        validationFreqs: JSON.stringify(validationFrequencies),
        extractedRules: JSON.stringify(analysisResult.rules || []),
        analysisResult: JSON.stringify(analysisResult),
        changesSummary: JSON.stringify(diff),
        status: 'Analyzed',
        analyzedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
      validationFrequencies,
      diff,
      newRules: newRuleMarkers,
      elevatedRules,
    });
  } catch (error) {
    console.error('Error analyzing policy:', error);
    return NextResponse.json(
      { error: 'Failed to analyze policy' },
      { status: 500 }
    );
  }
}
