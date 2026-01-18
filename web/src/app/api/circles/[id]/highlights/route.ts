import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { verifyCircleMember, filterVisibleVerses } from '@/lib/circle-permissions';

export const runtime = 'nodejs';

/**
 * GET /api/circles/[id]/highlights
 * List verse highlights shared in the circle
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { id: circleId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');

    // Verify user is a member
    const member = await verifyCircleMember(circleId, userId);
    if (!member) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Not a member of this circle' },
        { status: 403 }
      );
    }

    // Fetch highlights
    const highlights = await prisma.circleVerseHighlight.findMany({
      where: {
        circleId,
      },
      include: {
        reactions: {
          select: {
            id: true,
            userId: true,
            type: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            reactions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit ? parseInt(limit) : undefined,
    });

    // Filter based on privacy settings (uses shareVerses)
    const visibleHighlights = await filterVisibleVerses(
      highlights,
      circleId,
      userId
    );

    return NextResponse.json({
      success: true,
      highlights: visibleHighlights,
    });
  } catch (error) {
    console.error('[API] Failed to fetch highlights:', error);
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
 * POST /api/circles/[id]/highlights
 * Share a verse highlight to the circle
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { id: circleId } = await params;

    // Verify user is a member
    const member = await verifyCircleMember(circleId, userId);
    if (!member) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Not a member of this circle' },
        { status: 403 }
      );
    }

    // Check if user has enabled verse sharing
    if (!member.shareVerses) {
      return NextResponse.json(
        {
          error: 'forbidden',
          message: 'You must enable verse sharing in your privacy settings first',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { reference, text, insight, fromDayNumber } = body;

    // Validate inputs
    if (!reference || typeof reference !== 'string' || reference.trim().length === 0) {
      return NextResponse.json(
        { error: 'invalid_payload', message: 'Verse reference is required' },
        { status: 400 }
      );
    }

    if (reference.length > 100) {
      return NextResponse.json(
        {
          error: 'invalid_payload',
          message: 'Reference must be 100 characters or less',
        },
        { status: 400 }
      );
    }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'invalid_payload', message: 'Verse text is required' },
        { status: 400 }
      );
    }

    if (text.length > 2000) {
      return NextResponse.json(
        {
          error: 'invalid_payload',
          message: 'Verse text must be 2000 characters or less',
        },
        { status: 400 }
      );
    }

    if (insight && insight.length > 500) {
      return NextResponse.json(
        {
          error: 'invalid_payload',
          message: 'Insight must be 500 characters or less',
        },
        { status: 400 }
      );
    }

    // Create highlight
    const highlight = await prisma.circleVerseHighlight.create({
      data: {
        circleId,
        userId,
        reference: reference.trim(),
        text: text.trim(),
        insight: insight?.trim() || null,
        fromDayNumber: fromDayNumber || null,
      },
      include: {
        reactions: true,
        _count: {
          select: {
            reactions: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      highlight,
    });
  } catch (error) {
    console.error('[API] Failed to share highlight:', error);
    return NextResponse.json(
      {
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
