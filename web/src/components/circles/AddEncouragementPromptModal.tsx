'use client';

import { useState } from 'react';
import styles from './add-encouragement-prompt-modal.module.css';

interface AddEncouragementPromptModalProps {
  circleId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  currentDay?: number;
}

export default function AddEncouragementPromptModal({
  circleId,
  isOpen,
  onClose,
  onSuccess,
  currentDay,
}: AddEncouragementPromptModalProps) {
  const [promptText, setPromptText] = useState('');
  const [dayNumber, setDayNumber] = useState(currentDay?.toString() || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!promptText.trim()) {
      setError('Please enter a prompt');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/circles/${circleId}/encouragements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptText: promptText.trim(),
          dayNumber: dayNumber ? parseInt(dayNumber) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create prompt');
      }

      // Reset form
      setPromptText('');
      setDayNumber(currentDay?.toString() || '');

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create prompt');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setPromptText('');
    setDayNumber(currentDay?.toString() || '');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>💬 Create Encouragement Prompt</h2>
            <p className={styles.subtitle}>
              Ask your circle a question or share a thought to encourage responses
            </p>
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

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="prompt" className={styles.label}>
              Prompt <span className={styles.required}>*</span>
            </label>
            <textarea
              id="prompt"
              className={styles.textarea}
              placeholder="e.g., What verse encouraged you most this week?"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              maxLength={200}
              rows={3}
              required
            />
            <div className={styles.charCount}>{promptText.length}/200</div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="dayNumber" className={styles.label}>
              Link to Day <span className={styles.optional}>(Optional)</span>
            </label>
            <input
              id="dayNumber"
              type="number"
              className={styles.input}
              placeholder="e.g., 1"
              value={dayNumber}
              onChange={(e) => setDayNumber(e.target.value)}
              min="1"
            />
          </div>

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
              disabled={submitting || !promptText.trim()}
            >
              {submitting ? 'Creating...' : 'Create Prompt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
