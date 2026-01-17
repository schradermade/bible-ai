import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { verifyCircleMember, verifyCircleAdmin } from '@/lib/circle-permissions';

export const runtime = 'nodejs';

/**
 * PATCH /api/circles/[id]/members/[userId]
 * Update member settings (privacy settings or role)
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  const { userId: requestingUserId } = await auth();

  if (!requestingUserId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { id: circleId, userId: targetUserId } = params;

    // Verify requesting user is a member
    const requestingMember = await verifyCircleMember(circleId, requestingUserId);
    if (!requestingMember) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Not a member of this circle' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { shareProgress, shareReflections, shareVerses, sharePrayers, role } =
      body;

    // If updating role, verify admin permissions
    if (role !== undefined) {
      const isAdmin = await verifyCircleAdmin(circleId, requestingUserId);
      if (!isAdmin) {
        return NextResponse.json(
          {
            error: 'forbidden',
            message: 'Only circle admins can update member roles',
          },
          { status: 403 }
        );
      }

      // Prevent changing owner role
      const targetMember = await prisma.studyCircleMember.findUnique({
        where: { circleId_userId: { circleId, userId: targetUserId } },
      });

      if (targetMember?.role === 'owner') {
        return NextResponse.json(
          {
            error: 'forbidden',
            message: 'Cannot change the role of the circle owner',
          },
          { status: 403 }
        );
      }

      // Validate role
      if (!['member', 'admin'].includes(role)) {
        return NextResponse.json(
          {
            error: 'invalid_payload',
            message: 'Invalid role. Must be "member" or "admin"',
          },
          { status: 400 }
        );
      }
    }

    // If updating privacy settings, verify user is updating their own settings
    if (
      (shareProgress !== undefined ||
        shareReflections !== undefined ||
        shareVerses !== undefined ||
        sharePrayers !== undefined) &&
      targetUserId !== requestingUserId
    ) {
      return NextResponse.json(
        {
          error: 'forbidden',
          message: 'You can only update your own privacy settings',
        },
        { status: 403 }
      );
    }

    // Update member
    const updatedMember = await prisma.studyCircleMember.update({
      where: {
        circleId_userId: { circleId, userId: targetUserId },
      },
      data: {
        ...(shareProgress !== undefined && { shareProgress }),
        ...(shareReflections !== undefined && { shareReflections }),
        ...(shareVerses !== undefined && { shareVerses }),
        ...(sharePrayers !== undefined && { sharePrayers }),
        ...(role !== undefined && { role }),
      },
    });

    return NextResponse.json({
      success: true,
      member: updatedMember,
    });
  } catch (error) {
    console.error('[API] Failed to update member:', error);
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
 * DELETE /api/circles/[id]/members/[userId]
 * Remove a member from the circle
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  const { userId: requestingUserId } = await auth();

  if (!requestingUserId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { id: circleId, userId: targetUserId } = params;

    // Check if user is admin or removing themselves
    const isAdmin = await verifyCircleAdmin(circleId, requestingUserId);
    const isSelf = targetUserId === requestingUserId;

    if (!isAdmin && !isSelf) {
      return NextResponse.json(
        {
          error: 'forbidden',
          message: 'Only admins can remove other members',
        },
        { status: 403 }
      );
    }

    // Prevent removing the owner
    const targetMember = await prisma.studyCircleMember.findUnique({
      where: { circleId_userId: { circleId, userId: targetUserId } },
    });

    if (!targetMember) {
      return NextResponse.json(
        { error: 'not_found', message: 'Member not found' },
        { status: 404 }
      );
    }

    if (targetMember.role === 'owner') {
      return NextResponse.json(
        {
          error: 'forbidden',
          message: 'Cannot remove the circle owner. Delete the circle instead.',
        },
        { status: 403 }
      );
    }

    // Remove member
    await prisma.studyCircleMember.delete({
      where: {
        circleId_userId: { circleId, userId: targetUserId },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    console.error('[API] Failed to remove member:', error);
    return NextResponse.json(
      {
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
