import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { verifyCircleMember } from '@/lib/circle-permissions';
import { getFormattedUserNames } from '@/lib/clerk-utils';

export const runtime = 'nodejs';

/**
 * GET /api/circles/[id]/study-intentions
 * Fetch all study intentions for a circle
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

    // Verify user is a member
    const member = await verifyCircleMember(circleId, userId);
    if (!member) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Not a member of this circle' },
        { status: 403 }
      );
    }

    // Fetch all intentions for this circle
    const intentions = await prisma.circleStudyIntention.findMany({
      where: {
        circleId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Get total member count
    const totalMembers = await prisma.studyCircleMember.count({
      where: {
        circleId,
      },
    });

    // Fetch user names
    const userIds = intentions.map((i) => i.userId);
    const userNames = await getFormattedUserNames(userIds);

    // Add user names to intentions
    const intentionsWithNames = intentions.map((intention) => ({
      ...intention,
      userName: userNames[intention.userId] || 'Unknown User',
      selectedTopics: JSON.parse(intention.selectedTopics),
    }));

    return NextResponse.json({
      success: true,
      intentions: intentionsWithNames,
      totalSubmitted: intentions.length,
      totalMembers,
    });
  } catch (error) {
    console.error('[API] Failed to fetch study intentions:', error);
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
 * POST /api/circles/[id]/study-intentions
 * Submit or update user's study intention
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

    // Check if circle already has an active study
    const activeStudy = await prisma.circleStudyPlan.findFirst({
      where: {
        circleId,
        status: 'active',
      },
    });

    if (activeStudy) {
      return NextResponse.json(
        {
          error: 'forbidden',
          message: 'Cannot submit intentions when a study is already active',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { selectedTopics, depthLevel, currentSeason, studyPace, heartQuestion } = body;

    // Validate selectedTopics
    if (!Array.isArray(selectedTopics) || selectedTopics.length === 0 || selectedTopics.length > 3) {
      return NextResponse.json(
        {
          error: 'invalid_payload',
          message: 'Must select 1-3 topics',
        },
        { status: 400 }
      );
    }

    const validTopics = [
      'faith_doubt',
      'relationships',
      'purpose',
      'prayer',
      'scripture_study',
      'spiritual_growth',
      'forgiveness',
      'hope_healing',
    ];

    if (!selectedTopics.every((topic: string) => validTopics.includes(topic))) {
      return NextResponse.json(
        {
          error: 'invalid_payload',
          message: 'Invalid topic selected',
        },
        { status: 400 }
      );
    }

    // Validate depthLevel
    if (
      typeof depthLevel !== 'number' ||
      depthLevel < 1 ||
      depthLevel > 10 ||
      !Number.isInteger(depthLevel)
    ) {
      return NextResponse.json(
        {
          error: 'invalid_payload',
          message: 'Depth level must be an integer between 1 and 10',
        },
        { status: 400 }
      );
    }

    // Validate currentSeason
    const validSeasons = [
      'seeking',
      'growing',
      'struggling',
      'celebrating',
      'distant',
      'serving',
    ];

    if (!validSeasons.includes(currentSeason)) {
      return NextResponse.json(
        {
          error: 'invalid_payload',
          message: 'Invalid season selected',
        },
        { status: 400 }
      );
    }

    // Validate studyPace
    const validPaces = ['light', 'moderate', 'deep'];

    if (!validPaces.includes(studyPace)) {
      return NextResponse.json(
        {
          error: 'invalid_payload',
          message: 'Invalid pace selected',
        },
        { status: 400 }
      );
    }

    // Validate heartQuestion (optional)
    if (heartQuestion !== null && heartQuestion !== undefined && heartQuestion !== '') {
      if (typeof heartQuestion !== 'string') {
        return NextResponse.json(
          {
            error: 'invalid_payload',
            message: 'Heart question must be a string',
          },
          { status: 400 }
        );
      }

      if (heartQuestion.length > 300) {
        return NextResponse.json(
          {
            error: 'invalid_payload',
            message: 'Heart question must be 300 characters or less',
          },
          { status: 400 }
        );
      }
    }

    // Upsert intention
    const intention = await prisma.circleStudyIntention.upsert({
      where: {
        circleId_userId: {
          circleId,
          userId,
        },
      },
      create: {
        circleId,
        userId,
        selectedTopics: JSON.stringify(selectedTopics),
        depthLevel,
        currentSeason,
        studyPace,
        heartQuestion: heartQuestion?.trim() || null,
      },
      update: {
        selectedTopics: JSON.stringify(selectedTopics),
        depthLevel,
        currentSeason,
        studyPace,
        heartQuestion: heartQuestion?.trim() || null,
      },
    });

    return NextResponse.json({
      success: true,
      intention: {
        ...intention,
        selectedTopics: JSON.parse(intention.selectedTopics),
      },
    });
  } catch (error) {
    console.error('[API] Failed to submit study intention:', error);
    return NextResponse.json(
      {
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
