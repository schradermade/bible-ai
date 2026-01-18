import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { verifyCircleMember, filterVisiblePrayers } from '@/lib/circle-permissions';

export const runtime = 'nodejs';

/**
 * GET /api/circles/[id]/prayers
 * List prayer requests in the circle
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { id: circleId } = params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'ongoing';

    // Verify user is a member
    const member = await verifyCircleMember(circleId, userId);
    if (!member) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Not a member of this circle' },
        { status: 403 }
      );
    }

    // Fetch prayers
    const prayers = await prisma.circlePrayerRequest.findMany({
      where: {
        circleId,
        status,
      },
      include: {
        prayerSupport: {
          select: {
            userId: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            prayerSupport: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter based on privacy settings
    const visiblePrayers = await filterVisiblePrayers(prayers, circleId, userId);

    return NextResponse.json({
      success: true,
      prayers: visiblePrayers,
    });
  } catch (error) {
    console.error('[API] Failed to fetch prayers:', error);
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
 * POST /api/circles/[id]/prayers
 * Share a prayer request to the circle
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { id: circleId } = params;

    // Verify user is a member
    const member = await verifyCircleMember(circleId, userId);
    if (!member) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Not a member of this circle' },
        { status: 403 }
      );
    }

    // Check if user has enabled prayer sharing
    if (!member.sharePrayers) {
      return NextResponse.json(
        {
          error: 'forbidden',
          message: 'You must enable prayer sharing in your privacy settings first',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, source, sourceReference, dayNumber } = body;

    // Validate inputs
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'invalid_payload', message: 'Prayer content is required' },
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

    if (title && title.length > 100) {
      return NextResponse.json(
        {
          error: 'invalid_payload',
          message: 'Prayer title must be 100 characters or less',
        },
        { status: 400 }
      );
    }

    if (!source || !['verse', 'chat', 'manual', 'study'].includes(source)) {
      return NextResponse.json(
        {
          error: 'invalid_payload',
          message: 'Source must be one of: verse, chat, manual, study',
        },
        { status: 400 }
      );
    }

    // Create prayer
    const prayer = await prisma.circlePrayerRequest.create({
      data: {
        circleId,
        userId,
        title: title?.trim() || null,
        content: content.trim(),
        source,
        sourceReference: sourceReference?.trim() || null,
        dayNumber: dayNumber || null,
        status: 'ongoing',
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
      prayer,
    });
  } catch (error) {
    console.error('[API] Failed to share prayer:', error);
    return NextResponse.json(
      {
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
