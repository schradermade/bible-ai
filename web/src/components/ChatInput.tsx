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

export default function ChatInput() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPromptIndex((prevIndex) => (prevIndex + 1) % prompts.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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

    setIsLoading(true);
    // TODO: Handle LLM request and populate containers
    console.log('User input:', input);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className={`${styles.chatInputContainer} ${!isVisible ? styles.hidden : ''}`}>
      <div className={styles.promptText}>
        <span key={currentPromptIndex} className={styles.rotatingText}>
          {prompts[currentPromptIndex]}
        </span>
        {' '}
        <span className={styles.staticText}>Ask Berea AI.</span>
      </div>
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
