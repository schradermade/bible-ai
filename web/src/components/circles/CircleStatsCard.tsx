'use client';

import { useState, useEffect } from 'react';
import styles from './circle-stats-card.module.css';

interface CircleStats {
  totalDaysCompleted: number;
  averageProgress: number;
  totalReflections: number;
  totalPrayers: number;
  totalVerses: number;
  activeDays: number;
  memberCount: number;
}

interface CircleStatsCardProps {
  circleId: string;
  studyPlanId?: string;
}

export default function CircleStatsCard({
  circleId,
  studyPlanId,
}: CircleStatsCardProps) {
  const [stats, setStats] = useState<CircleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, [circleId, studyPlanId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = studyPlanId
        ? `/api/circles/${circleId}/studies/${studyPlanId}/stats`
        : `/api/circles/${circleId}/stats`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch stats');
      }

      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Circle Statistics</h3>
        </div>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner} />
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Circle Statistics</h3>
        </div>
        <div className={styles.error}>{error || 'Unable to load stats'}</div>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Circle Statistics</h3>
        <button className={styles.refreshButton} onClick={fetchStats}>
          <svg viewBox="0 0 24 24" className={styles.refreshIcon}>
            <path
              d="M23 4v6h-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </button>
      </div>

      <div className={styles.description}>
        Celebrating your collective journey through Scripture
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <span className={styles.statIcon}>✅</span>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>
              {formatNumber(stats.totalDaysCompleted)}
            </div>
            <div className={styles.statLabel}>Days Completed</div>
            <div className={styles.statSubtext}>
              {stats.memberCount} {stats.memberCount === 1 ? 'member' : 'members'}{' '}
              studying together
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <span className={styles.statIcon}>📈</span>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.averageProgress}%</div>
            <div className={styles.statLabel}>Average Progress</div>
            <div className={styles.statSubtext}>
              Across all active members
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <span className={styles.statIcon}>💭</span>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>
              {formatNumber(stats.totalReflections)}
            </div>
            <div className={styles.statLabel}>Reflections</div>
            <div className={styles.statSubtext}>
              Insights shared with the circle
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <span className={styles.statIcon}>🙏</span>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>
              {formatNumber(stats.totalPrayers)}
            </div>
            <div className={styles.statLabel}>Prayer Requests</div>
            <div className={styles.statSubtext}>
              Supporting each other in prayer
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <span className={styles.statIcon}>📖</span>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>
              {formatNumber(stats.totalVerses)}
            </div>
            <div className={styles.statLabel}>Verses Shared</div>
            <div className={styles.statSubtext}>
              Scripture that resonated
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <span className={styles.statIcon}>🔥</span>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.activeDays}</div>
            <div className={styles.statLabel}>Active Days</div>
            <div className={styles.statSubtext}>
              Days with circle activity
            </div>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.footerIcon}>✨</div>
        <div className={styles.footerText}>
          These metrics celebrate your collective journey, not individual
          performance. Every contribution enriches the circle.
        </div>
      </div>
    </div>
  );
}
