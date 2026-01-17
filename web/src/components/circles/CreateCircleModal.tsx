'use client';

import { useState } from 'react';
import styles from './create-circle-modal.module.css';

interface CreateCircleModalProps {
  onClose: () => void;
  onCircleCreated: (circle: any) => void;
}

export default function CreateCircleModal({
  onClose,
  onCircleCreated,
}: CreateCircleModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Circle name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/circles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          maxMembers: 8,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create circle');
      }

      onCircleCreated(data.circle);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create circle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Create Study Circle</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="circle-name" className={styles.label}>
              Circle Name <span className={styles.required}>*</span>
            </label>
            <input
              id="circle-name"
              type="text"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Sunday School Group"
              maxLength={100}
              disabled={loading}
              autoFocus
            />
            <div className={styles.hint}>
              Choose a name that reflects your group's identity
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="circle-description" className={styles.label}>
              Description <span className={styles.optional}>(optional)</span>
            </label>
            <textarea
              id="circle-description"
              className={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this circle about?"
              rows={3}
              maxLength={500}
              disabled={loading}
            />
            <div className={styles.hint}>
              {description.length}/500 characters
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
              disabled={loading || !name.trim()}
            >
              {loading ? 'Creating...' : 'Create Circle'}
            </button>
          </div>
        </form>

        <div className={styles.info}>
          <div className={styles.infoIcon}>ℹ️</div>
          <div className={styles.infoText}>
            You'll be able to invite members after creating the circle.
            Circles can have 2-8 members.
          </div>
        </div>
      </div>
    </div>
  );
}
