'use client';

import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import styles from './chat-conversation.module.css';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SavedVerse {
  reference: string;
  text: string;
}

interface ChatConversationProps {
  messages: Message[];
  isStreaming?: boolean;
  onSuggestionClick?: (suggestion: string) => void;
  onSaveVerse?: (verse: SavedVerse) => void;
}

// Bible verse reference pattern: Detects [[Book chapter:verse]] format
// This matches the format that ChatGPT is instructed to use
const VERSE_PATTERN = /\[\[([^\]]+)\]\]/g;

// Component to render verse references with save button
function VerseReference({
  reference,
  fullText,
  onSave
}: {
  reference: string;
  fullText: string;
  onSave?: (verse: SavedVerse) => void;
}) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!onSave || isSaving) return;

    setIsSaving(true);

    try {
      // Fetch the exact verse text from the Bible API
      const response = await fetch(`/api/bible/verse?reference=${encodeURIComponent(reference)}`);

      if (!response.ok) {
        // Fallback to extraction if API fails
        const verseText = extractVerseText(reference, fullText);
        onSave({
          reference: reference,
          text: verseText || 'Verse text not available',
        });
        return;
      }

      const data = await response.json();

      onSave({
        reference: data.reference,
        text: data.text,
      });
    } catch (error) {
      // Fallback to extraction on error
      const verseText = extractVerseText(reference, fullText);
      onSave({
        reference: reference,
        text: verseText || 'Verse text not available',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <span className={styles.verseReference}>
      <strong>{reference}</strong>
      {onSave && (
        <button
          onClick={handleSave}
          className={styles.verseSaveButton}
          disabled={isSaving}
          aria-label={`Save ${reference}`}
          title={`Save ${reference} to My Verses`}
        >
          {isSaving ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={styles.spinner}
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="60"
                strokeDashoffset="20"
              />
            </svg>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 21L12 16L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      )}
    </span>
  );
}

// Extract verse text from the full message content
function extractVerseText(reference: string, fullText: string): string {
  // Escape special regex characters in the reference
  const escapedRef = reference.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Pattern 1: [[Reference]] followed by quoted text
  // Example: "[[Matthew 5:5]] says, 'Blessed are the meek...'"
  const pattern1 = new RegExp(
    `\\[\\[${escapedRef}\\]\\]\\s*(?:says|reads|states)?\\s*,?\\s*["']([^"']+)["']`,
    'i'
  );

  // Pattern 2: Reference (without brackets) followed by quoted text
  // Example: "Matthew 5:5 says, 'Blessed are the meek...'"
  const pattern2 = new RegExp(
    `${escapedRef}\\s+(?:says|reads|states)\\s*,?\\s*["']([^"']+)["']`,
    'i'
  );

  // Pattern 3: Reference in parentheses after quoted text
  // Example: "'Blessed are the meek...' (Matthew 5:5)"
  const pattern3 = new RegExp(
    `["']([^"']+)["']\\s*\\(${escapedRef}\\)`,
    'i'
  );

  // Pattern 4: Reference followed by colon/dash and quoted text
  // Example: "Matthew 5:5: 'Blessed are the meek...'"
  const pattern4 = new RegExp(
    `${escapedRef}\\s*[:-]?\\s*["']([^"']+)["']`,
    'i'
  );

  // Try each pattern
  let match = fullText.match(pattern1);
  if (match) return match[1].trim();

  match = fullText.match(pattern2);
  if (match) return match[1].trim();

  match = fullText.match(pattern3);
  if (match) return match[1].trim();

  match = fullText.match(pattern4);
  if (match) return match[1].trim();

  // If no pattern matches, return empty string
  return '';
}

// Function to parse text and identify verse references
function parseVerseReferences(text: string, fullText: string, onSave?: (verse: SavedVerse) => void) {
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match;

  // Reset regex
  const regex = new RegExp(VERSE_PATTERN);

  while ((match = regex.exec(text)) !== null) {
    // match[1] contains the verse reference (everything between [[ and ]])
    const reference = match[1].trim();

    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Add the verse reference component (displayed without brackets)
    parts.push(
      <VerseReference
        key={match.index}
        reference={reference}
        fullText={fullText}
        onSave={onSave}
      />
    );

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

// Helper to recursively process children and detect verse references
function processChildren(children: any, fullText: string, onSave?: (verse: SavedVerse) => void): any {
  if (typeof children === 'string') {
    return parseVerseReferences(children, fullText, onSave);
  }

  if (Array.isArray(children)) {
    return children.map((child, index) => {
      if (typeof child === 'string') {
        return <span key={index}>{parseVerseReferences(child, fullText, onSave)}</span>;
      }
      return child;
    });
  }

  return children;
}

export default function ChatConversation({
  messages,
  isStreaming = false,
  onSuggestionClick,
  onSaveVerse,
}: ChatConversationProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const userIsScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const suggestions = [
    "How do I deal with anxiety?",
    "What does the Bible say about forgiveness?",
    "Help me understand Romans 8"
  ];

  // Handle scroll events to detect manual scrolling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

      // User is actively scrolling
      userIsScrollingRef.current = true;

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // After user stops scrolling for 200ms, check position
      scrollTimeoutRef.current = setTimeout(() => {
        userIsScrollingRef.current = false;
        // If they ended at the bottom, re-enable auto-scroll
        if (isAtBottom) {
          shouldAutoScrollRef.current = true;
        } else {
          // If they're not at bottom, disable auto-scroll
          shouldAutoScrollRef.current = false;
        }
      }, 200);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Never auto-scroll while user is actively scrolling
    if (userIsScrollingRef.current) {
      return;
    }

    // Only auto-scroll if explicitly enabled
    if (shouldAutoScrollRef.current && messagesEndRef.current && containerRef.current) {
      const { scrollHeight, clientHeight } = containerRef.current;
      // Use direct scrollTop assignment instead of scrollIntoView to avoid smooth behavior
      containerRef.current.scrollTop = scrollHeight - clientHeight;
    }
  }, [messages]);

  return (
    <div ref={containerRef} className={`${styles.chatContainer} ${messages.length > 0 ? styles.hasMessages : ''}`}>
      {messages.length === 0 ? (
        <div className={styles.welcomeContainer}>
          <div className={styles.welcomeIcon}>
            <svg
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
          </div>
          <h2 className={styles.welcomeTitle}>Welcome to Berea</h2>
          <p className={styles.welcomeMessage}>
            Ask me anything about Scripture, theology, or how God's Word applies to your life.
          </p>
          <div className={styles.welcomeSuggestions}>
            <p className={styles.suggestionsLabel}>Try asking:</p>
            <div className={styles.suggestionCards}>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={styles.suggestionCard}
                  onClick={() => onSuggestionClick?.(suggestion)}
                >
                  "{suggestion}"
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.messagesContainer}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`${styles.message} ${
                message.type === 'user' ? styles.userMessage : styles.assistantMessage
              }`}
            >
              <div className={styles.messageContent}>
                {message.type === 'assistant' ? (
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => {
                        // Process text nodes to detect verse references
                        const processedChildren = processChildren(children, message.content, onSaveVerse);
                        return <p>{processedChildren}</p>;
                      },
                      li: ({ children }) => {
                        const processedChildren = processChildren(children, message.content, onSaveVerse);
                        return <li>{processedChildren}</li>;
                      },
                      strong: ({ children }) => {
                        const processedChildren = processChildren(children, message.content, onSaveVerse);
                        return <strong>{processedChildren}</strong>;
                      },
                      em: ({ children }) => {
                        const processedChildren = processChildren(children, message.content, onSaveVerse);
                        return <em>{processedChildren}</em>;
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))}
          {isStreaming && (
            <div className={styles.streamingIndicator}>
              <div className={styles.typingDots}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
}
