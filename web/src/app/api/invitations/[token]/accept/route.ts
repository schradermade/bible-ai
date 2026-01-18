import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { isCircleFull } from '@/lib/circle-permissions';

export const runtime = 'nodejs';

/**
 * POST /api/invitations/[token]/accept
 * Accept a circle invitation
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { token } = await params;

    // Fetch invitation
    const invitation = await prisma.circleInvitation.findUnique({
      where: { token },
      include: {
        circle: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'not_found', message: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check if invitation is expired
    if (new Date() > invitation.expiresAt) {
      return NextResponse.json(
        { error: 'expired', message: 'Invitation has expired' },
        { status: 410 }
      );
    }

    // Check if invitation is not pending
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        {
          error: 'invalid_status',
          message: `Invitation has already been ${invitation.status}`,
        },
        { status: 410 }
      );
    }

    // Check if circle is full
    const isFull = await isCircleFull(invitation.circleId);
    if (isFull) {
      return NextResponse.json(
        {
          error: 'circle_full',
          message: 'Circle has reached maximum member limit',
        },
        { status: 410 }
      );
    }

    // Check if user is already a member
    const existingMember = await prisma.studyCircleMember.findUnique({
      where: {
        circleId_userId: {
          circleId: invitation.circleId,
          userId,
        },
      },
    });

    if (existingMember) {
      // User is already a member, just mark invitation as accepted
      await prisma.circleInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'accepted',
          acceptedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'You are already a member of this circle',
        circleId: invitation.circleId,
      });
    }

    // Add user to circle and mark invitation as accepted in a transaction
    await prisma.$transaction([
      // Add user as member
      prisma.studyCircleMember.create({
        data: {
          circleId: invitation.circleId,
          userId,
          role: 'member',
          shareProgress: true,
          shareReflections: false,
          shareVerses: false,
          sharePrayers: false,
        },
      }),
      // Mark invitation as accepted
      prisma.circleInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'accepted',
          acceptedAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the circle',
      circleId: invitation.circleId,
      circle: invitation.circle,
    });
  } catch (error) {
    console.error('[API] Failed to accept invitation:', error);
    return NextResponse.json(
      {
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
