/**
 * Circle Milestones System
 *
 * Celebrates collective achievements in a non-competitive, Scripture-centered way.
 * All milestones focus on community, mutual encouragement, and shared faith journey.
 */

export interface Milestone {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'study' | 'community' | 'prayer' | 'scripture';
  threshold: number;
  checkCondition: (stats: CircleStats) => boolean;
  celebrationMessage: string;
  color: string;
}

export interface CircleStats {
  totalDaysCompleted: number;
  averageProgress: number;
  totalReflections: number;
  totalPrayers: number;
  totalVerses: number;
  activeDays: number;
  memberCount: number;
  completedStudies: number;
  longestStreak: number;
  totalComments: number;
  totalSupport: number;
}

export const MILESTONES: Milestone[] = [
  // Study Milestones
  {
    id: 'first_study',
    name: 'First Study Together',
    description: 'Complete your first study as a circle',
    icon: '📚',
    category: 'study',
    threshold: 1,
    checkCondition: (stats) => stats.completedStudies >= 1,
    celebrationMessage:
      'Your circle completed its first study together! This is just the beginning of your shared journey through Scripture.',
    color: '#3b82f6',
  },
  {
    id: 'unified_week',
    name: 'Unified Week',
    description: 'All members complete the same 7 days',
    icon: '🤝',
    category: 'study',
    threshold: 7,
    checkCondition: (stats) => stats.longestStreak >= 7,
    celebrationMessage:
      'Every member completed 7 days! Your unity in Scripture study is inspiring.',
    color: '#8b5cf6',
  },
  {
    id: 'century_club',
    name: 'Century Club',
    description: '100 total days completed across all members',
    icon: '💯',
    category: 'study',
    threshold: 100,
    checkCondition: (stats) => stats.totalDaysCompleted >= 100,
    celebrationMessage:
      '100 days of collective Bible study! Your dedication to Scripture is bearing fruit.',
    color: '#10b981',
  },
  {
    id: 'marathon_readers',
    name: 'Marathon Readers',
    description: '500 total days completed',
    icon: '🏃',
    category: 'study',
    threshold: 500,
    checkCondition: (stats) => stats.totalDaysCompleted >= 500,
    celebrationMessage:
      '500 days! Your circle has run the race with endurance, growing together in faith.',
    color: '#f59e0b',
  },

  // Community Milestones
  {
    id: 'first_reflection',
    name: 'First Shared Reflection',
    description: 'Someone shares their first reflection',
    icon: '💭',
    category: 'community',
    threshold: 1,
    checkCondition: (stats) => stats.totalReflections >= 1,
    celebrationMessage:
      'Your first reflection shared! Opening up and sharing insights is the heart of circle life.',
    color: '#667eea',
  },
  {
    id: 'thoughtful_circle',
    name: 'Thoughtful Circle',
    description: '50 reflections shared',
    icon: '🧠',
    category: 'community',
    threshold: 50,
    checkCondition: (stats) => stats.totalReflections >= 50,
    celebrationMessage:
      '50 reflections! Your circle values deep thinking about Scripture and learning from each other.',
    color: '#667eea',
  },
  {
    id: 'wisdom_keepers',
    name: 'Wisdom Keepers',
    description: '100 reflections shared',
    icon: '📝',
    category: 'community',
    threshold: 100,
    checkCondition: (stats) => stats.totalReflections >= 100,
    celebrationMessage:
      '100 reflections! The wisdom your circle shares is a treasure that enriches everyone.',
    color: '#667eea',
  },
  {
    id: 'engaged_community',
    name: 'Engaged Community',
    description: '100 comments on reflections',
    icon: '💬',
    category: 'community',
    threshold: 100,
    checkCondition: (stats) => stats.totalComments >= 100,
    celebrationMessage:
      '100 comments! Your circle actively engages with each other\'s insights.',
    color: '#ec4899',
  },

  // Prayer Milestones
  {
    id: 'prayer_warriors',
    name: 'Prayer Warriors',
    description: '50 prayer requests shared',
    icon: '🙏',
    category: 'prayer',
    threshold: 50,
    checkCondition: (stats) => stats.totalPrayers >= 50,
    celebrationMessage:
      '50 prayers shared! Your circle carries each other\'s burdens in prayer.',
    color: '#f59e0b',
  },
  {
    id: 'faithful_intercessors',
    name: 'Faithful Intercessors',
    description: '100 prayer requests',
    icon: '⛪',
    category: 'prayer',
    threshold: 100,
    checkCondition: (stats) => stats.totalPrayers >= 100,
    celebrationMessage:
      '100 prayers! Your circle demonstrates faithful intercession for one another.',
    color: '#f59e0b',
  },
  {
    id: 'supporting_circle',
    name: 'Supporting Circle',
    description: '200 prayer supports ("I\'m praying")',
    icon: '🤲',
    category: 'prayer',
    threshold: 200,
    checkCondition: (stats) => stats.totalSupport >= 200,
    celebrationMessage:
      '200 prayer supports! Your circle actively prays for each other\'s needs.',
    color: '#f59e0b',
  },

  // Scripture Milestones
  {
    id: 'scripture_seekers',
    name: 'Scripture Seekers',
    description: '25 verses shared',
    icon: '📖',
    category: 'scripture',
    threshold: 25,
    checkCondition: (stats) => stats.totalVerses >= 25,
    celebrationMessage:
      '25 verses shared! Your circle finds and celebrates meaningful Scripture together.',
    color: '#8b5cf6',
  },
  {
    id: 'word_treasurers',
    name: 'Word Treasurers',
    description: '100 verses shared',
    icon: '💎',
    category: 'scripture',
    threshold: 100,
    checkCondition: (stats) => stats.totalVerses >= 100,
    celebrationMessage:
      '100 verses! Your circle treasures God\'s Word and shares it generously.',
    color: '#8b5cf6',
  },
  {
    id: 'consistent_circle',
    name: 'Consistent Circle',
    description: '30 active days',
    icon: '🔥',
    category: 'study',
    threshold: 30,
    checkCondition: (stats) => stats.activeDays >= 30,
    celebrationMessage:
      '30 active days! Your circle maintains regular engagement with Scripture and each other.',
    color: '#ef4444',
  },
];

