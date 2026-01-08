'use client';

import { useState, useEffect, useRef } from 'react';
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

interface ChatInputProps {
  onSearch: (query: string) => Promise<void>;
  isLoading: boolean;
  usageRefreshTrigger?: number;
}

export default function ChatInput({ onSearch, isLoading, usageRefreshTrigger = 0 }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPromptIndex((prevIndex) => (prevIndex + 1) % prompts.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [usageRefreshTrigger]);

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
      </form>
    </div>
  );
}
