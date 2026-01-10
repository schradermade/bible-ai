'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import styles from './welcomeScreen.module.css';

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

interface RecentConversation {
  id: string;
  title: string | null;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

interface WelcomeScreenProps {
  onContinueConversation: (conversationId: string) => void;
  onStartFresh: () => void;
}

export default function WelcomeScreen({
  onContinueConversation,
  onStartFresh,
}: WelcomeScreenProps) {
  const { user } = useUser();
  const [recentConversation, setRecentConversation] = useState<RecentConversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (user) {
      loadRecentConversation();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const loadRecentConversation = async () => {
    try {
      // Get list of conversations (sorted by updatedAt desc)
      const listResponse = await fetch('/api/conversations');
      if (!listResponse.ok) {
        setIsLoading(false);
        return;
      }

      const listData = await listResponse.json();
      const conversations = listData.conversations || [];

      // If no conversations, hide the welcome screen
      if (conversations.length === 0) {
        setIsLoading(false);
        setIsVisible(false);
        return;
      }

      // Get the most recent conversation with messages
      const mostRecentId = conversations[0].id;
      const detailResponse = await fetch(`/api/conversations/${mostRecentId}`);

      if (!detailResponse.ok) {
        setIsLoading(false);
        return;
      }

      const detailData = await detailResponse.json();
      setRecentConversation(detailData.conversation);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load recent conversation:', error);
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (recentConversation) {
      onContinueConversation(recentConversation.id);
      setIsVisible(false);
    }
  };

  const handleStartFresh = () => {
    onStartFresh();
    setIsVisible(false);
  };

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
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
  };

  const getPreviewMessages = () => {
    if (!recentConversation || !recentConversation.messages) return [];

    // Get last 2 messages (or fewer if conversation is short)
    const messages = recentConversation.messages;
    return messages.slice(-2);
  };

  const truncateContent = (content: string, maxLength: number = 120) => {
    if (content.length <= maxLength) return content;

    const truncated = content.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    return lastSpace > 80 ? truncated.slice(0, lastSpace) + '...' : truncated + '...';
  };

  // Don't render if not visible, loading, or no conversation
  if (!isVisible || isLoading || !recentConversation || !user) {
    return null;
  }

  return (
    <div className={styles.welcomeOverlay}>
      <div className={styles.welcomeCard}>
        <div className={styles.welcomeHeader}>
          <h2 className={styles.welcomeTitle}>Welcome back, {user.firstName}!</h2>
          <p className={styles.welcomeSubtitle}>Continue Your Journey</p>
        </div>

        <div className={styles.conversationPreview}>
          <div className={styles.previewHeader}>
            <h3 className={styles.previewTitle}>
              {recentConversation.title || 'Recent Conversation'}
            </h3>
            <div className={styles.previewMeta}>
              {recentConversation.messageCount} {recentConversation.messageCount === 1 ? 'message' : 'messages'} • {formatDate(recentConversation.updatedAt)}
            </div>
          </div>

          <div className={styles.previewMessages}>
            {getPreviewMessages().map((msg) => (
              <div
                key={msg.id}
                className={`${styles.previewMessage} ${
                  msg.role === 'user' ? styles.userMessage : styles.assistantMessage
                }`}
              >
                <div className={styles.messageRole}>
                  {msg.role === 'user' ? 'You' : 'Berea'}
                </div>
                <div className={styles.messageContent}>
                  {truncateContent(msg.content)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.welcomeActions}>
          <button
            className={`${styles.actionButton} ${styles.primaryButton}`}
            onClick={handleContinue}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Continue Conversation
          </button>

          <button
            className={`${styles.actionButton} ${styles.secondaryButton}`}
            onClick={handleStartFresh}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Start Fresh Discussion
          </button>
        </div>

        <button
          className={styles.dismissButton}
          onClick={handleStartFresh}
          aria-label="Dismiss welcome screen"
        >
          ×
        </button>
      </div>
    </div>
  );
}
