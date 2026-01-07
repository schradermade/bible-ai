'use client';

import { useRef, useEffect, useState } from 'react';
import styles from './prophecy-panel.module.css';

interface ProphecyContent {
  past: {
    title: string;
    scripture: {
      reference: string;
      text: string;
    };
    context: string;
  };
  present: {
    title: string;
    word: string;
  };
  future: {
    title: string;
    promise: string;
  };
}

interface ProphecyPanelProps {
  content?: ProphecyContent;
  isPreview?: boolean;
}

export default function ProphecyPanel({ content, isPreview = false }: ProphecyPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const panelElement = panelRef.current;
    if (!panelElement || isPreview) return;

    const handleScroll = () => {
      const currentScrollY = panelElement.scrollTop;

      if (currentScrollY <= 5) {
        // At the top, always show header
        setHeaderVisible(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 20) {
        // Scrolling down past threshold - hide header
        setHeaderVisible(false);
      } else if (currentScrollY < lastScrollY.current) {
        // Scrolling up - show header
        setHeaderVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    panelElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => panelElement.removeEventListener('scroll', handleScroll);
  }, [isPreview]);

  const defaultContent: ProphecyContent = {
    past: {
      title: 'What Was Spoken',
      scripture: {
        reference: 'Isaiah 55:11',
        text: 'So shall my word be that goes out from my mouth; it shall not return to me empty, but it shall accomplish that which I purpose, and shall succeed in the thing for which I sent it.',
      },
      context: 'Throughout Scripture, God\'s prophetic word has never failed. From the promises to Abraham, through the prophets to Israel, to the fulfillment in Christ—His word always accomplishes its divine purpose.',
    },
    present: {
      title: 'Word for Today',
      word: 'In this season, God is speaking purpose over your waiting. What feels like delay is actually divine preparation. He is aligning circumstances, maturing your character, and positioning you for the fulfillment He has planned.',
    },
    future: {
      title: 'The Promise Ahead',
      promise: 'What God has spoken over your life will come to pass. The seeds planted in prayer, the prophetic words received, the quiet assurances in your spirit—these are not mere hopes, but divine declarations taking root in time.',
    },
  };

  const displayContent = content || defaultContent;

  if (isPreview) {
    return (
      <div className={styles.prophecyPreview}>
        <div className={styles.previewIcon}>📜</div>
        <div className={styles.previewTitle}>Prophetic Word</div>
        <div className={styles.previewSubtitle}>Past • Present • Future</div>
      </div>
    );
  }

  return (
    <div ref={panelRef} className={styles.prophecyPanel}>
      <div className={`${styles.prophecyHeader} ${!headerVisible ? styles.headerHidden : ''}`}>
        <h2 className={styles.prophecyTitle}>Prophecy</h2>
        <div className={styles.prophecySubtitle}>God's Word Unfolding Through Time</div>
      </div>

      <div className={styles.epochSection}>
        <div className={styles.epochLabel}>Past</div>
        <h3 className={styles.epochTitle}>{displayContent.past.title}</h3>
        <div className={styles.scriptureRef}>{displayContent.past.scripture.reference}</div>
        <p className={styles.scriptureText}>"{displayContent.past.scripture.text}"</p>
        <p className={styles.contextText}>{displayContent.past.context}</p>
      </div>

      <div className={styles.timelineDivider}></div>

      <div className={styles.epochSection}>
        <div className={styles.epochLabel}>Present</div>
        <h3 className={styles.epochTitle}>{displayContent.present.title}</h3>
        <p className={styles.wordText}>{displayContent.present.word}</p>
      </div>

      <div className={styles.timelineDivider}></div>

      <div className={styles.epochSection}>
        <div className={styles.epochLabel}>Future</div>
        <h3 className={styles.epochTitle}>{displayContent.future.title}</h3>
        <p className={styles.promiseText}>{displayContent.future.promise}</p>
      </div>
    </div>
  );
}
