'use client';

import { useState } from 'react';
import styles from './dashboard.module.css';
import ContextualWidgets from './ContextualWidgets';
import ChatInput from './ChatInput';
import DailyPanel from './DailyPanel';
import ProphecyPanel from './ProphecyPanel';
import InsightPanel from './InsightPanel';
import LifePanel from './LifePanel';

type PanelType = 'insight' | 'life' | 'prophecy' | 'daily' | null;

interface SavedVerse {
  reference: string;
  text: string;
}

const panels = [
  { id: 'insight' as const, title: 'Insight' },
  { id: 'life' as const, title: 'Life' },
  { id: 'prophecy' as const, title: 'Prophecy' },
  { id: 'daily' as const, title: 'Daily' },
];

export default function Dashboard() {
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

  const addVerse = (verse: SavedVerse) => {
    // Check if verse already exists
    const exists = myVerses.some(v => v.reference === verse.reference);
    if (!exists) {
      setMyVerses([verse, ...myVerses]); // Add to beginning of array
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
      <ChatInput />
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
                  {!(panel.id === 'prophecy' || panel.id === 'insight' || panel.id === 'life' || panel.id === 'daily') && (
                    <div className={styles.panelHeader}>
                      <h2 className={styles.panelTitle}>{panel.title}</h2>
                      <button className={styles.collapseButton}>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M15 10H5M10 5L5 10L10 15"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                  <div className={styles.panelContent}>
                    {panel.id === 'insight' && <InsightPanel />}
                    {panel.id === 'life' && <LifePanel onSaveVerse={addVerse} />}
                    {panel.id === 'prophecy' && <ProphecyPanel />}
                    {panel.id === 'daily' && <DailyPanel />}
                  </div>
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
                {panel.id === 'insight' && <InsightPanel isPreview={true} />}
                {panel.id === 'life' && <LifePanel isPreview={true} />}
                {panel.id === 'prophecy' && <ProphecyPanel isPreview={true} />}
                {panel.id === 'daily' && <DailyPanel isPreview={true} />}
              </div>
            </div>
          ))
        )}
      </div>
      </div>

      <aside className={styles.widgetsSidebar}>
        <ContextualWidgets myVerses={myVerses} />
      </aside>
    </div>
  );
}
