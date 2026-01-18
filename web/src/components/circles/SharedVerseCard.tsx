'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import styles from './shared-verse-card.module.css';

interface VerseReaction {
  id: string;
  userId: string;
  type: 'amen' | 'saved' | 'memorizing';
  createdAt: string;
}

interface SharedVerseCardProps {
  verse: {
    id: string;
    userId: string;
    reference: string;
    text: string;
    note?: string | null;
    fromDayNumber?: number | null;
    createdAt: string;
    reactions: VerseReaction[];
    _count: {
      reactions: number;
    };
  };
  circleId: string;
  onUpdate?: () => void;
}

const REACTION_TYPES = [
  { type: 'amen', emoji: '🙏', label: 'Amen' },
  { type: 'saved', emoji: '💾', label: 'Saved' },
  { type: 'memorizing', emoji: '📝', label: 'Memorizing' },
] as const;

export default function SharedVerseCard({
  verse,
  circleId,
  onUpdate,
}: SharedVerseCardProps) {
  const { user } = useUser();
  const [isReacting, setIsReacting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = verse.userId === user?.id;

  const getUserReactions = () => {
    return verse.reactions
      .filter((r) => r.userId === user?.id)
      .map((r) => r.type);
  };

  const getReactionCount = (type: string) => {
    return verse.reactions.filter((r) => r.type === type).length;
  };

  const handleReaction = async (type: string) => {
    if (!user || isReacting) return;

    try {
      setIsReacting(true);
      setError(null);

      const response = await fetch(
        `/api/circles/${circleId}/verses/${verse.id}/react`,
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
          <div className={styles.avatar}>{getUserAvatar(verse.userId)}</div>
          <div className={styles.meta}>
            <div className={styles.authorName}>
              {verse.userId.substring(0, 20)}
              {verse.userId.length > 20 ? '...' : ''}
              {isOwner && <span className={styles.youBadge}>You</span>}
            </div>
            <div className={styles.timestamp} suppressHydrationWarning>
              {verse.fromDayNumber && `Day ${verse.fromDayNumber} • `}
              {getRelativeTime(verse.createdAt)}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.verseContainer}>
        <div className={styles.referenceHeader}>
          <svg viewBox="0 0 24 24" className={styles.bibleIcon}>
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
          <h3 className={styles.reference}>{verse.reference}</h3>
        </div>

        <blockquote className={styles.verseText}>
          <div className={styles.quoteIcon}>"</div>
          {verse.text}
          <div className={styles.quoteIconEnd}>"</div>
        </blockquote>

        {verse.note && (
          <div className={styles.note}>
            <div className={styles.noteIcon}>💭</div>
            <p className={styles.noteText}>{verse.note}</p>
          </div>
        )}
      </div>

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
