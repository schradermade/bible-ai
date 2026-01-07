'use client';

import { useState } from 'react';
import styles from './dashboard.module.css';
import ContextualWidgets from './ContextualWidgets';
import ChatInput from './ChatInput';

type PanelType = 'insight' | 'life' | 'reflect' | 'daily' | null;

const panels = [
  { id: 'insight' as const, title: 'Insight' },
  { id: 'life' as const, title: 'Life' },
  { id: 'reflect' as const, title: 'Reflect' },
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
              }`}
              onClick={() => handlePanelClick(panel.id)}
            >
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
              <div className={styles.panelContent}>
                {/* Content will go here */}
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
