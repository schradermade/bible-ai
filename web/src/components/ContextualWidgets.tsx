'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useUser } from '@clerk/nextjs';
import styles from './contextual-widgets.module.css';
import { TEMPLATE_OPTIONS } from '@/lib/study-plan-templates';
import type { Achievement } from '@/lib/achievements';
import type { Milestone } from '@/lib/milestones';
import CreateCircleModal from './circles/CreateCircleModal';

interface SavedVerse {
  reference: string;
  text: string;
}

interface MemoryVerse {
  id: string;
  reference: string;
  text: string;
  memorized: boolean;
}

interface Prayer {
  id: string;
  title: string | null;
  content: string;
  source: string;
  sourceReference: string | null;
  status: string;
  answeredAt: string | null;
  createdAt: string;
}

interface Circle {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count: {
    members: number;
    plans: number;
  };
  plans: Array<{
    id: string;
    title: string;
    status: string;
  }>;
}

interface CircleInvitation {
  id: string;
  token: string;
  circleId: string;
  invitedBy: string;
  invitedEmail: string | null;
  status: string;
  expiresAt: string;
  createdAt: string;
  circle: {
    id: string;
    name: string;
    description: string | null;
    maxMembers: number;
    _count: {
      members: number;
    };
  };
}

interface ContextualWidgetsProps {
  myVerses: SavedVerse[];
  onLoadHistory: (response: string) => void;
  onSaveVerse: (verse: SavedVerse) => void;
  onDeleteVerse: (verse: SavedVerse) => void;
  prayerRefreshTrigger?: number;
  circlesRefreshTrigger?: number;
  onSelectCircle?: (circleId: string) => void;
}

