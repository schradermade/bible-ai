'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import styles from './encouragement-prompt-card.module.css';

interface Reaction {
  id: string;
  userId: string;
  type: 'amen' | 'encouraging' | 'blessed';
  createdAt: string;
}

interface Response {
  id: string;
  userId: string;
  userName?: string;
  content: string;
  source: 'ai_generated' | 'user_custom';
  scriptureRef?: string | null;
  scriptureText?: string | null;
  reflection?: string | null;
  prayerPrompt?: string | null;
  createdAt: string;
  reactions: Reaction[];
  _count: {
    reactions: number;
  };
}

interface EncouragementPromptCardProps {
  encouragement: {
    id: string;
    promptText: string;
    createdBy: string;
    createdByName?: string;
    dayNumber?: number | null;
    createdAt: string;
    responses: Response[];
    _count: {
      responses: number;
    };
  };
  circleId: string;
  onUpdate?: () => void;
  onAddResponse?: (encouragement: EncouragementPromptCardProps['encouragement']) => void;
}

const RESPONSE_REACTION_TYPES = [
  { type: 'amen', emoji: '🙏', label: 'Amen' },
  { type: 'encouraging', emoji: '💚', label: 'Encouraging' },
  { type: 'blessed', emoji: '✨', label: 'Blessed' },
] as const;

export default function EncouragementPromptCard({
  encouragement,
  circleId,
  onUpdate,
  onAddResponse,
}: EncouragementPromptCardProps) {
  const { user } = useUser();
  const [isReacting, setIsReacting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isPromptOwner = encouragement.createdBy === user?.id;

  const getUserReactions = (response: Response) => {
    return response.reactions
      .filter((r) => r.userId === user?.id)
      .map((r) => r.type);
  };

  const getReactionCount = (response: Response, type: string) => {
    return response.reactions.filter((r) => r.type === type).length;
  };

  const handleReaction = async (responseId: string, type: string) => {
    if (!user || isReacting) return;

    try {
      setIsReacting(responseId);
      setError(null);

      const response = await fetch(
        `/api/circles/${circleId}/encouragements/${encouragement.id}/responses/${responseId}/react`,
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
      setIsReacting(null);
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

  const getUserAvatar = (userName?: string, userId?: string) => {
    if (userName) {
      return userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    return userId?.substring(0, 2).toUpperCase() || '??';
  };

  return (
    <article className={styles.card}>
      <div className={styles.promptHeader}>
        <span className={styles.promptAuthor}>
          {encouragement.createdByName || encouragement.createdBy}
        </span>
        {isPromptOwner && <span className={styles.youBadge}>You</span>}
        <span className={styles.promptTime} suppressHydrationWarning>
          {getRelativeTime(encouragement.createdAt)}
        </span>
        {encouragement.dayNumber && (
          <span className={styles.dayBadge}>Day {encouragement.dayNumber}</span>
        )}
      </div>

      <div className={styles.promptText}>{encouragement.promptText}</div>

      {error && <div className={styles.error}>{error}</div>}

      {encouragement.responses.length > 0 && (
        <div className={styles.responsesSection}>
          {encouragement.responses.map((response) => {
            const isResponseOwner = response.userId === user?.id;
            const userReactions = getUserReactions(response);

            return (
              <div key={response.id} className={styles.responseCard}>
                <div className={styles.responseHeader}>
                  <div className={styles.responseAvatar}>
                    {getUserAvatar(response.userName, response.userId)}
                  </div>
                  <div className={styles.responseMeta}>
                    <span className={styles.responseAuthor}>
                      {response.userName || response.userId}
                      {isResponseOwner && (
                        <span className={styles.youBadgeSmall}>you</span>
                      )}
                    </span>
                    <span className={styles.responseTime} suppressHydrationWarning>
                      {getRelativeTime(response.createdAt)}
                    </span>
                    {response.source === 'ai_generated' && (
                      <span className={styles.aiBadge}>AI</span>
                    )}
                  </div>
                </div>

                <div className={styles.responseContent}>{response.content}</div>

                {response.source === 'ai_generated' && (response.scriptureRef || response.reflection || response.prayerPrompt) && (
                  <div className={styles.aiSections}>
                    {response.scriptureRef && response.scriptureText && (
                      <div className={styles.scriptureSection}>
                        <div className={styles.scriptureRef}>
                          {response.scriptureRef}
                        </div>
                        <div className={styles.scriptureText}>
                          {response.scriptureText}
                        </div>
                      </div>
                    )}

                    {response.reflection && (
                      <div className={styles.reflectionSection}>
                        <div className={styles.reflectionTitle}>
                          Reflection
                        </div>
                        <div className={styles.reflectionText}>
                          {response.reflection}
                        </div>
                      </div>
                    )}

                    {response.prayerPrompt && (
                      <div className={styles.prayerSection}>
                        <div className={styles.prayerTitle}>Prayer</div>
                        <div className={styles.prayerText}>
                          {response.prayerPrompt}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className={styles.responseReactions}>
                  {RESPONSE_REACTION_TYPES.map(({ type, emoji, label }) => {
                    const count = getReactionCount(response, type);
                    const isActive = userReactions.includes(type);

                    return (
                      <button
                        key={type}
                        className={`${styles.reactionButton} ${
                          isActive ? styles.active : ''
                        }`}
                        onClick={() => handleReaction(response.id, type)}
                        disabled={isReacting === response.id}
                        title={label}
                      >
                        <span className={styles.reactionEmoji}>{emoji}</span>
                        {count > 0 && (
                          <span className={styles.reactionCount}>{count}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.footer}>
        <button className={styles.addResponseButton} onClick={() => onAddResponse?.(encouragement)}>
          <svg viewBox="0 0 24 24" className={styles.addIcon}>
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          {encouragement.responses.length === 0
            ? 'Be the first to respond'
            : 'Add Response'}
        </button>
      </div>
    </article>
  );
}