/**
 * Check which milestones a circle has achieved
 */
export function checkMilestones(stats: CircleStats): Milestone[] {
  return MILESTONES.filter((milestone) => milestone.checkCondition(stats));
}

/**
 * Get newly achieved milestones by comparing previous and current stats
 */
export function getNewMilestones(
  previousStats: CircleStats,
  currentStats: CircleStats
): Milestone[] {
  const previousAchieved = checkMilestones(previousStats);
  const currentAchieved = checkMilestones(currentStats);

  const previousIds = new Set(previousAchieved.map((m) => m.id));

  return currentAchieved.filter((milestone) => !previousIds.has(milestone.id));
}

/**
 * Get progress towards next milestone in a category
 */
export function getNextMilestone(
  stats: CircleStats,
  category?: Milestone['category']
): { milestone: Milestone; progress: number } | null {
  const achieved = checkMilestones(stats);
  const achievedIds = new Set(achieved.map((m) => m.id));

  const upcoming = MILESTONES.filter((m) => {
    if (achievedIds.has(m.id)) return false;
    if (category && m.category !== category) return false;
    return true;
  }).sort((a, b) => a.threshold - b.threshold);

  if (upcoming.length === 0) return null;

  const next = upcoming[0];

  // Calculate progress based on the milestone type
  let current = 0;
  switch (next.category) {
    case 'study':
      if (next.id === 'unified_week') {
        current = stats.longestStreak;
      } else if (next.id === 'consistent_circle') {
        current = stats.activeDays;
      } else {
        current = stats.totalDaysCompleted;
      }
      break;
    case 'community':
      if (next.id === 'engaged_community') {
        current = stats.totalComments;
      } else {
        current = stats.totalReflections;
      }
      break;
    case 'prayer':
      if (next.id === 'supporting_circle') {
        current = stats.totalSupport;
      } else {
        current = stats.totalPrayers;
      }
      break;
    case 'scripture':
      current = stats.totalVerses;
      break;
  }

  const progress = Math.min(100, Math.round((current / next.threshold) * 100));

  return { milestone: next, progress };
}

/**
 * Get a celebration message for achieving multiple milestones at once
 */
export function getMultiMilestoneCelebration(milestones: Milestone[]): string {
  if (milestones.length === 0) return '';
  if (milestones.length === 1) return milestones[0].celebrationMessage;

  return `Incredible! Your circle just achieved ${milestones.length} milestones! ${milestones.map((m) => m.name).join(', ')}. Keep growing together in faith!`;
}
