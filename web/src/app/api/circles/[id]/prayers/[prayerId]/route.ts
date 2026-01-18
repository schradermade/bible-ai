import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { verifyCircleMember } from '@/lib/circle-permissions';

export const runtime = 'nodejs';

/**
 * PATCH /api/circles/[id]/prayers/[prayerId]
 * Update a prayer request (owner only)
 */
export async function PATCH(
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

    // Verify ownership
    if (prayer.userId !== userId) {
      return NextResponse.json(
        {
          error: 'forbidden',
          message: 'You can only update your own prayer requests',
        },
        { status: 403 }
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

    const body = await request.json();
    const { title, content, status } = body;

    // Validate inputs
    if (content !== undefined) {
      if (typeof content !== 'string' || content.trim().length === 0) {
        return NextResponse.json(
          { error: 'invalid_payload', message: 'Content cannot be empty' },
          { status: 400 }
        );
      }

      if (content.length > 1000) {
        return NextResponse.json(
          {
            error: 'invalid_payload',
            message: 'Prayer must be 1000 characters or less',
          },
          { status: 400 }
        );
      }
    }

    if (title !== undefined && title && title.length > 100) {
      return NextResponse.json(
        {
          error: 'invalid_payload',
          message: 'Prayer title must be 100 characters or less',
        },
        { status: 400 }
      );
    }

    if (status !== undefined && !['ongoing', 'answered'].includes(status)) {
      return NextResponse.json(
        {
          error: 'invalid_payload',
          message: 'Status must be either "ongoing" or "answered"',
        },
        { status: 400 }
      );
    }

    // Update prayer
    const updatedPrayer = await prisma.circlePrayerRequest.update({
      where: { id: prayerId },
      data: {
        ...(title !== undefined && { title: title?.trim() || null }),
        ...(content !== undefined && { content: content.trim() }),
        ...(status !== undefined && {
          status,
          ...(status === 'answered' && { answeredAt: new Date() }),
        }),
      },
      include: {
        prayerSupport: true,
        _count: {
          select: {
            prayerSupport: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      prayer: updatedPrayer,
    });
  } catch (error) {
    console.error('[API] Failed to update prayer:', error);
    return NextResponse.json(
      {
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/circles/[id]/prayers/[prayerId]
 * Delete a prayer request (owner only)
 */
export async function DELETE(
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

    // Verify ownership
    if (prayer.userId !== userId) {
      return NextResponse.json(
        {
          error: 'forbidden',
          message: 'You can only delete your own prayer requests',
        },
        { status: 403 }
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

    // Delete prayer (cascade will handle prayer support)
    await prisma.circlePrayerRequest.delete({
      where: { id: prayerId },
    });

    return NextResponse.json({
      success: true,
      message: 'Prayer request deleted successfully',
    });
  } catch (error) {
    console.error('[API] Failed to delete prayer:', error);
    return NextResponse.json(
      {
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
