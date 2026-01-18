'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import styles from './reflection-card.module.css';

interface Reaction {
  id: string;
  userId: string;
  type: 'amen' | 'praying' | 'insightful' | 'encouraging';
  createdAt: string;
}

interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
}

interface ReflectionCardProps {
  reflection: {
    id: string;
    userId: string;
    dayNumber: number;
    content: string;
    verseHighlight?: string | null;
    createdAt: string;
    updatedAt: string;
    reactions: Reaction[];
    comments: Comment[];
    _count: {
      reactions: number;
      comments: number;
    };
  };
  circleId: string;
  onUpdate?: () => void;
}

const REACTION_TYPES = [
  { type: 'amen', emoji: '🙏', label: 'Amen' },
  { type: 'praying', emoji: '✨', label: 'Praying' },
  { type: 'insightful', emoji: '💡', label: 'Insightful' },
  { type: 'encouraging', emoji: '💪', label: 'Encouraging' },
] as const;

export default function ReflectionCard({
  reflection,
  circleId,
  onUpdate,
}: ReflectionCardProps) {
  const { user } = useUser();
  const [showAllComments, setShowAllComments] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = reflection.userId === user?.id;
  const displayedComments = showAllComments
    ? reflection.comments
    : reflection.comments.slice(0, 3);
  const hasMoreComments = reflection.comments.length > 3;

  const getUserReactions = () => {
    return reflection.reactions
      .filter((r) => r.userId === user?.id)
      .map((r) => r.type);
  };

  const getReactionCount = (type: string) => {
    return reflection.reactions.filter((r) => r.type === type).length;
  };

  const handleReaction = async (type: string) => {
    if (!user || isReacting) return;

    try {
      setIsReacting(true);
      setError(null);

      const response = await fetch(
        `/api/circles/${circleId}/reflections/${reflection.id}/react`,
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

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmittingComment) return;

    try {
      setIsSubmittingComment(true);
      setError(null);

      const response = await fetch(
        `/api/circles/${circleId}/reflections/${reflection.id}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: newComment.trim() }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to post comment');
      }

      setNewComment('');
      setShowCommentInput(false);
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
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
          <div className={styles.avatar}>{getUserAvatar(reflection.userId)}</div>
          <div className={styles.meta}>
            <div className={styles.authorName}>
              {reflection.userId.substring(0, 20)}
              {reflection.userId.length > 20 ? '...' : ''}
              {isOwner && <span className={styles.youBadge}>You</span>}
            </div>
            <div className={styles.timestamp}>
              Day {reflection.dayNumber} • {getRelativeTime(reflection.createdAt)}
              {reflection.updatedAt !== reflection.createdAt && (
                <span className={styles.edited}>(edited)</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {reflection.verseHighlight && (
        <div className={styles.verseHighlight}>
          <div className={styles.verseIcon}>📖</div>
          <div className={styles.verseText}>{reflection.verseHighlight}</div>
        </div>
      )}

      <div className={styles.content}>{reflection.content}</div>

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

        <button
          className={styles.commentButton}
          onClick={() => setShowCommentInput(!showCommentInput)}
        >
          <svg viewBox="0 0 24 24" className={styles.commentIcon}>
            <path
              d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {reflection._count.comments > 0 && (
            <span>{reflection._count.comments}</span>
          )}
        </button>
      </div>

      {reflection.comments.length > 0 && (
        <div className={styles.commentsSection}>
          <div className={styles.commentsList}>
            {displayedComments.map((comment) => {
              const isCommentOwner = comment.userId === user?.id;
              return (
                <div key={comment.id} className={styles.comment}>
                  <div className={styles.commentAvatar}>
                    {getUserAvatar(comment.userId)}
                  </div>
                  <div className={styles.commentContent}>
                    <div className={styles.commentHeader}>
                      <span className={styles.commentAuthor}>
                        {comment.userId.substring(0, 15)}
                        {comment.userId.length > 15 ? '...' : ''}
                        {isCommentOwner && (
                          <span className={styles.youBadgeSmall}>you</span>
                        )}
                      </span>
                      <span className={styles.commentTime}>
                        {getRelativeTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className={styles.commentText}>{comment.content}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {hasMoreComments && !showAllComments && (
            <button
              className={styles.showMoreButton}
              onClick={() => setShowAllComments(true)}
            >
              View {reflection.comments.length - 3} more{' '}
              {reflection.comments.length - 3 === 1 ? 'comment' : 'comments'}
            </button>
          )}
        </div>
      )}

      {showCommentInput && (
        <form onSubmit={handleSubmitComment} className={styles.commentForm}>
          <div className={styles.commentInputWrapper}>
            <textarea
              className={styles.commentInput}
              placeholder="Add a thoughtful comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              maxLength={200}
              rows={2}
              autoFocus
            />
            <div className={styles.commentInputFooter}>
              <span className={styles.charCount}>
                {newComment.length}/200
              </span>
              <div className={styles.commentActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowCommentInput(false);
                    setNewComment('');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={!newComment.trim() || isSubmittingComment}
                >
                  {isSubmittingComment ? 'Posting...' : 'Comment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </article>
  );
}
