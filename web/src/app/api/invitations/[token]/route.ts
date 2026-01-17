import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

/**
 * GET /api/invitations/[token]
 * Get invitation details (public - no auth required)
 */
export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    // Fetch invitation with circle details
    const invitation = await prisma.circleInvitation.findUnique({
      where: { token },
      include: {
        circle: {
          select: {
            id: true,
            name: true,
            description: true,
            maxMembers: true,
            createdAt: true,
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
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
    if (
      invitation.circle._count.members >= invitation.circle.maxMembers
    ) {
      return NextResponse.json(
        {
          error: 'circle_full',
          message: 'Circle has reached maximum member limit',
        },
        { status: 410 }
      );
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        circleId: invitation.circleId,
        expiresAt: invitation.expiresAt,
        circle: invitation.circle,
      },
    });
  } catch (error) {
    console.error('[API] Failed to fetch invitation:', error);
    return NextResponse.json(
      {
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
