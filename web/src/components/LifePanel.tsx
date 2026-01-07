'use client';

import { useRef, useEffect, useState } from 'react';
import styles from './life-panel.module.css';

interface SavedVerse {
  reference: string;
  text: string;
}

interface LifePanelProps {
  content?: {
    title: string;
    situation: string;
    biblicalPrinciples?: Array<{
      reference: string;
      text: string;
    }>;
    practicalWisdom: string;
    encouragement?: string;
  };
  isPreview?: boolean;
  onSaveVerse?: (verse: SavedVerse) => void;
}

export default function LifePanel({ content, isPreview = false, onSaveVerse }: LifePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [savedVerseIndex, setSavedVerseIndex] = useState<number | null>(null);
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
    biblicalPrinciples: [
      {
        reference: 'Ephesians 4:2-3',
        text: 'Be completely humble and gentle; be patient, bearing with one another in love. Make every effort to keep the unity of the Spirit through the bond of peace.',
      },
      {
        reference: 'Colossians 3:13',
        text: 'Bear with each other and forgive one another if any of you has a grievance against someone. Forgive as the Lord forgave you.',
      },
      {
        reference: 'Matthew 5:23-24',
        text: 'Therefore, if you are offering your gift at the altar and there remember that your brother or sister has something against you, leave your gift there in front of the altar. First go and be reconciled to them; then come and offer your gift.',
      },
      {
        reference: 'Proverbs 15:1',
        text: 'A gentle answer turns away wrath, but a harsh word stirs up anger.',
      },
      {
        reference: 'Romans 12:18',
        text: 'If it is possible, as far as it depends on you, live at peace with everyone.',
      },
      {
        reference: 'James 1:19',
        text: 'Everyone should be quick to listen, slow to speak and slow to become angry.',
      },
    ],
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

      {displayContent.biblicalPrinciples && displayContent.biblicalPrinciples.length > 0 && (
        <>
          <div className={styles.divider}></div>

          <div className={styles.contentSection}>
            <div className={styles.sectionLabel}>Biblical Principles</div>
            {displayContent.biblicalPrinciples.map((principle, index) => (
              <div key={index} className={styles.verseContainer}>
                <div className={styles.verseHeader}>
                  <div className={styles.scriptureReference}>{principle.reference}</div>
                  <div style={{ position: 'relative' }}>
                    <button
                      className={styles.saveVerseButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSaveVerse) {
                          onSaveVerse({
                            reference: principle.reference,
                            text: principle.text,
                          });
                          setSavedVerseIndex(index);
                          setTimeout(() => setSavedVerseIndex(null), 2500);
                        }
                      }}
                      title="Save to My Verses"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 21L12 16L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    {savedVerseIndex === index && (
                      <div className={styles.savedToast}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Saved to My Verses
                      </div>
                    )}
                  </div>
                </div>
                <p className={styles.scriptureText}>"{principle.text}"</p>
              </div>
            ))}
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
