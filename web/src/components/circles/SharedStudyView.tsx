'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import styles from './shared-study-view.module.css';
import MemberProgressIndicator from './MemberProgressIndicator';

interface StudyDay {
  id: string;
  dayNumber: number;
  title: string;
  completed: boolean;
  completedAt: string | null;
}

interface MemberPlan {
  userId: string;
  studyPlan: {
    id: string;
    userId: string;
    days: StudyDay[];
  };
}

interface CircleStudyPlan {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  startDate: string;
  status: string;
  memberPlans: MemberPlan[];
  _count: {
    memberPlans: number;
    reflections: number;
  };
}

interface SharedStudyViewProps {
  circleId: string;
  studyPlanId: string;
}

export default function SharedStudyView({
  circleId,
  studyPlanId,
}: SharedStudyViewProps) {
  const { user } = useUser();
  const [studyPlan, setStudyPlan] = useState<CircleStudyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    fetchStudyPlan();
  }, [circleId, studyPlanId]);

  const fetchStudyPlan = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/circles/${circleId}/studies/${studyPlanId}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch study plan');
      }

      setStudyPlan(data.studyPlan);

      // Check if current user has joined
      const userPlan = data.studyPlan.memberPlans.find(
        (mp: MemberPlan) => mp.userId === user?.id
      );
      setHasJoined(!!userPlan);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch study plan'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleJoinStudy = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/circles/${circleId}/studies/${studyPlanId}/join`,
        {
          method: 'POST',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to join study');
      }

      // Redirect to the new study plan
      window.location.href = `/study`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join study');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading study...</div>
      </div>
    );
  }

  if (error || !studyPlan) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error || 'Study not found'}</div>
      </div>
    );
  }

  const memberProgress = studyPlan.memberPlans.map((mp) => {
    const completedDays = mp.studyPlan.days.filter((d) => d.completed).length;
    const lastCompleted = mp.studyPlan.days
      .filter((d) => d.completed && d.completedAt)
      .sort(
        (a, b) =>
          new Date(b.completedAt!).getTime() -
          new Date(a.completedAt!).getTime()
      )[0];

    return {
      userId: mp.userId,
      completedDays,
      totalDays: studyPlan.duration,
      lastCompletedAt: lastCompleted?.completedAt || undefined,
    };
  });

  if (!hasJoined) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <a href={`/circles/${circleId}`} className={styles.backLink}>
            ← Back to Circle
          </a>
        </div>

        <div className={styles.joinPrompt}>
          <div className={styles.studyInfo}>
            <div className={styles.studyIcon}>📖</div>
            <div>
              <h1 className={styles.studyTitle}>{studyPlan.title}</h1>
              {studyPlan.description && (
                <p className={styles.studyDescription}>
                  {studyPlan.description}
                </p>
              )}
              <div className={styles.studyMeta}>
                {studyPlan.duration} days • Started{' '}
                {new Date(studyPlan.startDate).toLocaleDateString()}
              </div>
              <div className={styles.studyParticipants}>
                {studyPlan._count.memberPlans} members participating
              </div>
            </div>
          </div>

          <div className={styles.joinCard}>
            <h2 className={styles.joinTitle}>Join This Study</h2>
            <p className={styles.joinDescription}>
              Create your personal study plan to join your circle members in
              this {studyPlan.duration}-day journey through Scripture.
            </p>
            <button
              className={styles.joinButton}
              onClick={handleJoinStudy}
              disabled={loading}
            >
              {loading ? 'Joining...' : 'Join Study'}
            </button>
          </div>

          <MemberProgressIndicator members={memberProgress} />
        </div>
      </div>
    );
  }

  const userPlan = studyPlan.memberPlans.find(
    (mp) => mp.userId === user?.id
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <a href={`/circles/${circleId}`} className={styles.backLink}>
          ← Back to Circle
        </a>
        <h1 className={styles.title}>{studyPlan.title}</h1>
      </div>

      <div className={styles.splitView}>
        <div className={styles.personalStudy}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>My Study</h2>
            <a href="/study" className={styles.viewLink}>
              Open Full View →
            </a>
          </div>
          <div className={styles.studyPreview}>
            <p className={styles.previewText}>
              Your personal study plan is active. Open the full study view to
              read Scripture, reflect, and engage with the daily content.
            </p>
            <a href="/study" className={styles.openStudyButton}>
              Open Study Plan
            </a>
          </div>
        </div>

        <div className={styles.circleContext}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Circle Activity</h2>
          </div>

          <MemberProgressIndicator members={memberProgress} />

          <div className={styles.placeholderCard}>
            <h3 className={styles.placeholderTitle}>Shared Reflections</h3>
            <p className={styles.placeholderText}>
              Reflections shared by members will appear here (Phase 2)
            </p>
          </div>

          <div className={styles.placeholderCard}>
            <h3 className={styles.placeholderTitle}>Prayer Requests</h3>
            <p className={styles.placeholderText}>
              Circle prayer requests will appear here (Phase 2)
            </p>
          </div>

          <div className={styles.placeholderCard}>
            <h3 className={styles.placeholderTitle}>Shared Verses</h3>
            <p className={styles.placeholderText}>
              Verses shared by members will appear here (Phase 2)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
