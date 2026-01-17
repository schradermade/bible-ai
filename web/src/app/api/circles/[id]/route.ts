import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { verifyCircleMember, verifyCircleOwner } from '@/lib/circle-permissions';

export const runtime = 'nodejs';

/**
 * GET /api/circles/[id]
 * Get details of a specific circle
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
    const { id } = params;

    // Verify user is a member
    const member = await verifyCircleMember(id, userId);
    if (!member) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Not a member of this circle' },
        { status: 403 }
      );
    }

    // Fetch circle with details
    const circle = await prisma.studyCircle.findUnique({
      where: { id },
      include: {
        members: {
          orderBy: {
            joinedAt: 'asc',
          },
          select: {
            id: true,
            userId: true,
            role: true,
            joinedAt: true,
            shareProgress: true,
            shareReflections: true,
            shareVerses: true,
            sharePrayers: true,
          },
        },
        plans: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            _count: {
              select: {
                memberPlans: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            plans: true,
            prayers: true,
            verses: true,
          },
        },
      },
    });

    if (!circle) {
      return NextResponse.json(
        { error: 'not_found', message: 'Circle not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      circle,
    });
  } catch (error) {
    console.error('[API] Failed to fetch circle:', error);
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
 * PATCH /api/circles/[id]
 * Update circle details (owner only)
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;

    // Verify user is the owner
    const member = await verifyCircleOwner(id, userId);
    if (!member) {
      return NextResponse.json(
        {
          error: 'forbidden',
          message: 'Only the circle owner can update circle details',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    // Validate inputs
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          {
            error: 'invalid_payload',
            message: 'Circle name cannot be empty',
          },
          { status: 400 }
        );
      }

      if (name.length > 100) {
        return NextResponse.json(
          {
            error: 'invalid_payload',
            message: 'Circle name must be 100 characters or less',
          },
          { status: 400 }
        );
      }
    }

    // Update circle
    const updatedCircle = await prisma.studyCircle.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && {
          description:
            typeof description === 'string' ? description.trim() : null,
        }),
      },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      circle: updatedCircle,
    });
  } catch (error) {
    console.error('[API] Failed to update circle:', error);
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
 * DELETE /api/circles/[id]
 * Delete a circle (owner only)
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
    const { id } = params;

    // Verify user is the owner
    const member = await verifyCircleOwner(id, userId);
    if (!member) {
      return NextResponse.json(
        {
          error: 'forbidden',
          message: 'Only the circle owner can delete the circle',
        },
        { status: 403 }
      );
    }

    // Delete circle (cascade will handle related records)
    await prisma.studyCircle.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Circle deleted successfully',
    });
  } catch (error) {
    console.error('[API] Failed to delete circle:', error);
    return NextResponse.json(
      {
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