export default function ContextualWidgets({
  myVerses,
  onSaveVerse,
  onDeleteVerse,
  prayerRefreshTrigger,
  circlesRefreshTrigger,
  onSelectCircle,
}: ContextualWidgetsProps) {
  const { user } = useUser();
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [memoryVerses, setMemoryVerses] = useState<MemoryVerse[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [isLoadingCircles, setIsLoadingCircles] = useState(true);
  const [invitations, setInvitations] = useState<CircleInvitation[]>([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(true);
  const [invitationErrors, setInvitationErrors] = useState<Record<string, string>>({});
  const [processingInvitations, setProcessingInvitations] = useState<Set<string>>(new Set());
  const [generatingPrayerForVerse, setGeneratingPrayerForVerse] = useState<
    string | null
  >(null);
  const [collapsedWidgets, setCollapsedWidgets] = useState<
    Record<string, boolean>
  >({
    circles: false,
    prayer: false,
    myVerses: false,
    searchHistory: false,
  });
  const [highlightedItems, setHighlightedItems] = useState<Set<string>>(
    new Set()
  );
  const highlightTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const previousVersesRef = useRef<SavedVerse[]>([]);
  const previousPrayersRef = useRef<Prayer[]>([]);
  const previousMemoryVersesRef = useRef<MemoryVerse[]>([]);

  const [isMounted, setIsMounted] = useState(false);
  const [showCreateCircle, setShowCreateCircle] = useState(false);

  // Pagination state for widgets
  const [visibleVersesCount, setVisibleVersesCount] = useState(5);
  const [visiblePrayersCount, setVisiblePrayersCount] = useState(5);

  // Handle client-side mounting for portal
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Helper to add highlight
  const addHighlight = (key: string) => {
    // Clear any existing timer for this key
    const existingTimer = highlightTimersRef.current.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Add to highlighted set
    setHighlightedItems((prev) => new Set(prev).add(key));

    // Set timer to remove after 3 seconds
    const timer = setTimeout(() => {
      setHighlightedItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
      highlightTimersRef.current.delete(key);
    }, 3000);

    highlightTimersRef.current.set(key, timer);
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      highlightTimersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  // Load prayers on mount, when user changes, or when refresh is triggered
  useEffect(() => {
    const loadPrayers = async () => {
      if (!user) {
        setPrayers([]);
        return;
      }

      try {
        const response = await fetch('/api/prayers');
        if (response.ok) {
          const data = await response.json();
          setPrayers(data.prayers);
        }
      } catch (error) {
        console.error('Failed to load prayers:', error);
      }
    };

    loadPrayers();
  }, [user, prayerRefreshTrigger]);

  // Detect newly added prayers
  useEffect(() => {
    if (previousPrayersRef.current.length === 0 && prayers.length > 0) {
      // Initial load - don't highlight
      previousPrayersRef.current = prayers;
      return;
    }

    if (prayers.length > previousPrayersRef.current.length) {
      // New prayer(s) added
      const newPrayers = prayers.filter(
        (p) => !previousPrayersRef.current.some((prev) => prev.id === p.id)
      );

      newPrayers.forEach((prayer) => {
        const key = `prayer-${prayer.id}`;
        // Only add if not already highlighted
        if (!highlightTimersRef.current.has(key)) {
          addHighlight(key);
        }
      });
    }

    previousPrayersRef.current = prayers;
  }, [prayers]);

  // Detect newly added verses in myVerses prop
  useEffect(() => {
    if (previousVersesRef.current.length === 0 && myVerses.length > 0) {
      // Initial load - don't highlight
      previousVersesRef.current = myVerses;
      return;
    }

    if (myVerses.length > previousVersesRef.current.length) {
      // New verse(s) added
      const newVerses = myVerses.filter(
        (v) =>
          !previousVersesRef.current.some(
            (prev) => prev.reference === v.reference
          )
      );

      newVerses.forEach((verse) => {
        const key = `verse-${verse.reference}`;
        if (!highlightTimersRef.current.has(key)) {
          addHighlight(key);
        }
      });
    }

    previousVersesRef.current = myVerses;
  }, [myVerses]);

  // Detect newly added memory verses
  useEffect(() => {
    if (
      previousMemoryVersesRef.current.length === 0 &&
      memoryVerses.length > 0
    ) {
      // Initial load - don't highlight
      previousMemoryVersesRef.current = memoryVerses;
      return;
    }

    if (memoryVerses.length > previousMemoryVersesRef.current.length) {
      // New memory verse(s) added - use reference as stable identifier
      const newVerses = memoryVerses.filter(
        (v) =>
          !previousMemoryVersesRef.current.some(
            (prev) => prev.reference === v.reference
          )
      );

      newVerses.forEach((verse) => {
        const key = `memory-${verse.reference}`;
        if (!highlightTimersRef.current.has(key)) {
          addHighlight(key);
        }
      });
    }

    previousMemoryVersesRef.current = memoryVerses;
  }, [memoryVerses]);

  // Load memorized verses on mount and when user changes
  useEffect(() => {
    const loadMemorizedVerses = async () => {
      if (!user) {
        // Clear data when user signs out
        setMemoryVerses([]);
        return;
      }

      try {
        const response = await fetch('/api/verses/memorized');
        if (response.ok) {
          const data = await response.json();
          const verses: MemoryVerse[] = data.verses.map((v: any) => ({
            id: v.id,
            reference: v.reference,
            text: v.text || '',
            memorized: v.memorizedAt !== null, // Only marked as memorized if memorizedAt is set
          }));
          setMemoryVerses(verses);
        }
      } catch (error) {
        console.error('Failed to load memorized verses:', error);
      }
    };

    loadMemorizedVerses();
  }, [user]);


  // Load circles on mount and when user changes or when refresh is triggered
  useEffect(() => {
    const loadCircles = async () => {
      if (!user) {
        setCircles([]);
        setIsLoadingCircles(false);
        return;
      }

      setIsLoadingCircles(true);
      try {
        const response = await fetch('/api/circles');
        if (response.ok) {
          const data = await response.json();
          setCircles(data.circles || []);
        }
      } catch (error) {
        console.error('Failed to load circles:', error);
      } finally {
        setIsLoadingCircles(false);
      }
    };

    loadCircles();
  }, [user, circlesRefreshTrigger]);

  // Load invitations
  useEffect(() => {
    const loadInvitations = async () => {
      if (!user) {
        setInvitations([]);
        setIsLoadingInvitations(false);
        return;
      }

      setIsLoadingInvitations(true);
      try {
        const response = await fetch('/api/invitations');
        if (response.ok) {
          const data = await response.json();
          setInvitations(data.invitations || []);
        }
      } catch (error) {
        console.error('Failed to load invitations:', error);
      } finally {
        setIsLoadingInvitations(false);
      }
    };

    loadInvitations();
  }, [user]);

  // Poll for new invitations and circles every 30 seconds
  useEffect(() => {
    if (!user) return;

    const refreshInvitationsAndCircles = async () => {
      try {
        // Fetch invitations without showing loading spinner
        const invitationsResponse = await fetch('/api/invitations');
        if (invitationsResponse.ok) {
          const data = await invitationsResponse.json();
          setInvitations(data.invitations || []);
        }

        // Fetch circles without showing loading spinner
        const circlesResponse = await fetch('/api/circles');
        if (circlesResponse.ok) {
          const data = await circlesResponse.json();
          setCircles(data.circles || []);
        }
      } catch (error) {
        console.error('Failed to refresh invitations and circles:', error);
      }
    };

    const interval = setInterval(refreshInvitationsAndCircles, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const toggleWidget = (widgetId: string) => {
    setCollapsedWidgets((prev) => ({
      ...prev,
      [widgetId]: !prev[widgetId],
    }));
  };

  const handleToggleMemorizeVerse = async (verse: SavedVerse) => {
    // Check if verse already exists in memory verses
    const existingVerse = memoryVerses.find((v) => v.reference === verse.reference);

    if (!existingVerse) {
      // Verse doesn't exist - add it to memory list with memorized: false
      const tempId = `${Date.now()}-${Math.random()}`;
      const newMemoryVerse: MemoryVerse = {
        id: tempId,
        reference: verse.reference,
        text: verse.text,
        memorized: false,
      };

      // Optimistically add to UI
      setMemoryVerses([newMemoryVerse, ...memoryVerses]);

      try {
        const response = await fetch('/api/verses/memorized', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reference: verse.reference,
            text: verse.text || null,
            markAsMemorized: false,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save verse to memory list');
        }

        const data = await response.json();
        setMemoryVerses((prev) =>
          prev.map((v) => (v.id === tempId ? { ...v, id: data.verse.id } : v))
        );
      } catch (error) {
        console.error('Failed to add verse to memory list:', error);
        setMemoryVerses((prev) => prev.filter((v) => v.id !== tempId));
      }
    } else {
      // Verse exists - toggle memorized status
      const newMemorizedState = !existingVerse.memorized;

      // Optimistically update UI
      setMemoryVerses(
        memoryVerses.map((v) =>
          v.id === existingVerse.id ? { ...v, memorized: newMemorizedState } : v
        )
      );

      try {
        const response = await fetch('/api/verses/memorized', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reference: verse.reference,
            text: verse.text || null,
            markAsMemorized: newMemorizedState,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update memorized status');
        }

        if (newMemorizedState) {
          const data = await response.json();
          setMemoryVerses((prev) =>
            prev.map((v) =>
              v.id === existingVerse.id ? { ...v, id: data.verse.id, memorized: true } : v
            )
          );
        }
      } catch (error) {
        console.error('Failed to update memorized status:', error);
        setMemoryVerses(
          memoryVerses.map((v) =>
            v.id === existingVerse.id ? { ...v, memorized: !newMemorizedState } : v
          )
        );
      }
    }
  };

  const togglePrayerStatus = async (id: string) => {
    const prayer = prayers.find((p) => p.id === id);
    if (!prayer) return;

    const newStatus = prayer.status === 'ongoing' ? 'answered' : 'ongoing';

    // Optimistically update UI
    setPrayers(
      prayers.map((p) =>
        p.id === id
          ? {
              ...p,
              status: newStatus,
              answeredAt:
                newStatus === 'answered' ? new Date().toISOString() : null,
            }
          : p
      )
    );

    try {
      const response = await fetch('/api/prayers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update prayer status');
      }
    } catch (error) {
      console.error('Failed to update prayer status:', error);
      // Revert on error
      setPrayers(
        prayers.map((p) =>
          p.id === id
            ? { ...p, status: prayer.status, answeredAt: prayer.answeredAt }
            : p
        )
      );
    }
  };

  const deletePrayer = async (id: string) => {
    // Optimistically remove from UI
    const previousPrayers = prayers;
    setPrayers(prayers.filter((p) => p.id !== id));

    try {
      const response = await fetch('/api/prayers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete prayer');
      }
    } catch (error) {
      console.error('Failed to delete prayer:', error);
      // Revert on error
      setPrayers(previousPrayers);
    }
  };

  const generatePrayerFromVerse = async (verse: SavedVerse) => {
    if (generatingPrayerForVerse) return; // Prevent multiple simultaneous generations

    setGeneratingPrayerForVerse(verse.reference);

    try {
      // Generate prayer using AI
      const generateResponse = await fetch('/api/ai/generate-prayer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'verse',
          verseReference: verse.reference,
          verseText: verse.text,
        }),
      });

      if (!generateResponse.ok) {
        throw new Error('Failed to generate prayer');
      }

      const { prayer, title, sourceReference } = await generateResponse.json();

      // Save prayer to database
      const saveResponse = await fetch('/api/prayers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content: prayer,
          source: 'verse',
          sourceReference,
        }),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save prayer');
      }

      const { prayer: savedPrayer } = await saveResponse.json();

      // Add to prayers list (highlight will be handled by useEffect)
      setPrayers([savedPrayer, ...prayers]);
    } catch (error) {
      console.error('Failed to generate prayer:', error);
      alert('Failed to generate prayer. Please try again.');
    } finally {
      setGeneratingPrayerForVerse(null);
    }
  };


  // Helper for expiration display
  const getExpirationText = (expiresAt: string): string => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 1) {
      const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return 'Expires soon';
      return `Expires in ${diffHours}h`;
    }
    return `Expires in ${diffDays}d`;
  };

  // Accept invitation handler
  const handleAcceptInvitation = async (invitation: CircleInvitation) => {
    setProcessingInvitations(prev => new Set(prev).add(invitation.id));
    setInvitationErrors(prev => {
      const { [invitation.id]: _, ...rest } = prev;
      return rest;
    });

    try {
      const response = await fetch(`/api/invitations/${invitation.token}/accept`, {
        method: 'POST'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to accept');
      }

      // Remove from invitations
      setInvitations(prev => prev.filter(inv => inv.id !== invitation.id));

      // Refresh circles
      const circlesResponse = await fetch('/api/circles');
      if (circlesResponse.ok) {
        const data = await circlesResponse.json();
        setCircles(data.circles || []);
      }
    } catch (error) {
      setInvitationErrors(prev => ({
        ...prev,
        [invitation.id]: error instanceof Error ? error.message : 'Failed to accept'
      }));
    } finally {
      setProcessingInvitations(prev => {
        const newSet = new Set(prev);
        newSet.delete(invitation.id);
        return newSet;
      });
    }
  };

  // Decline invitation handler
  const handleDeclineInvitation = async (invitation: CircleInvitation) => {
    const previousInvitations = invitations;
    setInvitations(prev => prev.filter(inv => inv.id !== invitation.id));

    try {
      const response = await fetch(`/api/invitations/${invitation.token}/decline`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to decline');
      }
    } catch (error) {
      setInvitations(previousInvitations);
      setInvitationErrors(prev => ({
        ...prev,
        [invitation.id]: error instanceof Error ? error.message : 'Failed to decline'
      }));
    }
  };

  return (
    <>
      <div className={styles.widgetsContainer}>
        {/* Circles Widget */}
        <div className={styles.widget}>
          <div
            className={styles.widgetHeader}
            onClick={() => toggleWidget('circles')}
          >
            <div className={styles.widgetTitleRow}>
              <h3 className={styles.widgetTitle}>
                <span className={styles.widgetIcon}>👥</span> Circles
              </h3>
              <button className={styles.chevronButton}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  style={{
                    transform: collapsedWidgets.circles
                      ? 'rotate(-90deg)'
                      : 'rotate(0deg)',
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
            </div>
            {invitations.length > 0 ? (
              <span className={styles.invitationBadge}>{invitations.length}</span>
            ) : (
              <span className={styles.countBadge}>{circles.length}</span>
            )}
          </div>
          <div
            className={`${styles.widgetContent} ${collapsedWidgets.circles ? styles.collapsed : ''}`}
          >
            {(isLoadingCircles || isLoadingInvitations) && (
              <div className={styles.creatingPlan}>
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={styles.spinningIcon}
                >
                  <path
                    d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <p>Loading circles...</p>
              </div>
            )}

            {/* Pending Invitations */}
            {invitations.length > 0 && (
              <div className={styles.invitationsSection}>
                <div className={styles.invitationsSectionTitle}>
                  📬 Pending Invitations
                </div>
                <div className={styles.invitationsList}>
                  {invitations.map((invitation) => (
                    <div key={invitation.id} className={styles.invitationCard}>
                      <div className={styles.invitationHeader}>
                        <span className={styles.invitationCircleName}>
                          {invitation.circle.name}
                        </span>
                        <span className={styles.invitationExpiry}>
                          {getExpirationText(invitation.expiresAt)}
                        </span>
                      </div>

                      {invitation.circle.description && (
                        <p className={styles.invitationDescription}>
                          {invitation.circle.description}
                        </p>
                      )}

                      <div className={styles.invitationMeta}>
                        <span className={styles.invitationMembers}>
                          {invitation.circle._count.members}/{invitation.circle.maxMembers} members
                        </span>
                      </div>

                      {invitationErrors[invitation.id] && (
                        <div className={styles.invitationError}>
                          {invitationErrors[invitation.id]}
                        </div>
                      )}

                      <div className={styles.invitationActions}>
                        <button
                          className={styles.invitationDeclineButton}
                          onClick={() => handleDeclineInvitation(invitation)}
                          disabled={processingInvitations.has(invitation.id)}
                        >
                          Decline
                        </button>
                        <button
                          className={styles.invitationAcceptButton}
                          onClick={() => handleAcceptInvitation(invitation)}
                          disabled={processingInvitations.has(invitation.id)}
                        >
                          {processingInvitations.has(invitation.id) ? 'Accepting...' : 'Accept'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Divider if both invitations and circles exist */}
            {invitations.length > 0 && circles.length > 0 && (
              <div className={styles.circlesSectionDivider}>
                <span>Your Circles</span>
              </div>
            )}

            {!isLoadingCircles && circles.length === 0 && invitations.length === 0 && (
              <div className={styles.studyPlanEmpty}>
                <div className={styles.emptyIcon}>👥</div>
                <h4>Study Together</h4>
                <p>Create a circle to study the Bible with 2-8 friends</p>
                <button
                  className={styles.createPlanButton}
                  onClick={() => setShowCreateCircle(true)}
                >
                  + Create Circle
                </button>
              </div>
            )}

            {!isLoadingCircles && circles.length > 0 && (
              <>
                <div className={styles.versesList}>
                  {circles.map((circle) => (
                    <div
                      key={circle.id}
                      className={styles.prayerCard}
                      onClick={() => onSelectCircle?.(circle.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className={styles.prayerCardHeader}>
                        <span className={styles.prayerTitle}>{circle.name}</span>
                        <span className={styles.verseReference}>
                          {circle._count.members} members
                        </span>
                      </div>
                      {circle.plans && circle.plans.length > 0 && (
                        <p className={styles.prayerText}>
                          Active: {circle.plans[0].title}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  className={styles.createPlanButton}
                  onClick={() => setShowCreateCircle(true)}
                  style={{ marginTop: '12px' }}
                >
                  + Create Circle
                </button>
              </>
            )}
          </div>
        </div>

        {/* Prayer Journal Widget */}
        <div className={styles.widget}>
          <div
            className={styles.widgetHeader}
            onClick={() => toggleWidget('prayer')}
          >
            <div className={styles.widgetTitleRow}>
              <h3 className={styles.widgetTitle}>
                <span className={styles.widgetIcon}>🙏</span> Pray
              </h3>
              <button className={styles.chevronButton}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  style={{
                    transform: collapsedWidgets.prayer
                      ? 'rotate(-90deg)'
                      : 'rotate(0deg)',
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
            </div>
            <span className={styles.countBadge}>
              {prayers.filter((p) => p.status === 'ongoing').length}
            </span>
          </div>
          <div
            className={`${styles.widgetContent} ${collapsedWidgets.prayer ? styles.collapsed : ''}`}
          >
            {prayers.length === 0 ? (
              <p className={styles.emptyState}>
                No prayers yet. Save a verse and create a prayer!
              </p>
            ) : (
              <>
                <div className={styles.versesList}>
                  {prayers.slice(0, visiblePrayersCount).map((prayer) => (
                    <div
                      key={prayer.id}
                      className={`${styles.prayerCard} ${prayer.status === 'answered' ? styles.prayerAnswered : ''} ${highlightedItems.has(`prayer-${prayer.id}`) ? styles.itemNewlyAdded : ''}`}
                    >
                      <div className={styles.prayerCardHeader}>
                        <span className={styles.prayerTitle}>
                          {prayer.title ||
                            prayer.sourceReference ||
                            'Prayer Request'}
                        </span>
                        <button
                          className={styles.deleteButton}
                          onClick={() => deletePrayer(prayer.id)}
                          aria-label="Delete prayer"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M18 6L6 18M6 6L18 18"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                      <p className={styles.prayerText}>{prayer.content}</p>
                      <button
                        className={`${styles.prayerStatusButton} ${prayer.status === 'answered' ? styles.prayerStatusButtonAnswered : ''}`}
                        onClick={() => togglePrayerStatus(prayer.id)}
                      >
                        {prayer.status === 'answered' ? (
                          <>
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            Answered{' '}
                            {prayer.answeredAt &&
                              `• ${new Date(prayer.answeredAt).toLocaleDateString()}`}
                          </>
                        ) : (
                          <>
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <circle
                                cx="12"
                                cy="12"
                                r="9"
                                stroke="currentColor"
                                strokeWidth="2"
                              />
                            </svg>
                            Mark as Answered
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
                {prayers.length > visiblePrayersCount && (
                  <button
                    className={styles.showMoreButton}
                    onClick={() => setVisiblePrayersCount((prev) => prev + 5)}
                  >
                    Show More ({prayers.length - visiblePrayersCount} more)
                  </button>
                )}
                {visiblePrayersCount > 5 && prayers.length > 5 && (
                  <button
                    className={styles.showMoreButton}
                    onClick={() => setVisiblePrayersCount(5)}
                  >
                    Show Less
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* My Verses Widget */}
        <div className={styles.widget}>
          <div
            className={styles.widgetHeader}
            onClick={() => toggleWidget('myVerses')}
          >
            <div className={styles.widgetTitleRow}>
              <h3 className={styles.widgetTitle}>
                <span className={styles.widgetIcon}>🔖</span>Verses
              </h3>
              <button className={styles.chevronButton}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  style={{
                    transform: collapsedWidgets.myVerses
                      ? 'rotate(-90deg)'
                      : 'rotate(0deg)',
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
            </div>
            <span className={styles.countBadge}>{myVerses.length}</span>
          </div>
          <div
            className={`${styles.widgetContent} ${collapsedWidgets.myVerses ? styles.collapsed : ''}`}
          >
            {myVerses.length === 0 ? (
              <p className={styles.emptyState}>No verses saved yet</p>
            ) : (
              <>
                {/* Memory Verses Section */}
                {memoryVerses.length > 0 && (
                  <>
                    <div className={styles.versesSectionHeader}>
                      💭 Memory ({memoryVerses.length})
                    </div>
                    <div className={styles.versesList}>
                      {memoryVerses.map((memVerse) => {
                        const verse = myVerses.find(v => v.reference === memVerse.reference);
                        if (!verse) return null;
                        return (
                          <div
                            key={memVerse.reference}
                            className={`${styles.verseCard} ${highlightedItems.has(`verse-${verse.reference}`) ? styles.itemNewlyAdded : ''}`}
                          >
                            <div className={styles.verseCardHeader}>
                              <span className={styles.verseReference}>
                                {verse.reference}
                              </span>
                              <button
                                className={styles.deleteButton}
                                onClick={() => onDeleteVerse(verse)}
                                aria-label="Delete verse"
                              >
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M18 6L6 18M6 6L18 18"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>
                            </div>
                            <p className={styles.verseText}>
                              &quot;{verse.text}&quot;
                            </p>
                            <div className={styles.verseActions}>
                              <button
                                className={`${styles.memorizedButton} ${memVerse.memorized ? styles.memorizedActive : ''}`}
                                onClick={() => handleToggleMemorizeVerse(verse)}
                              >
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  {memVerse.memorized ? (
                                    <path
                                      d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  ) : (
                                    <circle
                                      cx="12"
                                      cy="12"
                                      r="9"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    />
                                  )}
                                </svg>
                                Memorize
                              </button>
                              <button
                                className={styles.createPrayerButton}
                                onClick={() => generatePrayerFromVerse(verse)}
                                disabled={
                                  generatingPrayerForVerse === verse.reference
                                }
                              >
                                {generatingPrayerForVerse === verse.reference ? (
                                  <>
                                    <svg
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                      className={styles.spinningIcon}
                                    >
                                      <path
                                        d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                      />
                                    </svg>
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <svg
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        d="M12 6v6l4 2"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                      />
                                      <path
                                        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                      />
                                      <path
                                        d="M8 2h8M8 22h8"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                      />
                                    </svg>
                                    Create Prayer
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Regular Saved Verses Section */}
                {myVerses.filter(v => !memoryVerses.some(m => m.reference === v.reference)).length > 0 && (
                  <>
                    {memoryVerses.length > 0 && (
                      <div className={styles.versesSectionHeader}>
                        📚 Saved Verses ({myVerses.filter(v => !memoryVerses.some(m => m.reference === v.reference)).length})
                      </div>
                    )}
                    <div className={styles.versesList}>
                      {myVerses
                        .filter(v => !memoryVerses.some(m => m.reference === v.reference))
                        .slice(0, visibleVersesCount)
                        .map((verse, index) => (
                          <div
                            key={index}
                            className={`${styles.verseCard} ${highlightedItems.has(`verse-${verse.reference}`) ? styles.itemNewlyAdded : ''}`}
                          >
                            <div className={styles.verseCardHeader}>
                              <span className={styles.verseReference}>
                                {verse.reference}
                              </span>
                              <button
                                className={styles.deleteButton}
                                onClick={() => onDeleteVerse(verse)}
                                aria-label="Delete verse"
                              >
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M18 6L6 18M6 6L18 18"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>
                            </div>
                            <p className={styles.verseText}>
                              &quot;{verse.text}&quot;
                            </p>
                            <div className={styles.verseActions}>
                              <button
                                className={styles.memorizeButton}
                                onClick={() => handleToggleMemorizeVerse(verse)}
                              >
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                Memorize
                              </button>
                              <button
                                className={styles.createPrayerButton}
                                onClick={() => generatePrayerFromVerse(verse)}
                                disabled={
                                  generatingPrayerForVerse === verse.reference
                                }
                              >
                                {generatingPrayerForVerse === verse.reference ? (
                                  <>
                                    <svg
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                      className={styles.spinningIcon}
                                    >
                                      <path
                                        d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                      />
                                    </svg>
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <svg
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        d="M12 6v6l4 2"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                      />
                                      <path
                                        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                      />
                                      <path
                                        d="M8 2h8M8 22h8"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                      />
                                    </svg>
                                    Create Prayer
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                    {myVerses.filter(v => !memoryVerses.some(m => m.reference === v.reference)).length > visibleVersesCount && (
                      <button
                        className={styles.showMoreButton}
                        onClick={() => setVisibleVersesCount((prev) => prev + 5)}
                      >
                        Show More ({myVerses.filter(v => !memoryVerses.some(m => m.reference === v.reference)).length - visibleVersesCount} more)
                      </button>
                    )}
                    {visibleVersesCount > 5 && myVerses.filter(v => !memoryVerses.some(m => m.reference === v.reference)).length > 5 && (
                      <button
                        className={styles.showMoreButton}
                        onClick={() => setVisibleVersesCount(5)}
                      >
                        Show Less
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Plan Creator Modal */}
      {/* Create Circle Modal */}
      {showCreateCircle &&
        createPortal(
          <CreateCircleModal
            onClose={() => setShowCreateCircle(false)}
            onCircleCreated={(circle) => {
              setCircles([circle, ...circles]);
              if (onSelectCircle) {
                onSelectCircle(circle.id);
              }
            }}
          />,
          document.body
        )}
    </>
  );
}
