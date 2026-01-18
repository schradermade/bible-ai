'use client';

import { useState } from 'react';
import styles from './add-highlight-modal.module.css';

interface AddHighlightModalProps {
  circleId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  currentDay?: number;
}

export default function AddHighlightModal({
  circleId,
  isOpen,
  onClose,
  onSuccess,
  currentDay,
}: AddHighlightModalProps) {
  const [reference, setReference] = useState('');
  const [text, setText] = useState('');
  const [insight, setInsight] = useState('');
  const [fromDayNumber, setFromDayNumber] = useState(currentDay?.toString() || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reference.trim() || !text.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/circles/${circleId}/highlights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: reference.trim(),
          text: text.trim(),
          insight: insight.trim() || null,
          fromDayNumber: fromDayNumber ? parseInt(fromDayNumber) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to share highlight');
      }

      // Reset form
      setReference('');
      setText('');
      setInsight('');
      setFromDayNumber(currentDay?.toString() || '');

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share highlight');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setReference('');
    setText('');
    setInsight('');
    setFromDayNumber(currentDay?.toString() || '');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>💡 Share Verse Insight</h2>
            <p className={styles.subtitle}>
              Share a verse that spoke to you with your circle
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
            <label htmlFor="reference" className={styles.label}>
              Verse Reference <span className={styles.required}>*</span>
            </label>
            <input
              id="reference"
              type="text"
              className={styles.input}
              placeholder="e.g., John 3:16"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              maxLength={100}
              required
            />
            <div className={styles.charCount}>{reference.length}/100</div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="text" className={styles.label}>
              Verse Text <span className={styles.required}>*</span>
            </label>
            <textarea
              id="text"
              className={styles.textarea}
              placeholder="Enter the full verse text..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={2000}
              rows={4}
              required
            />
            <div className={styles.charCount}>{text.length}/2000</div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="insight" className={styles.label}>
              Personal Insight <span className={styles.optional}>(Optional)</span>
            </label>
            <textarea
              id="insight"
              className={styles.textarea}
              placeholder="Share what this verse means to you..."
              value={insight}
              onChange={(e) => setInsight(e.target.value)}
              maxLength={500}
              rows={3}
            />
            <div className={styles.charCount}>{insight.length}/500</div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="dayNumber" className={styles.label}>
              From Day <span className={styles.optional}>(Optional)</span>
            </label>
            <input
              id="dayNumber"
              type="number"
              className={styles.input}
              placeholder="e.g., 1"
              value={fromDayNumber}
              onChange={(e) => setFromDayNumber(e.target.value)}
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
              disabled={submitting || !reference.trim() || !text.trim()}
            >
              {submitting ? 'Sharing...' : 'Share Insight'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
