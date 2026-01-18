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
import MemberProgressIndicator from './MemberProgressIndicator';
import ReflectionCard from './ReflectionCard';
import PrayerRequestCard from './PrayerRequestCard';
import SharedVerseCard from './SharedVerseCard';

interface Member {
  id: string;
  userId: string;
  userName?: string;
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

export default function CircleHome({ circleId }: CircleHomeProps) {
  const { user } = useUser();
  const [circle, setCircle] = useState<Circle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showStartStudyModal, setShowStartStudyModal] = useState(false);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [showAllDays, setShowAllDays] = useState(false);
  const [visibleDaysCount, setVisibleDaysCount] = useState(7);
  const [currentDayNumber, setCurrentDayNumber] = useState(1);
  const [prayerFilter, setPrayerFilter] = useState<'all' | 'active' | 'answered'>('all');

  useEffect(() => {
    fetchCircle();
  }, [circleId]);

  // Update current day number when circle loads
  useEffect(() => {
    if (circle && user) {
      const activeStudy = circle.plans.find((p) => p.status === 'active');
      if (activeStudy) {
        const userPlan = activeStudy.memberPlans?.find((mp) => mp.userId === user.id);
        if (userPlan) {
          const completedDays = userPlan.studyPlan.days.filter((d) => d.completed).length;
          setCurrentDayNumber(completedDays + 1);
        }
      }
    }
  }, [circle, user]);

  const fetchCircle = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/circles/${circleId}`, {
        cache: 'no-store',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch circle');
      }

      console.log('[CircleHome] Loaded circle with plans:', data.circle.plans);
      setCircle(data.circle);

      // Fetch shared content
      fetchSharedContent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch circle');
    } finally {
      setLoading(false);
    }
  };

  // Refresh circle data without showing loading spinner
  const refreshCircle = async () => {
    try {
      const response = await fetch(`/api/circles/${circleId}`, {
        cache: 'no-store',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error('Failed to refresh circle');
      }

      setCircle(data.circle);
    } catch (err) {
      console.error('Failed to refresh circle:', err);
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

  const isOwner = circle?.createdBy === user?.id;
  const isAdmin = circle?.members.find((m) => m.userId === user?.id)?.role === 'admin';
  const canManage = isOwner || isAdmin;

  // Filter prayers based on status
  const filteredPrayers = prayers.filter(prayer => {
    if (prayerFilter === 'all') return true;
    if (prayerFilter === 'active') return prayer.status === 'ongoing';
    if (prayerFilter === 'answered') return prayer.status === 'answered';
    return true;
  });

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

  // Calculate member progress for active study
  const memberProgress = activeStudy?.memberPlans?.map((mp) => {
    const completedDays = mp.studyPlan.days.filter((d) => d.completed).length;
    const lastCompleted = mp.studyPlan.days
      .filter((d) => d.completed && d.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];

    return {
      userId: mp.userId,
      userName: mp.userName,
      completedDays,
      totalDays: activeStudy.duration,
      lastCompletedAt: lastCompleted?.completedAt || undefined,
    };
  }) || [];

  return (
    <div className={styles.container}>
      {/* Compact header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <a href="/circles" className={styles.backLink}>
            ← Back to Circles
          </a>
          <div className={styles.headerActions}>
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
              + Invite
            </button>
          </div>
        </div>

        <div className={styles.headerMain}>
          <h1 className={styles.title}>{circle.name}</h1>
          {circle.description && (
            <p className={styles.description}>{circle.description}</p>
          )}
          <div className={styles.meta}>
            <span>{circle._count.members} members</span>
            {activeStudy && (
              <>
                <span className={styles.metaSeparator}>•</span>
                <span>{activeStudy.title.replace(/^\d+-Day (Journey|Deep Dive): /, '')}</span>
                <span className={styles.metaSeparator}>•</span>
                <span>{activeStudy.duration} days</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main unified content */}
      <div className={styles.content}>
        {activeStudy ? (
          <>
            {/* Individual progress bars for each member - stacked */}
            {activeStudy.memberPlans && activeStudy.memberPlans.length > 0 && (
              <div className={styles.memberProgressBars}>
                <h3 className={styles.progressBarsTitle}>Member Progress</h3>
                {activeStudy.memberPlans.map((mp) => {
                  const completedDays = mp.studyPlan.days.filter((d) => d.completed).length;
                  const percentage = (completedDays / activeStudy.duration) * 100;
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
                              {completedDays}/{activeStudy.duration}
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
            )}

            {/* Current day study - matching Study widget exactly */}
            {(() => {
              const userPlan = activeStudy.memberPlans?.find((mp) => mp.userId === user?.id);
              if (userPlan) {
                const currentDay = userPlan.studyPlan.days.find((d) => d.dayNumber === currentDayNumber);

                if (currentDay && currentDayNumber <= activeStudy.duration) {
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
                } else if (currentDayNumber > activeStudy.duration) {
                  return (
                    <div className={styles.completedCard}>
                      <div className={styles.completedIcon}>✓</div>
                      <h3 className={styles.completedTitle}>Study Completed!</h3>
                      <p className={styles.completedText}>
                        Congratulations on completing this {activeStudy.duration}-day journey together!
                      </p>
                    </div>
                  );
                }
              }
              return null;
            })()}

            {/* All Days Toggle */}
            {(() => {
              const userPlan = activeStudy.memberPlans?.find((mp) => mp.userId === user?.id);
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
              const userPlan = activeStudy.memberPlans?.find((mp) => mp.userId === user?.id);
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

            {/* Progress heatmap */}
            <ProgressHeatmap
              circleId={circle.id}
              studyPlanId={activeStudy.id}
              totalDays={activeStudy.duration}
            />

            {/* Activity feed */}
            <ActivityFeed circleId={circle.id} limit={10} />

            {/* Shared content */}
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

            {/* Prayer Requests with Filters */}
            {prayers.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>Prayer Requests</h3>
                  <div className={styles.filterButtons}>
                    <button
                      className={`${styles.filterButton} ${prayerFilter === 'all' ? styles.active : ''}`}
                      onClick={() => setPrayerFilter('all')}
                    >
                      All
                    </button>
                    <button
                      className={`${styles.filterButton} ${prayerFilter === 'active' ? styles.active : ''}`}
                      onClick={() => setPrayerFilter('active')}
                    >
                      Active
                    </button>
                    <button
                      className={`${styles.filterButton} ${prayerFilter === 'answered' ? styles.active : ''}`}
                      onClick={() => setPrayerFilter('answered')}
                    >
                      Answered
                    </button>
                  </div>
                </div>
                {filteredPrayers.map((prayer) => (
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

            {/* Stats - compact */}
            <CircleStatsCard circleId={circle.id} studyPlanId={activeStudy.id} />

            {/* Members - compact */}
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
                      <div className={styles.memberAvatar}>{initials}</div>
                      <div className={styles.memberInfo}>
                        <div className={styles.memberName}>{displayName}</div>
                        <div className={styles.memberRole}>
                          {member.role === 'owner' && '👑 '}
                          {member.role}
                        </div>
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
              <p>Start a study together to begin your shared Scripture journey.</p>
              {canManage && (
                <button
                  className={styles.startStudyButton}
                  onClick={() => setShowStartStudyModal(true)}
                >
                  Start New Study
                </button>
              )}
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
                      <div className={styles.memberAvatar}>{initials}</div>
                      <div className={styles.memberInfo}>
                        <div className={styles.memberName}>{displayName}</div>
                        <div className={styles.memberRole}>
                          {member.role === 'owner' && '👑 '}
                          {member.role}
                        </div>
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
