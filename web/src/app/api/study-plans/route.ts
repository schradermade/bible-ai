import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { STUDY_PLAN_TEMPLATES } from '@/lib/study-plan-templates';
import { generateAIStudyPlan } from '@/lib/generate-study-plan';
import {
  getSubscriptionStatus,
  getUsageCount,
  getUsageLimit,
  incrementUsage,
  INSIGHT_FEATURE_KEY
} from '@/lib/billing';

export const runtime = 'nodejs';

// GET - Fetch user's active plan and stats
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    // First try to fetch active plan
    let activePlan = await prisma.studyPlan.findFirst({
      where: {
        userId,
        status: 'active',
        deletedAt: null
      },
      include: {
        days: {
          orderBy: { dayNumber: 'asc' }
        }
      }
    });

    // If no active plan, fetch most recently completed plan (but only the very latest one)
    if (!activePlan) {
      activePlan = await prisma.studyPlan.findFirst({
        where: {
          userId,
          status: 'completed',
          deletedAt: null
        },
        orderBy: { completedAt: 'desc' },
        include: {
          days: {
            orderBy: { dayNumber: 'asc' }
          }
        }
      });
    }

    // Fetch or create streak stats
    const streak = await prisma.studyStreak.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        currentStreak: 0,
        longestStreak: 0
      }
    });

    return NextResponse.json({
      success: true,
      activePlan,
      stats: {
        totalCompleted: streak.totalPlansCompleted,
        totalDaysStudied: streak.totalDaysStudied,
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak
      }
    });
  } catch (error) {
    console.error('[API] Failed to fetch study plans:', error);
    return NextResponse.json({
      error: 'server_error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Create a new study plan
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const source = typeof body.source === 'string' ? body.source : '';
    const duration = typeof body.duration === 'number' ? body.duration : 7;

    // Validate inputs
    if (!source || (duration !== 7 && duration !== 21)) {
      return NextResponse.json({
        error: 'invalid_payload',
        message: 'Source and valid duration (7 or 21) required'
      }, { status: 400 });
    }

    // Check for existing active plan (enforce single active plan)
    const existingPlan = await prisma.studyPlan.findFirst({
      where: {
        userId,
        status: 'active',
        deletedAt: null
      }
    });

    if (existingPlan) {
      return NextResponse.json({
        error: 'conflict',
        message: 'You already have an active study plan. Complete or delete it first.'
      }, { status: 409 });
    }

    // Check usage limits (only for AI-personalized plans)
    if (source === 'ai_personalized') {
      const subscription = await getSubscriptionStatus(userId);
      const usageCount = await getUsageCount(userId, INSIGHT_FEATURE_KEY);
      const usageLimit = getUsageLimit(subscription.isActive);

      if (!subscription.isActive && usageCount >= usageLimit) {
        return NextResponse.json({
          error: 'usage_limit_exceeded',
          message: `You've reached your monthly limit of ${usageLimit} AI requests. Upgrade to continue.`
        }, { status: 429 });
      }
    }

    let planData: {
      title: string;
      description: string;
      days: Array<{
        dayNumber: number;
        title: string;
        content: string;
        reflection: string;
        verseReference: string;
        verseText: string;
      }>;
    };

    // Get plan content from template or AI
    if (source === 'ai_personalized') {
      // Generate AI plan directly
      planData = await generateAIStudyPlan(userId, duration as 7 | 21);

      // Increment usage for AI generation
      await incrementUsage(userId, INSIGHT_FEATURE_KEY);
    } else {
      // Load from template
      const template = STUDY_PLAN_TEMPLATES[source];

      if (!template) {
        return NextResponse.json({
          error: 'invalid_source',
          message: 'Invalid template source'
        }, { status: 400 });
      }

      const templateDays = template.getDays(duration as 7 | 21);
      planData = {
        title: `${duration}-Day ${duration === 7 ? 'Journey' : 'Deep Dive'}: ${template.title}`,
        description: template.description,
        days: templateDays
      };
    }

    console.log('[API] Creating study plan:', { userId, source, duration, title: planData.title });

    // Create plan with all days in a transaction
    const plan = await prisma.$transaction(async (tx) => {
      const createdPlan = await tx.studyPlan.create({
        data: {
          userId,
          title: planData.title,
          description: planData.description,
          duration,
          source,
          status: 'active'
        }
      });

      // Create all days
      await tx.studyPlanDay.createMany({
        data: planData.days.map(day => ({
          studyPlanId: createdPlan.id,
          dayNumber: day.dayNumber,
          title: day.title,
          content: day.content,
          reflection: day.reflection,
          verseReference: day.verseReference || null,
          verseText: day.verseText || null
        }))
      });

      // Fetch complete plan with days
      return await tx.studyPlan.findUnique({
        where: { id: createdPlan.id },
        include: {
          days: {
            orderBy: { dayNumber: 'asc' }
          }
        }
      });
    });

    console.log('[API] Study plan created successfully:', plan?.id);

    return NextResponse.json({
      success: true,
      plan
    });
  } catch (error) {
    console.error('[API] Failed to create study plan:', error);
    return NextResponse.json({
      error: 'server_error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
