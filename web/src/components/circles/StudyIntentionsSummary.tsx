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
  const canGenerate = submittedCount >= 2;

  const hasCompleted = (userId: string) => {
    return intentions.some((intention) => intention.userId === userId);
  };

  return (
    <div className={styles.summaryContainer}>
      <div className={styles.summaryHeader}>
        <h3>Group Study Input</h3>
        <div className={styles.submissionStatus}>
          {submittedCount}/{totalMembers} members have submitted
        </div>
      </div>

      {/* Visual indicator for how to track submissions */}
      <div className={styles.indicatorGuide}>
        <div className={styles.guideIcon}>💡</div>
        <div className={styles.guideContent}>
          <p className={styles.guideText}>
            Check member avatars above — a <span className={styles.goldBadge}>gold-bordered checkmark</span> means they've submitted their input
          </p>
        </div>
      </div>

      {/* Generate button (only for creator, only when >= 2 submissions) */}
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
