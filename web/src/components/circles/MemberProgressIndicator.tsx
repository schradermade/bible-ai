'use client';

import styles from './member-progress-indicator.module.css';

interface MemberProgress {
  userId: string;
  completedDays: number;
  totalDays: number;
  lastCompletedAt?: string;
  isActiveNow?: boolean;
}

interface MemberProgressIndicatorProps {
  members: MemberProgress[];
  currentDay?: number;
}

export default function MemberProgressIndicator({
  members,
  currentDay,
}: MemberProgressIndicatorProps) {
  const getProgressPercentage = (member: MemberProgress) => {
    return Math.round((member.completedDays / member.totalDays) * 100);
  };

  const getProgressStatus = (member: MemberProgress) => {
    if (member.completedDays === member.totalDays) {
      return 'completed';
    }
    if (currentDay && member.completedDays >= currentDay) {
      return 'ahead';
    }
    if (currentDay && member.completedDays < currentDay - 1) {
      return 'behind';
    }
    return 'on-track';
  };

  const getCompletionTime = (dateString?: string) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Member Progress</h3>
      <div className={styles.members}>
        {members.map((member) => {
          const status = getProgressStatus(member);
          const percentage = getProgressPercentage(member);

          return (
            <div key={member.userId} className={styles.member}>
              <div className={styles.avatarContainer}>
                <div
                  className={`${styles.avatar} ${
                    member.isActiveNow ? styles.active : ''
                  }`}
                  title={member.userId}
                >
                  {member.userId.substring(0, 2).toUpperCase()}
                </div>
                {member.isActiveNow && (
                  <div className={styles.activeIndicator} title="Active now" />
                )}
                {member.completedDays === member.totalDays && (
                  <div className={styles.completedBadge} title="Completed">
                    ✓
                  </div>
                )}
              </div>

              <div className={styles.info}>
                <div className={styles.userId}>
                  {member.userId.substring(0, 15)}
                  {member.userId.length > 15 ? '...' : ''}
                </div>
                <div className={styles.progress}>
                  <div className={styles.progressBar}>
                    <div
                      className={`${styles.progressFill} ${styles[status]}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className={styles.progressText}>
                    {member.completedDays}/{member.totalDays} days
                  </div>
                </div>
                {member.lastCompletedAt && (
                  <div className={styles.lastCompleted}>
                    Last: {getCompletionTime(member.lastCompletedAt)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {members.length === 0 && (
        <div className={styles.empty}>
          <p>No members have joined this study yet.</p>
        </div>
      )}
    </div>
  );
}
