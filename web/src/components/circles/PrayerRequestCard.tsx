'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import styles from './prayer-request-card.module.css';

interface PrayerSupport {
  userId: string;
  createdAt: string;
}

interface PrayerRequestCardProps {
  prayer: {
    id: string;
    userId: string;
    title?: string | null;
    content: string;
    source: string;
    sourceReference?: string | null;
    dayNumber?: number | null;
    status: string;
    answeredAt?: string | null;
    createdAt: string;
    prayerSupport: PrayerSupport[];
    _count: {
      prayerSupport: number;
    };
  };
  circleId: string;
  onUpdate?: () => void;
}

export default function PrayerRequestCard({
  prayer,
  circleId,
  onUpdate,
}: PrayerRequestCardProps) {
  const { user } = useUser();
  const [isToggling, setIsToggling] = useState(false);
  const [showAllSupporters, setShowAllSupporters] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = prayer.userId === user?.id;
  const isSupporting = prayer.prayerSupport.some((s) => s.userId === user?.id);
  const isAnswered = prayer.status === 'answered';

  const displayedSupporters = showAllSupporters
    ? prayer.prayerSupport
    : prayer.prayerSupport.slice(0, 5);
  const hasMoreSupporters = prayer.prayerSupport.length > 5;

  const handleToggleSupport = async () => {
    if (!user || isToggling) return;

    try {
      setIsToggling(true);
      setError(null);

      const response = await fetch(
        `/api/circles/${circleId}/prayers/${prayer.id}/support`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update prayer support');
      }

      onUpdate?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update prayer support'
      );
    } finally {
      setIsToggling(false);
    }
  };

  const handleMarkAnswered = async () => {
    if (!user || !isOwner) return;

    try {
      setError(null);

      const response = await fetch(
        `/api/circles/${circleId}/prayers/${prayer.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'answered' }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to mark as answered');
      }

      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as answered');
    }
  };

  const getRelativeTime = (dateString: string) => {
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

  const getSourceIcon = () => {
    switch (prayer.source) {
      case 'verse':
        return '📖';
      case 'study':
        return '📚';
      case 'chat':
        return '💬';
      default:
        return '🙏';
    }
  };

  return (
    <article className={`${styles.card} ${isAnswered ? styles.answered : ''}`}>
      {isAnswered && (
        <div className={styles.answeredBanner}>
          <svg viewBox="0 0 24 24" className={styles.checkIcon}>
            <path
              d="M20 6L9 17l-5-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Prayer Answered</span>
          {prayer.answeredAt && (
            <span className={styles.answeredDate}>
              {getRelativeTime(prayer.answeredAt)}
            </span>
          )}
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.authorInfo}>
          <div className={styles.avatar}>{getUserAvatar(prayer.userId)}</div>
          <div className={styles.meta}>
            <div className={styles.authorName}>
              {prayer.userId.substring(0, 20)}
              {prayer.userId.length > 20 ? '...' : ''}
              {isOwner && <span className={styles.youBadge}>You</span>}
            </div>
            <div className={styles.timestamp}>
              <span className={styles.sourceIcon}>{getSourceIcon()}</span>
              {prayer.dayNumber && `Day ${prayer.dayNumber} • `}
              {getRelativeTime(prayer.createdAt)}
            </div>
          </div>
        </div>
      </div>

      {prayer.title && <h3 className={styles.title}>{prayer.title}</h3>}

      <p className={styles.content}>{prayer.content}</p>

      {prayer.sourceReference && (
        <div className={styles.reference}>
          <span className={styles.referenceIcon}>🔗</span>
          {prayer.sourceReference}
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.footer}>
        <button
          className={`${styles.supportButton} ${
            isSupporting ? styles.active : ''
          }`}
          onClick={handleToggleSupport}
          disabled={isToggling || isAnswered}
        >
          <svg viewBox="0 0 24 24" className={styles.handsIcon}>
            <path
              d="M12 5.69l1.09-1.6a2.5 2.5 0 0 1 3.56-.46 2.5 2.5 0 0 1 .46 3.27L12 14.31 6.89 6.9a2.5 2.5 0 0 1 .46-3.27 2.5 2.5 0 0 1 3.56.46L12 5.69z"
              fill={isSupporting ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 14.31V21"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <span>
            {isSupporting ? 'Praying' : 'Pray for this'}
          </span>
        </button>

        {isOwner && !isAnswered && (
          <button
            className={styles.markAnsweredButton}
            onClick={handleMarkAnswered}
          >
            Mark as Answered
          </button>
        )}
      </div>

      {prayer._count.prayerSupport > 0 && (
        <div className={styles.supportSection}>
          <div className={styles.supportHeader}>
            <span className={styles.supportCount}>
              {prayer._count.prayerSupport}{' '}
              {prayer._count.prayerSupport === 1 ? 'person is' : 'people are'}{' '}
              praying
            </span>
          </div>
          <div className={styles.supportersList}>
            {displayedSupporters.map((supporter, index) => (
              <div
                key={`${supporter.userId}-${index}`}
                className={styles.supporterAvatar}
                style={{ zIndex: displayedSupporters.length - index }}
                title={supporter.userId}
              >
                {getUserAvatar(supporter.userId)}
              </div>
            ))}
            {hasMoreSupporters && !showAllSupporters && (
              <button
                className={styles.moreButton}
                onClick={() => setShowAllSupporters(true)}
              >
                +{prayer.prayerSupport.length - 5}
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
