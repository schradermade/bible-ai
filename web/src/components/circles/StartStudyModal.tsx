'use client';

import { useState } from 'react';
import styles from './start-study-modal.module.css';
import { TEMPLATE_OPTIONS } from '@/lib/study-plan-templates';

interface StartStudyModalProps {
  circleId: string;
  circleName: string;
  onClose: () => void;
  onStudyCreated?: () => void;
}

export default function StartStudyModal({
  circleId,
  circleName,
  onClose,
  onStudyCreated,
}: StartStudyModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [duration, setDuration] = useState<7 | 21>(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTemplate) {
      setError('Please select a study plan');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/circles/${circleId}/studies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateSource: selectedTemplate,
          duration,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to start study');
      }

      onStudyCreated?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start study');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Start New Study</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.circleInfo}>
            <div className={styles.circleIcon}>⭕</div>
            <div>
              <div className={styles.circleName}>{circleName}</div>
              <div className={styles.circleHint}>
                Choose a study plan for your circle to follow together
              </div>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Study Duration <span className={styles.required}>*</span>
            </label>
            <div className={styles.durationToggle}>
              <button
                type="button"
                className={`${styles.durationButton} ${duration === 7 ? styles.durationButtonActive : ''}`}
                onClick={() => setDuration(7)}
              >
                7 Days
              </button>
              <button
                type="button"
                className={`${styles.durationButton} ${duration === 21 ? styles.durationButtonActive : ''}`}
                onClick={() => setDuration(21)}
              >
                21 Days
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Study Plan <span className={styles.required}>*</span>
            </label>
            <div className={styles.templateGrid}>
              {TEMPLATE_OPTIONS.map((template) => (
                <button
                  key={template.value}
                  type="button"
                  className={`${styles.templateCard} ${selectedTemplate === template.value ? styles.templateCardActive : ''}`}
                  onClick={() => setSelectedTemplate(template.value)}
                >
                  <div className={styles.templateIcon}>{template.icon}</div>
                  <div className={styles.templateTitle}>{template.title}</div>
                  <div className={styles.templateDescription}>
                    {template.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading || !selectedTemplate}
            >
              {loading ? 'Starting...' : 'Start Study'}
            </button>
          </div>
        </form>

        <div className={styles.info}>
          <div className={styles.infoIcon}>ℹ️</div>
          <div className={styles.infoText}>
            All circle members will be invited to join this study. Each member
            progresses at their own pace while sharing reflections and
            encouragement.
          </div>
        </div>
      </div>
    </div>
  );
}
