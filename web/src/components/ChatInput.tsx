'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import styles from './chat-input.module.css';

const prompts = [
  'What are you seeking today?',
  'Bring your questions into the light.',
  'What would you have revealed?',
  'Search the Scriptures.',
  'What is stirring your heart today?',
  'Come, let us reason together.',
];

interface UsageData {
  used: number;
  limit: number;
  remaining: number;
  isSubscribed: boolean;
}

interface HistoryItem {
  id: string;
  prompt: string;
  response: string;
  createdAt: string;
}

interface ChatInputProps {
  onSearch: (query: string) => Promise<void>;
  isLoading: boolean;
  usageRefreshTrigger?: number;
}

export default function ChatInput({ onSearch, isLoading, usageRefreshTrigger = 0 }: ChatInputProps) {
  const { user } = useUser();
  const [input, setInput] = useState('');
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const lastScrollY = useRef(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const historyButtonRef = useRef<HTMLButtonElement>(null);

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/usage');
      if (response.ok) {
        const data = await response.json();
        setUsage(data);
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    }
  };

  const fetchHistory = async () => {
    if (!user) return;

    setIsHistoryLoading(true);
    try {
      const response = await fetch('/api/history?limit=7');
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const toggleHistory = () => {
    if (!isHistoryOpen && history.length === 0) {
      fetchHistory();
    }
    setIsHistoryOpen(!isHistoryOpen);
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setInput(item.prompt);
    setIsHistoryOpen(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const truncatePrompt = (prompt: string, maxLength: number = 40) => {
    if (prompt.length <= maxLength) return prompt;
    return prompt.substring(0, maxLength) + '...';
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPromptIndex((prevIndex) => (prevIndex + 1) % prompts.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user) {
      // Clear usage data when user signs out
      setUsage(null);
      return;
    }
    fetchUsage();
  }, [usageRefreshTrigger, user]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY.current;

      if (currentScrollY <= 200) {
        // Always show if near the top
        setIsVisible(true);
      } else if (scrollingDown && currentScrollY > 300) {
        // Hide when scrolling down
        setIsVisible(false);
      } else if (!scrollingDown) {
        // Show when scrolling up
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isHistoryOpen &&
        dropdownRef.current &&
        historyButtonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !historyButtonRef.current.contains(event.target as Node)
      ) {
        setIsHistoryOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isHistoryOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    await onSearch(input.trim());
  };

  return (
    <div
      className={`${styles.chatInputContainer} ${!isVisible ? styles.hidden : ''}`}
    >
      <div className={styles.topRow}>
        <div className={styles.promptText}>Ask Berea AI.</div>
        {usage && (
          <div className={styles.usageText}>
            {usage.remaining} of {usage.limit} searches remaining
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputWrapper}>
          <button
            ref={historyButtonRef}
            type="button"
            className={styles.historyButton}
            onClick={toggleHistory}
            disabled={!user || isLoading}
            aria-label="Search history"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3.05 11C3.55 6.05 7.73 2 12.75 2C18 2 22.25 6.25 22.25 11.5C22.25 16.75 18 21 12.75 21C9.74 21 7.07 19.6 5.29 17.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 13V11H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={prompts[currentPromptIndex]}
            className={styles.input}
            disabled={isLoading}
          />
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <span className={styles.spinner}>⏳</span>
            ) : (
              <span>Ask</span>
            )}
          </button>
        </div>

        {/* History Dropdown */}
        {isHistoryOpen && (
          <div ref={dropdownRef} className={styles.historyDropdown}>
            <div className={styles.historyDropdownHeader}>
              <span className={styles.historyDropdownTitle}>Recent Searches</span>
            </div>
            <div className={styles.historyDropdownContent}>
              {isHistoryLoading ? (
                <div className={styles.historyEmptyState}>Loading...</div>
              ) : history.length === 0 ? (
                <div className={styles.historyEmptyState}>No search history yet</div>
              ) : (
                history.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={styles.historyItem}
                    onClick={() => handleSelectHistory(item)}
                  >
                    <span className={styles.historyItemPrompt}>
                      {truncatePrompt(item.prompt || 'Untitled search')}
                    </span>
                    <span className={styles.historyItemDate}>
                      {formatDate(item.createdAt)}
                    </span>
                  </button>
                ))
              )}
            </div>
            {history.length > 0 && (
              <div className={styles.historyDropdownFooter}>
                <a href="/saved" className={styles.viewAllLink}>
                  View All History →
                </a>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
