import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { verifyCircleMember } from '@/lib/circle-permissions';

export const runtime = 'nodejs';

/**
 * GET /api/circles/[id]/reflections/[reflectionId]/comments
 * Get all comments on a reflection
 */
export async function GET(
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

    // Fetch comments
    const comments = await prisma.circleComment.findMany({
      where: { reflectionId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      comments,
    });
  } catch (error) {
    console.error('[API] Failed to fetch comments:', error);
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
 * POST /api/circles/[id]/reflections/[reflectionId]/comments
 * Add a comment to a reflection
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
    const { content } = body;

    // Validate content
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'invalid_payload', message: 'Comment content is required' },
        { status: 400 }
      );
    }

    if (content.length > 200) {
      return NextResponse.json(
        {
          error: 'invalid_payload',
          message: 'Comment must be 200 characters or less',
        },
        { status: 400 }
      );
    }

    // Verify reflection exists and belongs to this circle
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

    if (reflection.circleStudyPlan.circleId !== circleId) {
      return NextResponse.json(
        {
          error: 'forbidden',
          message: 'Reflection does not belong to this circle',
        },
        { status: 403 }
      );
    }

    // Create comment
    const comment = await prisma.circleComment.create({
      data: {
        reflectionId,
        userId,
        content: content.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      comment,
    });
  } catch (error) {
    console.error('[API] Failed to create comment:', error);
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
 * PATCH /api/circles/[id]/reflections/[reflectionId]/comments
 * Edit a comment (owner only)
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
    const { id: circleId } = params;
    const body = await request.json();
    const { commentId, content } = body;

    if (!commentId) {
      return NextResponse.json(
        { error: 'invalid_payload', message: 'Comment ID is required' },
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

    // Fetch comment
    const comment = await prisma.circleComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'not_found', message: 'Comment not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (comment.userId !== userId) {
      return NextResponse.json(
        { error: 'forbidden', message: 'You can only edit your own comments' },
        { status: 403 }
      );
    }

    // Validate content
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'invalid_payload', message: 'Comment content is required' },
        { status: 400 }
      );
    }

    if (content.length > 200) {
      return NextResponse.json(
        {
          error: 'invalid_payload',
          message: 'Comment must be 200 characters or less',
        },
        { status: 400 }
      );
    }

    // Update comment
    const updatedComment = await prisma.circleComment.update({
      where: { id: commentId },
      data: { content: content.trim() },
    });

    return NextResponse.json({
      success: true,
      comment: updatedComment,
    });
  } catch (error) {
    console.error('[API] Failed to update comment:', error);
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
 * DELETE /api/circles/[id]/reflections/[reflectionId]/comments
 * Delete a comment (owner only)
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
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json(
        { error: 'invalid_payload', message: 'Comment ID is required' },
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

    // Fetch comment
    const comment = await prisma.circleComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'not_found', message: 'Comment not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (comment.userId !== userId) {
      return NextResponse.json(
        {
          error: 'forbidden',
          message: 'You can only delete your own comments',
        },
        { status: 403 }
      );
    }

    // Delete comment
    await prisma.circleComment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('[API] Failed to delete comment:', error);
    return NextResponse.json(
      {
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
