import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { verifyCircleMember } from '@/lib/circle-permissions';

export const runtime = 'nodejs';

/**
 * PATCH /api/circles/[id]/reflections/[reflectionId]
 * Edit a reflection (owner only)
 */
export async function PATCH(
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

    // Verify ownership
    if (reflection.userId !== userId) {
      return NextResponse.json(
        { error: 'forbidden', message: 'You can only edit your own reflections' },
        { status: 403 }
      );
    }

    // Verify reflection belongs to this circle
    if (reflection.circleStudyPlan.circleId !== circleId) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Reflection does not belong to this circle' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { content, verseHighlight } = body;

    // Validate content
    if (content !== undefined) {
      if (typeof content !== 'string' || content.trim().length === 0) {
        return NextResponse.json(
          { error: 'invalid_payload', message: 'Content cannot be empty' },
          { status: 400 }
        );
      }

      if (content.length > 500) {
        return NextResponse.json(
          {
            error: 'invalid_payload',
            message: 'Reflection must be 500 characters or less',
          },
          { status: 400 }
        );
      }
    }

    // Update reflection
    const updatedReflection = await prisma.circleDayReflection.update({
      where: { id: reflectionId },
      data: {
        ...(content !== undefined && { content: content.trim() }),
        ...(verseHighlight !== undefined && {
          verseHighlight: verseHighlight?.trim() || null,
        }),
      },
      include: {
        reactions: true,
        comments: true,
        _count: {
          select: {
            reactions: true,
            comments: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      reflection: updatedReflection,
    });
  } catch (error) {
    console.error('[API] Failed to update reflection:', error);
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
 * DELETE /api/circles/[id]/reflections/[reflectionId]
 * Delete a reflection (owner only)
 */
export async function DELETE(
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

    // Verify ownership
    if (reflection.userId !== userId) {
      return NextResponse.json(
        {
          error: 'forbidden',
          message: 'You can only delete your own reflections',
        },
        { status: 403 }
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

    // Delete reflection (cascade will handle reactions and comments)
    await prisma.circleDayReflection.delete({
      where: { id: reflectionId },
    });

    return NextResponse.json({
      success: true,
      message: 'Reflection deleted successfully',
    });
  } catch (error) {
    console.error('[API] Failed to delete reflection:', error);
    return NextResponse.json(
      {
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
