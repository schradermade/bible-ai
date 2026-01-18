import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { verifyCircleMember } from '@/lib/circle-permissions';
import { STUDY_PLAN_TEMPLATES } from '@/lib/study-plan-templates';

export const runtime = 'nodejs';

/**
 * POST /api/circles/[id]/studies/[planId]/join
 * Join an existing circle study
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; planId: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { id: circleId, planId } = await params;

    // Verify user is a member
    const member = await verifyCircleMember(circleId, userId);
    if (!member) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Not a member of this circle' },
        { status: 403 }
      );
    }

    // Fetch circle study plan
    const circleStudyPlan = await prisma.circleStudyPlan.findUnique({
      where: { id: planId },
    });

    if (!circleStudyPlan) {
      return NextResponse.json(
        { error: 'not_found', message: 'Study plan not found' },
        { status: 404 }
      );
    }

    // Verify study plan belongs to the circle
    if (circleStudyPlan.circleId !== circleId) {
      return NextResponse.json(
        {
          error: 'forbidden',
          message: 'Study plan does not belong to this circle',
        },
        { status: 403 }
      );
    }

    // Check if user already joined this study
    const existingMemberPlan = await prisma.memberStudyPlan.findFirst({
      where: {
        circleStudyPlanId: planId,
        userId,
      },
    });

    if (existingMemberPlan) {
      return NextResponse.json(
        {
          error: 'conflict',
          message: 'You have already joined this study',
        },
        { status: 409 }
      );
    }

    // Check if user has an active personal study plan
    const existingActivePlan = await prisma.studyPlan.findFirst({
      where: {
        userId,
        status: 'active',
        deletedAt: null,
      },
    });

    if (existingActivePlan) {
      return NextResponse.json(
        {
          error: 'conflict',
          message:
            'You already have an active study plan. Complete or delete it first.',
        },
        { status: 409 }
      );
    }

    // Get template data to create days
    const template = STUDY_PLAN_TEMPLATES[circleStudyPlan.templateSource];
    if (!template) {
      return NextResponse.json(
        {
          error: 'invalid_source',
          message: 'Invalid template source',
        },
        { status: 400 }
      );
    }

    const templateDays = template.getDays(
      circleStudyPlan.duration as 7 | 21
    );

    // Create individual study plan and link to circle study in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create individual study plan
      const userStudyPlan = await tx.studyPlan.create({
        data: {
          userId,
          title: circleStudyPlan.title,
          description: circleStudyPlan.description,
          duration: circleStudyPlan.duration,
          source: `circle_${circleStudyPlan.templateSource}`,
          status: 'active',
        },
      });

      // Create study plan days
      await tx.studyPlanDay.createMany({
        data: templateDays.map((day) => ({
          studyPlanId: userStudyPlan.id,
          dayNumber: day.dayNumber,
          title: day.title,
          content: day.content,
          reflection: day.reflection,
          prayer: day.prayer || null,
          verseReference: day.verseReference || null,
          verseText: day.verseText || null,
        })),
      });

      // Link user's study plan to circle study plan
      const memberPlan = await tx.memberStudyPlan.create({
        data: {
          circleStudyPlanId: planId,
          userId,
          studyPlanId: userStudyPlan.id,
        },
      });

      return {
        memberPlan,
        studyPlan: userStudyPlan,
      };
    });

    console.log('[API] User joined circle study:', result.studyPlan.id);

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the study',
      studyPlanId: result.studyPlan.id,
    });
  } catch (error) {
    console.error('[API] Failed to join circle study:', error);
    return NextResponse.json(
      {
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
