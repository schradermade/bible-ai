import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

/**
 * GET /api/circles
 * List all circles the user is a member of
 */
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const circles = await prisma.studyCircle.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        _count: {
          select: {
            members: true,
            plans: true,
          },
        },
        members: {
          take: 5, // Get first 5 members for avatars
          orderBy: {
            joinedAt: 'asc',
          },
          select: {
            userId: true,
            role: true,
          },
        },
        plans: {
          where: {
            status: 'active',
          },
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            title: true,
            duration: true,
            startDate: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      circles,
    });
  } catch (error) {
    console.error('[API] Failed to fetch circles:', error);
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
 * POST /api/circles
 * Create a new study circle
 */
export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, maxMembers } = body;

    // Validate inputs
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'invalid_payload',
          message: 'Circle name is required',
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

    const maxMembersCount =
      typeof maxMembers === 'number' && maxMembers >= 2 && maxMembers <= 8
        ? maxMembers
        : 8;

    // Create circle and add creator as owner in a transaction
    const circle = await prisma.$transaction(async (tx) => {
      const newCircle = await tx.studyCircle.create({
        data: {
          name: name.trim(),
          description:
            description && typeof description === 'string'
              ? description.trim()
              : null,
          createdBy: userId,
          maxMembers: maxMembersCount,
        },
      });

      // Add creator as owner
      await tx.studyCircleMember.create({
        data: {
          circleId: newCircle.id,
          userId,
          role: 'owner',
          shareProgress: true,
          shareReflections: false,
          shareVerses: false,
          sharePrayers: false,
        },
      });

      // Return circle with member count and plans
      return await tx.studyCircle.findUnique({
        where: { id: newCircle.id },
        include: {
          _count: {
            select: {
              members: true,
              plans: true,
            },
          },
          members: {
            select: {
              userId: true,
              role: true,
            },
          },
          plans: {
            where: {
              status: 'active',
            },
            take: 1,
            orderBy: {
              createdAt: 'desc',
            },
            select: {
              id: true,
              title: true,
              duration: true,
              startDate: true,
            },
          },
        },
      });
    });

    console.log('[API] Circle created successfully:', circle?.id);

    return NextResponse.json({
      success: true,
      circle,
    });
  } catch (error) {
    console.error('[API] Failed to create circle:', error);
    return NextResponse.json(
      {
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
