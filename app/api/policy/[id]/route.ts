// Policy [id] API - Get, update, delete single policy version

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/policy/[id] - Get single policy
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const policy = await prisma.policyVersion.findUnique({
      where: { id },
    });

    if (!policy) {
      return NextResponse.json(
        { error: 'Policy not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ policy });
  } catch (error) {
    console.error('Error fetching policy:', error);
    return NextResponse.json(
      { error: 'Failed to fetch policy' },
      { status: 500 }
    );
  }
}

// PATCH /api/policy/[id] - Update policy
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const policy = await prisma.policyVersion.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ policy });
  } catch (error) {
    console.error('Error updating policy:', error);
    return NextResponse.json(
      { error: 'Failed to update policy' },
      { status: 500 }
    );
  }
}

// DELETE /api/policy/[id] - Archive policy (soft delete)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Don't allow deleting applied policies
    const policy = await prisma.policyVersion.findUnique({
      where: { id },
    });

    if (!policy) {
      return NextResponse.json(
        { error: 'Policy not found' },
        { status: 404 }
      );
    }

    if (policy.status === 'Applied') {
      return NextResponse.json(
        { error: 'Cannot delete an applied policy' },
        { status: 400 }
      );
    }

    // Soft delete by setting status to Archived
    await prisma.policyVersion.update({
      where: { id },
      data: { status: 'Archived' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting policy:', error);
    return NextResponse.json(
      { error: 'Failed to delete policy' },
      { status: 500 }
    );
  }
}
