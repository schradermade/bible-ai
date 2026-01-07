'use client';

import { useState } from 'react';
import styles from './contextual-widgets.module.css';

interface SavedVerse {
  reference: string;
  text: string;
}

interface ContextualWidgetsProps {
  myVerses: SavedVerse[];
}

export default function ContextualWidgets({ myVerses }: ContextualWidgetsProps) {
  const [prayerNotes, setPrayerNotes] = useState<string[]>([]);
  const [memoryVerses, setMemoryVerses] = useState<string[]>([]);
  const [studyProgress, setStudyProgress] = useState(0);
  const [collapsedWidgets, setCollapsedWidgets] = useState<Record<string, boolean>>({
    prayer: false,
    myVerses: false,
    memory: false,
    study: false,
  });

  const toggleWidget = (widgetId: string) => {
    setCollapsedWidgets(prev => ({
      ...prev,
      [widgetId]: !prev[widgetId],
    }));
  };

  const handleMemorizeVerse = (verse: SavedVerse) => {
    // Add to memory verses
    setMemoryVerses([...memoryVerses, `${verse.reference}: ${verse.text}`]);
    // Optionally remove from My Verses or keep it there
    // For now, we'll keep it in My Verses too
  };

  return (
    <div className={styles.widgetsContainer}>
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
        <div className={`${styles.widgetContent} ${collapsedWidgets.memory ? styles.collapsed : ''}`}>
          {memoryVerses.length === 0 ? (
            <p className={styles.emptyState}>No verses saved yet</p>
          ) : (
            <ul className={styles.list}>
              {memoryVerses.map((verse, index) => (
                <li key={index} className={styles.listItem}>
                  {verse}
                </li>
              ))}
            </ul>
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
