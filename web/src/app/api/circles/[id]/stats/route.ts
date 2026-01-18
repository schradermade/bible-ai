import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyCircleMember } from '@/lib/circle-permissions';

/**
 * GET /api/circles/[id]/stats
 * Get aggregate statistics for a circle
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const circleId = params.id;

    // Verify membership
    const membership = await verifyCircleMember(circleId, userId);
    if (membership instanceof NextResponse) {
      return membership;
    }

    // Get circle with all related data
    const circle = await prisma.studyCircle.findUnique({
      where: { id: circleId },
      include: {
        members: true,
        plans: {
          include: {
            memberPlans: {
              include: {
                studyPlan: {
                  include: {
                    days: {
                      where: { completed: true },
                    },
                  },
                },
              },
            },
            reflections: {
              include: {
                comments: true,
              },
            },
          },
        },
        prayers: {
          include: {
            prayerSupport: true,
          },
        },
        verses: true,
      },
    });

    if (!circle) {
      return NextResponse.json({ message: 'Circle not found' }, { status: 404 });
    }

    // Calculate statistics
    const totalDaysCompleted = circle.plans.reduce((total, plan) => {
      return (
        total +
        plan.memberPlans.reduce((planTotal, memberPlan) => {
          return planTotal + memberPlan.studyPlan.days.length;
        }, 0)
      );
    }, 0);

    // Calculate average progress
    const totalMembers = circle.members.length;
    const activePlans = circle.plans.filter((p) => p.status === 'active');
    let averageProgress = 0;

    if (activePlans.length > 0 && totalMembers > 0) {
      const progressSum = activePlans.reduce((sum, plan) => {
        const memberProgressSum = plan.memberPlans.reduce((mSum, mp) => {
          const completedDays = mp.studyPlan.days.length;
          const progress = (completedDays / plan.duration) * 100;
          return mSum + progress;
        }, 0);
        return sum + memberProgressSum / Math.max(plan.memberPlans.length, 1);
      }, 0);
      averageProgress = Math.round(progressSum / activePlans.length);
    }

    // Total reflections
    const totalReflections = circle.plans.reduce((total, plan) => {
      return total + plan.reflections.length;
    }, 0);

    // Total comments
    const totalComments = circle.plans.reduce((total, plan) => {
      return (
        total +
        plan.reflections.reduce((commentTotal, reflection) => {
          return commentTotal + reflection.comments.length;
        }, 0)
      );
    }, 0);

    // Total prayers and support
    const totalPrayers = circle.prayers.length;
    const totalSupport = circle.prayers.reduce((total, prayer) => {
      return total + prayer.prayerSupport.length;
    }, 0);

    // Total verses
    const totalVerses = circle.verses.length;

    // Calculate active days (days with any activity)
    const activityDates = new Set<string>();

    // Add reflection dates
    circle.plans.forEach((plan) => {
      plan.reflections.forEach((reflection) => {
        const date = new Date(reflection.createdAt).toDateString();
        activityDates.add(date);
      });
    });

    // Add prayer dates
    circle.prayers.forEach((prayer) => {
      const date = new Date(prayer.createdAt).toDateString();
      activityDates.add(date);
    });

    // Add verse dates
    circle.verses.forEach((verse) => {
      const date = new Date(verse.createdAt).toDateString();
      activityDates.add(date);
    });

    // Add completion dates
    circle.plans.forEach((plan) => {
      plan.memberPlans.forEach((mp) => {
        mp.studyPlan.days.forEach((day) => {
          if (day.completedAt) {
            const date = new Date(day.completedAt).toDateString();
            activityDates.add(date);
          }
        });
      });
    });

    const activeDays = activityDates.size;

    // Completed studies
    const completedStudies = circle.plans.filter(
      (p) => p.status === 'completed'
    ).length;

    // Calculate longest streak (simplified - days where all members completed)
    const longestStreak = 0; // TODO: Implement streak calculation

    const stats = {
      totalDaysCompleted,
      averageProgress,
      totalReflections,
      totalPrayers,
      totalVerses,
      activeDays,
      memberCount: totalMembers,
      completedStudies,
      longestStreak,
      totalComments,
      totalSupport,
    };

    return NextResponse.json({ stats }, { status: 200 });
  } catch (error) {
    console.error('Error fetching circle stats:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
