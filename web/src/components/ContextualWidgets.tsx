'use client';

import { useState } from 'react';
import styles from './contextual-widgets.module.css';

export default function ContextualWidgets() {
  const [prayerNotes, setPrayerNotes] = useState<string[]>([]);
  const [memoryVerses, setMemoryVerses] = useState<string[]>([]);
  const [studyProgress, setStudyProgress] = useState(0);

  return (
    <div className={styles.widgetsContainer}>
      {/* Prayer Journal Widget */}
      <div className={styles.widget}>
        <div className={styles.widgetHeader}>
          <h3 className={styles.widgetTitle}>Prayer Journal</h3>
          <button className={styles.addButton}>
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
        <div className={styles.widgetContent}>
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

      {/* Memory Verses Widget */}
      <div className={styles.widget}>
        <div className={styles.widgetHeader}>
          <h3 className={styles.widgetTitle}>Memory Verses</h3>
          <button className={styles.addButton}>
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
        <div className={styles.widgetContent}>
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
        <div className={styles.widgetHeader}>
          <h3 className={styles.widgetTitle}>Study Plan</h3>
          <span className={styles.progressBadge}>{studyProgress}%</span>
        </div>
        <div className={styles.widgetContent}>
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
