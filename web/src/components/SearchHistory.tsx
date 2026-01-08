'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import styles from './search-history.module.css';

interface HistoryItem {
  id: string;
  prompt: string;
  response: string;
  createdAt: string;
}

interface SearchHistoryProps {
  onLoadHistory: (response: string) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function SearchHistory({ onLoadHistory, isCollapsed, onToggle }: SearchHistoryProps) {
  const { user } = useUser();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      // Clear history when user signs out
      setHistory([]);
      setIsLoading(false);
      return;
    }
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/history');
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const truncatePrompt = (prompt: string, maxLength: number = 50) => {
    if (prompt.length <= maxLength) return prompt;
    return prompt.substring(0, maxLength) + '...';
  };

  return (
    <div className={styles.widget}>
      <div className={styles.widgetHeader} onClick={onToggle}>
        <div className={styles.widgetTitleRow}>
          <h3 className={styles.widgetTitle}>Search History</h3>
          <button className={styles.chevronButton}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
            >
              <path
                d="M4 6L8 10L12 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        {!isCollapsed && history.length > 0 && (
          <span className={styles.countBadge}>{history.length}</span>
        )}
      </div>
      <div className={`${styles.widgetContent} ${isCollapsed ? styles.collapsed : ''}`}>
        {isLoading ? (
          <p className={styles.emptyState}>Loading...</p>
        ) : history.length === 0 ? (
          <p className={styles.emptyState}>No search history yet</p>
        ) : (
          <div className={styles.historyList}>
            {history.map((item) => (
              <div
                key={item.id}
                className={styles.historyItem}
                onClick={() => onLoadHistory(item.response)}
              >
                <div className={styles.historyPrompt}>
                  {truncatePrompt(item.prompt || 'Untitled search')}
                </div>
                <div className={styles.historyDate}>
                  {formatDate(item.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
