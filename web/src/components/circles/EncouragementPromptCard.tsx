'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import styles from './encouragement-prompt-card.module.css';

interface Reaction {
  id: string;
  userId: string;
  userName?: string;
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
}: EncouragementPromptCardProps) {
  const { user } = useUser();
  const [isReacting, setIsReacting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResponseInput, setShowResponseInput] = useState(false);
  const [hoveredReaction, setHoveredReaction] = useState<{ responseId: string; type: string } | null>(null);
  const [responseMode, setResponseMode] = useState<'custom' | 'ai'>('custom');
  const [customResponse, setCustomResponse] = useState('');
  const [aiContext, setAiContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiGenerated, setAiGenerated] = useState<{
    encouragement: string;
    scriptureReference: string;
    scriptureText: string;
    reflection: string;
    prayerPrompt: string;
  } | null>(null);

  const isPromptOwner = encouragement.createdBy === user?.id;

  const getUserReactions = (response: Response) => {
    return response.reactions
      .filter((r) => r.userId === user?.id)
      .map((r) => r.type);
  };

  const getReactionCount = (response: Response, type: string) => {
    return response.reactions.filter((r) => r.type === type).length;
  };

  const getReactionUsers = (response: Response, type: string) => {
    return response.reactions
      .filter((r) => r.type === type)
      .map((r) => r.userName || 'Unknown User');
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

  const handleGenerateAI = async () => {
    if (!aiContext.trim()) {
      setError('Please provide context for AI generation');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      const response = await fetch('/api/ai/generate-encouragement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptText: encouragement.promptText,
          context: aiContext,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to generate encouragement');
      }

      const data = await response.json();
      setAiGenerated(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate encouragement');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!user) return;

    const content = responseMode === 'custom' ? customResponse.trim() : aiGenerated?.encouragement;
    if (!content) {
      setError('Please provide a response');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch(
        `/api/circles/${circleId}/encouragements/${encouragement.id}/responses`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            source: responseMode === 'ai' ? 'ai_generated' : 'user_custom',
            ...(responseMode === 'ai' && aiGenerated && {
              scriptureRef: aiGenerated.scriptureReference,
              scriptureText: aiGenerated.scriptureText,
              reflection: aiGenerated.reflection,
              prayerPrompt: aiGenerated.prayerPrompt,
            }),
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to submit response');
      }

      // Reset form
      setCustomResponse('');
      setAiContext('');
      setAiGenerated(null);
      setShowResponseInput(false);
      setResponseMode('custom');
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit response');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowResponseInput(false);
    setCustomResponse('');
    setAiContext('');
    setAiGenerated(null);
    setResponseMode('custom');
    setError(null);
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
                    const users = getReactionUsers(response, type);
                    const showPopup = hoveredReaction?.responseId === response.id && hoveredReaction?.type === type && count > 0;

                    return (
                      <div key={type} className={styles.reactionWrapper}>
                        <button
                          className={`${styles.reactionButton} ${
                            isActive ? styles.active : ''
                          }`}
                          onClick={() => handleReaction(response.id, type)}
                          onMouseEnter={() => setHoveredReaction({ responseId: response.id, type })}
                          onMouseLeave={() => setHoveredReaction(null)}
                          disabled={isReacting === response.id}
                          title={label}
                        >
                          <span className={styles.reactionEmoji}>{emoji}</span>
                          {count > 0 && (
                            <span className={styles.reactionCount}>{count}</span>
                          )}
                        </button>
                        {showPopup && (
                          <div className={styles.reactionPopup}>
                            <div className={styles.reactionPopupArrow} />
                            <div className={styles.reactionPopupContent}>
                              {users.map((userName, idx) => (
                                <div key={idx} className={styles.reactionPopupUser}>
                                  {userName}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.footer}>
        {!showResponseInput ? (
          <button
            className={styles.addResponseButton}
            onClick={() => setShowResponseInput(true)}
          >
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
        ) : (
          <div className={styles.responseInputContainer}>
            <div className={styles.modeToggle}>
              <button
                className={`${styles.modeButton} ${
                  responseMode === 'custom' ? styles.modeButtonActive : ''
                }`}
                onClick={() => setResponseMode('custom')}
              >
                Write My Own
              </button>
              <button
                className={`${styles.modeButton} ${
                  responseMode === 'ai' ? styles.modeButtonActive : ''
                }`}
                onClick={() => setResponseMode('ai')}
              >
                Generate with AI
              </button>
            </div>

            {responseMode === 'custom' ? (
              <div className={styles.customInput}>
                <textarea
                  className={styles.responseTextarea}
                  placeholder="Share your encouragement..."
                  value={customResponse}
                  onChange={(e) => setCustomResponse(e.target.value)}
                  maxLength={500}
                  rows={3}
                />
                <div className={styles.characterCount}>
                  {customResponse.length}/500
                </div>
              </div>
            ) : (
              <div className={styles.aiInput}>
                <textarea
                  className={styles.contextTextarea}
                  placeholder="Share context for AI to generate encouragement (e.g., 'I'm struggling with anxiety about the future')"
                  value={aiContext}
                  onChange={(e) => setAiContext(e.target.value)}
                  rows={2}
                />
                {!aiGenerated ? (
                  <button
                    className={styles.generateButton}
                    onClick={handleGenerateAI}
                    disabled={isGenerating || !aiContext.trim()}
                  >
                    {isGenerating ? 'Generating...' : 'Generate Encouragement'}
                  </button>
                ) : (
                  <div className={styles.aiPreview}>
                    <div className={styles.aiPreviewHeader}>
                      AI Generated Response
                    </div>
                    <div className={styles.aiPreviewContent}>
                      <p>{aiGenerated.encouragement}</p>
                      {aiGenerated.scriptureReference && (
                        <div className={styles.aiPreviewScripture}>
                          <strong>{aiGenerated.scriptureReference}</strong>
                          <p>{aiGenerated.scriptureText}</p>
                        </div>
                      )}
                      {aiGenerated.reflection && (
                        <div className={styles.aiPreviewSection}>
                          <strong>Reflection:</strong> {aiGenerated.reflection}
                        </div>
                      )}
                      {aiGenerated.prayerPrompt && (
                        <div className={styles.aiPreviewSection}>
                          <strong>Prayer:</strong> {aiGenerated.prayerPrompt}
                        </div>
                      )}
                    </div>
                    <button
                      className={styles.regenerateButton}
                      onClick={handleGenerateAI}
                      disabled={isGenerating}
                    >
                      Regenerate
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className={styles.actionButtons}>
              <button
                className={styles.cancelButton}
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                className={styles.submitButton}
                onClick={handleSubmitResponse}
                disabled={
                  isSubmitting ||
                  (responseMode === 'custom' && !customResponse.trim()) ||
                  (responseMode === 'ai' && !aiGenerated)
                }
              >
                {isSubmitting ? 'Submitting...' : 'Submit Response'}
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
