import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { verifyCircleMember } from '@/lib/circle-permissions';

export const runtime = 'nodejs';

const VALID_REACTION_TYPES = ['amen', 'insightful', 'saved'];

/**
 * POST /api/circles/[id]/highlights/[highlightId]/react
 * Add or remove a reaction to a verse highlight
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; highlightId: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { id: circleId, highlightId } = await params;

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

    // Fetch highlight
    const highlight = await prisma.circleVerseHighlight.findUnique({
      where: { id: highlightId },
    });

    if (!highlight) {
      return NextResponse.json(
        { error: 'not_found', message: 'Highlight not found' },
        { status: 404 }
      );
    }

    // Verify highlight belongs to this circle
    if (highlight.circleId !== circleId) {
      return NextResponse.json(
        {
          error: 'forbidden',
          message: 'Highlight does not belong to this circle',
        },
        { status: 403 }
      );
    }

    // Check if reaction already exists
    const existingReaction = await prisma.circleHighlightReaction.findUnique({
      where: {
        highlightId_userId_type: {
          highlightId,
          userId,
          type,
        },
      },
    });

    if (existingReaction) {
      // Remove reaction (toggle off)
      await prisma.circleHighlightReaction.delete({
        where: { id: existingReaction.id },
      });

      return NextResponse.json({
        success: true,
        action: 'removed',
        type,
      });
    } else {
      // Add reaction
      const reaction = await prisma.circleHighlightReaction.create({
        data: {
          highlightId,
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
    console.error('[API] Failed to react to highlight:', error);
    return NextResponse.json(
      {
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
