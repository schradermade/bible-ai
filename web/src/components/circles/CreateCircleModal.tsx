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
  const [isSolo, setIsSolo] = useState(false);
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
          maxMembers: isSolo ? 1 : 8,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create circle');
      }

      onCircleCreated(data.circle);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create circle');
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>

        <h2 className={styles.modalTitle}>Create Study Circle</h2>

        <form onSubmit={handleSubmit}>
          {/* Study Type Selection */}
          <div className={styles.typeStep}>
            <h3>Choose Study Type</h3>
            <div className={styles.typeOptions}>
              <button
                type="button"
                className={`${styles.typeCard} ${!isSolo ? styles.selected : ''}`}
                onClick={() => setIsSolo(false)}
              >
                <div className={styles.typeTitle}>Group Study</div>
                <div className={styles.typeDesc}>Study with 2-8 friends</div>
              </button>
              <button
                type="button"
                className={`${styles.typeCard} ${isSolo ? styles.selected : ''}`}
                onClick={() => setIsSolo(true)}
              >
                <div className={styles.typeTitle}>Solo Study</div>
                <div className={styles.typeDesc}>Study on your own</div>
              </button>
            </div>
          </div>

          {/* Circle Details */}
          <div className={styles.detailsSection}>
            <div className={styles.fieldGroup}>
              <label htmlFor="circle-name" className={styles.fieldLabel}>
                Circle Name <span className={styles.required}>*</span>
              </label>
              <input
                id="circle-name"
                type="text"
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  isSolo
                    ? 'e.g., My Personal Study'
                    : 'e.g., Sunday School Group'
                }
                maxLength={100}
                disabled={loading}
                autoFocus
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="circle-description" className={styles.fieldLabel}>
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
              <div className={styles.charCount}>{description.length}/500</div>
            </div>
          </div>

          {/* Info Card */}
          <div className={styles.infoSection}>
            <div className={styles.infoCard}>
              <span className={styles.infoIcon}>ℹ️</span>
              <span className={styles.infoText}>
                {isSolo
                  ? 'Solo circles are perfect for personal study with AI-generated plans.'
                  : "You'll be able to invite members after creating the circle. Group circles can have 2-8 members."}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && <div className={styles.error}>{error}</div>}

          {/* Action Buttons */}
          <div className={styles.buttonRow}>
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
              className={styles.createButton}
              disabled={loading || !name.trim()}
            >
              {loading ? (
                <>
                  <span className={styles.spinner}></span>
                  Creating Circle...
                </>
              ) : (
                'Create Circle'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
