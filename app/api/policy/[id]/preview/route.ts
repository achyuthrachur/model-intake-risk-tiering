// Policy Preview API - Preview impact of applying policy changes

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { previewReTiering, summarizePreview } from '@/lib/policy/re-tier';
import { formatPolicyDiffForDisplay, hasSignificantChanges } from '@/lib/policy/diff';
import type { ValidationFrequencies, PolicyDiffResult } from '@/lib/policy/types';

// GET /api/policy/[id]/preview - Preview changes from applying this policy
export async function GET(
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

    if (policy.status !== 'Analyzed' && policy.status !== 'Approved') {
      return NextResponse.json(
        { error: 'Policy must be analyzed before preview' },
        { status: 400 }
      );
    }

    if (!policy.validationFreqs) {
      return NextResponse.json(
        { error: 'Policy has no validation frequencies extracted' },
        { status: 400 }
      );
    }

    const validationFrequencies = JSON.parse(policy.validationFreqs) as ValidationFrequencies;
    const diff = policy.changesSummary
      ? JSON.parse(policy.changesSummary) as PolicyDiffResult
      : null;

    // Get preview of affected models
    const affectedModels = await previewReTiering(validationFrequencies);
    const summary = summarizePreview(affectedModels);

    // Format diff for display
    const formattedDiff = diff ? formatPolicyDiffForDisplay(diff) : null;
    const hasChanges = diff ? hasSignificantChanges(diff) : affectedModels.length > 0;

    return NextResponse.json({
      policyId: id,
      policyName: policy.name,
      status: policy.status,
      validationFrequencies,
      diff: formattedDiff,
      affectedModels,
      summary: {
        ...summary,
        hasSignificantChanges: hasChanges,
      },
      canApply: policy.status === 'Approved' || policy.status === 'Analyzed',
    });
  } catch (error) {
    console.error('Error previewing policy:', error);
    return NextResponse.json(
      { error: 'Failed to preview policy changes' },
      { status: 500 }
    );
  }
}
