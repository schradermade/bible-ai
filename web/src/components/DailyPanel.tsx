'use client';

import { useRef, useEffect, useState } from 'react';
import styles from './daily-panel.module.css';

interface DailyPanelProps {
  content?: {
    title: string;
    date: string;
    scripture: {
      reference: string;
      text: string;
    };
    reflection: string;
    prayer: string;
    actionStep: string;
  };
  isPreview?: boolean;
}

export default function DailyPanel({ content, isPreview = false }: DailyPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const panelElement = panelRef.current;
    if (!panelElement || isPreview) return;

    const handleScroll = () => {
      const currentScrollY = panelElement.scrollTop;

      if (currentScrollY <= 5) {
        setHeaderVisible(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 20) {
        setHeaderVisible(false);
      } else if (currentScrollY < lastScrollY.current) {
        setHeaderVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    panelElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => panelElement.removeEventListener('scroll', handleScroll);
  }, [isPreview]);

  // Default content for demonstration
  const defaultContent = {
    title: 'Finding Peace in the Storm',
    date: new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    scripture: {
      reference: 'Philippians 4:6-7',
      text: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.',
    },
    reflection: 'When we face struggles—whether depression, anxiety, or uncertainty—God invites us to bring our burdens to Him. This passage reminds us that peace isn\'t found in the absence of problems, but in the presence of God. His peace transcends our understanding because it doesn\'t depend on our circumstances; it flows from His unchanging character and faithful promises.',
    prayer: 'Heavenly Father, thank You for inviting me to cast my anxieties upon You. Help me to trust in Your sovereignty and rest in Your peace. Guard my heart and mind as I navigate today\'s challenges. Amen.',
    actionStep: 'Take 5 minutes today to write down your worries, then intentionally pray through each one, releasing them to God.',
  };

  const displayContent = content || defaultContent;

  if (isPreview) {
    return (
      <div className={styles.dailyPreview}>
        <div className={styles.previewIcon}>🙏</div>
        <div className={styles.previewContent}>
          <div className={styles.previewLabel}>Today's Devotional</div>
          <div className={styles.previewTitle}>{displayContent.title}</div>
        </div>
      </div>
    );
  }

  return (
    <div ref={panelRef} className={styles.dailyPanel}>
      <div className={`${styles.header} ${!headerVisible ? styles.headerHidden : ''}`}>
        <h2 className={styles.panelTitle}>Daily</h2>
        <div className={styles.panelSubtitle}>Today's Devotional Reflection</div>
      </div>

      <div className={styles.contentSection}>
        <div className={styles.datebadge}>{displayContent.date}</div>
        <h3 className={styles.title}>{displayContent.title}</h3>
      </div>

      <div className={styles.divider}></div>

      <div className={styles.contentSection}>
        <div className={styles.sectionLabel}>Today's Scripture</div>
        <div className={styles.scriptureReference}>{displayContent.scripture.reference}</div>
        <p className={styles.scriptureText}>"{displayContent.scripture.text}"</p>
      </div>

      <div className={styles.divider}></div>

      <div className={styles.contentSection}>
        <div className={styles.sectionLabel}>Reflection</div>
        <p className={styles.sectionText}>{displayContent.reflection}</p>
      </div>

      <div className={styles.divider}></div>

      <div className={styles.contentSection}>
        <div className={styles.sectionLabel}>Prayer</div>
        <p className={styles.sectionText}>{displayContent.prayer}</p>
      </div>

      <div className={styles.divider}></div>

      <div className={styles.contentSection}>
        <div className={styles.sectionLabel}>Today's Action Step</div>
        <p className={styles.sectionText}>{displayContent.actionStep}</p>
      </div>
    </div>
  );
}
