'use client';

import { useState } from 'react';
import styles from './add-encouragement-response-modal.module.css';

interface AddEncouragementResponseModalProps {
  circleId: string;
  encouragementId: string;
  promptText: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface AIGeneratedContent {
  encouragement: string;
  scriptureReference: string;
  scriptureText: string;
  reflection: string;
  prayerPrompt: string;
}

export default function AddEncouragementResponseModal({
  circleId,
  encouragementId,
  promptText,
  isOpen,
  onClose,
  onSuccess,
}: AddEncouragementResponseModalProps) {
  const [mode, setMode] = useState<'custom' | 'ai'>('custom');
  const [customContent, setCustomContent] = useState('');
  const [aiContext, setAiContext] = useState('');
  const [aiGenerated, setAiGenerated] = useState<AIGeneratedContent | null>(null);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!aiContext.trim()) {
      setError('Please provide some context for the AI');
      return;
    }

    try {
      setGenerating(true);
      setError(null);

      const response = await fetch('/api/ai/generate-encouragement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptText,
          context: aiContext,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(
            data.message || 'You have reached your monthly AI request limit'
          );
        }
        throw new Error(data.message || 'Failed to generate encouragement');
      }

      setAiGenerated({
        encouragement: data.encouragement,
        scriptureReference: data.scriptureReference,
        scriptureText: data.scriptureText,
        reflection: data.reflection,
        prayerPrompt: data.prayerPrompt,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate encouragement');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const content =
      mode === 'custom' ? customContent : aiGenerated?.encouragement || '';

    if (!content.trim()) {
      setError('Please provide a response');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(
        `/api/circles/${circleId}/encouragements/${encouragementId}/responses`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: content.trim(),
            source: mode === 'ai' ? 'ai_generated' : 'user_custom',
            scriptureRef: aiGenerated?.scriptureReference || null,
            scriptureText: aiGenerated?.scriptureText || null,
            reflection: aiGenerated?.reflection || null,
            prayerPrompt: aiGenerated?.prayerPrompt || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to share response');
      }

      // Reset form
      setCustomContent('');
      setAiContext('');
      setAiGenerated(null);
      setMode('custom');

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share response');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setCustomContent('');
    setAiContext('');
    setAiGenerated(null);
    setMode('custom');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>💬 Respond to Encouragement</h2>
            <p className={styles.subtitle}>{promptText}</p>
          </div>
          <button className={styles.closeButton} onClick={handleCancel}>
            <svg viewBox="0 0 24 24" className={styles.closeIcon}>
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${mode === 'custom' ? styles.active : ''}`}
            onClick={() => {
              setMode('custom');
              setError(null);
            }}
          >
            ✍️ Write My Own
          </button>
          <button
            className={`${styles.tab} ${mode === 'ai' ? styles.active : ''}`}
            onClick={() => {
              setMode('ai');
              setError(null);
            }}
          >
            ✨ Generate with AI
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {mode === 'custom' ? (
            <div className={styles.formGroup}>
              <label htmlFor="custom" className={styles.label}>
                Your Response
              </label>
              <textarea
                id="custom"
                className={styles.textarea}
                placeholder="Share your encouraging words..."
                value={customContent}
                onChange={(e) => setCustomContent(e.target.value)}
                maxLength={500}
                rows={6}
                required
              />
              <div className={styles.charCount}>{customContent.length}/500</div>
            </div>
          ) : (
            <>
              {!aiGenerated ? (
                <div className={styles.formGroup}>
                  <label htmlFor="context" className={styles.label}>
                    Add Context (Optional)
                  </label>
                  <textarea
                    id="context"
                    className={styles.textarea}
                    placeholder="Add any specific context or needs to help guide the AI..."
                    value={aiContext}
                    onChange={(e) => setAiContext(e.target.value)}
                    rows={3}
                  />
                  <button
                    type="button"
                    className={styles.generateButton}
                    onClick={handleGenerate}
                    disabled={generating}
                  >
                    {generating ? (
                      <>
                        <div className={styles.spinner} />
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" className={styles.generateIcon}>
                          <path
                            d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                            fill="currentColor"
                          />
                        </svg>
                        Generate Response
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className={styles.preview}>
                  <div className={styles.previewHeader}>
                    <span className={styles.previewTitle}>
                      AI-Generated Response
                    </span>
                    <button
                      type="button"
                      className={styles.regenerateButton}
                      onClick={() => setAiGenerated(null)}
                    >
                      ↻ Generate Again
                    </button>
                  </div>

                  <div className={styles.previewContent}>
                    <p className={styles.previewText}>{aiGenerated.encouragement}</p>

                    {aiGenerated.scriptureReference && aiGenerated.scriptureText && (
                      <div className={styles.previewScripture}>
                        <div className={styles.previewScriptureRef}>
                          📖 {aiGenerated.scriptureReference}
                        </div>
                        <div className={styles.previewScriptureText}>
                          {aiGenerated.scriptureText}
                        </div>
                      </div>
                    )}

                    {aiGenerated.reflection && (
                      <div className={styles.previewReflection}>
                        <div className={styles.previewLabel}>💭 Reflection</div>
                        <div className={styles.previewLabelText}>
                          {aiGenerated.reflection}
                        </div>
                      </div>
                    )}

                    {aiGenerated.prayerPrompt && (
                      <div className={styles.previewPrayer}>
                        <div className={styles.previewLabel}>🙏 Prayer</div>
                        <div className={styles.previewLabelText}>
                          {aiGenerated.prayerPrompt}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={handleCancel}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={
                submitting ||
                (mode === 'custom' && !customContent.trim()) ||
                (mode === 'ai' && !aiGenerated)
              }
            >
              {submitting ? 'Sharing...' : 'Share Response'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
