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

const panels = [
  { id: 'insight' as const, title: 'Insight' },
  { id: 'life' as const, title: 'Life' },
  { id: 'prophecy' as const, title: 'Prophecy' },
  { id: 'daily' as const, title: 'Daily' },
];

export default function Dashboard() {
  const [expandedPanel, setExpandedPanel] = useState<PanelType>(null);

  const handlePanelClick = (panelId: PanelType) => {
    if (expandedPanel === panelId) {
      // Collapse if clicking the already expanded panel
      setExpandedPanel(null);
    } else {
      // Expand the clicked panel
      setExpandedPanel(panelId);
    }
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
        {panels.map((panel) => {
          const isExpanded = expandedPanel === panel.id;
          const isCollapsed = expandedPanel && expandedPanel !== panel.id;

          return (
            <div
              key={panel.id}
              className={`${styles.panel} ${
                isExpanded
                  ? styles.panelExpanded
                  : isCollapsed
                  ? styles.panelCollapsed
                  : ''
              } ${
                (panel.id === 'prophecy' || panel.id === 'insight' || panel.id === 'life' || panel.id === 'daily') && isExpanded
                  ? styles.prophecyExpanded
                  : ''
              }`}
              onClick={() => handlePanelClick(panel.id)}
            >
              {!((panel.id === 'prophecy' || panel.id === 'insight' || panel.id === 'life' || panel.id === 'daily') && isExpanded) && (
                <div className={styles.panelHeader}>
                  <h2 className={styles.panelTitle}>{panel.title}</h2>
                  {isExpanded && (
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
                  )}
                </div>
              )}
              <div className={styles.panelContent}>
                {panel.id === 'insight' && !isCollapsed && <InsightPanel />}
                {panel.id === 'insight' && isCollapsed && <InsightPanel isPreview={true} />}
                {panel.id === 'life' && !isCollapsed && <LifePanel />}
                {panel.id === 'life' && isCollapsed && <LifePanel isPreview={true} />}
                {panel.id === 'prophecy' && !isCollapsed && <ProphecyPanel />}
                {panel.id === 'prophecy' && isCollapsed && <ProphecyPanel isPreview={true} />}
                {panel.id === 'daily' && !isCollapsed && <DailyPanel />}
                {panel.id === 'daily' && isCollapsed && <DailyPanel isPreview={true} />}
              </div>
            </div>
          );
        })}
      </div>
      </div>

      <aside className={styles.widgetsSidebar}>
        <ContextualWidgets />
      </aside>
    </div>
  );
}
