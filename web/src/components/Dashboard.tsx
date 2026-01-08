'use client';

import { useState } from 'react';
import styles from './dashboard.module.css';
import ContextualWidgets from './ContextualWidgets';
import ChatInput from './ChatInput';
import DailyPanel from './DailyPanel';
import ProphecyPanel from './ProphecyPanel';
import InsightPanel from './InsightPanel';
import LifePanel from './LifePanel';
import { useToast } from '@/contexts/ToastContext';

type PanelType = 'insight' | 'life' | 'prophecy' | 'daily' | null;

interface SavedVerse {
  reference: string;
  text: string;
}

interface InsightContent {
  title: string;
  mainInsight: string;
  scriptureContext: {
    reference: string;
    text: string;
  };
  application: string;
  deeperTruth: string;
}

interface LifeContent {
  title: string;
  situation: string;
  biblicalPrinciples: Array<{
    reference: string;
    text: string;
  }>;
  practicalWisdom: string;
  encouragement: string;
}

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

interface DailyContent {
  title: string;
  date: string;
  scripture: {
    reference: string;
    text: string;
  };
  reflection: string;
  prayer: string;
  actionStep: string;
}

interface PanelContent {
  insight?: InsightContent;
  life?: LifeContent;
  prophecy?: ProphecyContent;
  daily?: DailyContent;
}

const panels = [
  { id: 'insight' as const, title: 'Insight' },
  { id: 'life' as const, title: 'Life' },
  { id: 'prophecy' as const, title: 'Prophecy' },
  { id: 'daily' as const, title: 'Daily' },
];

