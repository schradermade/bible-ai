'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useUser } from '@clerk/nextjs';
import styles from './circle-view.module.css';
import CircleStatsCard from './circles/CircleStatsCard';
import InviteModal from './circles/InviteModal';
import StartStudyModal from './circles/StartStudyModal';
import MemberProgressIndicator from './circles/MemberProgressIndicator';
import ReflectionCard from './circles/ReflectionCard';
import PrayerRequestCard from './circles/PrayerRequestCard';
import SharedVerseCard from './circles/SharedVerseCard';
import VerseHighlightCard from './circles/VerseHighlightCard';
import AddHighlightModal from './circles/AddHighlightModal';
import EncouragementPromptCard from './circles/EncouragementPromptCard';
import AddEncouragementPromptModal from './circles/AddEncouragementPromptModal';
import StudyIntentionsForm from './circles/StudyIntentionsForm';
import StudyIntentionsSummary from './circles/StudyIntentionsSummary';
import AIStudyGenerationModal from './circles/AIStudyGenerationModal';

interface CircleMember {
  id: string;
  userId: string;
  userName?: string;
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
  memberPlans: Array<{
    userId: string;
    userName?: string;
    studyPlan: {
      id: string;
      userId: string;
      days: Array<{
        id: string;
        dayNumber: number;
        title: string;
        content: string;
        reflection: string;
        prayer?: string | null;
        verseReference?: string | null;
        verseText?: string | null;
        completed: boolean;
        completedAt: string | null;
      }>;
    };
  }>;
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

interface VerseHighlight {
  id: string;
  userId: string;
  reference: string;
  text: string;
  insight?: string | null;
  fromDayNumber?: number | null;
  createdAt: string;
  reactions: Array<{
    id: string;
    userId: string;
    type: 'amen' | 'insightful' | 'saved';
    createdAt: string;
  }>;
  _count: {
    reactions: number;
  };
}

interface Encouragement {
  id: string;
  promptText: string;
  createdBy: string;
  createdByName?: string;
  dayNumber?: number | null;
  createdAt: string;
  responses: Array<{
    id: string;
    userId: string;
    userName?: string;
    content: string;
    source: 'ai_generated' | 'user_custom';
    scriptureRef?: string | null;
    scriptureText?: string | null;
    reflection?: string | null;
    prayerPrompt?: string | null;
    createdAt: string;
    reactions: Array<{
      id: string;
      userId: string;
      userName?: string;
      type: 'amen' | 'encouraging' | 'blessed';
      createdAt: string;
    }>;
    _count: {
      reactions: number;
    };
  }>;
  _count: {
    responses: number;
  };
}

export default function CircleView({ circleId, onClose }: CircleViewProps) {
  const { user } = useUser();
  const [circle, setCircle] = useState<Circle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showStartStudyModal, setShowStartStudyModal] = useState(false);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [highlights, setHighlights] = useState<VerseHighlight[]>([]);
  const [encouragements, setEncouragements] = useState<Encouragement[]>([]);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [showAllDays, setShowAllDays] = useState(false);
  const [visibleDaysCount, setVisibleDaysCount] = useState(7);
  const [currentDayNumber, setCurrentDayNumber] = useState(1);
  const [showAddHighlightModal, setShowAddHighlightModal] = useState(false);
  const [showAddEncouragementPromptModal, setShowAddEncouragementPromptModal] =
    useState(false);
  const [prayerFilter, setPrayerFilter] = useState<
    'all' | 'active' | 'answered'
  >('all');
  const [intentions, setIntentions] = useState<any[]>([]);
  const [hasSubmittedIntention, setHasSubmittedIntention] = useState(false);
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const [totalMembers, setTotalMembers] = useState(0);
  const [showPlanCompletion, setShowPlanCompletion] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const loadCircle = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/circles/${circleId}`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to load circle');
      }

      const data = await response.json();
      console.log('[CircleView] Loaded circle with plans:', data.circle.plans);
      setCircle(data.circle);

      // Load shared content
      fetchSharedContent();
    } catch (error) {
      console.error('Failed to load circle:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to load circle'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh circle data without showing loading spinner
  const refreshCircle = async () => {
    try {
      const response = await fetch(`/api/circles/${circleId}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to refresh circle');
      }

      const data = await response.json();
      setCircle(data.circle);
    } catch (error) {
      console.error('Failed to refresh circle:', error);
    }
  };

  // Archive the current study
  const handleArchiveStudy = async (planId: string) => {
    setIsArchiving(true);
    try {
      const response = await fetch(`/api/circles/${circleId}/studies/${planId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'archive' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to archive study');
      }

      // Refresh circle data to show updated state
      await new Promise((resolve) => setTimeout(resolve, 300));
      await refreshCircle();
    } catch (error) {
      console.error('Failed to archive study:', error);
      alert(error instanceof Error ? error.message : 'Failed to archive study');
    } finally {
      setIsArchiving(false);
    }
  };

  const fetchSharedContent = async () => {
    await Promise.all([
      fetchReflections(),
      fetchEncouragements(),
      fetchPrayers(),
      fetchVerses(),
      fetchHighlights(),
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
      const response = await fetch(`/api/circles/${circleId}/prayers?limit=5`);
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
      const response = await fetch(`/api/circles/${circleId}/verses?limit=5`);
      const data = await response.json();
      if (response.ok) {
        setVerses(data.verses || []);
      }
    } catch (err) {
      console.error('Failed to fetch verses:', err);
    }
  };

  const fetchHighlights = async () => {
    try {
      const response = await fetch(
        `/api/circles/${circleId}/highlights?limit=5`
      );
      const data = await response.json();
      if (response.ok) {
        setHighlights(data.highlights || []);
      }
    } catch (err) {
      console.error('Failed to fetch highlights:', err);
    }
  };

  const fetchEncouragements = async () => {
    try {
      const response = await fetch(
        `/api/circles/${circleId}/encouragements?limit=3`
      );
      const data = await response.json();
      if (response.ok) {
        setEncouragements(data.encouragements || []);
      }
    } catch (err) {
      console.error('Failed to fetch encouragements:', err);
    }
  };

  const fetchIntentions = async () => {
    try {
      const response = await fetch(`/api/circles/${circleId}/study-intentions`);
      const data = await response.json();
      if (response.ok) {
        setIntentions(data.intentions || []);
        setTotalMembers(data.totalMembers || 0);
        const userIntention = data.intentions?.find(
          (i: any) => i.userId === user?.id
        );
        setHasSubmittedIntention(!!userIntention);
      }
    } catch (err) {
      console.error('Failed to fetch intentions:', err);
    }
  };

  useEffect(() => {
    loadCircle();
  }, [circleId]);

  // Set initial current day number when circle first loads
  useEffect(() => {
    if (circle && user && currentDayNumber === 1) {
      const activePlan = circle.plans.find((p) => p.status === 'active');
      if (activePlan) {
        const userPlan = activePlan.memberPlans?.find(
          (mp) => mp.userId === user.id
        );
        if (userPlan) {
          const completedDays = userPlan.studyPlan.days.filter(
            (d) => d.completed
          ).length;
          setCurrentDayNumber(completedDays + 1);
        }
      }
    }
  }, [circle, user, currentDayNumber]);

  // Fetch intentions when circle loads if no active study
  useEffect(() => {
    if (circle && user) {
      const activePlan = circle.plans.find((p) => p.status === 'active');
      if (!activePlan) {
        fetchIntentions();
      }
    }
  }, [circle, user]);

  // Poll all data every 30 seconds for real-time updates
  useEffect(() => {
    if (!circle) return;

    const interval = setInterval(() => {
      // Refresh circle data without loading spinner (member updates, study progress)
      refreshCircle();

      // Refresh shared content (reflections, prayers, verses, highlights, encouragements)
      fetchSharedContent();

      // Refresh study intentions if no active study
      const activePlan = circle.plans.find((p) => p.status === 'active');
      if (!activePlan) {
        fetchIntentions();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [circleId, circle, refreshCircle, fetchSharedContent, fetchIntentions]);

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

  // Calculate member progress
  const memberProgress =
    activePlan?.memberPlans?.map((mp) => {
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
        totalDays: activePlan.duration,
        lastCompletedAt: lastCompleted?.completedAt || undefined,
      };
    }) || [];

  return (
    <div className={styles.circleView}>
      {/* Top header with back button, title, and invite */}
      <div className={styles.topHeader}>
        <button className={styles.closeButton} onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Chat
        </button>
        <h2 className={styles.studyCircleTitle}>Study Circle</h2>
        <button
          className={styles.inviteButton}
          onClick={() => setShowInviteModal(true)}
        >
          + Invite
        </button>
      </div>

      {/* Circle name and basic info - compact */}
      <div className={styles.circleHeader}>
        <div className={styles.circleHeaderContent}>
          <h1 className={styles.circleName}>{circle.name}</h1>
          {circle.description && (
            <p className={styles.circleDescription}>{circle.description}</p>
          )}
          <div className={styles.circleMeta}>
            <span>{circle.members.length} members</span>
            {activePlan && (
              <>
                <span className={styles.metaSeparator}>•</span>
                <span>
                  {activePlan.title.replace(
                    /^\d+-Day (Journey|Deep Dive): /,
                    ''
                  )}
                </span>
                <span className={styles.metaSeparator}>•</span>
                <span>{activePlan.duration} days</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main unified content area */}
      <div className={styles.content}>
        {activePlan ? (
          <>
            {/* Individual progress bars for each member - stacked */}
            {(() => {
              console.log(
                '[CircleView] activePlan.memberPlans:',
                activePlan.memberPlans
              );
              return (
                activePlan.memberPlans &&
                activePlan.memberPlans.length > 0 && (
                  <div className={styles.memberProgressBars}>
                    <h3 className={styles.progressBarsTitle}>
                      Member Progress
                    </h3>
                    {activePlan.memberPlans.map((mp) => {
                      const completedDays = mp.studyPlan.days.filter(
                        (d) => d.completed
                      ).length;
                      const percentage =
                        (completedDays / activePlan.duration) * 100;
                      const isCurrentUser = mp.userId === user?.id;
                      const displayName = mp.userName || mp.userId;
                      const initials = mp.userName
                        ? mp.userName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .substring(0, 2)
                        : mp.userId.substring(0, 2).toUpperCase();

                      return (
                        <div
                          key={mp.userId}
                          className={styles.memberProgressItem}
                        >
                          <div className={styles.memberProgressRow}>
                            <div className={styles.memberAvatar}>
                              {initials}
                            </div>
                            <div className={styles.memberProgressContent}>
                              <div className={styles.memberProgressHeader}>
                                <span className={styles.memberProgressName}>
                                  {displayName.length > 20
                                    ? displayName.substring(0, 20) + '...'
                                    : displayName}
                                  {isCurrentUser && (
                                    <span className={styles.youLabel}>
                                      {' '}
                                      (You)
                                    </span>
                                  )}
                                </span>
                                <span className={styles.memberProgressCount}>
                                  {completedDays}/{activePlan.duration}
                                </span>
                              </div>
                              <div className={styles.memberProgressBarTrack}>
                                <div
                                  className={`${styles.memberProgressBarFill} ${isCurrentUser ? styles.currentUserBar : ''}`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              );
            })()}

            {/* Current day study - matching Study widget exactly */}
            {(() => {
              const userPlan = activePlan.memberPlans?.find(
                (mp) => mp.userId === user?.id
              );
              if (userPlan) {
                const currentDay = userPlan.studyPlan.days.find(
                  (d) => d.dayNumber === currentDayNumber
                );

                if (currentDay && currentDayNumber <= activePlan.duration) {
                  return (
                    <div className={styles.currentDayFocus}>
                      <div className={styles.dayNumber}>Day {currentDay.dayNumber}</div>
                      <h5 className={styles.dayTitle}>{currentDay.title}</h5>

                      {/* Scripture Section */}
                      {currentDay.verseReference && (
                        <div className={styles.scriptureSection}>
                          <div className={styles.verseWithButton}>
                            <div className={styles.verseContent}>
                              <p className={styles.verseRef}>
                                {currentDay.verseReference}
                              </p>
                              {currentDay.verseText && (
                                <p className={styles.verseText}>
                                  &quot;{currentDay.verseText}&quot;
                                </p>
                              )}
                            </div>
                            <button
                              className={styles.highlightButton}
                              onClick={() => setShowAddHighlightModal(true)}
                              title="Share your insight on this verse"
                            >
                              💡 Share Insight
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Main Content */}
                      <div className={styles.contentSection}>
                        <p className={styles.dayContent}>
                          {currentDay.content}
                        </p>
                      </div>

                      {/* Reflection Questions */}
                      {currentDay.reflection && (
                        <div className={styles.reflectionSection}>
                          <h6 className={styles.reflectionTitle}>Reflection</h6>
                          <p className={styles.reflectionText}>
                            {currentDay.reflection}
                          </p>
                        </div>
                      )}

                      {/* Prayer */}
                      {currentDay.prayer && (
                        <div className={styles.prayerSection}>
                          <div className={styles.prayerHeader}>
                            <h6 className={styles.prayerTitle}>Prayer</h6>
                          </div>
                          <p className={styles.prayerText}>
                            {currentDay.prayer}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className={styles.dayActions}>
                        <button
                          className={
                            currentDay.completed
                              ? styles.completedBtn
                              : styles.completeBtn
                          }
                          disabled={isMarkingComplete}
                          onClick={async () => {
                            setIsMarkingComplete(true);
                            try {
                              const response = await fetch(
                                `/api/study-plans/${userPlan.studyPlan.id}/progress`,
                                {
                                  method: 'PATCH',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    dayNumber: currentDay.dayNumber,
                                    completed: !currentDay.completed,
                                  }),
                                }
                              );
                              if (response.ok) {
                                // Check if this is the last day being completed
                                const isLastDay = currentDay.dayNumber === activePlan.duration;
                                const wasNotCompleted = !currentDay.completed;

                                // Small delay to ensure database update completes
                                await new Promise(resolve => setTimeout(resolve, 300));
                                await refreshCircle();

                                // Show celebration modal if completing the last day
                                if (isLastDay && wasNotCompleted) {
                                  setShowPlanCompletion(true);
                                  setTimeout(() => {
                                    setShowPlanCompletion(false);
                                  }, 6000);
                                }
                              }
                            } catch (error) {
                              console.error(
                                'Failed to toggle completion:',
                                error
                              );
                            } finally {
                              setIsMarkingComplete(false);
                            }
                          }}
                        >
                          {isMarkingComplete ? (
                            <>
                              <div className={styles.buttonSpinner}></div>
                              Updating...
                            </>
                          ) : currentDay.completed ? (
                            `✓ Day ${currentDay.dayNumber} Complete`
                          ) : (
                            <>
                              Mark Day {currentDay.dayNumber} Complete ✓
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                } else if (currentDayNumber > activePlan.duration) {
                  return (
                    <div className={styles.completedCard}>
                      <div className={styles.completedIcon}>✓</div>
                      <h3 className={styles.completedTitle}>
                        Study Completed!
                      </h3>
                      <p className={styles.completedText}>
                        Congratulations on completing this {activePlan.duration}
                        -day journey together!
                      </p>
                      <button
                        className={styles.archiveButton}
                        onClick={() => handleArchiveStudy(activePlan.id)}
                        disabled={isArchiving}
                      >
                        {isArchiving ? (
                          <>
                            <div className={styles.buttonSpinner}></div>
                            Archiving...
                          </>
                        ) : (
                          'Archive Study'
                        )}
                      </button>
                    </div>
                  );
                }
              }
              return null;
            })()}

            {/* All Days Toggle */}
            {(() => {
              const userPlan = activePlan.memberPlans?.find(
                (mp) => mp.userId === user?.id
              );
              if (userPlan && userPlan.studyPlan.days.length > 1) {
                return (
                  <button
                    className={styles.viewAllDaysBtn}
                    onClick={() => setShowAllDays(!showAllDays)}
                  >
                    {showAllDays ? 'Hide' : 'View'} All Days
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      style={{
                        transform: showAllDays
                          ? 'rotate(180deg)'
                          : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                      }}
                    >
                      <path
                        d="M4 6L8 10L12 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                );
              }
              return null;
            })()}

            {/* All Days List */}
            {(() => {
              const userPlan = activePlan.memberPlans?.find(
                (mp) => mp.userId === user?.id
              );
              if (showAllDays && userPlan) {
                return (
                  <>
                    <div className={styles.allDaysList}>
                      {userPlan.studyPlan.days
                        .slice(0, visibleDaysCount)
                        .map((day) => (
                          <div
                            key={day.id}
                            className={`${styles.dayItem} ${day.completed ? styles.dayCompleted : ''} ${day.dayNumber === currentDayNumber ? styles.dayActive : ''}`}
                            onClick={() => setCurrentDayNumber(day.dayNumber)}
                          >
                            <div className={styles.dayItemHeader}>
                              <span className={styles.dayNumber}>
                                Day {day.dayNumber}
                              </span>
                              {day.completed && (
                                <span className={styles.checkmark}>✓</span>
                              )}
                            </div>
                            <p className={styles.dayItemTitle}>{day.title}</p>
                          </div>
                        ))}
                    </div>
                    {userPlan.studyPlan.days.length > visibleDaysCount && (
                      <button
                        className={styles.showMoreButton}
                        onClick={() => setVisibleDaysCount((prev) => prev + 7)}
                      >
                        Show More (
                        {userPlan.studyPlan.days.length - visibleDaysCount} more
                        days)
                      </button>
                    )}
                    {visibleDaysCount > 7 &&
                      userPlan.studyPlan.days.length > 7 && (
                        <button
                          className={styles.showMoreButton}
                          onClick={() => setVisibleDaysCount(7)}
                        >
                          Show Less
                        </button>
                      )}
                  </>
                );
              }
              return null;
            })()}

            {/* Shared content - integrated */}
            {reflections.length > 0 && (
              <div className={styles.section}>
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

            {/* Encouragement Prompts Section */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Encouragement Prompts</h3>
                <button
                  className={styles.addButton}
                  onClick={() => setShowAddEncouragementPromptModal(true)}
                >
                  + Add Prompt
                </button>
              </div>
              {encouragements.length === 0 ? (
                <div className={styles.emptyMessage}>
                  <p>
                    No encouragement prompts yet. Be the first to share one!
                  </p>
                </div>
              ) : (
                encouragements.map((encouragement) => (
                  <EncouragementPromptCard
                    key={encouragement.id}
                    encouragement={encouragement}
                    circleId={circleId}
                    onUpdate={fetchEncouragements}
                  />
                ))
              )}
            </div>

            {/* Prayer Requests with Filters */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Prayer Requests</h3>
                <div className={styles.filterButtons}>
                  <button
                    className={
                      prayerFilter === 'all'
                        ? styles.filterActive
                        : styles.filterButton
                    }
                    onClick={() => setPrayerFilter('all')}
                  >
                    All
                  </button>
                  <button
                    className={
                      prayerFilter === 'active'
                        ? styles.filterActive
                        : styles.filterButton
                    }
                    onClick={() => setPrayerFilter('active')}
                  >
                    Active
                  </button>
                  <button
                    className={
                      prayerFilter === 'answered'
                        ? styles.filterActive
                        : styles.filterButton
                    }
                    onClick={() => setPrayerFilter('answered')}
                  >
                    Answered
                  </button>
                </div>
              </div>
              {(() => {
                const filteredPrayers = prayers.filter((prayer) => {
                  if (prayerFilter === 'all') return true;
                  if (prayerFilter === 'active')
                    return prayer.status === 'ongoing';
                  if (prayerFilter === 'answered')
                    return prayer.status === 'answered';
                  return true;
                });

                return filteredPrayers.length === 0 ? (
                  <div className={styles.emptyMessage}>
                    <p>
                      No {prayerFilter !== 'all' ? prayerFilter : ''} prayer
                      requests yet.
                    </p>
                  </div>
                ) : (
                  filteredPrayers.map((prayer) => (
                    <PrayerRequestCard
                      key={prayer.id}
                      prayer={prayer}
                      circleId={circleId}
                      onUpdate={fetchPrayers}
                    />
                  ))
                );
              })()}
            </div>

            {verses.length > 0 && (
              <div className={styles.section}>
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

            {/* Verse Highlights Section */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                Verse Highlights & Insights
              </h3>
              {highlights.length === 0 ? (
                <div className={styles.emptyMessage}>
                  <p>
                    No verse highlights yet. Use the "💡 Share Insight" button
                    on today's scripture to add one!
                  </p>
                </div>
              ) : (
                highlights.map((highlight) => (
                  <VerseHighlightCard
                    key={highlight.id}
                    highlight={highlight}
                    circleId={circleId}
                    onUpdate={fetchHighlights}
                  />
                ))
              )}
            </div>

            {/* Stats - compact, at bottom */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Statistics</h3>
              <CircleStatsCard circleId={circle.id} />
            </div>

            {/* Members - compact list */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Members</h3>
              <div className={styles.membersList}>
                {circle.members.map((member) => {
                  const displayName = member.userName || member.userId;
                  const initials = member.userName
                    ? member.userName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                    : member.userId.substring(0, 2).toUpperCase();

                  return (
                    <div key={member.id} className={styles.memberCard}>
                      <div className={styles.memberAvatar}>{initials}</div>
                      <div className={styles.memberInfo}>
                        <span className={styles.memberName}>{displayName}</span>
                        {member.role === 'owner' && (
                          <span className={styles.memberRole}>Owner</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Study Intentions Flow */}
            <div className={styles.studyInitiationSection}>
              {!hasSubmittedIntention ? (
                <StudyIntentionsForm
                  circleId={circleId}
                  members={circle.members}
                  intentions={intentions}
                  onSubmit={() => {
                    fetchIntentions();
                  }}
                />
              ) : circle.createdBy === user?.id ? (
                <StudyIntentionsSummary
                  intentions={intentions}
                  members={circle.members}
                  totalMembers={totalMembers}
                  isCreator={true}
                  onGenerateStudy={() => setShowGenerationModal(true)}
                />
              ) : (
                <>
                  <div className={styles.waitingMessage}>
                    <div className={styles.sealedScrollIcon}>📜</div>
                    <h3>Your contribution has been submitted</h3>
                    <p className={styles.waitingSubtitle}>
                      Waiting for the group creator to start the study
                    </p>
                  </div>

                  {/* Show member progress to non-creator members too */}
                  <div className={styles.memberProgressCard}>
                    <h3 className={styles.memberProgressTitle}>
                      Study Contribution Status
                    </h3>
                    <div className={styles.memberAvatarsGrid}>
                      {circle.members.map((member) => {
                        const hasSubmitted = intentions.some(
                          (i) => i.userId === member.userId
                        );
                        const displayName = member.userName || member.userId;
                        const initials = member.userName
                          ? member.userName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .substring(0, 2)
                          : '?';

                        return (
                          <div
                            key={member.id}
                            className={styles.memberAvatarItem}
                          >
                            <div
                              className={`${styles.memberAvatar} ${
                                hasSubmitted ? styles.completed : styles.pending
                              }`}
                            >
                              {initials}
                              {hasSubmitted && (
                                <div className={styles.completionBadge}>✓</div>
                              )}
                            </div>
                            <div className={styles.memberName}>
                              {displayName}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Members even without study */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Members</h3>
              <div className={styles.membersList}>
                {circle.members.map((member) => {
                  const displayName = member.userName || member.userId;
                  const initials = member.userName
                    ? member.userName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                    : member.userId.substring(0, 2).toUpperCase();

                  return (
                    <div key={member.id} className={styles.memberCard}>
                      <div className={styles.memberAvatar}>{initials}</div>
                      <div className={styles.memberInfo}>
                        <span className={styles.memberName}>{displayName}</span>
                        {member.role === 'owner' && (
                          <span className={styles.memberRole}>Owner</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Study History Section - shown at bottom */}
        {circle.plans && circle.plans.some((p) => p.status === 'archived') && (
          <div className={styles.historySection}>
            <h3 className={styles.historySectionTitle}>Study History</h3>
            <div className={styles.historyList}>
              {circle.plans
                .filter((plan) => plan.status === 'archived')
                .sort((a, b) =>
                  new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
                )
                .map((plan) => (
                  <div key={plan.id} className={styles.historyCard}>
                    <div className={styles.historyCardContent}>
                      <h4 className={styles.historyTitle}>
                        {plan.title.replace(/^\d+-Day (Journey|Deep Dive): /, '')}
                      </h4>
                      <div className={styles.historyMeta}>
                        <span>{plan.duration} days</span>
                        <span className={styles.metaSeparator}>•</span>
                        <span>
                          Started {new Date(plan.startDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className={styles.historyBadge}>Completed</div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showInviteModal && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          circleId={circle.id}
          circleName={circle.name}
        />
      )}

      {showStartStudyModal && (
        <StartStudyModal
          circleId={circle.id}
          circleName={circle.name}
          onClose={() => setShowStartStudyModal(false)}
          onStudyCreated={loadCircle}
        />
      )}

      {showAddHighlightModal && (
        <AddHighlightModal
          circleId={circle.id}
          isOpen={true}
          onClose={() => setShowAddHighlightModal(false)}
          onSuccess={() => {
            setShowAddHighlightModal(false);
            fetchHighlights();
          }}
          currentDay={currentDayNumber}
        />
      )}

      {showAddEncouragementPromptModal && (
        <AddEncouragementPromptModal
          circleId={circle.id}
          isOpen={true}
          onClose={() => setShowAddEncouragementPromptModal(false)}
          onSuccess={() => {
            setShowAddEncouragementPromptModal(false);
            fetchEncouragements();
          }}
          currentDay={currentDayNumber}
        />
      )}

      {showGenerationModal && (
        <AIStudyGenerationModal
          circleId={circle.id}
          intentions={intentions}
          onClose={() => setShowGenerationModal(false)}
          onStudyCreated={() => {
            setShowGenerationModal(false);
            loadCircle();
          }}
        />
      )}

      {/* Plan Completion Celebration */}
      {isMounted &&
        showPlanCompletion &&
        circle &&
        createPortal(
          <div className={styles.planCompletionModal}>
            <div className={styles.planCompletionContent}>
              <div className={styles.completionIcon}>🎉</div>
              <h2>Journey Complete!</h2>
              <p>
                Congratulations on completing your Circle study with{' '}
                {circle.members
                  .map((m) => m.userName || 'A member')
                  .join(', ')
                  .replace(/, ([^,]*)$/, ' and $1')}
                !
              </p>
              <p className={styles.completionEncouragement}>
                You&apos;ve taken meaningful steps in your spiritual growth together. Keep building on this momentum!
              </p>
              <button onClick={() => setShowPlanCompletion(false)}>
                Continue
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
