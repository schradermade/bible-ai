'use client';

import styles from './study-intentions-summary.module.css';

interface CircleMember {
  id: string;
  userId: string;
  userName?: string;
  role: string;
}

interface Intention {
  id: string;
  userId: string;
  userName: string;
  createdAt: string;
}

interface StudyIntentionsSummaryProps {
  intentions: Intention[];
  members: CircleMember[];
  totalMembers: number;
  isCreator: boolean;
  onGenerateStudy: () => void;
}

function getUserInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export default function StudyIntentionsSummary({
  intentions,
  members,
  totalMembers,
  isCreator,
  onGenerateStudy,
}: StudyIntentionsSummaryProps) {
  const submittedCount = intentions.length;
  // For solo circles (1 member), require 1 submission
  // For group circles, require at least 2 submissions
  const minSubmissions = totalMembers === 1 ? 1 : Math.max(2, Math.ceil(totalMembers * 0.5));
  const canGenerate = submittedCount >= minSubmissions;

  const hasCompleted = (userId: string) => {
    return intentions.some((intention) => intention.userId === userId);
  };

  return (
    <div className={styles.summaryContainer}>
      <div className={styles.summaryHeader}>
        <h3>{totalMembers === 1 ? 'Your Study Input' : 'Group Study Input'}</h3>
        <div className={styles.submissionStatus}>
          {totalMembers === 1
            ? submittedCount > 0
              ? 'Input submitted'
              : 'No input yet'
            : `${submittedCount}/${totalMembers} members have submitted`}
        </div>
      </div>

      {/* Visual indicator for how to track submissions - only for group circles */}
      {totalMembers > 1 && (
        <div className={styles.indicatorGuide}>
          <div className={styles.guideIcon}>💡</div>
          <div className={styles.guideContent}>
            <p className={styles.guideText}>
              Check member avatars above — a <span className={styles.goldBadge}>gold-bordered checkmark</span> means they've submitted their input
            </p>
          </div>
        </div>
      )}

      {/* Generate button (only for creator, only when minimum submissions met) */}
      {isCreator && canGenerate && (
        <div className={styles.generateButtonWrapper}>
          <button className={styles.generateStudyButton} onClick={onGenerateStudy}>
            <span className={styles.generateIcon}>✨</span>
            Generate Study with Berea AI
          </button>
        </div>
      )}
    </div>
  );
}
