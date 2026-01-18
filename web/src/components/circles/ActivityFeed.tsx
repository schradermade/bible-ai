'use client';

import { useState, useEffect } from 'react';
import styles from './activity-feed.module.css';

interface Activity {
  id: string;
  type: 'reflection' | 'prayer' | 'verse' | 'study_progress';
  userId: string;
  content?: string;
  reference?: string;
  title?: string;
  dayNumber?: number;
  studyPlanId?: string;
  createdAt: Date | string;
}

interface ActivityFeedProps {
  circleId: string;
  limit?: number;
}

export default function ActivityFeed({ circleId, limit = 20 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActivities();
  }, [circleId]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/circles/${circleId}/activity?limit=${limit}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch activity');
      }

      setActivities(data.activities || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activity');
    } finally {
      setLoading(false);
    }
  };

  const getRelativeTime = (dateString: Date | string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getUserAvatar = (userId: string) => {
    return userId.substring(0, 2).toUpperCase();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'reflection':
        return (
          <div className={`${styles.activityIcon} ${styles.reflection}`}>
            <svg viewBox="0 0 24 24">
              <path
                d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        );
      case 'prayer':
        return (
          <div className={`${styles.activityIcon} ${styles.prayer}`}>
            <svg viewBox="0 0 24 24">
              <path
                d="M12 5.69l1.09-1.6a2.5 2.5 0 0 1 3.56-.46 2.5 2.5 0 0 1 .46 3.27L12 14.31 6.89 6.9a2.5 2.5 0 0 1 .46-3.27 2.5 2.5 0 0 1 3.56.46L12 5.69z"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 14.31V21"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>
        );
      case 'verse':
        return (
          <div className={`${styles.activityIcon} ${styles.verse}`}>
            <svg viewBox="0 0 24 24">
              <path
                d="M2 3h6c1.06 0 2.08.42 2.83 1.17.75.75 1.17 1.77 1.17 2.83v14c0-.8-.32-1.56-.88-2.12A3 3 0 0 0 9 18H2V3z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M22 3h-6c-1.06 0-2.08.42-2.83 1.17A4 4 0 0 0 12 7v14c0-.8.32-1.56.88-2.12A3 3 0 0 1 15 18h7V3z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        );
      default:
        return (
          <div className={`${styles.activityIcon} ${styles.default}`}>
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="currentColor" />
            </svg>
          </div>
        );
    }
  };

  const getActivityText = (activity: Activity) => {
    const userName = activity.userId.substring(0, 15);
    const ellipsis = activity.userId.length > 15 ? '...' : '';

    switch (activity.type) {
      case 'reflection':
        return (
          <>
            <strong>{userName}{ellipsis}</strong> shared a reflection
            {activity.dayNumber && ` on Day ${activity.dayNumber}`}
          </>
        );
      case 'prayer':
        return (
          <>
            <strong>{userName}{ellipsis}</strong> shared a prayer request
            {activity.title && `: "${activity.title}"`}
          </>
        );
      case 'verse':
        return (
          <>
            <strong>{userName}{ellipsis}</strong> shared {activity.reference || 'a verse'}
          </>
        );
      default:
        return (
          <>
            <strong>{userName}{ellipsis}</strong> had activity in the circle
          </>
        );
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Recent Activity</h3>
        </div>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner} />
          <span>Loading activity...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Recent Activity</h3>
        </div>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Recent Activity</h3>
        </div>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M8 12h8"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <p className={styles.emptyTitle}>No activity yet</p>
          <p className={styles.emptyText}>
            When members share reflections, prayers, or verses, they'll appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Recent Activity</h3>
        <button className={styles.refreshButton} onClick={fetchActivities}>
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

      <div className={styles.timeline}>
        {activities.map((activity, index) => (
          <div key={`${activity.id}-${index}`} className={styles.activityItem}>
            <div className={styles.timelineLine}>
              {getActivityIcon(activity.type)}
              {index < activities.length - 1 && (
                <div className={styles.connector} />
              )}
            </div>

            <div className={styles.activityContent}>
              <div className={styles.activityHeader}>
                <div className={styles.avatar}>
                  {getUserAvatar(activity.userId)}
                </div>
                <div className={styles.activityMeta}>
                  <p className={styles.activityText}>{getActivityText(activity)}</p>
                  <span className={styles.activityTime} suppressHydrationWarning>
                    {getRelativeTime(activity.createdAt)}
                  </span>
                </div>
              </div>

              {activity.content && (
                <div className={styles.activityPreview}>
                  {activity.content}
                  {activity.content.length === 100 && '...'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
