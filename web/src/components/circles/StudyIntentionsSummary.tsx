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
        <h3>Group Study Intentions</h3>
        <div className={styles.submissionStatus}>
          {submittedCount}/{totalMembers} members have submitted
        </div>
      </div>

      {/* Member Completion Status */}
      <div className={styles.memberStatusSection}>
        <h3 className={styles.memberStatusTitle}>Study Contribution Status</h3>
        <div className={styles.memberAvatars}>
          {members.map((member) => {
            const completed = hasCompleted(member.userId);
            const displayName = member.userName || member.userId;
            const initials = getUserInitials(displayName);

            return (
              <div key={member.id} className={styles.memberAvatarItem}>
                <div
                  className={`${styles.memberAvatar} ${
                    completed ? styles.completed : styles.pending
                  }`}
                >
                  {initials}
                  {completed && (
                    <div className={styles.completionBadge}>✓</div>
                  )}
                </div>
                <div className={styles.memberName}>{displayName}</div>
              </div>
            );
          })}
        </div>
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
