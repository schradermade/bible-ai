'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import styles from './circle-view.module.css';
import CircleStatsCard from './circles/CircleStatsCard';
import InviteModal from './circles/InviteModal';
import StartStudyModal from './circles/StartStudyModal';
import MemberProgressIndicator from './circles/MemberProgressIndicator';
import ReflectionCard from './circles/ReflectionCard';
import PrayerRequestCard from './circles/PrayerRequestCard';
import SharedVerseCard from './circles/SharedVerseCard';

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
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [showAllDays, setShowAllDays] = useState(false);
  const [visibleDaysCount, setVisibleDaysCount] = useState(7);
  const [currentDayNumber, setCurrentDayNumber] = useState(1);

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
      const response = await fetch(`/api/circles/${circleId}`, {
        cache: 'no-store',
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

  const fetchSharedContent = async () => {
    await Promise.all([
      fetchReflections(),
      fetchPrayers(),
      fetchVerses(),
    ]);
  };

  const fetchReflections = async () => {
    try {
      const response = await fetch(`/api/circles/${circleId}/reflections?limit=5`);
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

  useEffect(() => {
    loadCircle();
  }, [circleId]);

  // Update current day number when circle loads
  useEffect(() => {
    if (circle && user) {
      const activePlan = circle.plans.find((p) => p.status === 'active');
      if (activePlan) {
        const userPlan = activePlan.memberPlans?.find((mp) => mp.userId === user.id);
        if (userPlan) {
          const completedDays = userPlan.studyPlan.days.filter((d) => d.completed).length;
          setCurrentDayNumber(completedDays + 1);
        }
      }
    }
  }, [circle, user]);

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
  const memberProgress = activePlan?.memberPlans?.map((mp) => {
    const completedDays = mp.studyPlan.days.filter((d) => d.completed).length;
    const lastCompleted = mp.studyPlan.days
      .filter((d) => d.completed && d.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];

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
      {/* Compact header */}
      <div className={styles.header}>
        <button className={styles.closeButton} onClick={onClose}>
          ← Back to Chat
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
                <span>{activePlan.title.replace(/^\d+-Day (Journey|Deep Dive): /, '')}</span>
                <span className={styles.metaSeparator}>•</span>
                <span>{activePlan.duration} days</span>
              </>
            )}
          </div>
        </div>
        <button
          className={styles.inviteButton}
          onClick={() => setShowInviteModal(true)}
        >
          + Invite
        </button>
      </div>

      {/* Main unified content area */}
      <div className={styles.content}>
        {activePlan ? (
          <>
            {/* Individual progress bars for each member - stacked */}
            {(() => {
              console.log('[CircleView] activePlan.memberPlans:', activePlan.memberPlans);
              return activePlan.memberPlans && activePlan.memberPlans.length > 0 && (
                <div className={styles.memberProgressBars}>
                  <h3 className={styles.progressBarsTitle}>Member Progress</h3>
                  {activePlan.memberPlans.map((mp) => {
                  const completedDays = mp.studyPlan.days.filter((d) => d.completed).length;
                  const percentage = (completedDays / activePlan.duration) * 100;
                  const isCurrentUser = mp.userId === user?.id;
                  const displayName = mp.userName || mp.userId;
                  const initials = mp.userName
                    ? mp.userName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                    : mp.userId.substring(0, 2).toUpperCase();

                  return (
                    <div key={mp.userId} className={styles.memberProgressItem}>
                      <div className={styles.memberProgressRow}>
                        <div className={styles.memberAvatar}>
                          {initials}
                        </div>
                        <div className={styles.memberProgressContent}>
                          <div className={styles.memberProgressHeader}>
                            <span className={styles.memberProgressName}>
                              {displayName.length > 20 ? displayName.substring(0, 20) + '...' : displayName}
                              {isCurrentUser && <span className={styles.youLabel}> (You)</span>}
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
              );
            })()}

            {/* Current day study - matching Study widget exactly */}
            {(() => {
              const userPlan = activePlan.memberPlans?.find((mp) => mp.userId === user?.id);
              if (userPlan) {
                const currentDay = userPlan.studyPlan.days.find((d) => d.dayNumber === currentDayNumber);

                if (currentDay && currentDayNumber <= activePlan.duration) {
                  return (
                    <div className={styles.currentDayFocus}>
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
                          <h6 className={styles.reflectionTitle}>
                            Reflection
                          </h6>
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
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    dayNumber: currentDay.dayNumber,
                                    completed: !currentDay.completed,
                                  }),
                                }
                              );
                              if (response.ok) {
                                await refreshCircle();
                              }
                            } catch (error) {
                              console.error('Failed to toggle completion:', error);
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
                            '✓ Completed'
                          ) : (
                            'Mark Complete'
                          )}
                        </button>
                      </div>
                    </div>
                  );
                } else if (currentDayNumber > activePlan.duration) {
                  return (
                    <div className={styles.completedCard}>
                      <div className={styles.completedIcon}>✓</div>
                      <h3 className={styles.completedTitle}>Study Completed!</h3>
                      <p className={styles.completedText}>
                        Congratulations on completing this {activePlan.duration}-day journey together!
                      </p>
                    </div>
                  );
                }
              }
              return null;
            })()}

            {/* All Days Toggle */}
            {(() => {
              const userPlan = activePlan.memberPlans?.find((mp) => mp.userId === user?.id);
              if (userPlan && userPlan.studyPlan.days.length > 1) {
                return (
                  <button
                    className={styles.viewAllDaysBtn}
                    onClick={() => setShowAllDays(!showAllDays)}
                  >
                    {showAllDays ? 'Hide' : 'View'} All Days
                  </button>
                );
              }
              return null;
            })()}

            {/* All Days List */}
            {(() => {
              const userPlan = activePlan.memberPlans?.find((mp) => mp.userId === user?.id);
              if (showAllDays && userPlan) {
                return (
                  <>
                    <div className={styles.allDaysList}>
                      {userPlan.studyPlan.days.slice(0, visibleDaysCount).map((day) => (
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
                        Show More ({userPlan.studyPlan.days.length - visibleDaysCount}{' '}
                        more days)
                      </button>
                    )}
                    {visibleDaysCount > 7 && userPlan.studyPlan.days.length > 7 && (
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

            {/* Member progress - compact */}
            {memberProgress.length > 0 && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Circle Progress</h3>
                <MemberProgressIndicator members={memberProgress} />
              </div>
            )}

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

            {prayers.length > 0 && (
              <div className={styles.section}>
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
                    ? member.userName.split(' ').map(n => n[0]).join('').toUpperCase()
                    : member.userId.substring(0, 2).toUpperCase();

                  return (
                    <div key={member.id} className={styles.memberCard}>
                      <div className={styles.memberAvatar}>
                        {initials}
                      </div>
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
            {/* No active study state */}
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

            {/* Members even without study */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Members</h3>
              <div className={styles.membersList}>
                {circle.members.map((member) => {
                  const displayName = member.userName || member.userId;
                  const initials = member.userName
                    ? member.userName.split(' ').map(n => n[0]).join('').toUpperCase()
                    : member.userId.substring(0, 2).toUpperCase();

                  return (
                    <div key={member.id} className={styles.memberCard}>
                      <div className={styles.memberAvatar}>
                        {initials}
                      </div>
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
    </div>
  );
}
