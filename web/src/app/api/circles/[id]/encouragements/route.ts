import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { verifyCircleMember } from '@/lib/circle-permissions';
import { getFormattedUserNames } from '@/lib/clerk-utils';

export const runtime = 'nodejs';

/**
 * GET /api/circles/[id]/encouragements
 * List encouragement prompts with responses in the circle
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
    const { id: circleId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');

    // Verify user is a member
    const member = await verifyCircleMember(circleId, userId);
    if (!member) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Not a member of this circle' },
        { status: 403 }
      );
    }

    // Fetch encouragements with responses
    const encouragements = await prisma.circleEncouragement.findMany({
      where: {
        circleId,
      },
      include: {
        responses: {
          include: {
            reactions: {
              select: {
                id: true,
                userId: true,
                type: true,
                createdAt: true,
              },
            },
            _count: {
              select: {
                reactions: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            responses: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit ? parseInt(limit) : 10,
    });

    // Fetch user names from Clerk for prompt creators, response authors, and reaction users
    const promptUserIds = encouragements.map((e) => e.createdBy);
    const responseUserIds = encouragements.flatMap((e) =>
      e.responses.map((r) => r.userId)
    );
    const reactionUserIds = encouragements.flatMap((e) =>
      e.responses.flatMap((r) => r.reactions.map((reaction) => reaction.userId))
    );
    const allUserIds = [...new Set([...promptUserIds, ...responseUserIds, ...reactionUserIds])];
    const userNames = await getFormattedUserNames(allUserIds);

    // Add user names to encouragements, responses, and reactions
    const encouragementsWithNames = encouragements.map((encouragement) => ({
      ...encouragement,
      createdByName: userNames[encouragement.createdBy] || 'Unknown User',
      responses: encouragement.responses.map((response) => ({
        ...response,
        userName: userNames[response.userId] || 'Unknown User',
        reactions: response.reactions.map((reaction) => ({
          ...reaction,
          userName: userNames[reaction.userId] || 'Unknown User',
        })),
      })),
    }));

    return NextResponse.json({
      success: true,
      encouragements: encouragementsWithNames,
    });
  } catch (error) {
    console.error('[API] Failed to fetch encouragements:', error);
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
 * POST /api/circles/[id]/encouragements
 * Create a new encouragement prompt
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { id: circleId } = await params;

    // Verify user is a member
    const member = await verifyCircleMember(circleId, userId);
    if (!member) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Not a member of this circle' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { promptText, dayNumber } = body;

    // Validate inputs
    if (!promptText || typeof promptText !== 'string' || promptText.trim().length === 0) {
      return NextResponse.json(
        { error: 'invalid_payload', message: 'Prompt text is required' },
        { status: 400 }
      );
    }

    if (promptText.length > 200) {
      return NextResponse.json(
        {
          error: 'invalid_payload',
          message: 'Prompt must be 200 characters or less',
        },
        { status: 400 }
      );
    }

    // Create encouragement
    const encouragement = await prisma.circleEncouragement.create({
      data: {
        circleId,
        createdBy: userId,
        promptText: promptText.trim(),
        dayNumber: dayNumber || null,
      },
      include: {
        responses: {
          include: {
            reactions: true,
            _count: {
              select: {
                reactions: true,
              },
            },
          },
        },
        _count: {
          select: {
            responses: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      encouragement,
    });
  } catch (error) {
    console.error('[API] Failed to create encouragement:', error);
    return NextResponse.json(
      {
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
