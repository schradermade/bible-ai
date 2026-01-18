'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import styles from './shared-study-view.module.css';
import MemberProgressIndicator from './MemberProgressIndicator';
import ReflectionCard from './ReflectionCard';
import PrayerRequestCard from './PrayerRequestCard';
import SharedVerseCard from './SharedVerseCard';

interface StudyDay {
  id: string;
  dayNumber: number;
  title: string;
  completed: boolean;
  completedAt: string | null;
}

interface MemberPlan {
  userId: string;
  userName?: string;
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

interface Reflection {
  id: string;
  userId: string;
  dayNumber: number;
  content: string;
  verseHighlight?: string | null;
  createdAt: string;
  updatedAt: string;
  reactions: Array<{
    id: string;
    userId: string;
    type: 'amen' | 'praying' | 'insightful' | 'encouraging';
    createdAt: string;
  }>;
  comments: Array<{
    id: string;
    userId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
  }>;
  _count: {
    reactions: number;
    comments: number;
  };
}

interface Prayer {
  id: string;
  userId: string;
  title?: string | null;
  content: string;
  source: string;
  sourceReference?: string | null;
  dayNumber?: number | null;
  status: string;
  answeredAt?: string | null;
  createdAt: string;
  prayerSupport: Array<{
    id: string;
    userId: string;
    createdAt: string;
  }>;
  _count: {
    prayerSupport: number;
  };
}

interface Verse {
  id: string;
  userId: string;
  reference: string;
  text: string;
  note?: string | null;
  fromDayNumber?: number | null;
  createdAt: string;
  reactions: Array<{
    id: string;
    userId: string;
    type: 'amen' | 'saved' | 'memorizing';
    createdAt: string;
  }>;
  _count: {
    reactions: number;
  };
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
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [verses, setVerses] = useState<Verse[]>([]);

  useEffect(() => {
    fetchStudyPlan();
  }, [circleId, studyPlanId]);

  useEffect(() => {
    if (hasJoined) {
      fetchSharedContent();
    }
  }, [hasJoined, circleId]);

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

      fetchStudyPlan();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join study');
      setLoading(false);
    }
  };

  const fetchSharedContent = async () => {
    await Promise.all([
      fetchReflections(),
      fetchPrayers(),
      fetchVerses(),
    ]);
  };

  const fetchReflections = async () => {
    try {
      const response = await fetch(
        `/api/circles/${circleId}/reflections?limit=5`
      );
      const data = await response.json();

      if (response.ok) {
        setReflections(data.reflections || []);
      }
    } catch (err) {
      console.error('Failed to fetch reflections:', err);
    }
  };

  const fetchPrayers = async () => {
    try {
      const response = await fetch(
        `/api/circles/${circleId}/prayers?limit=5`
      );
      const data = await response.json();

      if (response.ok) {
        setPrayers(data.prayers || []);
      }
    } catch (err) {
      console.error('Failed to fetch prayers:', err);
    }
  };

  const fetchVerses = async () => {
    try {
      const response = await fetch(
        `/api/circles/${circleId}/verses?limit=5`
      );
      const data = await response.json();

      if (response.ok) {
        setVerses(data.verses || []);
      }
    } catch (err) {
      console.error('Failed to fetch verses:', err);
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
      userName: mp.userName,
      completedDays,
      totalDays: studyPlan.duration,
      lastCompletedAt: lastCompleted?.completedAt || undefined,
    };
  });

  if (!hasJoined) {
    return (
      <div className={styles.container}>
        <div className={styles.joinPrompt}>
          <div className={styles.studyHeader}>
            <h1 className={styles.studyTitle}>{studyPlan.title}</h1>
            {studyPlan.description && (
              <p className={styles.studyDescription}>
                {studyPlan.description}
              </p>
            )}
            <div className={styles.studyMeta}>
              {studyPlan.duration} days • {studyPlan._count.memberPlans} members
            </div>
          </div>

          <div className={styles.joinCard}>
            <p>
              Join this study to participate with your circle in this {studyPlan.duration}-day
              journey through Scripture.
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
  const completedDays = userPlan?.studyPlan.days.filter(d => d.completed).length || 0;

  return (
    <div className={styles.container}>
      {/* Single unified header - compact */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{studyPlan.title}</h1>
          <div className={styles.meta}>
            <span>{studyPlan.duration} days</span>
            <span className={styles.metaSeparator}>•</span>
            <span>{studyPlan._count.memberPlans} members</span>
            <span className={styles.metaSeparator}>•</span>
            <span>Day {completedDays + 1}</span>
          </div>
        </div>
      </div>

      {/* Single unified content area - no nested containers */}
      <div className={styles.content}>
        {/* Main study area */}
        <div className={styles.mainArea}>
          <div className={styles.studyInfo}>
            <p>Your group is studying together through this {studyPlan.duration}-day plan. Continue your personal study to stay in sync with your circle.</p>
          </div>

          {/* Member progress - compact */}
          <div className={styles.progressSection}>
            <h3 className={styles.sectionTitle}>Circle Progress</h3>
            <MemberProgressIndicator members={memberProgress} />
          </div>

          {/* Shared content - integrated */}
          {reflections.length > 0 && (
            <div className={styles.contentSection}>
              <h3 className={styles.sectionTitle}>Recent Reflections</h3>
              {reflections.map((reflection) => (
                <ReflectionCard
                  key={reflection.id}
                  reflection={reflection}
                  circleId={circleId}
                  onUpdate={fetchReflections}
                />
              ))}
            </div>
          )}

          {prayers.length > 0 && (
            <div className={styles.contentSection}>
              <h3 className={styles.sectionTitle}>Prayer Requests</h3>
              {prayers.map((prayer) => (
                <PrayerRequestCard
                  key={prayer.id}
                  prayer={prayer}
                  circleId={circleId}
                  onUpdate={fetchPrayers}
                />
              ))}
            </div>
          )}

          {verses.length > 0 && (
            <div className={styles.contentSection}>
              <h3 className={styles.sectionTitle}>Shared Verses</h3>
              {verses.map((verse) => (
                <SharedVerseCard
                  key={verse.id}
                  verse={verse}
                  circleId={circleId}
                  onUpdate={fetchVerses}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
