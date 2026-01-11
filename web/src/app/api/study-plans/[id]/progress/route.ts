import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { checkNewAchievements, type StudyStreakStats } from '@/lib/achievements';

export const runtime = 'nodejs';

// PATCH - Update day progress and track streak
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { id: planId } = await context.params;
    const body = await request.json();
    const dayNumber = typeof body.dayNumber === 'number' ? body.dayNumber : 0;
    const completed = typeof body.completed === 'boolean' ? body.completed : false;
    const engagement = body.engagement || {};

    // Validate inputs
    if (!dayNumber) {
      return NextResponse.json({
        error: 'invalid_payload',
        message: 'Day number required'
      }, { status: 400 });
    }

    // Verify plan belongs to user and is active
    const plan = await prisma.studyPlan.findFirst({
      where: {
        id: planId,
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

    if (!plan) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    // Find the specific day
    const day = plan.days.find(d => d.dayNumber === dayNumber);

    if (!day) {
      return NextResponse.json({
        error: 'invalid_day',
        message: 'Day not found in plan'
      }, { status: 400 });
    }

    console.log('[API] Updating study plan progress:', {
      planId,
      dayNumber,
      completed,
      engagement
    });

    // Update day with completion and engagement
    const updatedDay = await prisma.studyPlanDay.update({
      where: { id: day.id },
      data: {
        completed,
        completedAt: completed ? new Date() : null,
        verseSaved: engagement.verseSaved !== undefined ? engagement.verseSaved : day.verseSaved,
        prayerGenerated: engagement.prayerGenerated !== undefined ? engagement.prayerGenerated : day.prayerGenerated,
        chatEngaged: engagement.chatEngaged !== undefined ? engagement.chatEngaged : day.chatEngaged
      }
    });

    // Calculate overall progress
    const completedDays = plan.days.filter(d =>
      d.id === day.id ? completed : d.completed
    ).length;
    const totalDays = plan.days.length;
    const percentComplete = Math.round((completedDays / totalDays) * 100);

    // Calculate engagement score
    const calculateEngagementScore = (d: typeof day) => {
      let score = 0;
      if (d.completed) score += 40;
      if (d.verseSaved) score += 20;
      if (d.prayerGenerated) score += 20;
      if (d.chatEngaged) score += 20;
      return score;
    };

    const totalEngagementScore = plan.days.reduce((sum, d) => {
      const dayScore = d.id === day.id
        ? calculateEngagementScore(updatedDay)
        : calculateEngagementScore(d);
      return sum + dayScore;
    }, 0);
    const engagementScore = Math.round((totalEngagementScore / (totalDays * 100)) * 100);

    // Update or create streak
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const streak = await prisma.studyStreak.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        currentStreak: 0,
        longestStreak: 0
      }
    });

    // Store previous stats for achievement comparison
    const previousStats: StudyStreakStats = {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      totalPlansCompleted: streak.totalPlansCompleted,
      total7DayCompleted: streak.total7DayCompleted,
      total21DayCompleted: streak.total21DayCompleted,
      totalDaysStudied: streak.totalDaysStudied,
      totalVersesFromPlans: streak.totalVersesFromPlans,
      totalPrayersFromPlans: streak.totalPrayersFromPlans
    };

    let newStreak = { ...streak };
    let newMilestone: { days: number; title: string; message: string; icon: string } | null = null;

    if (completed) {
      // User is checking off a day
      let isNewDay = false;

      if (streak.lastCompletedAt) {
        const lastDate = new Date(streak.lastCompletedAt);
        lastDate.setUTCHours(0, 0, 0, 0);
        const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        console.log('[STREAK DEBUG]', {
          today: today.toISOString(),
          lastDate: lastDate.toISOString(),
          daysDiff,
          currentStreak: streak.currentStreak
        });

        if (daysDiff === 0) {
          // Same day - ensure streak is at least 1, don't increment
          if (newStreak.currentStreak === 0) {
            newStreak.currentStreak = 1;
          }
          isNewDay = false;
        } else if (daysDiff === 1) {
          // Consecutive day - increment streak
          newStreak.currentStreak += 1;
          isNewDay = true;
        } else {
          // Streak broken - reset to 1
          newStreak.currentStreak = 1;
          isNewDay = true;
        }
      } else {
        // First completion ever
        console.log('[STREAK DEBUG] First completion, setting streak to 1');
        newStreak.currentStreak = 1;
        isNewDay = true;
      }

      // Update longest streak if needed
      if (newStreak.currentStreak > newStreak.longestStreak) {
        newStreak.longestStreak = newStreak.currentStreak;
      }

      newStreak.lastCompletedAt = today;

      // Only increment totalDaysStudied for new calendar days
      if (isNewDay) {
        newStreak.totalDaysStudied += 1;
      }

      // Check for milestone
      const MILESTONES = [
        { days: 3, title: 'Building Momentum', message: '3-day streak! You\'re building a habit.', icon: '🌱' },
        { days: 7, title: 'Week of Devotion', message: 'One full week of consistent study!', icon: '🔥' },
        { days: 14, title: 'Two Weeks Strong', message: 'Your dedication is inspiring!', icon: '💪' },
        { days: 21, title: 'Three Weeks Faithful', message: 'You\'ve built a lasting habit!', icon: '⭐' },
        { days: 30, title: 'Month of Faithfulness', message: 'A full month of growth!', icon: '🏆' }
      ];

      newMilestone = MILESTONES.find(m => m.days === newStreak.currentStreak) || null;
    } else {
      // User is unchecking - decrement but don't go below 0
      newStreak.currentStreak = Math.max(0, newStreak.currentStreak - 1);
      newStreak.totalDaysStudied = Math.max(0, newStreak.totalDaysStudied - 1);
    }

    // Update engagement stats
    if (engagement.verseSaved && !day.verseSaved) {
      newStreak.totalVersesFromPlans += 1;
    }
    if (engagement.prayerGenerated && !day.prayerGenerated) {
      newStreak.totalPrayersFromPlans += 1;
    }

    // Save streak updates
    await prisma.studyStreak.update({
      where: { userId },
      data: {
        currentStreak: newStreak.currentStreak,
        longestStreak: newStreak.longestStreak,
        lastCompletedAt: newStreak.lastCompletedAt,
        totalDaysStudied: newStreak.totalDaysStudied,
        totalVersesFromPlans: newStreak.totalVersesFromPlans,
        totalPrayersFromPlans: newStreak.totalPrayersFromPlans
      }
    });

    // Check if plan was just completed for celebration (BEFORE updating status)
    const planJustCompleted = percentComplete === 100 && plan.status === 'active';

    // If plan is fully completed, update plan status
    if (planJustCompleted) {
      await prisma.studyPlan.update({
        where: { id: planId },
        data: {
          status: 'completed',
          completedAt: new Date()
        }
      });

      // Update completion stats
      const updateData: Record<string, number> = {
        totalPlansCompleted: newStreak.totalPlansCompleted + 1
      };

      if (plan.duration === 7) {
        updateData.total7DayCompleted = newStreak.total7DayCompleted + 1;
      } else if (plan.duration === 21) {
        updateData.total21DayCompleted = newStreak.total21DayCompleted + 1;
      }

      await prisma.studyStreak.update({
        where: { userId },
        data: updateData
      });

      newStreak = { ...newStreak, ...updateData };
    }

    // Check for newly unlocked achievements
    const newStats: StudyStreakStats = {
      currentStreak: newStreak.currentStreak,
      longestStreak: newStreak.longestStreak,
      totalPlansCompleted: newStreak.totalPlansCompleted,
      total7DayCompleted: newStreak.total7DayCompleted,
      total21DayCompleted: newStreak.total21DayCompleted,
      totalDaysStudied: newStreak.totalDaysStudied,
      totalVersesFromPlans: newStreak.totalVersesFromPlans,
      totalPrayersFromPlans: newStreak.totalPrayersFromPlans
    };

    const unlockedAchievements = (streak as any).unlockedAchievements || [];
    const newAchievements = checkNewAchievements(previousStats, newStats, unlockedAchievements);

    // Update unlocked achievements if any new ones
    if (newAchievements.length > 0) {
      const updatedUnlockedList = [...unlockedAchievements, ...newAchievements.map(a => a.id)];
      try {
        await prisma.studyStreak.update({
          where: { userId },
          data: { unlockedAchievements: updatedUnlockedList } as any
        });
      } catch (error) {
        // Silently fail if field doesn't exist yet (backward compatible)
        console.log('[API] Achievement tracking not available yet');
      }
    }

    console.log('[API] Progress updated successfully', {
      returnedStreak: {
        currentStreak: newStreak.currentStreak,
        longestStreak: newStreak.longestStreak
      },
      newAchievements: newAchievements.map(a => a.title),
      planJustCompleted
    });

    return NextResponse.json({
      success: true,
      day: updatedDay,
      progress: {
        completedDays,
        totalDays,
        percentComplete,
        engagementScore
      },
      streak: {
        currentStreak: newStreak.currentStreak,
        longestStreak: newStreak.longestStreak,
        newMilestone
      },
      newAchievements,
      planCompleted: planJustCompleted
    });
  } catch (error) {
    console.error('[API] Failed to update progress:', error);
    return NextResponse.json({
      error: 'server_error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
