import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { verifyCircleMember, isCircleFull } from '@/lib/circle-permissions';
import { randomBytes } from 'crypto';

export const runtime = 'nodejs';

/**
 * POST /api/circles/[id]/invite
 * Create an invitation to join the circle
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { id: circleId } = params;

    // Verify user is a member
    const member = await verifyCircleMember(circleId, userId);
    if (!member) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Not a member of this circle' },
        { status: 403 }
      );
    }

    // Check if circle is full
    const isFull = await isCircleFull(circleId);
    if (isFull) {
      return NextResponse.json(
        {
          error: 'conflict',
          message: 'Circle has reached maximum member limit',
        },
        { status: 409 }
      );
    }

    const body = await request.json();
    const { email } = body;

    // Email is optional for now (shareable link), but validate if provided
    if (email !== undefined && email !== null) {
      if (typeof email !== 'string' || !email.includes('@')) {
        return NextResponse.json(
          {
            error: 'invalid_payload',
            message: 'Invalid email address',
          },
          { status: 400 }
        );
      }
    }

    // Generate unique token
    const token = randomBytes(32).toString('hex');

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation
    const invitation = await prisma.circleInvitation.create({
      data: {
        circleId,
        invitedBy: userId,
        invitedEmail: email || null,
        token,
        expiresAt,
        status: 'pending',
      },
      include: {
        circle: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    // Generate invitation URL
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invitations/${token}`;

    return NextResponse.json({
      success: true,
      invitation: {
        ...invitation,
        url: invitationUrl,
      },
    });
  } catch (error) {
    console.error('[API] Failed to create invitation:', error);
    return NextResponse.json(
      {
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
