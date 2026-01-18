import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { verifyCircleMember, filterVisibleVerses } from '@/lib/circle-permissions';

export const runtime = 'nodejs';

/**
 * GET /api/circles/[id]/verses
 * List verses shared in the circle
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

    // Verify user is a member
    const member = await verifyCircleMember(circleId, userId);
    if (!member) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Not a member of this circle' },
        { status: 403 }
      );
    }

    // Fetch verses
    const verses = await prisma.circleSharedVerse.findMany({
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
    });

    // Filter based on privacy settings
    const visibleVerses = await filterVisibleVerses(verses, circleId, userId);

    return NextResponse.json({
      success: true,
      verses: visibleVerses,
    });
  } catch (error) {
    console.error('[API] Failed to fetch verses:', error);
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
 * POST /api/circles/[id]/verses
 * Share a verse to the circle
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
    const { reference, text, note, fromDayNumber } = body;

    // Validate inputs
    if (!reference || typeof reference !== 'string' || reference.trim().length === 0) {
      return NextResponse.json(
        { error: 'invalid_payload', message: 'Verse reference is required' },
        { status: 400 }
      );
    }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'invalid_payload', message: 'Verse text is required' },
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

    if (text.length > 2000) {
      return NextResponse.json(
        {
          error: 'invalid_payload',
          message: 'Verse text must be 2000 characters or less',
        },
        { status: 400 }
      );
    }

    if (note && note.length > 500) {
      return NextResponse.json(
        {
          error: 'invalid_payload',
          message: 'Note must be 500 characters or less',
        },
        { status: 400 }
      );
    }

    // Create shared verse
    const verse = await prisma.circleSharedVerse.create({
      data: {
        circleId,
        userId,
        reference: reference.trim(),
        text: text.trim(),
        note: note?.trim() || null,
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
      verse,
    });
  } catch (error) {
    console.error('[API] Failed to share verse:', error);
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
 * DELETE /api/circles/[id]/verses/[verseId]
 * Delete a shared verse (owner only)
 */
export async function DELETE(
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
    const verseId = searchParams.get('verseId');

    if (!verseId) {
      return NextResponse.json(
        { error: 'invalid_payload', message: 'Verse ID is required' },
        { status: 400 }
      );
    }

    // Verify user is a member
    const member = await verifyCircleMember(circleId, userId);
    if (!member) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Not a member of this circle' },
        { status: 403 }
      );
    }

    // Fetch verse
    const verse = await prisma.circleSharedVerse.findUnique({
      where: { id: verseId },
    });

    if (!verse) {
      return NextResponse.json(
        { error: 'not_found', message: 'Verse not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (verse.userId !== userId) {
      return NextResponse.json(
        { error: 'forbidden', message: 'You can only delete your own verses' },
        { status: 403 }
      );
    }

    // Verify verse belongs to this circle
    if (verse.circleId !== circleId) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Verse does not belong to this circle' },
        { status: 403 }
      );
    }

    // Delete verse (cascade will handle reactions)
    await prisma.circleSharedVerse.delete({
      where: { id: verseId },
    });

    return NextResponse.json({
      success: true,
      message: 'Verse deleted successfully',
    });
  } catch (error) {
    console.error('[API] Failed to delete verse:', error);
    return NextResponse.json(
      {
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
