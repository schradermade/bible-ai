'use client';

import { useState, useEffect } from 'react';
import styles from './circle-view.module.css';
import CircleStatsCard from './circles/CircleStatsCard';
import InviteModal from './circles/InviteModal';
import StartStudyModal from './circles/StartStudyModal';

interface CircleMember {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
}

interface CirclePlan {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  status: string;
  startDate: string;
  _count: {
    memberPlans: number;
  };
}

interface Circle {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  createdAt: string;
  members: CircleMember[];
  plans: CirclePlan[];
}

interface CircleViewProps {
  circleId: string;
  onClose: () => void;
}

export default function CircleView({ circleId, onClose }: CircleViewProps) {
  const [circle, setCircle] = useState<Circle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showStartStudyModal, setShowStartStudyModal] = useState(false);

  const loadCircle = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/circles/${circleId}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to load circle');
      }

      const data = await response.json();
      setCircle(data.circle);
    } catch (error) {
      console.error('Failed to load circle:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to load circle'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCircle();
  }, [circleId]);

  if (isLoading) {
    return (
      <div className={styles.circleView}>
        <div className={styles.header}>
          <button className={styles.closeButton} onClick={onClose}>
            ← Back to Chat
          </button>
        </div>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading circle...</p>
        </div>
      </div>
    );
  }

  if (error || !circle) {
    return (
      <div className={styles.circleView}>
        <div className={styles.header}>
          <button className={styles.closeButton} onClick={onClose}>
            ← Back to Chat
          </button>
        </div>
        <div className={styles.error}>
          <p>{error || 'Circle not found'}</p>
          <button className={styles.retryButton} onClick={onClose}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const activePlan = circle.plans.find((p) => p.status === 'active');

  return (
    <div className={styles.circleView}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.closeButton} onClick={onClose}>
          ← Back to Chat
        </button>
      </div>

      {/* Circle Info */}
      <div className={styles.circleInfo}>
        <div className={styles.circleHeader}>
          <div>
            <h1 className={styles.circleName}>{circle.name}</h1>
            {circle.description && (
              <p className={styles.circleDescription}>{circle.description}</p>
            )}
          </div>
          <div className={styles.circleActions}>
            <button
              className={styles.inviteButton}
              onClick={() => setShowInviteModal(true)}
            >
              + Invite
            </button>
          </div>
        </div>

        {/* Members Count */}
        <div className={styles.circleStats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{circle.members.length}</span>
            <span className={styles.statLabel}>Members</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>
              {circle.plans.filter((p) => p.status === 'active').length}
            </span>
            <span className={styles.statLabel}>Active Studies</span>
          </div>
        </div>
      </div>

      {/* Active Study Section */}
      {activePlan && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Active Study</h2>
          <div className={styles.studyCard}>
            <div className={styles.studyCardHeader}>
              <h3 className={styles.studyTitle}>{activePlan.title}</h3>
              <span className={styles.studyDuration}>
                {activePlan.duration} days
              </span>
            </div>
            {activePlan.description && (
              <p className={styles.studyDescription}>
                {activePlan.description}
              </p>
            )}
            <div className={styles.studyStats}>
              <span>
                {activePlan._count.memberPlans} of {circle.members.length}{' '}
                members joined
              </span>
            </div>
            <a
              href={`/circles/${circle.id}/study/${activePlan.id}`}
              className={styles.viewStudyButton}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Study →
            </a>
          </div>
        </div>
      )}

      {/* Stats Section */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Circle Statistics</h2>
        <CircleStatsCard circleId={circle.id} />
      </div>

      {/* Members Section */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Members ({circle.members.length})
        </h2>
        <div className={styles.membersList}>
          {circle.members.map((member) => (
            <div key={member.id} className={styles.memberCard}>
              <div className={styles.memberAvatar}>
                {member.userId.substring(0, 2).toUpperCase()}
              </div>
              <div className={styles.memberInfo}>
                <span className={styles.memberUserId}>{member.userId}</span>
                {member.role === 'owner' && (
                  <span className={styles.memberRole}>Owner</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* No Active Study CTA */}
      {!activePlan && (
        <div className={styles.section}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📚</div>
            <h3>No Active Study</h3>
            <p>Start a study plan to begin your circle's journey together</p>
            <button
              className={styles.startStudyButton}
              onClick={() => setShowStartStudyModal(true)}
            >
              Start New Study
            </button>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          circleId={circle.id}
          circleName={circle.name}
        />
      )}

      {/* Start Study Modal */}
      {showStartStudyModal && (
        <StartStudyModal
          circleId={circle.id}
          circleName={circle.name}
          onClose={() => setShowStartStudyModal(false)}
          onStudyCreated={loadCircle}
        />
      )}
    </div>
  );
}
