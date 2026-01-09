'use client';

import { useRef, useEffect, useState } from 'react';
import styles from './insight-panel.module.css';

interface InsightPanelProps {
  content?: {
    title: string;
    mainInsight: string;
    scriptureContext?: {
      reference: string;
      text: string;
    };
    application: string;
    deeperTruth?: string;
  };
  isPreview?: boolean;
}

export default function InsightPanel({
  content,
  isPreview = false,
}: InsightPanelProps) {
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
    title: "Understanding God's Heart",
    mainInsight:
      "God's love isn't based on our performance, but on His unchanging character. When we grasp this truth, it transforms how we approach Him—not with fear of rejection, but with confidence in His steadfast love.",
    scriptureContext: {
      reference: '1 John 4:18',
      text: 'There is no fear in love. But perfect love drives out fear, because fear has to do with punishment. The one who fears is not made perfect in love.',
    },
    application:
      'Today, reflect on areas where you still approach God with performance-based thinking. His love for you is already complete—nothing you do can make Him love you more or less.',
    deeperTruth:
      "The Father's heart toward you is one of complete acceptance and delight. Rest in this truth and let it reshape how you live, pray, and relate to Him.",
  };

  const displayContent = content || defaultContent;

  if (isPreview) {
    return (
      <div className={styles.insightPreview}>
        <div className={styles.previewContent}>
          <div className={styles.previewLabel}>Biblical Insight</div>
        </div>
        <div className={styles.previewIcon}>💡</div>
      </div>
    );
  }

  return (
    <div ref={panelRef} className={styles.insightPanel}>
      <div
        className={`${styles.header} ${!headerVisible ? styles.headerHidden : ''}`}
      >
        <h2 className={styles.panelTitle}>Biblical Insight</h2>
        <div className={styles.panelSubtitle}>
          Biblical Understanding for Today
        </div>
      </div>

      <div className={styles.contentSection}>
        <h3 className={styles.title}>{displayContent.title}</h3>
        <p className={styles.mainText}>{displayContent.mainInsight}</p>
      </div>

      {displayContent.scriptureContext && (
        <>
          <div className={styles.divider}></div>

          <div className={styles.contentSection}>
            <div className={styles.sectionLabel}>Scripture Foundation</div>
            <div className={styles.scriptureReference}>
              {displayContent.scriptureContext.reference}
            </div>
            <p className={styles.scriptureText}>
              "{displayContent.scriptureContext.text}"
            </p>
          </div>
        </>
      )}

      <div className={styles.divider}></div>

      <div className={styles.contentSection}>
        <div className={styles.sectionLabel}>Application</div>
        <p className={styles.sectionText}>{displayContent.application}</p>
      </div>

      {displayContent.deeperTruth && (
        <>
          <div className={styles.divider}></div>

          <div className={styles.contentSection}>
            <div className={styles.sectionLabel}>Deeper Truth</div>
            <p className={styles.sectionText}>{displayContent.deeperTruth}</p>
          </div>
        </>
      )}
    </div>
  );
}
