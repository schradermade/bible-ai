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

  useEffect(() => {
    fetchStats();
  }, [circleId, studyPlanId]);

  const fetchStats = async () => {
    try {
      setLoading(true);

      const url = studyPlanId
        ? `/api/circles/${circleId}/studies/${studyPlanId}/stats`
        : `/api/circles/${circleId}/stats`;

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner} />
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          <span className={styles.statIcon}>✅</span>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.totalDaysCompleted}</span>
            <span className={styles.statLabel}>Days Completed</span>
          </div>
        </div>

        <div className={styles.statItem}>
          <span className={styles.statIcon}>📈</span>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.averageProgress}%</span>
            <span className={styles.statLabel}>Avg Progress</span>
          </div>
        </div>

        <div className={styles.statItem}>
          <span className={styles.statIcon}>💭</span>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.totalReflections}</span>
            <span className={styles.statLabel}>Reflections</span>
          </div>
        </div>

        <div className={styles.statItem}>
          <span className={styles.statIcon}>🙏</span>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.totalPrayers}</span>
            <span className={styles.statLabel}>Prayers</span>
          </div>
        </div>

        <div className={styles.statItem}>
          <span className={styles.statIcon}>📖</span>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.totalVerses}</span>
            <span className={styles.statLabel}>Verses</span>
          </div>
        </div>

        <div className={styles.statItem}>
          <span className={styles.statIcon}>🔥</span>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.activeDays}</span>
            <span className={styles.statLabel}>Active Days</span>
          </div>
        </div>
      </div>
    </div>
  );
}
