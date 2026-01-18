import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

/**
 * GET /api/invitations
 * Get all pending invitations for the current user
 */
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    // Get user email from Clerk
    const user = await currentUser();
    const userEmail = user?.emailAddresses?.[0]?.emailAddress;

    if (!userEmail) {
      return NextResponse.json({
        success: true,
        invitations: [],
      });
    }

    // Fetch pending invitations for this user's email
    const invitations = await prisma.circleInvitation.findMany({
      where: {
        invitedEmail: userEmail,
        status: 'pending',
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        circle: {
          include: {
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter out invitations for full circles
    const availableInvitations = invitations.filter(
      (invitation) =>
        invitation.circle._count.members < invitation.circle.maxMembers
    );

    return NextResponse.json({
      success: true,
      invitations: availableInvitations,
    });
  } catch (error) {
    console.error('[API] Failed to fetch invitations:', error);
    return NextResponse.json(
      {
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