export default function Dashboard() {
  const { showError } = useToast();
  const [expandedPanel, setExpandedPanel] = useState<PanelType>('insight');
  const [myVerses, setMyVerses] = useState<SavedVerse[]>([
    {
      reference: 'Ephesians 4:2-3',
      text: 'Be completely humble and gentle; be patient, bearing with one another in love.',
    },
    {
      reference: 'Colossians 3:13',
      text: 'Bear with each other and forgive one another if any of you has a grievance against someone.',
    },
    {
      reference: 'Proverbs 15:1',
      text: 'A gentle answer turns away wrath, but a harsh word stirs up anger.',
    },
  ]);
  const [panelContent, setPanelContent] = useState<PanelContent | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [lastQuery, setLastQuery] = useState<string>('');

  const addVerse = (verse: SavedVerse) => {
    // Check if verse already exists
    const exists = myVerses.some(v => v.reference === verse.reference);
    if (!exists) {
      setMyVerses([verse, ...myVerses]); // Add to beginning of array
    }
  };

  const handleSearch = async (query: string) => {
    setIsLoadingContent(true);
    setLastQuery(query);

    try {
      const response = await fetch('/api/ai/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Handle specific error types
        if (response.status === 401) {
          showError('Please sign in to use AI insights.');
          return;
        }

        if (response.status === 429) {
          showError(errorData.message || 'Monthly insight limit reached. Upgrade to continue.');
          return;
        }

        if (response.status === 503) {
          showError('AI service is temporarily unavailable. Please try again later.');
          return;
        }

        // Generic error
        showError(errorData.message || 'Failed to generate insights. Please try again.');
        return;
      }

      const data = await response.json();
      setPanelContent(data);

      // Expand first panel (Insight) after content loads
      setExpandedPanel('insight');
    } catch (error) {
      console.error('Search error:', error);

      // Network or other errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        showError('Network error. Please check your connection and try again.');
      } else {
        showError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoadingContent(false);
    }
  };

  const handleRetry = () => {
    if (lastQuery) {
      handleSearch(lastQuery);
    }
  };

  const handleLoadHistory = (responseString: string) => {
    try {
      const parsed = JSON.parse(responseString);
      setPanelContent(parsed);
      setExpandedPanel('insight');
    } catch (error) {
      console.error('Failed to parse history response:', error);
      showError('Failed to load search history item.');
    }
  };

  const handlePanelClick = (panelId: PanelType) => {
    if (expandedPanel === panelId) {
      // Do nothing if clicking the already expanded panel
      return;
    }
    // Expand the clicked panel
    setExpandedPanel(panelId);
  };

  return (
    <div className={styles.dashboardWrapper}>
      <div className={styles.dashboard}>
      <ChatInput onSearch={handleSearch} isLoading={isLoadingContent} />
      <div className={styles.panelsContainer}>
      <div
        className={
          expandedPanel ? styles.gridExpanded : styles.gridDefault
        }
      >
        {expandedPanel ? (
          <>
            {/* Expanded Panel */}
            {panels.map((panel) => {
              const isExpanded = expandedPanel === panel.id;
              if (!isExpanded) return null;

              return (
                <div
                  key={panel.id}
                  className={`${styles.panel} ${styles.panelExpanded} ${
                    (panel.id === 'prophecy' || panel.id === 'insight' || panel.id === 'life' || panel.id === 'daily')
                      ? styles.prophecyExpanded
                      : ''
                  }`}
                  onClick={() => handlePanelClick(panel.id)}
                >
                  <div className={styles.panelContent}>
                    {panel.id === 'insight' && <InsightPanel content={panelContent?.insight} />}
                    {panel.id === 'life' && <LifePanel content={panelContent?.life} onSaveVerse={addVerse} />}
                    {panel.id === 'prophecy' && <ProphecyPanel content={panelContent?.prophecy} />}
                    {panel.id === 'daily' && <DailyPanel content={panelContent?.daily} />}
                  </div>
                  {isLoadingContent && (
                    <div className={styles.panelLoadingOverlay}>
                      <div className={styles.loadingContent}>
                        <div className={styles.loadingSpinner}></div>
                        <div className={styles.loadingText}>Seeking wisdom from Scripture...</div>
                        <div className={styles.loadingSubtext}>Preparing your biblical insights</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Collapsed Panels Container */}
            <div className={styles.collapsedPanelsContainer}>
              {panels.map((panel) => {
                const isCollapsed = expandedPanel && expandedPanel !== panel.id;
                if (!isCollapsed) return null;

                return (
                  <div
                    key={panel.id}
                    className={`${styles.panel} ${styles.panelCollapsed}`}
                    onClick={() => handlePanelClick(panel.id)}
                  >
                    <div className={styles.panelHeader}>
                      <h2 className={styles.panelTitle}>{panel.title}</h2>
                    </div>
                    <div className={styles.panelContent}>
                      {panel.id === 'insight' && <InsightPanel isPreview={true} />}
                      {panel.id === 'life' && <LifePanel isPreview={true} />}
                      {panel.id === 'prophecy' && <ProphecyPanel isPreview={true} />}
                      {panel.id === 'daily' && <DailyPanel isPreview={true} />}
                    </div>
                    {isLoadingContent && (
                      <div className={styles.collapsedPanelLoadingOverlay}>
                        <div className={styles.smallLoadingSpinner}></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Default Grid - All Panels Equal Size */
          panels.map((panel) => (
            <div
              key={panel.id}
              className={styles.panel}
              onClick={() => handlePanelClick(panel.id)}
            >
              <div className={styles.panelHeader}>
                <h2 className={styles.panelTitle}>{panel.title}</h2>
              </div>
              <div className={styles.panelContent}>
                {panel.id === 'insight' && <InsightPanel content={panelContent?.insight} isPreview={true} />}
                {panel.id === 'life' && <LifePanel content={panelContent?.life} isPreview={true} />}
                {panel.id === 'prophecy' && <ProphecyPanel content={panelContent?.prophecy} isPreview={true} />}
                {panel.id === 'daily' && <DailyPanel content={panelContent?.daily} isPreview={true} />}
              </div>
            </div>
          ))
        )}
      </div>
      </div>
      </div>

      <aside className={styles.widgetsSidebar}>
        <ContextualWidgets myVerses={myVerses} />
      </aside>
    </div>
  );
}
