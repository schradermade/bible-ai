import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { verifyCircleMember } from '@/lib/circle-permissions';

export const runtime = 'nodejs';

/**
 * GET /api/circles/[id]/members
 * List all members of a circle
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Verify user is a member
    const member = await verifyCircleMember(id, userId);
    if (!member) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Not a member of this circle' },
        { status: 403 }
      );
    }

    // Fetch all members
    const members = await prisma.studyCircleMember.findMany({
      where: {
        circleId: id,
      },
      orderBy: [
        {
          role: 'desc', // owner first, then admin, then member
        },
        {
          joinedAt: 'asc',
        },
      ],
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
    });

    return NextResponse.json({
      success: true,
      members,
    });
  } catch (error) {
    console.error('[API] Failed to fetch circle members:', error);
    return NextResponse.json(
      {
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
