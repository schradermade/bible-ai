import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { verifyCircleMember, filterVisibleReflections } from '@/lib/circle-permissions';

export const runtime = 'nodejs';

/**
 * GET /api/circles/[id]/reflections
 * List reflections shared in the circle
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
    const dayNumber = searchParams.get('dayNumber');
    const studyPlanId = searchParams.get('studyPlanId');

    // Verify user is a member
    const member = await verifyCircleMember(circleId, userId);
    if (!member) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Not a member of this circle' },
        { status: 403 }
      );
    }

    // Build query filters
    const whereClause: any = {
      circleStudyPlan: {
        circleId,
      },
    };

    if (studyPlanId) {
      whereClause.circleStudyPlanId = studyPlanId;
    }

    if (dayNumber) {
      whereClause.dayNumber = parseInt(dayNumber);
    }

    // Fetch reflections
    const reflections = await prisma.circleDayReflection.findMany({
      where: whereClause,
      include: {
        reactions: {
          select: {
            id: true,
            userId: true,
            type: true,
            createdAt: true,
          },
        },
        comments: {
          select: {
            id: true,
            userId: true,
            content: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            reactions: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter based on privacy settings
    const visibleReflections = await filterVisibleReflections(
      reflections,
      circleId,
      userId
    );

    return NextResponse.json({
      success: true,
      reflections: visibleReflections,
    });
  } catch (error) {
    console.error('[API] Failed to fetch reflections:', error);
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
 * POST /api/circles/[id]/reflections
 * Share a reflection to the circle
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

    // Check if user has enabled reflection sharing
    if (!member.shareReflections) {
      return NextResponse.json(
        {
          error: 'forbidden',
          message: 'You must enable reflection sharing in your privacy settings first',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { studyPlanId, dayNumber, content, verseHighlight } = body;

    // Validate inputs
    if (!studyPlanId || typeof studyPlanId !== 'string') {
      return NextResponse.json(
        { error: 'invalid_payload', message: 'Study plan ID is required' },
        { status: 400 }
      );
    }

    if (typeof dayNumber !== 'number' || dayNumber < 1) {
      return NextResponse.json(
        { error: 'invalid_payload', message: 'Valid day number is required' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'invalid_payload', message: 'Reflection content is required' },
        { status: 400 }
      );
    }

    if (content.length > 500) {
      return NextResponse.json(
        {
          error: 'invalid_payload',
          message: 'Reflection must be 500 characters or less',
        },
        { status: 400 }
      );
    }

    // Verify study plan belongs to this circle
    const circleStudyPlan = await prisma.circleStudyPlan.findUnique({
      where: { id: studyPlanId },
    });

    if (!circleStudyPlan || circleStudyPlan.circleId !== circleId) {
      return NextResponse.json(
        {
          error: 'invalid_payload',
          message: 'Study plan does not belong to this circle',
        },
        { status: 400 }
      );
    }

    // Check if user already shared a reflection for this day
    const existingReflection = await prisma.circleDayReflection.findFirst({
      where: {
        circleStudyPlanId: studyPlanId,
        dayNumber,
        userId,
      },
    });

    if (existingReflection) {
      return NextResponse.json(
        {
          error: 'conflict',
          message: 'You have already shared a reflection for this day',
        },
        { status: 409 }
      );
    }

    // Create reflection
    const reflection = await prisma.circleDayReflection.create({
      data: {
        circleStudyPlanId: studyPlanId,
        dayNumber,
        userId,
        content: content.trim(),
        verseHighlight: verseHighlight?.trim() || null,
      },
      include: {
        reactions: true,
        comments: true,
        _count: {
          select: {
            reactions: true,
            comments: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      reflection,
    });
  } catch (error) {
    console.error('[API] Failed to share reflection:', error);
    return NextResponse.json(
      {
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
