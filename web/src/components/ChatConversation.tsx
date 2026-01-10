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

interface RecentConversation {
  id: string;
  title: string | null;
  messageCount: number;
  updatedAt: string;
}

interface ChatConversationProps {
  messages: Message[];
  isStreaming?: boolean;
  onSuggestionClick?: (suggestion: string) => void;
  onSaveVerse?: (verse: SavedVerse) => void;
  onGeneratePrayerFromChat?: (context: string) => Promise<void>;
  recentConversation?: RecentConversation | null;
  onContinueConversation?: (conversationId: string) => void;
}

// Bible verse reference pattern: Detects [[Book chapter:verse]] format
// This matches the format that ChatGPT is instructed to use
const VERSE_PATTERN = /\[\[([^\]]+)\]\]/g;

// Prayer marker pattern: Detects {{prayer-worthy text}} format
// ChatGPT wraps prayer-worthy content in double curly braces
const PRAYER_PATTERN = /\{\{([^}]+)\}\}/g;

// Component to render verse references with save button
function VerseReference({
  reference,
  fullText,
  onSave,
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
      const response = await fetch(
        `/api/bible/verse?reference=${encodeURIComponent(reference)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[VerseReference] API error:', errorData);

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
      console.error('[VerseReference] Fetch error:', error);

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

// Component to render prayer markers with create prayer button
function PrayerMarker({
  prayerText,
  onCreatePrayer,
}: {
  prayerText: string;
  onCreatePrayer?: (text: string) => Promise<void>;
}) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleCreatePrayer = async () => {
    if (!onCreatePrayer || isGenerating) return;

    setIsGenerating(true);
    try {
      await onCreatePrayer(prayerText);
    } catch (error) {
      console.error('[PrayerMarker] Failed to create prayer:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <span className={styles.prayerMarker}>
      <span className={styles.prayerText}>{prayerText}</span>
      {onCreatePrayer && (
        <button
          onClick={handleCreatePrayer}
          className={styles.prayerCreateButton}
          disabled={isGenerating}
          aria-label="Create prayer for this"
          title="Create a prayer for this moment"
        >
          {isGenerating ? (
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
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Left hand outline with fill */}
              <path
                d="M17 8C17 6 16 4 14 4C12 4 10 5 9 7C8 9 7 12 7 15C7 18 7 22 9 25C10 27 12 28 14 28C15 28 16 27 17 26V8Z"
                fill="currentColor"
                opacity="0.25"
              />
              {/* Right hand outline with fill */}
              <path
                d="M19 8C19 6 20 4 22 4C24 4 26 5 27 7C28 9 29 12 29 15C29 18 29 22 27 25C26 27 24 28 22 28C21 28 20 27 19 26V8Z"
                fill="currentColor"
                opacity="0.25"
              />
              {/* Left hand stroke */}
              <path
                d="M17 8C17 6 16 4 14 4C12 4 10 5 9 7C8 9 7 12 7 15C7 18 7 22 9 25C10 27 12 28 14 28C15 28 16 27 17 26V8Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Right hand stroke */}
              <path
                d="M19 8C19 6 20 4 22 4C24 4 26 5 27 7C28 9 29 12 29 15C29 18 29 22 27 25C26 27 24 28 22 28C21 28 20 27 19 26V8Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Center dividing line */}
              <path
                d="M18 4L18 28"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
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
  const pattern3 = new RegExp(`["']([^"']+)["']\\s*\\(${escapedRef}\\)`, 'i');

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
function parseVerseReferences(
  text: string,
  fullText: string,
  onSave?: (verse: SavedVerse) => void
) {
  const parts: (string | React.ReactElement)[] = [];
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

// Function to parse text and identify prayer markers
function parsePrayerMarkers(
  text: string,
  onCreatePrayer?: (text: string) => Promise<void>
) {
  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  let match;

  // Reset regex
  const regex = new RegExp(PRAYER_PATTERN);

  while ((match = regex.exec(text)) !== null) {
    // match[1] contains the prayer text (everything between {{ and }})
    const prayerText = match[1].trim();

    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Add the prayer marker component (displayed without braces)
    parts.push(
      <PrayerMarker
        key={`prayer-${match.index}`}
        prayerText={prayerText}
        onCreatePrayer={onCreatePrayer}
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

// Helper to recursively process children and detect verse references and prayer markers
function processChildren(
  children: any,
  fullText: string,
  onSave?: (verse: SavedVerse) => void,
  onCreatePrayer?: (text: string) => Promise<void>
): any {
  if (typeof children === 'string') {
    // First parse verse references
    let result = parseVerseReferences(children, fullText, onSave);

    // Then parse prayer markers from the result
    if (Array.isArray(result)) {
      return result.map((part, index) => {
        if (typeof part === 'string') {
          return (
            <span key={`part-${index}`}>
              {parsePrayerMarkers(part, onCreatePrayer)}
            </span>
          );
        }
        return part;
      });
    } else if (typeof result === 'string') {
      return parsePrayerMarkers(result, onCreatePrayer);
    }

    return result;
  }

  if (Array.isArray(children)) {
    return children.map((child, index) => {
      if (typeof child === 'string') {
        let result = parseVerseReferences(child, fullText, onSave);

        if (Array.isArray(result)) {
          return result.map((part, pIndex) => {
            if (typeof part === 'string') {
              return (
                <span key={`${index}-${pIndex}`}>
                  {parsePrayerMarkers(part, onCreatePrayer)}
                </span>
              );
            }
            return part;
          });
        } else if (typeof result === 'string') {
          return (
            <span key={index}>
              {parsePrayerMarkers(result, onCreatePrayer)}
            </span>
          );
        }

        return <span key={index}>{result}</span>;
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
  onGeneratePrayerFromChat,
  recentConversation,
  onContinueConversation,
}: ChatConversationProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const userIsScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const suggestions = [
    'How do I deal with anxiety?',
    'What does the Bible say about forgiveness?',
    'Help me understand Romans 8',
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} ${Math.floor(diffInHours) === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInHours < 48) {
      return 'yesterday';
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

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
    if (
      shouldAutoScrollRef.current &&
      messagesEndRef.current &&
      containerRef.current
    ) {
      const { scrollHeight, clientHeight } = containerRef.current;
      // Use direct scrollTop assignment instead of scrollIntoView to avoid smooth behavior
      containerRef.current.scrollTop = scrollHeight - clientHeight;
    }
  }, [messages]);

  return (
    <div
      ref={containerRef}
      className={`${styles.chatContainer} ${messages.length > 0 ? styles.hasMessages : ''}`}
    >
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
          <h2 className={styles.welcomeTitle}>Welcome to Berea Study</h2>
          <p className={styles.welcomeMessage}>
            Ask me anything about Scripture, theology, or how God's Word applies
            to your life.
          </p>

          {recentConversation && onContinueConversation && (
            <div className={styles.continueSection}>
              <p className={styles.continueLabel}>Continue Your Journey</p>
              <div
                className={styles.continueCard}
                onClick={() => onContinueConversation(recentConversation.id)}
              >
                <div className={styles.continueIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 2.5a10 10 0 1 0 0 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 3" opacity="0.5"/>
                  </svg>
                </div>
                <div className={styles.continueContent}>
                  <div className={styles.continueTitle}>
                    {recentConversation.title || 'Recent Conversation'}
                  </div>
                  <div className={styles.continueMeta}>
                    {recentConversation.messageCount} {recentConversation.messageCount === 1 ? 'message' : 'messages'} • {formatDate(recentConversation.updatedAt)}
                  </div>
                </div>
                <div className={styles.continueArrow}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          )}

          <div className={styles.welcomeSuggestions}>
            <p className={styles.suggestionsLabel}>
              {recentConversation ? 'Or try asking:' : 'Try asking:'}
            </p>
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
            <React.Fragment key={message.id}>
              <div
                className={`${styles.message} ${
                  message.type === 'user'
                    ? styles.userMessage
                    : styles.assistantMessage
                }`}
              >
                <div className={styles.messageContent}>
                  {message.type === 'assistant' ? (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => {
                          // Process text nodes to detect verse references and prayer markers
                          const processedChildren = processChildren(
                            children,
                            message.content,
                            onSaveVerse,
                            onGeneratePrayerFromChat
                          );
                          return <p>{processedChildren}</p>;
                        },
                        li: ({ children }) => {
                          const processedChildren = processChildren(
                            children,
                            message.content,
                            onSaveVerse,
                            onGeneratePrayerFromChat
                          );
                          return <li>{processedChildren}</li>;
                        },
                        strong: ({ children }) => {
                          const processedChildren = processChildren(
                            children,
                            message.content,
                            onSaveVerse,
                            onGeneratePrayerFromChat
                          );
                          return <strong>{processedChildren}</strong>;
                        },
                        em: ({ children }) => {
                          const processedChildren = processChildren(
                            children,
                            message.content,
                            onSaveVerse,
                            onGeneratePrayerFromChat
                          );
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
            </React.Fragment>
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
