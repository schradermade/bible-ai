/**
 * Achievement System
 *
 * Sophisticated gamification for Study Plans - growth-focused, not childish
 */

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'completion' | 'engagement' | 'depth';
  requirement: (stats: StudyStreakStats) => boolean;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface StudyStreakStats {
  currentStreak: number;
  longestStreak: number;
  totalPlansCompleted: number;
  total7DayCompleted: number;
  total21DayCompleted: number;
  totalDaysStudied: number;
  totalVersesFromPlans: number;
  totalPrayersFromPlans: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  // STREAK ACHIEVEMENTS
  {
    id: 'week_of_devotion',
    title: 'Week of Devotion',
    description: 'Maintained a 7-day study streak',
    icon: '🔥',
    category: 'streak',
    requirement: (stats) => stats.currentStreak >= 7,
    tier: 'bronze'
  },
  {
    id: 'fortnight_faithful',
    title: 'Fortnight Faithful',
    description: 'Maintained a 14-day study streak',
    icon: '⚡',
    category: 'streak',
    requirement: (stats) => stats.currentStreak >= 14,
    tier: 'silver'
  },
  {
    id: 'three_weeks_strong',
    title: 'Three Weeks Strong',
    description: 'Maintained a 21-day study streak',
    icon: '⭐',
    category: 'streak',
    requirement: (stats) => stats.currentStreak >= 21,
    tier: 'silver'
  },
  {
    id: 'month_of_faithfulness',
    title: 'Month of Faithfulness',
    description: 'Maintained a 30-day study streak',
    icon: '🏆',
    category: 'streak',
    requirement: (stats) => stats.currentStreak >= 30,
    tier: 'gold'
  },
  {
    id: 'unwavering_dedication',
    title: 'Unwavering Dedication',
    description: 'Maintained a 100-day study streak',
    icon: '👑',
    category: 'streak',
    requirement: (stats) => stats.currentStreak >= 100,
    tier: 'platinum'
  },
  {
    id: 'longest_streak_10',
    title: 'Consistency Builder',
    description: 'Achieved a 10-day longest streak',
    icon: '💪',
    category: 'streak',
    requirement: (stats) => stats.longestStreak >= 10,
    tier: 'bronze'
  },
  {
    id: 'longest_streak_50',
    title: 'Steadfast Spirit',
    description: 'Achieved a 50-day longest streak',
    icon: '🌟',
    category: 'streak',
    requirement: (stats) => stats.longestStreak >= 50,
    tier: 'gold'
  },

  // COMPLETION ACHIEVEMENTS
  {
    id: 'first_journey',
    title: 'First Journey',
    description: 'Completed your first 7-Day Journey',
    icon: '🎯',
    category: 'completion',
    requirement: (stats) => stats.total7DayCompleted >= 1,
    tier: 'bronze'
  },
  {
    id: 'journey_explorer',
    title: 'Journey Explorer',
    description: 'Completed 5 seven-day journeys',
    icon: '🗺️',
    category: 'completion',
    requirement: (stats) => stats.total7DayCompleted >= 5,
    tier: 'silver'
  },
  {
    id: 'deep_diver',
    title: 'Deep Diver',
    description: 'Completed your first 21-Day Deep Dive',
    icon: '🏊',
    category: 'completion',
    requirement: (stats) => stats.total21DayCompleted >= 1,
    tier: 'silver'
  },
  {
    id: 'depth_seeker',
    title: 'Depth Seeker',
    description: 'Completed 3 twenty-one-day deep dives',
    icon: '🔍',
    category: 'completion',
    requirement: (stats) => stats.total21DayCompleted >= 3,
    tier: 'gold'
  },
  {
    id: 'dedicated_scholar',
    title: 'Dedicated Scholar',
    description: 'Completed 10 study plans total',
    icon: '📚',
    category: 'completion',
    requirement: (stats) => stats.totalPlansCompleted >= 10,
    tier: 'gold'
  },
  {
    id: 'master_student',
    title: 'Master Student',
    description: 'Completed 25 study plans total',
    icon: '🎓',
    category: 'completion',
    requirement: (stats) => stats.totalPlansCompleted >= 25,
    tier: 'platinum'
  },

  // ENGAGEMENT ACHIEVEMENTS
  {
    id: 'scripture_collector',
    title: 'Scripture Collector',
    description: 'Saved 25 verses from study plans',
    icon: '💎',
    category: 'engagement',
    requirement: (stats) => stats.totalVersesFromPlans >= 25,
    tier: 'silver'
  },
  {
    id: 'word_treasure',
    title: 'Word Treasure',
    description: 'Saved 100 verses from study plans',
    icon: '📜',
    category: 'engagement',
    requirement: (stats) => stats.totalVersesFromPlans >= 100,
    tier: 'gold'
  },
  {
    id: 'prayer_warrior',
    title: 'Prayer Warrior',
    description: 'Generated 50 prayers from study plans',
    icon: '🙏',
    category: 'engagement',
    requirement: (stats) => stats.totalPrayersFromPlans >= 50,
    tier: 'gold'
  },
  {
    id: 'intercessor',
    title: 'Faithful Intercessor',
    description: 'Generated 100 prayers from study plans',
    icon: '🕊️',
    category: 'engagement',
    requirement: (stats) => stats.totalPrayersFromPlans >= 100,
    tier: 'platinum'
  },

  // DEPTH ACHIEVEMENTS
  {
    id: 'fifty_days_strong',
    title: '50 Days of Growth',
    description: 'Studied the Bible for 50 days total',
    icon: '🌱',
    category: 'depth',
    requirement: (stats) => stats.totalDaysStudied >= 50,
    tier: 'silver'
  },
  {
    id: 'hundred_days_strong',
    title: '100 Days of Growth',
    description: 'Studied the Bible for 100 days total',
    icon: '🌳',
    category: 'depth',
    requirement: (stats) => stats.totalDaysStudied >= 100,
    tier: 'gold'
  },
  {
    id: 'year_of_study',
    title: 'Year of Transformation',
    description: 'Studied the Bible for 365 days total',
    icon: '🌟',
    category: 'depth',
    requirement: (stats) => stats.totalDaysStudied >= 365,
    tier: 'platinum'
  }
];

