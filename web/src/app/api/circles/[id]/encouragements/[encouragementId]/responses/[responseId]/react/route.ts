import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { verifyCircleMember } from '@/lib/circle-permissions';

export const runtime = 'nodejs';

const VALID_REACTION_TYPES = ['amen', 'encouraging', 'blessed'];

/**
 * POST /api/circles/[id]/encouragements/[encouragementId]/responses/[responseId]/react
 * Add or remove a reaction to an encouragement response
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; encouragementId: string; responseId: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { id: circleId, responseId } = await params;

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

    // Fetch response and verify it belongs to this circle
    const response = await prisma.circleEncouragementResponse.findUnique({
      where: { id: responseId },
      include: {
        encouragement: true,
      },
    });

    if (!response) {
      return NextResponse.json(
        { error: 'not_found', message: 'Response not found' },
        { status: 404 }
      );
    }

    // Verify response belongs to this circle
    if (response.encouragement.circleId !== circleId) {
      return NextResponse.json(
        {
          error: 'forbidden',
          message: 'Response does not belong to this circle',
        },
        { status: 403 }
      );
    }

    // Check if reaction already exists
    const existingReaction = await prisma.circleEncouragementReaction.findUnique({
      where: {
        responseId_userId_type: {
          responseId,
          userId,
          type,
        },
      },
    });

    if (existingReaction) {
      // Remove reaction (toggle off)
      await prisma.circleEncouragementReaction.delete({
        where: { id: existingReaction.id },
      });

      return NextResponse.json({
        success: true,
        action: 'removed',
        type,
      });
    } else {
      // Add reaction
      const reaction = await prisma.circleEncouragementReaction.create({
        data: {
          responseId,
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
    console.error('[API] Failed to react to encouragement response:', error);
    return NextResponse.json(
      {
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
