'use client';

import { useEffect, useState } from 'react';
import styles from './milestone-modal.module.css';
import type { Milestone } from '@/lib/circle-milestones';

interface MilestoneModalProps {
  milestones: Milestone[];
  isOpen: boolean;
  onClose: () => void;
  circleName: string;
}

export default function MilestoneModal({
  milestones,
  isOpen,
  onClose,
  circleName,
}: MilestoneModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsExiting(false);
    }
  }, [isOpen]);

  if (!isOpen || milestones.length === 0) return null;

  const currentMilestone = milestones[currentIndex];
  const hasMultiple = milestones.length > 1;

  const handleNext = () => {
    if (currentIndex < milestones.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
    }, 300);
  };

  const getCategoryGradient = (category: string) => {
    switch (category) {
      case 'study':
        return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
      case 'community':
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      case 'prayer':
        return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
      case 'scripture':
        return 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
      default:
        return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    }
  };

  return (
    <div className={`${styles.overlay} ${isExiting ? styles.overlayExit : ''}`}>
      <div
        className={`${styles.modal} ${isExiting ? styles.modalExit : ''}`}
        style={{ background: getCategoryGradient(currentMilestone.category) }}
      >
        {/* Confetti animation */}
        <div className={styles.confetti}>
          {Array.from({ length: 50 }, (_, i) => (
            <div
              key={i}
              className={styles.confettiPiece}
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        <button className={styles.closeButton} onClick={handleClose}>
          <svg viewBox="0 0 24 24" className={styles.closeIcon}>
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className={styles.content}>
          <div className={styles.badge}>Milestone Achieved!</div>

          <div className={styles.iconWrapper}>
            <div className={styles.iconPulse} />
            <span className={styles.icon}>{currentMilestone.icon}</span>
          </div>

          <h2 className={styles.title}>{currentMilestone.name}</h2>

          <p className={styles.description}>{currentMilestone.description}</p>

          <div className={styles.circleName}>
            <span className={styles.circleIcon}>👥</span>
            {circleName}
          </div>

          <div className={styles.celebrationMessage}>
            {currentMilestone.celebrationMessage}
          </div>

          {hasMultiple && (
            <div className={styles.progress}>
              {milestones.map((_, index) => (
                <div
                  key={index}
                  className={`${styles.progressDot} ${index === currentIndex ? styles.progressDotActive : ''} ${index < currentIndex ? styles.progressDotCompleted : ''}`}
                />
              ))}
            </div>
          )}

          <div className={styles.footer}>
            <button className={styles.button} onClick={handleNext}>
              {currentIndex < milestones.length - 1 ? (
                <>
                  Next Milestone <span className={styles.arrow}>→</span>
                </>
              ) : (
                'Celebrate!'
              )}
            </button>
            {hasMultiple && (
              <div className={styles.counter}>
                {currentIndex + 1} of {milestones.length}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