/**
 * Check if any new achievements have been unlocked
 */
export function checkNewAchievements(
  previousStats: StudyStreakStats,
  newStats: StudyStreakStats,
  unlockedAchievements: string[]
): Achievement[] {
  return ACHIEVEMENTS.filter(achievement => {
    const alreadyUnlocked = unlockedAchievements.includes(achievement.id);
    const nowUnlocked = achievement.requirement(newStats);
    const wasNotUnlocked = !achievement.requirement(previousStats);

    return !alreadyUnlocked && nowUnlocked && wasNotUnlocked;
  });
}

/**
 * Get all unlocked achievements for a user
 */
export function getUnlockedAchievements(stats: StudyStreakStats): Achievement[] {
  return ACHIEVEMENTS.filter(achievement => achievement.requirement(stats));
}

/**
 * Get next achievements (not yet unlocked but close)
 */
export function getNextAchievements(
  stats: StudyStreakStats,
  limit: number = 3
): Array<Achievement & { progress: number; total: number }> {
  const unlocked = new Set(
    ACHIEVEMENTS.filter(a => a.requirement(stats)).map(a => a.id)
  );

  const nextAchievements = ACHIEVEMENTS
    .filter(a => !unlocked.has(a.id))
    .map(achievement => {
      let progress = 0;
      let total = 0;

      // Calculate progress for each achievement type
      if (achievement.id === 'week_of_devotion') {
        progress = stats.currentStreak;
        total = 7;
      } else if (achievement.id === 'fortnight_faithful') {
        progress = stats.currentStreak;
        total = 14;
      } else if (achievement.id === 'three_weeks_strong') {
        progress = stats.currentStreak;
        total = 21;
      } else if (achievement.id === 'month_of_faithfulness') {
        progress = stats.currentStreak;
        total = 30;
      } else if (achievement.id === 'unwavering_dedication') {
        progress = stats.currentStreak;
        total = 100;
      } else if (achievement.id === 'longest_streak_10') {
        progress = stats.longestStreak;
        total = 10;
      } else if (achievement.id === 'longest_streak_50') {
        progress = stats.longestStreak;
        total = 50;
      } else if (achievement.id === 'first_journey') {
        progress = stats.total7DayCompleted;
        total = 1;
      } else if (achievement.id === 'journey_explorer') {
        progress = stats.total7DayCompleted;
        total = 5;
      } else if (achievement.id === 'deep_diver') {
        progress = stats.total21DayCompleted;
        total = 1;
      } else if (achievement.id === 'depth_seeker') {
        progress = stats.total21DayCompleted;
        total = 3;
      } else if (achievement.id === 'dedicated_scholar') {
        progress = stats.totalPlansCompleted;
        total = 10;
      } else if (achievement.id === 'master_student') {
        progress = stats.totalPlansCompleted;
        total = 25;
      } else if (achievement.id === 'scripture_collector') {
        progress = stats.totalVersesFromPlans;
        total = 25;
      } else if (achievement.id === 'word_treasure') {
        progress = stats.totalVersesFromPlans;
        total = 100;
      } else if (achievement.id === 'prayer_warrior') {
        progress = stats.totalPrayersFromPlans;
        total = 50;
      } else if (achievement.id === 'intercessor') {
        progress = stats.totalPrayersFromPlans;
        total = 100;
      } else if (achievement.id === 'fifty_days_strong') {
        progress = stats.totalDaysStudied;
        total = 50;
      } else if (achievement.id === 'hundred_days_strong') {
        progress = stats.totalDaysStudied;
        total = 100;
      } else if (achievement.id === 'year_of_study') {
        progress = stats.totalDaysStudied;
        total = 365;
      }

      const percentProgress = total > 0 ? (progress / total) * 100 : 0;

      return {
        ...achievement,
        progress,
        total,
        percentProgress
      };
    })
    // Sort by closest to completion
    .sort((a, b) => b.percentProgress - a.percentProgress)
    .slice(0, limit);

  return nextAchievements;
}

/**
 * Get tier color for UI display
 */
export function getTierColor(tier: Achievement['tier']): string {
  switch (tier) {
    case 'bronze': return '#cd7f32';
    case 'silver': return '#c0c0c0';
    case 'gold': return '#ffd700';
    case 'platinum': return '#e5e4e2';
    default: return '#888';
  }
}

/**
 * Get tier display name
 */
export function getTierName(tier: Achievement['tier']): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}
