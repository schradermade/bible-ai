'use client';

import { useState } from 'react';
import styles from './chat-input.module.css';

export default function ChatInput() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    // TODO: Handle LLM request and populate containers
    console.log('User input:', input);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className={styles.chatInputContainer}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What's on your heart today? (e.g., 'I'm struggling with depression')"
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
