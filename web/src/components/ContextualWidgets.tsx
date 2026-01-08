'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import styles from './contextual-widgets.module.css';
import SearchHistory from './SearchHistory';

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

interface ContextualWidgetsProps {
  myVerses: SavedVerse[];
  onLoadHistory: (response: string) => void;
  onDeleteVerse: (verse: SavedVerse) => void;
}

export default function ContextualWidgets({ myVerses, onLoadHistory, onDeleteVerse }: ContextualWidgetsProps) {
  const { user } = useUser();
  const [prayerNotes, setPrayerNotes] = useState<string[]>([]);
  const [memoryVerses, setMemoryVerses] = useState<MemoryVerse[]>([]);
  const [studyProgress, setStudyProgress] = useState(0);
  const [collapsedWidgets, setCollapsedWidgets] = useState<Record<string, boolean>>({
    prayer: false,
    myVerses: false,
    memory: false,
    study: false,
    searchHistory: false,
  });

  // Load memorized verses on mount and when user changes
  useEffect(() => {
    const loadMemorizedVerses = async () => {
      if (!user) {
        // Clear data when user signs out
        setMemoryVerses([]);
        setPrayerNotes([]);
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
            memorized: true, // All verses from DB are marked as memorized
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

  const handleMemorizeVerse = (verse: SavedVerse) => {
    // Check if verse already exists in memory verses
    const exists = memoryVerses.some(v => v.reference === verse.reference);
    if (!exists) {
      const newMemoryVerse: MemoryVerse = {
        id: `${Date.now()}-${Math.random()}`,
        reference: verse.reference,
        text: verse.text,
        memorized: false,
      };
      setMemoryVerses([newMemoryVerse, ...memoryVerses]);
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
        await fetch('/api/verses/memorized', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reference: verse.reference,
            text: verse.text || null,
          }),
        });
      } else {
        // Remove from database
        await fetch('/api/verses/memorized', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference: verse.reference }),
        });
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

  return (
    <div className={styles.widgetsContainer}>
      {/* Search History Widget */}
      <SearchHistory
        onLoadHistory={onLoadHistory}
        isCollapsed={collapsedWidgets.searchHistory}
        onToggle={() => toggleWidget('searchHistory')}
      />

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
          <button className={styles.addButton} onClick={(e) => e.stopPropagation()}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 3V13M3 8H13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className={`${styles.widgetContent} ${collapsedWidgets.prayer ? styles.collapsed : ''}`}>
          {prayerNotes.length === 0 ? (
            <p className={styles.emptyState}>No prayer notes yet</p>
          ) : (
            <ul className={styles.list}>
              {prayerNotes.map((note, index) => (
                <li key={index} className={styles.listItem}>
                  {note}
                </li>
              ))}
            </ul>
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
                  <p className={styles.verseText}>"{verse.text}"</p>
                  <button
                    className={styles.memorizeButton}
                    onClick={() => handleMemorizeVerse(verse)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Memorize
                  </button>
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
