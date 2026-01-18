import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

/**
 * POST /api/invitations/[token]/decline
 * Decline a circle invitation
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
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'not_found', message: 'Invitation not found' },
        { status: 404 }
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

    // Mark invitation as declined
    await prisma.circleInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'declined',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Invitation declined',
    });
  } catch (error) {
    console.error('[API] Failed to decline invitation:', error);
    return NextResponse.json(
      {
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
