'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import styles from './shared-study-view.module.css';
import MemberProgressIndicator from './MemberProgressIndicator';
import ReflectionCard from './ReflectionCard';
import PrayerRequestCard from './PrayerRequestCard';
import SharedVerseCard from './SharedVerseCard';
import ActivityFeed from './ActivityFeed';

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

  // Phase 2: Shared content state
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [contentLoading, setContentLoading] = useState(false);

  // Phase 3: Mobile tabs
  const [activeTab, setActiveTab] = useState<'study' | 'circle'>('study');

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

  const fetchSharedContent = async () => {
    setContentLoading(true);
    await Promise.all([
      fetchReflections(),
      fetchPrayers(),
      fetchVerses(),
    ]);
    setContentLoading(false);
  };

  const fetchReflections = async () => {
    try {
      const response = await fetch(
        `/api/circles/${circleId}/reflections?limit=10`
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
        `/api/circles/${circleId}/prayers?limit=10`
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
        `/api/circles/${circleId}/verses?limit=10`
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

  const hasNewActivity = reflections.length + prayers.length + verses.length > 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <a href={`/circles/${circleId}`} className={styles.backLink}>
          ← Back to Circle
        </a>
        <h1 className={styles.title}>{studyPlan.title}</h1>
      </div>

      {/* Mobile tabs */}
      <div className={styles.mobileTabs}>
        <button
          className={`${styles.mobileTab} ${activeTab === 'study' ? styles.mobileTabActive : ''}`}
          onClick={() => setActiveTab('study')}
        >
          <span className={styles.mobileTabIcon}>📖</span>
          <span>My Study</span>
        </button>
        <button
          className={`${styles.mobileTab} ${activeTab === 'circle' ? styles.mobileTabActive : ''}`}
          onClick={() => setActiveTab('circle')}
        >
          <span className={styles.mobileTabIcon}>👥</span>
          <span>Circle</span>
          {hasNewActivity && <span className={styles.activityBadge} />}
        </button>
      </div>

      <div className={styles.splitView}>
        <div className={`${styles.personalStudy} ${activeTab === 'study' ? styles.tabActive : ''}`}>
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

        <div className={`${styles.circleContext} ${activeTab === 'circle' ? styles.tabActive : ''}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Circle Activity</h2>
          </div>

          <MemberProgressIndicator members={memberProgress} />

          <ActivityFeed circleId={circleId} limit={20} />

          <div className={styles.contentSection}>
            <h3 className={styles.contentSectionTitle}>Shared Reflections</h3>
            {contentLoading ? (
              <div className={styles.contentLoading}>Loading reflections...</div>
            ) : reflections.length > 0 ? (
              reflections.map((reflection) => (
                <ReflectionCard
                  key={reflection.id}
                  reflection={reflection}
                  circleId={circleId}
                  onUpdate={fetchReflections}
                />
              ))
            ) : (
              <div className={styles.emptyContent}>
                <p>No reflections shared yet. Be the first to share your thoughts!</p>
              </div>
            )}
          </div>

          <div className={styles.contentSection}>
            <h3 className={styles.contentSectionTitle}>Prayer Requests</h3>
            {contentLoading ? (
              <div className={styles.contentLoading}>Loading prayers...</div>
            ) : prayers.length > 0 ? (
              prayers.map((prayer) => (
                <PrayerRequestCard
                  key={prayer.id}
                  prayer={prayer}
                  circleId={circleId}
                  onUpdate={fetchPrayers}
                />
              ))
            ) : (
              <div className={styles.emptyContent}>
                <p>No prayer requests yet. Share a prayer need with your circle.</p>
              </div>
            )}
          </div>

          <div className={styles.contentSection}>
            <h3 className={styles.contentSectionTitle}>Shared Verses</h3>
            {contentLoading ? (
              <div className={styles.contentLoading}>Loading verses...</div>
            ) : verses.length > 0 ? (
              verses.map((verse) => (
                <SharedVerseCard
                  key={verse.id}
                  verse={verse}
                  circleId={circleId}
                  onUpdate={fetchVerses}
                />
              ))
            ) : (
              <div className={styles.emptyContent}>
                <p>No verses shared yet. Share a meaningful verse with your circle.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
