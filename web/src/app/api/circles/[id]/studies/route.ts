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
    const { templateSource, duration, aiGenerated, generatedPlan } = body;

    // Validate duration
    if (duration !== 7 && duration !== 21) {
      return NextResponse.json(
        {
          error: 'invalid_payload',
          message: 'Duration must be 7 or 21 days',
        },
        { status: 400 }
      );
    }

    let templateDays: any[];
    let title: string;
    let description: string;
    let finalTemplateSource: string;

    if (aiGenerated && generatedPlan) {
      // AI-generated study mode
      if (!generatedPlan.title || !generatedPlan.description || !generatedPlan.days) {
        return NextResponse.json(
          {
            error: 'invalid_payload',
            message: 'Generated plan must include title, description, and days',
          },
          { status: 400 }
        );
      }

      if (generatedPlan.days.length !== duration) {
        return NextResponse.json(
          {
            error: 'invalid_payload',
            message: `Generated plan must have exactly ${duration} days`,
          },
          { status: 400 }
        );
      }

      templateDays = generatedPlan.days;
      title = generatedPlan.title;
      description = generatedPlan.description;
      finalTemplateSource = 'ai_collaborative';
    } else {
      // Template mode
      if (!templateSource || typeof templateSource !== 'string') {
        return NextResponse.json(
          {
            error: 'invalid_payload',
            message: 'Template source is required',
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

      templateDays = template.getDays(duration as 7 | 21);
      title = `${duration}-Day ${duration === 7 ? 'Journey' : 'Deep Dive'}: ${template.title}`;
      description = template.description;
      finalTemplateSource = templateSource;
    }

    // Fetch all circle members
    const circle = await prisma.studyCircle.findUnique({
      where: { id: circleId },
      include: {
        members: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!circle) {
      return NextResponse.json(
        { error: 'not_found', message: 'Circle not found' },
        { status: 404 }
      );
    }

    // Create circle study plan in a transaction
    const circleStudyPlan = await prisma.$transaction(async (tx) => {
      // Create circle study plan
      const plan = await tx.circleStudyPlan.create({
        data: {
          circleId,
          templateSource: finalTemplateSource,
          duration,
          title,
          description,
          startDate: new Date(),
          createdBy: userId,
          status: 'active',
        },
      });

      // Create individual study plans for ALL circle members
      for (const member of circle.members) {
        // Create individual study plan
        const memberStudyPlan = await tx.studyPlan.create({
          data: {
            userId: member.userId,
            title,
            description,
            duration,
            source: `circle_${finalTemplateSource}`,
            status: 'active',
          },
        });

        // Create study plan days
        await tx.studyPlanDay.createMany({
          data: templateDays.map((day) => ({
            studyPlanId: memberStudyPlan.id,
            dayNumber: day.dayNumber,
            title: day.title,
            content: day.content,
            reflection: day.reflection,
            prayer: day.prayer || null,
            verseReference: day.verseReference || null,
            verseText: day.verseText || null,
          })),
        });

        // Link member's study plan to circle study plan
        await tx.memberStudyPlan.create({
          data: {
            circleStudyPlanId: plan.id,
            userId: member.userId,
            studyPlanId: memberStudyPlan.id,
          },
        });
      }

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
