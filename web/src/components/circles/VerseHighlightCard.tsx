'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import styles from './verse-highlight-card.module.css';

interface Reaction {
  id: string;
  userId: string;
  type: 'amen' | 'insightful' | 'saved';
  createdAt: string;
}

interface VerseHighlightCardProps {
  highlight: {
    id: string;
    userId: string;
    reference: string;
    text: string;
    insight?: string | null;
    fromDayNumber?: number | null;
    createdAt: string;
    reactions: Reaction[];
    _count: {
      reactions: number;
    };
  };
  circleId: string;
  onUpdate?: () => void;
}

const REACTION_TYPES = [
  { type: 'amen', emoji: '🙏', label: 'Amen' },
  { type: 'insightful', emoji: '💡', label: 'Insightful' },
  { type: 'saved', emoji: '💾', label: 'Saved' },
] as const;

export default function VerseHighlightCard({
  highlight,
  circleId,
  onUpdate,
}: VerseHighlightCardProps) {
  const { user } = useUser();
  const [isReacting, setIsReacting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = highlight.userId === user?.id;

  const getUserReactions = () => {
    return highlight.reactions
      .filter((r) => r.userId === user?.id)
      .map((r) => r.type);
  };

  const getReactionCount = (type: string) => {
    return highlight.reactions.filter((r) => r.type === type).length;
  };

  const handleReaction = async (type: string) => {
    if (!user || isReacting) return;

    try {
      setIsReacting(true);
      setError(null);

      const response = await fetch(
        `/api/circles/${circleId}/highlights/${highlight.id}/react`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to react');
      }

      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to react');
    } finally {
      setIsReacting(false);
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

  const userReactions = getUserReactions();

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div className={styles.authorInfo}>
          <div className={styles.avatar}>{getUserAvatar(highlight.userId)}</div>
          <div className={styles.meta}>
            <div className={styles.authorName}>
              {highlight.userId.substring(0, 20)}
              {highlight.userId.length > 20 ? '...' : ''}
              {isOwner && <span className={styles.youBadge}>You</span>}
            </div>
            <div className={styles.timestamp} suppressHydrationWarning>
              {highlight.fromDayNumber && (
                <>Day {highlight.fromDayNumber} • </>
              )}
              {getRelativeTime(highlight.createdAt)}
            </div>
          </div>
        </div>
      </div>

      {highlight.fromDayNumber && (
        <div className={styles.dayBadge}>Day {highlight.fromDayNumber}</div>
      )}

      <div className={styles.verseContainer}>
        <div className={styles.verseReference}>{highlight.reference}</div>
        <div className={styles.verseText}>{highlight.text}</div>
      </div>

      {highlight.insight && (
        <div className={styles.insightSection}>
          <div className={styles.insightLabel}>💭 Personal Insight</div>
          <div className={styles.insightContent}>{highlight.insight}</div>
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.footer}>
        <div className={styles.reactions}>
          {REACTION_TYPES.map(({ type, emoji, label }) => {
            const count = getReactionCount(type);
            const isActive = userReactions.includes(type);

            return (
              <button
                key={type}
                className={`${styles.reactionButton} ${
                  isActive ? styles.active : ''
                }`}
                onClick={() => handleReaction(type)}
                disabled={isReacting}
                title={label}
              >
                <span className={styles.reactionEmoji}>{emoji}</span>
                {count > 0 && <span className={styles.reactionCount}>{count}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </article>
  );
}
