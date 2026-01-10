'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import styles from './contextual-widgets.module.css';

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

interface ContextualWidgetsProps {
  myVerses: SavedVerse[];
  onLoadHistory: (response: string) => void;
  onDeleteVerse: (verse: SavedVerse) => void;
  prayerRefreshTrigger?: number;
}

export default function ContextualWidgets({ myVerses, onDeleteVerse, prayerRefreshTrigger }: ContextualWidgetsProps) {
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

    // Optimistically add to UI
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
      // Update with real database ID
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

      // Add to prayers list
      setPrayers([savedPrayer, ...prayers]);
    } catch (error) {
      console.error('Failed to generate prayer:', error);
      alert('Failed to generate prayer. Please try again.');
    } finally {
      setGeneratingPrayerForVerse(null);
    }
  };

  return (
    <div className={styles.widgetsContainer}>
      {/* Search History Widget - Moved to input field dropdown */}
      {/* <SearchHistory
        onLoadHistory={onLoadHistory}
        isCollapsed={collapsedWidgets.searchHistory}
        onToggle={() => toggleWidget('searchHistory')}
      /> */}

      {/* Prayer Journal Widget */}
      <div className={styles.widget}>
        <div className={styles.widgetHeader} onClick={() => toggleWidget('prayer')}>
          <div className={styles.widgetTitleRow}>
            <h3 className={styles.widgetTitle}>Prayer Journal</h3>
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
            <div className={styles.versesList}>
              {prayers.map((prayer) => (
                <div key={prayer.id} className={`${styles.prayerCard} ${prayer.status === 'answered' ? styles.prayerAnswered : ''}`}>
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
          )}
        </div>
      </div>

      {/* My Verses Widget */}
      <div className={styles.widget}>
        <div className={styles.widgetHeader} onClick={() => toggleWidget('myVerses')}>
          <div className={styles.widgetTitleRow}>
            <h3 className={styles.widgetTitle}>My Verses</h3>
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
            <div className={styles.versesList}>
              {myVerses.map((verse, index) => (
                <div key={index} className={styles.verseCard}>
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
          )}
        </div>
      </div>

      {/* Memory Verses Widget */}
      <div className={styles.widget}>
        <div className={styles.widgetHeader} onClick={() => toggleWidget('memory')}>
          <div className={styles.widgetTitleRow}>
            <h3 className={styles.widgetTitle}>Memory Verses</h3>
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
            <div className={styles.versesList}>
              {memoryVerses.map((verse) => (
                <div key={verse.id} className={styles.verseCard}>
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
                  <p className={styles.verseText}>"{verse.text}"</p>
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
          )}
        </div>
      </div>

      {/* Study Plan Widget */}
      <div className={styles.widget}>
        <div className={styles.widgetHeader} onClick={() => toggleWidget('study')}>
          <div className={styles.widgetTitleRow}>
            <h3 className={styles.widgetTitle}>Study Plan</h3>
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
          <span className={styles.progressBadge}>{studyProgress}%</span>
        </div>
        <div className={`${styles.widgetContent} ${collapsedWidgets.study ? styles.collapsed : ''}`}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${studyProgress}%` }}
            />
          </div>
          <p className={styles.progressLabel}>Daily reading progress</p>
          <div className={styles.studyPlanItems}>
            <div className={styles.studyItem}>
              <div className={styles.studyItemIcon}>📖</div>
              <div className={styles.studyItemText}>
                <p className={styles.studyItemTitle}>Genesis 1-3</p>
                <p className={styles.studyItemMeta}>Today's reading</p>
              </div>
            </div>
            <div className={styles.studyItem}>
              <div className={styles.studyItemIcon}>✓</div>
              <div className={styles.studyItemText}>
                <p className={styles.studyItemTitle}>Psalm 23</p>
                <p className={styles.studyItemMeta}>Completed yesterday</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
