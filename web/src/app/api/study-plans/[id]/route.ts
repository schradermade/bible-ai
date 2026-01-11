import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

// GET - Fetch specific study plan
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await context.params;

    const plan = await prisma.studyPlan.findFirst({
      where: {
        id,
        userId,
        deletedAt: null
      },
      include: {
        days: {
          orderBy: { dayNumber: 'asc' }
        }
      }
    });

    if (!plan) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error('[API] Failed to fetch study plan:', error);
    return NextResponse.json({
      error: 'server_error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Soft delete a study plan
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await context.params;

    // Verify plan belongs to user
    const existing = await prisma.studyPlan.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    // Soft delete - also change status to prevent unique constraint violation
    await prisma.studyPlan.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'deleted'
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Failed to delete study plan:', error);
    return NextResponse.json({
      error: 'server_error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
