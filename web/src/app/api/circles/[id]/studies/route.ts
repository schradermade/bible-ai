import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { verifyCircleMember } from '@/lib/circle-permissions';
import { STUDY_PLAN_TEMPLATES } from '@/lib/study-plan-templates';

export const runtime = 'nodejs';

/**
 * GET /api/circles/[id]/studies
 * List all studies in a circle
 */
export async function GET(
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

    // Fetch all circle studies
    const studies = await prisma.circleStudyPlan.findMany({
      where: {
        circleId,
      },
      include: {
        _count: {
          select: {
            memberPlans: true,
          },
        },
        memberPlans: {
          where: {
            userId,
          },
          select: {
            id: true,
            studyPlanId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      studies,
    });
  } catch (error) {
    console.error('[API] Failed to fetch circle studies:', error);
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
 * POST /api/circles/[id]/studies
 * Start a new study for the circle
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

    const body = await request.json();
    const { templateSource, duration } = body;

    // Validate inputs
    if (!templateSource || typeof templateSource !== 'string') {
      return NextResponse.json(
        {
          error: 'invalid_payload',
          message: 'Template source is required',
        },
        { status: 400 }
      );
    }

    if (duration !== 7 && duration !== 21) {
      return NextResponse.json(
        {
          error: 'invalid_payload',
          message: 'Duration must be 7 or 21 days',
        },
        { status: 400 }
      );
    }

    // Get template data
    const template = STUDY_PLAN_TEMPLATES[templateSource];
    if (!template) {
      return NextResponse.json(
        {
          error: 'invalid_source',
          message: 'Invalid template source',
        },
        { status: 400 }
      );
    }

    const templateDays = template.getDays(duration as 7 | 21);
    const title = `${duration}-Day ${duration === 7 ? 'Journey' : 'Deep Dive'}: ${template.title}`;
    const description = template.description;

    // Create circle study plan in a transaction
    const circleStudyPlan = await prisma.$transaction(async (tx) => {
      // Create circle study plan
      const plan = await tx.circleStudyPlan.create({
        data: {
          circleId,
          templateSource,
          duration,
          title,
          description,
          startDate: new Date(),
          createdBy: userId,
          status: 'active',
        },
      });

      // Create individual study plan for the creator
      const creatorStudyPlan = await tx.studyPlan.create({
        data: {
          userId,
          title,
          description,
          duration,
          source: `circle_${templateSource}`,
          status: 'active',
        },
      });

      // Create study plan days
      await tx.studyPlanDay.createMany({
        data: templateDays.map((day) => ({
          studyPlanId: creatorStudyPlan.id,
          dayNumber: day.dayNumber,
          title: day.title,
          content: day.content,
          reflection: day.reflection,
          prayer: day.prayer || null,
          verseReference: day.verseReference || null,
          verseText: day.verseText || null,
        })),
      });

      // Link creator's study plan to circle study plan
      await tx.memberStudyPlan.create({
        data: {
          circleStudyPlanId: plan.id,
          userId,
          studyPlanId: creatorStudyPlan.id,
        },
      });

      return await tx.circleStudyPlan.findUnique({
        where: { id: plan.id },
        include: {
          _count: {
            select: {
              memberPlans: true,
            },
          },
        },
      });
    });

    console.log('[API] Circle study plan created:', circleStudyPlan?.id);

    return NextResponse.json({
      success: true,
      studyPlan: circleStudyPlan,
    });
  } catch (error) {
    console.error('[API] Failed to create circle study plan:', error);
    return NextResponse.json(
      {
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
