import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

// One-time fix: Update soft-deleted plans to have status 'deleted'
export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    // Update any plans that are soft-deleted but still have active status
    const result = await prisma.studyPlan.updateMany({
      where: {
        userId,
        deletedAt: { not: null },
        status: 'active'
      },
      data: {
        status: 'deleted'
      }
    });

    console.log(`[FIX] Updated ${result.count} soft-deleted plans`);

    return NextResponse.json({
      success: true,
      fixed: result.count
    });
  } catch (error) {
    console.error('[FIX] Failed to fix deleted plans:', error);
    return NextResponse.json({
      error: 'server_error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
