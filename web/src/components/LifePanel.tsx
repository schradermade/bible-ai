'use client';

import { useRef, useEffect, useState } from 'react';
import styles from './life-panel.module.css';

interface LifePanelProps {
  content?: {
    title: string;
    situation: string;
    biblicalPrinciple?: {
      reference: string;
      text: string;
    };
    practicalWisdom: string;
    encouragement?: string;
  };
  isPreview?: boolean;
}

export default function LifePanel({ content, isPreview = false }: LifePanelProps) {
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
    title: 'Navigating Difficult Relationships',
    situation: 'When relationships become strained and conflict arises, it\'s easy to become defensive or withdraw. But God calls us to a different way—one marked by humility, forgiveness, and genuine love.',
    biblicalPrinciple: {
      reference: 'Ephesians 4:2-3',
      text: 'Be completely humble and gentle; be patient, bearing with one another in love. Make every effort to keep the unity of the Spirit through the bond of peace.',
    },
    practicalWisdom: 'Choose to listen first before defending yourself. Ask God to show you any blind spots in how you\'ve contributed to the conflict. Extend grace remembering how much grace you\'ve received from God.',
    encouragement: 'Reconciliation is rarely easy, but it\'s always worth it. Your willingness to humble yourself and seek peace reflects the heart of Christ and brings healing to broken relationships.',
  };

  const displayContent = content || defaultContent;

  if (isPreview) {
    return (
      <div className={styles.lifePreview}>
        <div className={styles.previewIcon}>🌱</div>
        <div className={styles.previewContent}>
          <div className={styles.previewLabel}>Life Application</div>
          <div className={styles.previewTitle}>{displayContent.title}</div>
        </div>
      </div>
    );
  }

  return (
    <div ref={panelRef} className={styles.lifePanel}>
      <div className={`${styles.header} ${!headerVisible ? styles.headerHidden : ''}`}>
        <h2 className={styles.panelTitle}>Life</h2>
        <div className={styles.panelSubtitle}>Wisdom for Everyday Living</div>
      </div>

      <div className={styles.contentSection}>
        <h3 className={styles.title}>{displayContent.title}</h3>
        <p className={styles.situationText}>{displayContent.situation}</p>
      </div>

      {displayContent.biblicalPrinciple && (
        <>
          <div className={styles.divider}></div>

          <div className={styles.contentSection}>
            <div className={styles.sectionLabel}>Biblical Principle</div>
            <div className={styles.scriptureReference}>{displayContent.biblicalPrinciple.reference}</div>
            <p className={styles.scriptureText}>"{displayContent.biblicalPrinciple.text}"</p>
          </div>
        </>
      )}

      <div className={styles.divider}></div>

      <div className={styles.contentSection}>
        <div className={styles.sectionLabel}>Practical Wisdom</div>
        <p className={styles.sectionText}>{displayContent.practicalWisdom}</p>
      </div>

      {displayContent.encouragement && (
        <>
          <div className={styles.divider}></div>

          <div className={styles.contentSection}>
            <div className={styles.sectionLabel}>Encouragement</div>
            <p className={styles.sectionText}>{displayContent.encouragement}</p>
          </div>
        </>
      )}
    </div>
  );
}
