// Policy Apply API - Apply policy changes to the system

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { applyPolicyChanges } from '@/lib/policy/re-tier';
import { saveValidationFrequencies } from '@/lib/config-loader';
import type { ValidationFrequencies } from '@/lib/policy/types';

// POST /api/policy/[id]/apply - Apply the policy changes
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { approvedBy = 'mrm-user' } = body;

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
        { error: 'Policy must be analyzed before applying' },
        { status: 400 }
      );
    }

    if (!policy.validationFreqs) {
      return NextResponse.json(
        { error: 'Policy has no validation frequencies to apply' },
        { status: 400 }
      );
    }

    const validationFrequencies = JSON.parse(policy.validationFreqs) as ValidationFrequencies;

    // First, mark as approved if not already
    if (policy.status !== 'Approved') {
      await prisma.policyVersion.update({
        where: { id },
        data: {
          status: 'Approved',
          approvedBy,
          approvedAt: new Date(),
        },
      });
    }

    // Save validation frequencies to database (makes them active)
    await saveValidationFrequencies(validationFrequencies, id, approvedBy);

    // Apply changes to inventory models
    const result = await applyPolicyChanges(validationFrequencies, id, approvedBy);

    // Archive any previously applied policies
    await prisma.policyVersion.updateMany({
      where: {
        status: 'Applied',
        id: { not: id },
      },
      data: {
        status: 'Archived',
      },
    });

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? `Policy applied successfully. ${result.modelsUpdated} models updated.`
        : 'Policy application completed with some errors.',
      result,
    });
  } catch (error) {
    console.error('Error applying policy:', error);
    return NextResponse.json(
      { error: 'Failed to apply policy' },
      { status: 500 }
    );
  }
}
