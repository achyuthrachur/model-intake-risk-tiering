// Synthetic Policies API - Load pre-defined demo policies

import { NextResponse } from 'next/server';
import { loadSyntheticPolicy, listSyntheticPolicies } from '@/lib/config-loader';
import prisma from '@/lib/db';

// GET /api/policy/synthetic - List available synthetic policies
export async function GET() {
  try {
    const policies = listSyntheticPolicies();
    return NextResponse.json({ policies });
  } catch (error) {
    console.error('Error listing synthetic policies:', error);
    return NextResponse.json(
      { error: 'Failed to list synthetic policies' },
      { status: 500 }
    );
  }
}

// POST /api/policy/synthetic - Load a synthetic policy and create a draft
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { policyType, createdBy = 'mrm-user' } = body;

    if (!policyType || !['current', 'updated'].includes(policyType)) {
      return NextResponse.json(
        { error: 'Invalid policy type. Must be "current" or "updated"' },
        { status: 400 }
      );
    }

    // Load the synthetic policy content
    const documentContent = loadSyntheticPolicy(policyType);

    // Determine name and description based on type
    const isUpdated = policyType === 'updated';
    const name = isUpdated
      ? 'MRM Policy v2.0 - Enhanced Governance'
      : 'MRM Policy v1.0 - Current';
    const description = isUpdated
      ? 'Enhanced policy with stricter validation frequencies (T3=6mo, T2=12mo, T1=24mo) and new elevation rules for PII and vendor models'
      : 'Current active policy matching existing tiering rules (T3=12mo, T2=24mo, T1=36mo)';

    // Create a new policy version with the synthetic content
    const policy = await prisma.policyVersion.create({
      data: {
        name,
        description,
        documentContent,
        createdBy,
        status: 'Draft',
      },
    });

    return NextResponse.json({
      success: true,
      policy,
      message: `Loaded ${isUpdated ? 'updated' : 'current'} synthetic policy`,
    });
  } catch (error) {
    console.error('Error loading synthetic policy:', error);
    return NextResponse.json(
      { error: 'Failed to load synthetic policy' },
      { status: 500 }
    );
  }
}
