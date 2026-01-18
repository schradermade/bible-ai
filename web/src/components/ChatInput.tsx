'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import ConversationSelector from './ConversationSelector';
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
  currentConversationId: string | null;
  onSelectConversation: (conversationId: string | null) => void;
  onNewConversation: () => void;
  conversationRefreshTrigger?: number;
  welcomeMinimized?: boolean;
  onRestoreWelcome?: () => void;
}

export default function ChatInput({
  onSearch,
  isLoading,
  usageRefreshTrigger = 0,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  conversationRefreshTrigger = 0,
  welcomeMinimized = false,
  onRestoreWelcome,
}: ChatInputProps) {
  const { user } = useUser();
  const [input, setInput] = useState('');
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [showCharLimitWarning, setShowCharLimitWarning] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  // Show warning when character limit is reached
  useEffect(() => {
    if (input.length >= 500) {
      setShowCharLimitWarning(true);
    } else {
      setShowCharLimitWarning(false);
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const query = input.trim();
    setInput(''); // Clear input immediately after submitting
    await onSearch(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div
      className={styles.chatInputContainer}
    >
      <div className={styles.topRow}>
        <div className={styles.promptText}>Ask Berea AI.</div>
        {usage && (
          <div className={styles.usageText}>
            {usage.remaining} of {usage.limit} searches remaining
          </div>
        )}
      </div>
      <form ref={formRef} onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputWrapper}>
          <div className={styles.conversationSelectorWrapper}>
            <ConversationSelector
              currentConversationId={currentConversationId}
              onSelectConversation={onSelectConversation}
              onNewConversation={onNewConversation}
              refreshTrigger={conversationRefreshTrigger}
            />
          </div>
          {welcomeMinimized && onRestoreWelcome && (
            <button
              type="button"
              className={styles.welcomeRestoreButton}
              onClick={onRestoreWelcome}
              aria-label="Show welcome section"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 3H8C9.06087 3 10.0783 3.42143 10.8284 4.17157C11.5786 4.92172 12 5.93913 12 7V21C12 20.2044 11.6839 19.4413 11.1213 18.8787C10.5587 18.3161 9.79565 18 9 18H2V3Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M22 3H16C14.9391 3 13.9217 3.42143 13.1716 4.17157C12.4214 4.92172 12 5.93913 12 7V21C12 20.2044 12.3161 19.4413 12.8787 18.8787C13.4413 18.3161 14.2044 18 15 18H22V3Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={prompts[currentPromptIndex]}
            className={styles.input}
            disabled={isLoading}
            rows={1}
            maxLength={500}
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
        {showCharLimitWarning && (
          <div className={styles.charLimitWarning}>
            Character limit reached (500 max)
          </div>
        )}
      </form>
    </div>
  );
}
