'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useUser } from '@clerk/nextjs';
import styles from './contextual-widgets.module.css';
import { TEMPLATE_OPTIONS } from '@/lib/study-plan-templates';
import type { Achievement } from '@/lib/achievements';
import type { Milestone } from '@/lib/milestones';

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

interface StudyPlanDay {
  id: string;
  dayNumber: number;
  title: string;
  content: string;
  reflection: string;
  prayer: string | null;
  verseReference: string | null;
  verseText: string | null;
  completed: boolean;
  completedAt: string | null;
  verseSaved: boolean;
  prayerGenerated: boolean;
  chatEngaged: boolean;
}

interface StudyPlan {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  status: string;
  days: StudyPlanDay[];
}

interface StudyStreak {
  currentStreak: number;
  longestStreak: number;
}

interface ContextualWidgetsProps {
  myVerses: SavedVerse[];
  onLoadHistory: (response: string) => void;
  onSaveVerse: (verse: SavedVerse) => void;
  onDeleteVerse: (verse: SavedVerse) => void;
  prayerRefreshTrigger?: number;
}

export default function ContextualWidgets({ myVerses, onSaveVerse, onDeleteVerse, prayerRefreshTrigger }: ContextualWidgetsProps) {
  const { user } = useUser();
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [memoryVerses, setMemoryVerses] = useState<MemoryVerse[]>([]);
  const [studyProgress, setStudyProgress] = useState(0);
  const [generatingPrayerForVerse, setGeneratingPrayerForVerse] = useState<string | null>(null);
  const [collapsedWidgets, setCollapsedWidgets] = useState<Record<string, boolean>>({
    prayer: false,
    myVerses: false,
    memory: false,
    study: false,
    searchHistory: false,
  });
  const [highlightedItems, setHighlightedItems] = useState<Set<string>>(new Set());
  const highlightTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const previousVersesRef = useRef<SavedVerse[]>([]);
  const previousPrayersRef = useRef<Prayer[]>([]);
  const previousMemoryVersesRef = useRef<MemoryVerse[]>([]);

  // Study Plan state
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [studyStreak, setStudyStreak] = useState<StudyStreak>({ currentStreak: 0, longestStreak: 0 });
  const [showPlanCreator, setShowPlanCreator] = useState(false);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [currentDayNumber, setCurrentDayNumber] = useState(1);
  const [showAllDays, setShowAllDays] = useState(false);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [showMilestone, setShowMilestone] = useState<Milestone | null>(null);
  const [showPlanMenu, setShowPlanMenu] = useState(false);
  const [showPlanCompletion, setShowPlanCompletion] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Pagination state for widgets
  const [visibleVersesCount, setVisibleVersesCount] = useState(5);
  const [visiblePrayersCount, setVisiblePrayersCount] = useState(5);
  const [visibleMemoryCount, setVisibleMemoryCount] = useState(5);
  const [visibleDaysCount, setVisibleDaysCount] = useState(7);

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
    setHighlightedItems(prev => new Set(prev).add(key));

    // Set timer to remove after 3 seconds
    const timer = setTimeout(() => {
      setHighlightedItems(prev => {
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
      highlightTimersRef.current.forEach(timer => clearTimeout(timer));
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
        p => !previousPrayersRef.current.some(prev => prev.id === p.id)
      );

      newPrayers.forEach(prayer => {
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
        v => !previousVersesRef.current.some(prev => prev.reference === v.reference)
      );

      newVerses.forEach(verse => {
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
    if (previousMemoryVersesRef.current.length === 0 && memoryVerses.length > 0) {
      // Initial load - don't highlight
      previousMemoryVersesRef.current = memoryVerses;
      return;
    }

    if (memoryVerses.length > previousMemoryVersesRef.current.length) {
      // New memory verse(s) added - use reference as stable identifier
      const newVerses = memoryVerses.filter(
        v => !previousMemoryVersesRef.current.some(prev => prev.reference === v.reference)
      );

      newVerses.forEach(verse => {
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
        setStudyProgress(0);
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

  // Load study plan on mount and when user changes
  useEffect(() => {
    const loadStudyPlan = async () => {
      if (!user) {
        setStudyPlan(null);
        setStudyStreak({ currentStreak: 0, longestStreak: 0 });
        return;
      }

      try {
        const response = await fetch('/api/study-plans');
        if (response.ok) {
          const data = await response.json();
          setStudyPlan(data.activePlan);
          setStudyStreak(data.stats);

          // Set current day to first incomplete day
          if (data.activePlan) {
            const firstIncomplete = data.activePlan.days.find((d: StudyPlanDay) => !d.completed);
            if (firstIncomplete) {
              setCurrentDayNumber(firstIncomplete.dayNumber);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load study plan:', error);
      }
    };

    loadStudyPlan();
  }, [user]);

  const toggleWidget = (widgetId: string) => {
    setCollapsedWidgets(prev => ({
      ...prev,
      [widgetId]: !prev[widgetId],
    }));
  };

  const handleMemorizeVerse = async (verse: SavedVerse) => {
    // Check if verse already exists in memory verses
    const exists = memoryVerses.some(v => v.reference === verse.reference);
    if (exists) return;

    // Generate temporary ID for optimistic UI update
    const tempId = `${Date.now()}-${Math.random()}`;
    const newMemoryVerse: MemoryVerse = {
      id: tempId,
      reference: verse.reference,
      text: verse.text,
      memorized: false, // Not yet memorized, just added to practice list
    };

    // Optimistically add to UI (highlight will be handled by useEffect)
    setMemoryVerses([newMemoryVerse, ...memoryVerses]);

    try {
      // Save to database immediately (with memorized: false)
      const response = await fetch('/api/verses/memorized', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: verse.reference,
          text: verse.text || null,
          markAsMemorized: false, // Just add to list, not marking as memorized yet
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save verse to memory list');
      }

      const data = await response.json();
      // Update with real database ID (keeping same reference so animation continues)
      setMemoryVerses(prev =>
        prev.map(v => v.id === tempId ? { ...v, id: data.verse.id } : v)
      );
    } catch (error) {
      console.error('Failed to add verse to memory list:', error);
      // Revert on error
      setMemoryVerses(prev => prev.filter(v => v.id !== tempId));
    }
  };

  const toggleMemorized = async (id: string) => {
    const verse = memoryVerses.find(v => v.id === id);
    if (!verse) return;

    const newMemorizedState = !verse.memorized;

    // Optimistically update UI
    setMemoryVerses(memoryVerses.map(v =>
      v.id === id ? { ...v, memorized: newMemorizedState } : v
    ));

    try {
      if (newMemorizedState) {
        // Mark as memorized in database
        const response = await fetch('/api/verses/memorized', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reference: verse.reference,
            text: verse.text || null,
            markAsMemorized: true, // Explicitly mark as memorized
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save memorized verse');
        }

        const data = await response.json();
        // Update with real database ID
        setMemoryVerses(prev =>
          prev.map(v => v.id === id ? { ...v, id: data.verse.id, memorized: true } : v)
        );
      } else {
        // Unmark as memorized (set memorizedAt to null)
        const response = await fetch('/api/verses/memorized', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reference: verse.reference,
            text: verse.text || null,
            markAsMemorized: false, // Unmark as memorized
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update memorized status');
        }
      }
    } catch (error) {
      console.error('Failed to update memorized status:', error);
      // Revert on error
      setMemoryVerses(memoryVerses.map(v =>
        v.id === id ? { ...v, memorized: !newMemorizedState } : v
      ));
    }
  };

  const deleteMemoryVerse = async (id: string) => {
    const verse = memoryVerses.find(v => v.id === id);
    if (!verse) return;

    // Optimistically remove from UI
    setMemoryVerses(memoryVerses.filter(v => v.id !== id));

    try {
      // Remove from database
      await fetch('/api/verses/memorized', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: verse.reference }),
      });
    } catch (error) {
      console.error('Failed to delete verse:', error);
      // Revert on error
      setMemoryVerses([...memoryVerses]);
    }
  };

  const togglePrayerStatus = async (id: string) => {
    const prayer = prayers.find(p => p.id === id);
    if (!prayer) return;

    const newStatus = prayer.status === 'ongoing' ? 'answered' : 'ongoing';

    // Optimistically update UI
    setPrayers(prayers.map(p =>
      p.id === id ? { ...p, status: newStatus, answeredAt: newStatus === 'answered' ? new Date().toISOString() : null } : p
    ));

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
      setPrayers(prayers.map(p =>
        p.id === id ? { ...p, status: prayer.status, answeredAt: prayer.answeredAt } : p
      ));
    }
  };

  const deletePrayer = async (id: string) => {
    // Optimistically remove from UI
    const previousPrayers = prayers;
    setPrayers(prayers.filter(p => p.id !== id));

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

  // Study Plan handlers
  const handleCreatePlan = async (source: string, duration: number) => {
    setIsCreatingPlan(true);
    setShowPlanCreator(false);

    try {
      const response = await fetch('/api/study-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, duration })
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 409) {
          alert('You already have an active plan. Complete or delete it first.');
        } else if (response.status === 429) {
          alert(error.message);
        } else {
          alert('Failed to create study plan. Please try again.');
        }
        return;
      }

      const data = await response.json();
      setStudyPlan(data.plan);
      setCurrentDayNumber(1);
    } catch (error) {
      console.error('Failed to create plan:', error);
      alert('Failed to create study plan. Please try again.');
    } finally {
      setIsCreatingPlan(false);
    }
  };

  const handleToggleComplete = async (day: StudyPlanDay) => {
    if (!studyPlan) return;

    const newCompleted = !day.completed;

    // Optimistic update
    setStudyPlan(prev => prev ? {
      ...prev,
      days: prev.days.map(d =>
        d.id === day.id ? { ...d, completed: newCompleted } : d
      )
    } : null);

    try {
      const response = await fetch(`/api/study-plans/${studyPlan.id}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayNumber: day.dayNumber, completed: newCompleted })
      });

      if (!response.ok) {
        throw new Error('Failed to update progress');
      }

      const data = await response.json();

      console.log('[FRONTEND] Received streak update:', data.streak);

      // Update streak
      setStudyStreak({
        currentStreak: data.streak.currentStreak,
        longestStreak: data.streak.longestStreak
      });

      console.log('[FRONTEND] Updated streak state:', {
        currentStreak: data.streak.currentStreak,
        longestStreak: data.streak.longestStreak
      });

      // Show milestone if reached
      if (data.streak.newMilestone) {
        setShowMilestone(data.streak.newMilestone);
        setTimeout(() => setShowMilestone(null), 4000);
      }

      // Show achievements
      if (data.newAchievements?.length > 0) {
        setNewAchievements(data.newAchievements);
        setTimeout(() => setNewAchievements([]), 5000);
      }

      // Plan completed celebration
      if (data.planCompleted) {
        setShowPlanCompletion(true);
        // Update plan status to completed in local state
        setStudyPlan(prev => prev ? { ...prev, status: 'completed', completedAt: new Date() } : null);
        // Close celebration modal after 6 seconds
        setTimeout(() => {
          setShowPlanCompletion(false);
        }, 6000);
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
      // Revert on error
      setStudyPlan(prev => prev ? {
        ...prev,
        days: prev.days.map(d =>
          d.id === day.id ? { ...d, completed: !newCompleted } : d
        )
      } : null);
    }
  };

  const handleSaveVerseFromPlan = async (day: StudyPlanDay) => {
    if (!day.verseReference || !day.verseText || !studyPlan) return;

    try {
      // Save the verse using parent's callback
      await onSaveVerse({
        reference: day.verseReference,
        text: day.verseText,
      });

      // Update engagement
      await fetch(`/api/study-plans/${studyPlan.id}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayNumber: day.dayNumber,
          engagement: { verseSaved: true }
        })
      });

      // Optimistic update
      setStudyPlan(prev => prev ? {
        ...prev,
        days: prev.days.map(d =>
          d.id === day.id ? { ...d, verseSaved: true } : d
        )
      } : null);

      // Highlight the newly added verse
      const verseKey = `verse-${day.verseReference}`;
      setHighlightedItems(prev => new Set([...prev, verseKey]));
      setTimeout(() => {
        setHighlightedItems(prev => {
          const next = new Set(prev);
          next.delete(verseKey);
          return next;
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to save verse:', error);
      alert('Failed to save verse. Please try again.');
    }
  };

  const handleSavePrayerFromPlan = async (day: StudyPlanDay) => {
    if (!day.prayer || !studyPlan) return;

    try {
      // Save the existing prayer from the study plan
      const saveResponse = await fetch('/api/prayers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: day.title.replace(/^Day \d+: /, ''), // Remove "Day X:" prefix
          content: day.prayer,
          source: 'study_plan',
          sourceReference: day.verseReference || undefined,
        }),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save prayer');
      }

      const { prayer: savedPrayer } = await saveResponse.json();

      // Add to prayers list
      setPrayers([savedPrayer, ...prayers]);

      // Update engagement
      await fetch(`/api/study-plans/${studyPlan.id}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayNumber: day.dayNumber,
          engagement: { prayerGenerated: true }
        })
      });

      // Optimistic update
      setStudyPlan(prev => prev ? {
        ...prev,
        days: prev.days.map(d =>
          d.id === day.id ? { ...d, prayerGenerated: true } : d
        )
      } : null);

      // Highlight the newly added prayer
      setHighlightedItems(prev => new Set([...prev, `prayer-${savedPrayer.id}`]));
      setTimeout(() => {
        setHighlightedItems(prev => {
          const next = new Set(prev);
          next.delete(`prayer-${savedPrayer.id}`);
          return next;
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to save prayer:', error);
      alert('Failed to save prayer. Please try again.');
    }
  };

  const handleGeneratePrayerFromPlan = async (day: StudyPlanDay) => {
    if (!day.verseReference || !day.verseText || !studyPlan) return;

    try {
      // Generate prayer
      const generateResponse = await fetch('/api/ai/generate-prayer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'verse',
          verseReference: day.verseReference,
          verseText: day.verseText,
        }),
      });

      if (!generateResponse.ok) {
        throw new Error('Failed to generate prayer');
      }

      const { prayer, title, sourceReference } = await generateResponse.json();

      // Save prayer
      const saveResponse = await fetch('/api/prayers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content: prayer,
          source: 'study_plan',
          sourceReference,
        }),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save prayer');
      }

      const { prayer: savedPrayer } = await saveResponse.json();

      // Add to prayers list
      setPrayers([savedPrayer, ...prayers]);

      // Update engagement
      await fetch(`/api/study-plans/${studyPlan.id}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayNumber: day.dayNumber,
          engagement: { prayerGenerated: true }
        })
      });

      // Optimistic update
      setStudyPlan(prev => prev ? {
        ...prev,
        days: prev.days.map(d =>
          d.id === day.id ? { ...d, prayerGenerated: true } : d
        )
      } : null);
    } catch (error) {
      console.error('Failed to generate prayer:', error);
      alert('Failed to generate prayer. Please try again.');
    }
  };

  const handleAskBereaAboutDay = async (day: StudyPlanDay) => {
    if (!studyPlan) return;

    // Compose question for Berea
    const question = `I'm studying day ${day.dayNumber} of my study plan: "${day.title}". ${day.verseReference ? `The scripture is ${day.verseReference}: "${day.verseText}"` : ''}\n\n${day.content}\n\nReflection: ${day.reflection}`;

    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(question);

      // Track engagement
      await fetch(`/api/study-plans/${studyPlan.id}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayNumber: day.dayNumber,
          engagement: { chatEngaged: true }
        })
      });

      // Optimistic update
      setStudyPlan(prev => prev ? {
        ...prev,
        days: prev.days.map(d =>
          d.id === day.id ? { ...d, chatEngaged: true } : d
        )
      } : null);

      // Show success message
      alert('Study plan content copied to clipboard! Paste it into the chat below to discuss with Berea.');

      // Scroll to chat input
      const chatInput = document.querySelector('textarea[placeholder*="Ask"]');
      if (chatInput) {
        chatInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (chatInput as HTMLTextAreaElement).focus();
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      alert('Please scroll down to the chat and ask Berea about today\'s study content.');
    }
  };

  const handleDeletePlan = async () => {
    if (!studyPlan || !confirm('Are you sure you want to delete this study plan?')) return;

    const planId = studyPlan.id;
    setShowPlanMenu(false);

    try {
      const response = await fetch(`/api/study-plans/${planId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete plan');
      }

      // Successfully deleted - clear local state
      setStudyPlan(null);

      // Reload to ensure sync with server
      const reloadResponse = await fetch('/api/study-plans');
      if (reloadResponse.ok) {
        const data = await reloadResponse.json();
        setStudyPlan(data.activePlan);
        setStudyStreak(data.stats);
      }
    } catch (error) {
      console.error('Failed to delete plan:', error);
      alert('Failed to delete study plan. Please try again.');
      // Reload to get current state
      const reloadResponse = await fetch('/api/study-plans');
      if (reloadResponse.ok) {
        const data = await reloadResponse.json();
        setStudyPlan(data.activePlan);
      }
    }
  };

  const handleArchivePlan = async () => {
    if (!studyPlan) return;

    const planId = studyPlan.id;

    try {
      const response = await fetch(`/api/study-plans/${planId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to archive plan');
      }

      // Successfully archived - clear local state
      setStudyPlan(null);

      // Reload to check for other plans
      const reloadResponse = await fetch('/api/study-plans');
      if (reloadResponse.ok) {
        const data = await reloadResponse.json();
        setStudyPlan(data.activePlan);
        setStudyStreak(data.stats);
      }
    } catch (error) {
      console.error('Failed to archive plan:', error);
      alert('Failed to archive study plan. Please try again.');
    }
  };

  return (
    <>
    <div className={styles.widgetsContainer}>
      {/* Search History Widget - Moved to input field dropdown */}
      {/* <SearchHistory
        onLoadHistory={onLoadHistory}
        isCollapsed={collapsedWidgets.searchHistory}
        onToggle={() => toggleWidget('searchHistory')}
      /> */}

      {/* Study Plan Widget */}
      <div className={styles.widget}>
        <div className={styles.widgetHeader} onClick={() => toggleWidget('study')}>
          <div className={styles.widgetTitleRow}>
            <h3 className={styles.widgetTitle}><span className={styles.widgetIcon}>📚</span> Study Plan</h3>
            <button className={styles.chevronButton}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                style={{ transform: collapsedWidgets.study ? 'rotate(-90deg)' : 'rotate(0deg)' }}
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
          {studyStreak.currentStreak > 0 && (
            <span className={styles.streakBadge}>🔥 {studyStreak.currentStreak}</span>
          )}
        </div>
        <div className={`${styles.widgetContent} ${collapsedWidgets.study ? styles.collapsed : ''}`}>
          {!studyPlan && !isCreatingPlan && (
            <div className={styles.studyPlanEmpty}>
              <div className={styles.emptyIcon}>📖</div>
              <h4>Start Your Journey</h4>
              <p>AI-personalized study plans tailored to your spiritual growth</p>
              <button
                className={styles.createPlanButton}
                onClick={() => setShowPlanCreator(true)}
              >
                + Create Study Plan
              </button>
            </div>
          )}

          {isCreatingPlan && (
            <div className={styles.creatingPlan}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.spinningIcon}>
                <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <p>Creating your personalized study plan...</p>
            </div>
          )}

          {studyPlan && (
            <>
              <div className={styles.planHeader}>
                <div className={styles.planHeaderTop}>
                  <h4 className={styles.planTitle}>{studyPlan.title}</h4>
                  <div className={styles.planHeaderRight}>
                    <span className={styles.streakIndicator}>🔥 {studyStreak.currentStreak} day streak</span>
                    <span className={styles.planProgress}>
                      {studyPlan.days.filter(d => d.completed).length}/{studyPlan.days.length} days
                    </span>
                    <button
                      className={styles.planMenuButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPlanMenu(!showPlanMenu);
                      }}
                    >
                      ⋮
                    </button>
                  </div>
                </div>
                {studyPlan.status === 'completed' && (
                  <span className={styles.completedBadge}>✓ Completed</span>
                )}
                {showPlanMenu && (
                  <div className={styles.planMenu}>
                    {studyPlan.status === 'completed' ? (
                      <button onClick={handleArchivePlan}>Archive Plan</button>
                    ) : (
                      <button onClick={handleDeletePlan}>Delete Plan</button>
                    )}
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className={styles.progressBarContainer}>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${(studyPlan.days.filter(d => d.completed).length / studyPlan.days.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Current Day Focus */}
              {studyPlan.status === 'active' && (() => {
                const currentDay = studyPlan.days.find(d => d.dayNumber === currentDayNumber);
                if (!currentDay) return null;

                return (
                  <div className={styles.currentDayFocus}>
                    <h5 className={styles.dayTitle}>{currentDay.title}</h5>

                    {/* Scripture Section */}
                    {currentDay.verseReference && (
                      <div className={styles.scriptureSection}>
                        <div className={styles.verseWithButton}>
                          <div className={styles.verseContent}>
                            <p className={styles.verseRef}>{currentDay.verseReference}</p>
                            {currentDay.verseText && (
                              <p className={styles.verseText}>&quot;{currentDay.verseText}&quot;</p>
                            )}
                          </div>
                          {!currentDay.verseSaved && (
                            <button
                              className={styles.saveVerseButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveVerseFromPlan(currentDay);
                              }}
                              title="Save verse"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                  d="M19 21L12 16L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          )}
                          {currentDay.verseSaved && (
                            <span className={styles.savedIndicator}>✓ Saved</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Main Content */}
                    <div className={styles.contentSection}>
                      <p className={styles.dayContent}>{currentDay.content}</p>
                    </div>

                    {/* Reflection Questions */}
                    {currentDay.reflection && (
                      <div className={styles.reflectionSection}>
                        <h6 className={styles.reflectionTitle}>Reflection</h6>
                        <p className={styles.reflectionText}>{currentDay.reflection}</p>
                      </div>
                    )}

                    {/* Prayer */}
                    {currentDay.prayer && (
                      <div className={styles.prayerSection}>
                        <div className={styles.prayerHeader}>
                          <h6 className={styles.prayerTitle}>Prayer</h6>
                          {!currentDay.prayerGenerated && (
                            <button
                              className={styles.savePrayerButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSavePrayerFromPlan(currentDay);
                              }}
                              title="Save prayer"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                  d="M19 21L12 16L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          )}
                          {currentDay.prayerGenerated && (
                            <span className={styles.savedIndicator}>✓ Saved</span>
                          )}
                        </div>
                        <p className={styles.prayerText}>{currentDay.prayer}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className={styles.dayActions}>
                      <button
                        className={currentDay.completed ? styles.completedBtn : styles.completeBtn}
                        onClick={() => handleToggleComplete(currentDay)}
                      >
                        {currentDay.completed ? '✓ Completed' : 'Mark Complete'}
                      </button>
                      {!currentDay.chatEngaged && (
                        <button
                          className={styles.secondaryBtn}
                          onClick={() => handleAskBereaAboutDay(currentDay)}
                        >
                          💬 Ask Berea
                        </button>
                      )}
                    </div>

                    {/* Engagement Indicators */}
                    {currentDay.chatEngaged && (
                      <div className={styles.engagementIndicators}>
                        <span>💬 Discussed</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* All Days Toggle */}
              {studyPlan.days.length > 1 && (
                <button
                  className={styles.viewAllDaysBtn}
                  onClick={() => setShowAllDays(!showAllDays)}
                >
                  {showAllDays ? 'Hide' : 'View'} All Days
                </button>
              )}

              {/* All Days List */}
              {showAllDays && (
                <>
                  <div className={styles.allDaysList}>
                    {studyPlan.days.slice(0, visibleDaysCount).map(day => (
                      <div
                        key={day.id}
                        className={`${styles.dayItem} ${day.completed ? styles.dayCompleted : ''} ${day.dayNumber === currentDayNumber ? styles.dayActive : ''}`}
                        onClick={() => setCurrentDayNumber(day.dayNumber)}
                      >
                        <div className={styles.dayItemHeader}>
                          <span className={styles.dayNumber}>Day {day.dayNumber}</span>
                          {day.completed && <span className={styles.checkmark}>✓</span>}
                        </div>
                        <p className={styles.dayItemTitle}>{day.title}</p>
                      </div>
                    ))}
                  </div>
                  {studyPlan.days.length > visibleDaysCount && (
                    <button
                      className={styles.showMoreButton}
                      onClick={() => setVisibleDaysCount(prev => prev + 7)}
                    >
                      Show More ({studyPlan.days.length - visibleDaysCount} more days)
                    </button>
                  )}
                  {visibleDaysCount > 7 && studyPlan.days.length > 7 && (
                    <button
                      className={styles.showMoreButton}
                      onClick={() => setVisibleDaysCount(7)}
                    >
                      Show Less
                    </button>
                  )}
                </>
              )}

              {/* Archive Plan Button for Completed Plans */}
              {studyPlan.status === 'completed' && (
                <div className={styles.archivePlanSection}>
                  <p className={styles.archiveMessage}>
                    Great work completing this journey! Ready to start a new one?
                  </p>
                  <button
                    className={styles.archivePlanButton}
                    onClick={handleArchivePlan}
                  >
                    Archive Plan
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Prayer Journal Widget */}
      <div className={styles.widget}>
        <div className={styles.widgetHeader} onClick={() => toggleWidget('prayer')}>
          <div className={styles.widgetTitleRow}>
            <h3 className={styles.widgetTitle}><span className={styles.widgetIcon}>🙏</span> Prayer Journal</h3>
            <button className={styles.chevronButton}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                style={{ transform: collapsedWidgets.prayer ? 'rotate(-90deg)' : 'rotate(0deg)' }}
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
          <span className={styles.countBadge}>{prayers.filter(p => p.status === 'ongoing').length}</span>
        </div>
        <div className={`${styles.widgetContent} ${collapsedWidgets.prayer ? styles.collapsed : ''}`}>
          {prayers.length === 0 ? (
            <p className={styles.emptyState}>No prayers yet. Save a verse and create a prayer!</p>
          ) : (
            <>
              <div className={styles.versesList}>
                {prayers.slice(0, visiblePrayersCount).map((prayer) => (
                  <div key={prayer.id} className={`${styles.prayerCard} ${prayer.status === 'answered' ? styles.prayerAnswered : ''} ${highlightedItems.has(`prayer-${prayer.id}`) ? styles.itemNewlyAdded : ''}`}>
                    <div className={styles.prayerCardHeader}>
                      <span className={styles.prayerTitle}>
                        {prayer.title || prayer.sourceReference || 'Prayer Request'}
                      </span>
                      <button
                        className={styles.deleteButton}
                        onClick={() => deletePrayer(prayer.id)}
                        aria-label="Delete prayer"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Answered {prayer.answeredAt && `• ${new Date(prayer.answeredAt).toLocaleDateString()}`}
                        </>
                      ) : (
                        <>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
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
                  onClick={() => setVisiblePrayersCount(prev => prev + 5)}
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
        <div className={styles.widgetHeader} onClick={() => toggleWidget('myVerses')}>
          <div className={styles.widgetTitleRow}>
            <h3 className={styles.widgetTitle}><span className={styles.widgetIcon}>🔖</span> My Verses</h3>
            <button className={styles.chevronButton}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                style={{ transform: collapsedWidgets.myVerses ? 'rotate(-90deg)' : 'rotate(0deg)' }}
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
        <div className={`${styles.widgetContent} ${collapsedWidgets.myVerses ? styles.collapsed : ''}`}>
          {myVerses.length === 0 ? (
            <p className={styles.emptyState}>No verses saved yet</p>
          ) : (
            <>
              <div className={styles.versesList}>
                {myVerses.slice(0, visibleVersesCount).map((verse, index) => (
                  <div key={index} className={`${styles.verseCard} ${highlightedItems.has(`verse-${verse.reference}`) ? styles.itemNewlyAdded : ''}`}>
                    <div className={styles.verseCardHeader}>
                      <span className={styles.verseReference}>{verse.reference}</span>
                      <button
                        className={styles.deleteButton}
                        onClick={() => onDeleteVerse(verse)}
                        aria-label="Delete verse"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                    <p className={styles.verseText}>&quot;{verse.text}&quot;</p>
                    <div className={styles.verseActions}>
                      <button
                        className={styles.memorizeButton}
                        onClick={() => handleMemorizeVerse(verse)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Memorize
                      </button>
                      <button
                        className={styles.createPrayerButton}
                        onClick={() => generatePrayerFromVerse(verse)}
                        disabled={generatingPrayerForVerse === verse.reference}
                      >
                        {generatingPrayerForVerse === verse.reference ? (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.spinningIcon}>
                              <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            Generating...
                          </>
                        ) : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" strokeWidth="2"/>
                              <path d="M8 2h8M8 22h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            Create Prayer
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {myVerses.length > visibleVersesCount && (
                <button
                  className={styles.showMoreButton}
                  onClick={() => setVisibleVersesCount(prev => prev + 5)}
                >
                  Show More ({myVerses.length - visibleVersesCount} more)
                </button>
              )}
              {visibleVersesCount > 5 && myVerses.length > 5 && (
                <button
                  className={styles.showMoreButton}
                  onClick={() => setVisibleVersesCount(5)}
                >
                  Show Less
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Memory Verses Widget */}
      <div className={styles.widget}>
        <div className={styles.widgetHeader} onClick={() => toggleWidget('memory')}>
          <div className={styles.widgetTitleRow}>
            <h3 className={styles.widgetTitle}><span className={styles.widgetIcon}>🧠</span> Memory Verses</h3>
            <button className={styles.chevronButton}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                style={{ transform: collapsedWidgets.memory ? 'rotate(-90deg)' : 'rotate(0deg)' }}
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
          <span className={styles.countBadge}>{memoryVerses.length}</span>
        </div>
        <div className={`${styles.widgetContent} ${collapsedWidgets.memory ? styles.collapsed : ''}`}>
          {memoryVerses.length === 0 ? (
            <p className={styles.emptyState}>No verses saved yet</p>
          ) : (
            <>
              <div className={styles.versesList}>
                {memoryVerses.slice(0, visibleMemoryCount).map((verse) => (
                  <div key={verse.reference} className={`${styles.verseCard} ${highlightedItems.has(`memory-${verse.reference}`) ? styles.itemNewlyAdded : ''}`}>
                    <div className={styles.verseCardHeader}>
                      <span className={styles.verseReference}>{verse.reference}</span>
                      <button
                        className={styles.deleteButton}
                        onClick={() => deleteMemoryVerse(verse.id)}
                        aria-label="Delete verse"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                    <p className={styles.verseText}>&quot;{verse.text}&quot;</p>
                    <button
                      className={`${styles.memorizedButton} ${verse.memorized ? styles.memorizedActive : ''}`}
                      onClick={() => toggleMemorized(verse.id)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {verse.memorized ? (
                          <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        ) : (
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                        )}
                      </svg>
                      {verse.memorized ? 'Memorized!' : 'Mark as Memorized'}
                    </button>
                  </div>
                ))}
              </div>
              {memoryVerses.length > visibleMemoryCount && (
                <button
                  className={styles.showMoreButton}
                  onClick={() => setVisibleMemoryCount(prev => prev + 5)}
                >
                  Show More ({memoryVerses.length - visibleMemoryCount} more)
                </button>
              )}
              {visibleMemoryCount > 5 && memoryVerses.length > 5 && (
                <button
                  className={styles.showMoreButton}
                  onClick={() => setVisibleMemoryCount(5)}
                >
                  Show Less
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>

      {/* Plan Creator Modal */}
      {isMounted && showPlanCreator && createPortal(
        <div className={styles.modalOverlay} onClick={() => setShowPlanCreator(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Choose Your Journey</h3>
              <button
                className={styles.modalCloseButton}
                onClick={() => setShowPlanCreator(false)}
              >
                ×
              </button>
            </div>

            {/* AI Personalized Option */}
            <div className={styles.aiOption}>
              <div className={styles.recommendedBadge}>✨ Recommended</div>
              <h4>AI-Personalized Plan</h4>
              <p>Custom study plan based on your conversations, verses, and prayers</p>
              <div className={styles.durationButtons}>
                <button onClick={() => handleCreatePlan('ai_personalized', 7)}>
                  7-Day Journey
                </button>
                <button onClick={() => handleCreatePlan('ai_personalized', 21)}>
                  21-Day Deep Dive
                </button>
              </div>
            </div>

            <div className={styles.divider}>or choose a template</div>

            {/* Template Options */}
            {TEMPLATE_OPTIONS.map(template => (
              <div key={template.id} className={styles.templateOption}>
                <h5>{template.title}</h5>
                <p>{template.description}</p>
                <div className={styles.durationButtons}>
                  <button onClick={() => handleCreatePlan(template.id, 7)}>7 Days</button>
                  <button onClick={() => handleCreatePlan(template.id, 21)}>21 Days</button>
                </div>
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}

      {/* Milestone Celebration Modal */}
      {isMounted && showMilestone && createPortal(
        <div className={styles.milestoneModal}>
          <div className={styles.milestoneContent}>
            <div className={styles.milestoneIcon}>{showMilestone.icon}</div>
            <h3>{showMilestone.title}</h3>
            <p>{showMilestone.message}</p>
            <button onClick={() => setShowMilestone(null)}>Continue</button>
          </div>
        </div>,
        document.body
      )}

      {/* Plan Completion Celebration */}
      {isMounted && showPlanCompletion && createPortal(
        <div className={styles.planCompletionModal}>
          <div className={styles.planCompletionContent}>
            <div className={styles.completionIcon}>🎉</div>
            <h2>Journey Complete!</h2>
            <p>Congratulations on completing your {studyPlan?.duration}-day study plan!</p>
            <p className={styles.completionEncouragement}>
              You've taken meaningful steps in your spiritual growth. Keep building on this momentum!
            </p>
            <button onClick={() => setShowPlanCompletion(false)}>Continue</button>
          </div>
        </div>,
        document.body
      )}

      {/* Achievement Toast */}
      {isMounted && newAchievements.length > 0 && createPortal(
        <div className={styles.achievementToast}>
          <div className={styles.achievementIcon}>{newAchievements[0].icon}</div>
          <div>
            <h5>Achievement Unlocked!</h5>
            <p>{newAchievements[0].title}</p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
