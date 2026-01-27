// Policy API - List and create policy versions

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/policy - List all policy versions
export async function GET() {
  try {
    const policies = await prisma.policyVersion.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Get current active config
    const activeFreqConfig = await prisma.activeConfiguration.findUnique({
      where: { configType: 'validationFrequency' },
    });

    const currentFrequencies = activeFreqConfig
      ? JSON.parse(activeFreqConfig.configData)
      : { T3: 12, T2: 24, T1: 36 };

    return NextResponse.json({
      policies,
      currentFrequencies,
      activePolicy: policies.find(p => p.status === 'Applied'),
    });
  } catch (error) {
    console.error('Error fetching policies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch policies' },
      { status: 500 }
    );
  }
}

// POST /api/policy - Create a new policy version (draft)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, documentContent, createdBy = 'mrm-user' } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Policy name is required' },
        { status: 400 }
      );
    }

    const policy = await prisma.policyVersion.create({
      data: {
        name,
        description,
        documentContent,
        createdBy,
        status: 'Draft',
      },
    });

    return NextResponse.json({ policy }, { status: 201 });
  } catch (error) {
    console.error('Error creating policy:', error);
    return NextResponse.json(
      { error: 'Failed to create policy' },
      { status: 500 }
    );
  }
}
