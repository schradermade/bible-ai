'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import styles from './circle-home.module.css';
import InviteModal from './InviteModal';
import PrivacySettingsModal from './PrivacySettingsModal';
import StartStudyModal from './StartStudyModal';
import ProgressHeatmap from './ProgressHeatmap';
import ActivityFeed from './ActivityFeed';
import CircleStatsCard from './CircleStatsCard';

interface Member {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  shareProgress: boolean;
  shareReflections: boolean;
  shareVerses: boolean;
  sharePrayers: boolean;
}

interface Study {
  id: string;
  title: string;
  duration: number;
  startDate: string;
  status: string;
  _count: {
    memberPlans: number;
  };
}

interface Circle {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  maxMembers: number;
  createdAt: string;
  members: Member[];
  plans: Study[];
  _count: {
    members: number;
    plans: number;
    prayers: number;
    verses: number;
  };
}

interface CircleHomeProps {
  circleId: string;
}

export default function CircleHome({ circleId }: CircleHomeProps) {
  const { user } = useUser();
  const [circle, setCircle] = useState<Circle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showStartStudyModal, setShowStartStudyModal] = useState(false);

  useEffect(() => {
    fetchCircle();
  }, [circleId]);

  const fetchCircle = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/circles/${circleId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch circle');
      }

      setCircle(data.circle);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch circle');
    } finally {
      setLoading(false);
    }
  };

  const isOwner = circle?.createdBy === user?.id;
  const isAdmin = circle?.members.find((m) => m.userId === user?.id)?.role === 'admin';
  const canManage = isOwner || isAdmin;

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading circle...</div>
      </div>
    );
  }

  if (error || !circle) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error || 'Circle not found'}</div>
      </div>
    );
  }

  const activeStudy = circle.plans.find((p) => p.status === 'active');

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <a href="/circles" className={styles.backLink}>
              ← Back to Circles
            </a>
            <h1 className={styles.title}>{circle.name}</h1>
            {circle.description && (
              <p className={styles.description}>{circle.description}</p>
            )}
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.statValue}>{circle._count.members}</div>
              <div className={styles.statLabel}>Members</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{circle._count.plans}</div>
              <div className={styles.statLabel}>Studies</div>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.settingsButton}
            onClick={() => setShowPrivacyModal(true)}
            title="Privacy Settings"
          >
            <svg viewBox="0 0 24 24" className={styles.settingsIcon}>
              <path
                d="M12 15a3 3 0 100-6 3 3 0 000 6z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </button>
          <button
            className={styles.inviteButton}
            onClick={() => setShowInviteModal(true)}
          >
            + Invite Members
          </button>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.mainColumn}>
          {activeStudy ? (
            <div className={styles.activeStudyCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Active Study</h2>
                <div className={styles.badge}>In Progress</div>
              </div>
              <div className={styles.studyInfo}>
                <div className={styles.studyIcon}>📖</div>
                <div>
                  <h3 className={styles.studyTitle}>{activeStudy.title}</h3>
                  <div className={styles.studyMeta}>
                    {activeStudy.duration} days • Started{' '}
                    {new Date(activeStudy.startDate).toLocaleDateString()}
                  </div>
                  <div className={styles.studyParticipants}>
                    {activeStudy._count.memberPlans}{' '}
                    {activeStudy._count.memberPlans === 1
                      ? 'member'
                      : 'members'}{' '}
                    participating
                  </div>
                </div>
              </div>
              <div className={styles.studyActions}>
                <a
                  href={`/circles/${circle.id}/study/${activeStudy.id}`}
                  className={styles.viewStudyButton}
                >
                  View Study
                </a>
              </div>
            </div>
          ) : (
            <div className={styles.emptyStudyCard}>
              <div className={styles.emptyIcon}>📚</div>
              <h3 className={styles.emptyTitle}>No Active Study</h3>
              <p className={styles.emptyText}>
                Start a study together to begin your shared Scripture journey.
              </p>
              {canManage && (
                <button
                  className={styles.startStudyButton}
                  onClick={() => setShowStartStudyModal(true)}
                >
                  Start New Study
                </button>
              )}
            </div>
          )}

          {activeStudy && (
            <ProgressHeatmap
              circleId={circle.id}
              studyPlanId={activeStudy.id}
              totalDays={activeStudy.duration}
            />
          )}

          <ActivityFeed circleId={circle.id} limit={15} />

          <CircleStatsCard circleId={circle.id} studyPlanId={activeStudy?.id} />
        </div>

        <div className={styles.sidebar}>
          <div className={styles.membersCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Members</h2>
              <div className={styles.memberCount}>
                {circle._count.members}/{circle.maxMembers}
              </div>
            </div>
            <div className={styles.membersList}>
              {circle.members.map((member) => (
                <div key={member.id} className={styles.memberItem}>
                  <div className={styles.memberAvatar}>
                    {member.userId.substring(0, 2).toUpperCase()}
                  </div>
                  <div className={styles.memberInfo}>
                    <div className={styles.memberName}>
                      {member.userId.substring(0, 20)}
                      {member.userId.length > 20 ? '...' : ''}
                    </div>
                    <div className={styles.memberRole}>
                      {member.role === 'owner' && '👑 '}
                      {member.role}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.quickStats}>
            <h3 className={styles.quickStatsTitle}>Circle Stats</h3>
            <div className={styles.quickStatItem}>
              <span className={styles.quickStatLabel}>Total Prayers</span>
              <span className={styles.quickStatValue}>
                {circle._count.prayers}
              </span>
            </div>
            <div className={styles.quickStatItem}>
              <span className={styles.quickStatLabel}>Shared Verses</span>
              <span className={styles.quickStatValue}>
                {circle._count.verses}
              </span>
            </div>
            <div className={styles.quickStatItem}>
              <span className={styles.quickStatLabel}>Created</span>
              <span className={styles.quickStatValue}>
                {new Date(circle.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {showInviteModal && (
        <InviteModal
          circleId={circle.id}
          circleName={circle.name}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      <PrivacySettingsModal
        circleId={circle.id}
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        onUpdate={fetchCircle}
      />

      {showStartStudyModal && (
        <StartStudyModal
          circleId={circle.id}
          circleName={circle.name}
          onClose={() => setShowStartStudyModal(false)}
          onStudyCreated={fetchCircle}
        />
      )}
    </div>
  );
}
