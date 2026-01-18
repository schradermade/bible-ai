import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { verifyCircleMember } from '@/lib/circle-permissions';

export const runtime = 'nodejs';

/**
 * POST /api/circles/[id]/prayers/[prayerId]/support
 * Toggle prayer support ("I'm praying for this")
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string; prayerId: string } }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { id: circleId, prayerId } = params;

    // Verify user is a member
    const member = await verifyCircleMember(circleId, userId);
    if (!member) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Not a member of this circle' },
        { status: 403 }
      );
    }

    // Fetch prayer
    const prayer = await prisma.circlePrayerRequest.findUnique({
      where: { id: prayerId },
    });

    if (!prayer) {
      return NextResponse.json(
        { error: 'not_found', message: 'Prayer request not found' },
        { status: 404 }
      );
    }

    // Verify prayer belongs to this circle
    if (prayer.circleId !== circleId) {
      return NextResponse.json(
        {
          error: 'forbidden',
          message: 'Prayer request does not belong to this circle',
        },
        { status: 403 }
      );
    }

    // Check if user is already supporting
    const existingSupport = await prisma.circlePrayerSupport.findUnique({
      where: {
        prayerId_userId: {
          prayerId,
          userId,
        },
      },
    });

    if (existingSupport) {
      // Remove support (toggle off)
      await prisma.circlePrayerSupport.delete({
        where: { id: existingSupport.id },
      });

      return NextResponse.json({
        success: true,
        action: 'removed',
        message: 'Prayer support removed',
      });
    } else {
      // Add support
      const support = await prisma.circlePrayerSupport.create({
        data: {
          prayerId,
          userId,
        },
      });

      return NextResponse.json({
        success: true,
        action: 'added',
        support,
        message: 'Now praying for this request',
      });
    }
  } catch (error) {
    console.error('[API] Failed to toggle prayer support:', error);
    return NextResponse.json(
      {
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
