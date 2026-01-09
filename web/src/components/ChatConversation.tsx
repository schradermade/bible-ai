'use client';

import { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import styles from './chat-conversation.module.css';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatConversationProps {
  messages: Message[];
  isStreaming?: boolean;
  onSuggestionClick?: (suggestion: string) => void;
}

export default function ChatConversation({
  messages,
  isStreaming = false,
  onSuggestionClick,
}: ChatConversationProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    "How do I deal with anxiety?",
    "What does the Bible say about forgiveness?",
    "Help me understand Romans 8"
  ];

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className={`${styles.chatContainer} ${messages.length > 0 ? styles.hasMessages : ''}`}>
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
                  <ReactMarkdown>{message.content}</ReactMarkdown>
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
