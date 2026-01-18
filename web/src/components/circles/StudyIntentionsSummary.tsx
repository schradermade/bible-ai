'use client';

import styles from './study-intentions-summary.module.css';

interface Intention {
  id: string;
  userId: string;
  userName: string;
  createdAt: string;
}

interface StudyIntentionsSummaryProps {
  intentions: Intention[];
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
  totalMembers,
  isCreator,
  onGenerateStudy,
}: StudyIntentionsSummaryProps) {
  const submittedCount = intentions.length;
  const canGenerate = submittedCount >= 2;

  return (
    <div className={styles.summaryContainer}>
      <div className={styles.summaryHeader}>
        <h3>Group Study Intentions</h3>
        <div className={styles.submissionStatus}>
          {submittedCount}/{totalMembers} members have submitted
        </div>
      </div>

      {/* Sealed scroll cards for each submission */}
      <div className={styles.scrollsList}>
        {intentions.map((intention) => (
          <div key={intention.id} className={styles.sealedScroll}>
            <div className={styles.scrollAvatar}>
              {getUserInitials(intention.userName)}
            </div>
            <div className={styles.scrollContent}>
              <div className={styles.scrollName}>{intention.userName}</div>
              <div className={styles.scrollSealed}>Sealed 📜</div>
            </div>
          </div>
        ))}
      </div>

      {/* Generate button (only for creator, only when >= 2 submissions) */}
      {isCreator && canGenerate && (
        <button className={styles.generateStudyButton} onClick={onGenerateStudy}>
          Generate Study from Group Input
        </button>
      )}

      {/* Minimum requirement message */}
      {isCreator && !canGenerate && (
        <div className={styles.requirementMessage}>
          <div className={styles.requirementIcon}>⏳</div>
          <p>At least 2 members need to submit intentions before generating</p>
          <p className={styles.requirementSubtext}>
            {submittedCount > 0
              ? `${2 - submittedCount} more ${2 - submittedCount === 1 ? 'submission' : 'submissions'} needed`
              : 'Waiting for submissions...'}
          </p>
        </div>
      )}
    </div>
  );
}
