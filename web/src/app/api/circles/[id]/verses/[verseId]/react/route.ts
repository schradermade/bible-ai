import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { verifyCircleMember } from '@/lib/circle-permissions';

export const runtime = 'nodejs';

const VALID_REACTION_TYPES = ['amen', 'saved', 'memorizing'];

/**
 * POST /api/circles/[id]/verses/[verseId]/react
 * Add or remove a reaction to a shared verse
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string; verseId: string } }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { id: circleId, verseId } = params;

    // Verify user is a member
    const member = await verifyCircleMember(circleId, userId);
    if (!member) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Not a member of this circle' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type } = body;

    // Validate reaction type
    if (!type || !VALID_REACTION_TYPES.includes(type)) {
      return NextResponse.json(
        {
          error: 'invalid_payload',
          message: `Reaction type must be one of: ${VALID_REACTION_TYPES.join(', ')}`,
        },
        { status: 400 }
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

    // Verify verse belongs to this circle
    if (verse.circleId !== circleId) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Verse does not belong to this circle' },
        { status: 403 }
      );
    }

    // Check if reaction already exists
    const existingReaction = await prisma.circleVerseReaction.findUnique({
      where: {
        verseId_userId_type: {
          verseId,
          userId,
          type,
        },
      },
    });

    if (existingReaction) {
      // Remove reaction (toggle off)
      await prisma.circleVerseReaction.delete({
        where: { id: existingReaction.id },
      });

      return NextResponse.json({
        success: true,
        action: 'removed',
        type,
      });
    } else {
      // Add reaction
      const reaction = await prisma.circleVerseReaction.create({
        data: {
          verseId,
          userId,
          type,
        },
      });

      return NextResponse.json({
        success: true,
        action: 'added',
        reaction,
      });
    }
  } catch (error) {
    console.error('[API] Failed to react to verse:', error);
    return NextResponse.json(
      {
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
