import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { verifyCircleMember } from '@/lib/circle-permissions';

export const runtime = 'nodejs';

const VALID_REACTION_TYPES = ['amen', 'praying', 'insightful', 'encouraging'];

/**
 * POST /api/circles/[id]/reflections/[reflectionId]/react
 * Add or remove a reaction to a reflection
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string; reflectionId: string } }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { id: circleId, reflectionId } = params;

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

    // Fetch reflection
    const reflection = await prisma.circleDayReflection.findUnique({
      where: { id: reflectionId },
      include: {
        circleStudyPlan: true,
      },
    });

    if (!reflection) {
      return NextResponse.json(
        { error: 'not_found', message: 'Reflection not found' },
        { status: 404 }
      );
    }

    // Verify reflection belongs to this circle
    if (reflection.circleStudyPlan.circleId !== circleId) {
      return NextResponse.json(
        {
          error: 'forbidden',
          message: 'Reflection does not belong to this circle',
        },
        { status: 403 }
      );
    }

    // Check if reaction already exists
    const existingReaction = await prisma.circleReaction.findUnique({
      where: {
        reflectionId_userId_type: {
          reflectionId,
          userId,
          type,
        },
      },
    });

    if (existingReaction) {
      // Remove reaction (toggle off)
      await prisma.circleReaction.delete({
        where: { id: existingReaction.id },
      });

      return NextResponse.json({
        success: true,
        action: 'removed',
        type,
      });
    } else {
      // Add reaction
      const reaction = await prisma.circleReaction.create({
        data: {
          reflectionId,
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
    console.error('[API] Failed to react to reflection:', error);
    return NextResponse.json(
      {
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
