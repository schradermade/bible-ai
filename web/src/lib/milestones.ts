/**
 * Milestone System
 *
 * Celebrates key streak achievements with elegant, growth-focused messaging
 */

export interface Milestone {
  days: number;
  title: string;
  message: string;
  icon: string;
}

export const STREAK_MILESTONES: Milestone[] = [
  {
    days: 3,
    title: 'Building Momentum',
    message: '3-day streak! You\'re building a habit.',
    icon: '🌱'
  },
  {
    days: 7,
    title: 'Week of Devotion',
    message: 'One full week of consistent study!',
    icon: '🔥'
  },
  {
    days: 14,
    title: 'Two Weeks Strong',
    message: 'Your dedication is inspiring!',
    icon: '💪'
  },
  {
    days: 21,
    title: 'Three Weeks Faithful',
    message: 'You\'ve built a lasting habit!',
    icon: '⭐'
  },
  {
    days: 30,
    title: 'Month of Faithfulness',
    message: 'A full month of growth!',
    icon: '🏆'
  },
  {
    days: 50,
    title: 'Halfway to 100',
    message: 'You\'re unstoppable!',
    icon: '🚀'
  },
  {
    days: 100,
    title: 'Century of Devotion',
    message: '100 days! Incredible dedication!',
    icon: '👑'
  },
  {
    days: 365,
    title: 'Year of Transformation',
    message: 'A full year of daily study!',
    icon: '🌟'
  }
];

/**
 * Check if a streak has reached a milestone
 */
export function checkMilestone(currentStreak: number): Milestone | null {
  return STREAK_MILESTONES.find(m => m.days === currentStreak) || null;
}

/**
 * Get the next milestone to reach
 */
export function getNextMilestone(currentStreak: number): Milestone | null {
  return STREAK_MILESTONES.find(m => m.days > currentStreak) || null;
}

/**
 * Get progress toward next milestone
 */
export function getMilestoneProgress(currentStreak: number): {
  current: number;
  next: Milestone | null;
  daysRemaining: number;
  percentProgress: number;
} {
  const nextMilestone = getNextMilestone(currentStreak);

  if (!nextMilestone) {
    return {
      current: currentStreak,
      next: null,
      daysRemaining: 0,
      percentProgress: 100
    };
  }

  const daysRemaining = nextMilestone.days - currentStreak;
  const percentProgress = Math.round((currentStreak / nextMilestone.days) * 100);

  return {
    current: currentStreak,
    next: nextMilestone,
    daysRemaining,
    percentProgress
  };
}
