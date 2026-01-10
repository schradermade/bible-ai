'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import styles from './dashboard.module.css';
import ContextualWidgets from './ContextualWidgets';
import ChatInput from './ChatInput';
import ChatConversation from './ChatConversation';
import DailyPanel from './DailyPanel';
import ProphecyPanel from './ProphecyPanel';
import InsightPanel from './InsightPanel';
import LifePanel from './LifePanel';
import ConversationSelector from './ConversationSelector';
import { useToast } from '@/contexts/ToastContext';

type PanelType = 'insight' | 'life' | 'prophecy' | 'daily' | null;

interface SavedVerse {
  reference: string;
  text: string;
}

interface InsightContent {
  title: string;
  mainInsight: string;
  scriptureContext: {
    reference: string;
    text: string;
  };
  application: string;
  deeperTruth: string;
}

interface LifeContent {
  title: string;
  situation: string;
  biblicalPrinciples: Array<{
    reference: string;
    text: string;
  }>;
  practicalWisdom: string;
  encouragement: string;
}

interface ProphecyContent {
  past: {
    title: string;
    scripture: {
      reference: string;
      text: string;
    };
    context: string;
  };
  present: {
    title: string;
    word: string;
  };
  future: {
    title: string;
    promise: string;
  };
}

interface DailyContent {
  title: string;
  date: string;
  scripture: {
    reference: string;
    text: string;
  };
  reflection: string;
  prayer: string;
  actionStep: string;
}

interface PanelContent {
  insight?: InsightContent;
  life?: LifeContent;
  prophecy?: ProphecyContent;
  daily?: DailyContent;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const panels = [
  { id: 'insight' as const, title: 'Insight' },
  { id: 'life' as const, title: 'Life' },
  { id: 'prophecy' as const, title: 'Prophecy' },
  { id: 'daily' as const, title: 'Daily' },
];

export default function Dashboard() {
  const { showError } = useToast();
  const { user } = useUser();
  const [expandedPanel, setExpandedPanel] = useState<PanelType>(null);
  const [myVerses, setMyVerses] = useState<SavedVerse[]>([]);
  const [panelContent, setPanelContent] = useState<PanelContent | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [lastQuery, setLastQuery] = useState<string>('');
  const [usageRefreshTrigger, setUsageRefreshTrigger] = useState(0);
  const [prayerRefreshTrigger, setPrayerRefreshTrigger] = useState(0);
  const [conversationRefreshTrigger, setConversationRefreshTrigger] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Load saved verses on mount and when user changes
  useEffect(() => {
    const loadSavedVerses = async () => {
      if (!user) {
        setMyVerses([]);
        return;
      }

      try {
        const response = await fetch('/api/verses/saved');
        if (response.ok) {
          const data = await response.json();
          setMyVerses(data.verses);
        }
      } catch (error) {
        console.error('Failed to load saved verses:', error);
      }
    };

    loadSavedVerses();
  }, [user]);

  // Clear user data when signed out
  useEffect(() => {
    if (!user) {
      setMyVerses([]);
      setPanelContent(null);
      setLastQuery('');
      setMessages([]);
      setCurrentConversationId(null);
    }
  }, [user]);

  const addVerse = async (verse: SavedVerse) => {
    // Check if verse already exists
    const exists = myVerses.some(v => v.reference === verse.reference);
    if (exists) return;

    // Optimistically add to UI
    setMyVerses([verse, ...myVerses]);

    try {
      // Save to database
      const response = await fetch('/api/verses/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: verse.reference,
          text: verse.text,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save verse');
      }
    } catch (error) {
      console.error('Failed to save verse:', error);
      showError('Failed to save verse. Please try again.');
      // Revert on error
      setMyVerses(prev => prev.filter(v => v.reference !== verse.reference));
    }
  };

  const deleteVerse = async (verse: SavedVerse) => {
    // Optimistically remove from UI
    const previousVerses = myVerses;
    setMyVerses(myVerses.filter(v => v.reference !== verse.reference));

    try {
      // Delete from database
      const response = await fetch('/api/verses/saved', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: verse.reference }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete verse');
      }
    } catch (error) {
      console.error('Failed to delete verse:', error);
      showError('Failed to delete verse. Please try again.');
      // Revert on error
      setMyVerses(previousVerses);
    }
  };

  const handleSearch = async (query: string) => {
    // Close any expanded panel to show chat stream
    if (expandedPanel) {
      setExpandedPanel(null);
    }

    setLastQuery(query);
    setIsLoadingContent(true);

    // Add user message to chat
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: query,
      timestamp: new Date(),
    };

    // Build conversation history including the new user message
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    // Create placeholder assistant message
    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantMessage: Message = {
      id: assistantMessageId,
      type: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          conversationId: currentConversationId, // Pass current conversation ID
        }),
      });

      // Extract conversation ID from response headers
      const conversationIdFromResponse = response.headers.get('X-Conversation-Id');
      if (conversationIdFromResponse && !currentConversationId) {
        setCurrentConversationId(conversationIdFromResponse);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Handle specific error types
        if (response.status === 401) {
          showError('Please sign in to use AI chat.');
          // Remove the empty assistant message
          setMessages(prev => prev.filter(m => m.id !== assistantMessageId));
          return;
        }

        if (response.status === 429) {
          showError(errorData.message || 'Monthly insight limit reached. Upgrade to continue.');
          setMessages(prev => prev.filter(m => m.id !== assistantMessageId));
          return;
        }

        showError(errorData.message || 'Failed to generate response. Please try again.');
        setMessages(prev => prev.filter(m => m.id !== assistantMessageId));
        return;
      }

      // Read the stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedContent += chunk;

        // Update the assistant message with accumulated content
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, content: accumulatedContent }
              : msg
          )
        );
      }

      // Trigger usage refresh
      setUsageRefreshTrigger(prev => prev + 1);

      // Trigger conversation list refresh (to update title and timestamp)
      setConversationRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Chat error:', error);
      showError('An unexpected error occurred. Please try again.');
      // Remove the empty assistant message
      setMessages(prev => prev.filter(m => m.id !== assistantMessageId));
    } finally {
      setIsLoadingContent(false);
    }
  };


  const handleLoadHistory = (responseString: string) => {
    try {
      const parsed = JSON.parse(responseString);
      setPanelContent(parsed);
    } catch (error) {
      console.error('Failed to parse history response:', error);
      showError('Failed to load search history item.');
    }
  };

  const handleGeneratePrayerFromChat = async (chatContext: string) => {
    try {
      // Generate prayer using AI
      const generateResponse = await fetch('/api/ai/generate-prayer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'chat',
          chatContext,
        }),
      });

      if (!generateResponse.ok) {
        throw new Error('Failed to generate prayer');
      }

      const { prayer, title } = await generateResponse.json();

      // Save prayer to database
      const saveResponse = await fetch('/api/prayers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content: prayer,
          source: 'chat',
          sourceReference: null,
        }),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save prayer');
      }

      // Trigger prayer journal refresh
      setPrayerRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Failed to generate prayer:', error);
      showError('Failed to generate prayer. Please try again.');
      throw error;
    }
  };

  const handlePanelClick = async (panelId: PanelType) => {
    if (expandedPanel === panelId) {
      // Do nothing if clicking the already expanded panel
      return;
    }

    // Expand the clicked panel
    setExpandedPanel(panelId);

    // If there's a query and we haven't loaded panel content yet, fetch it
    if (lastQuery && !panelContent) {
      setIsLoadingContent(true);

      try {
        const response = await fetch('/api/ai/dashboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: lastQuery }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          // Handle specific error types
          if (response.status === 401) {
            showError('Please sign in to use AI insights.');
            return;
          }

          if (response.status === 429) {
            showError(errorData.message || 'Monthly insight limit reached. Upgrade to continue.');
            return;
          }

          if (response.status === 503) {
            showError('AI service is temporarily unavailable. Please try again later.');
            return;
          }

          // Generic error
          showError(errorData.message || 'Failed to generate insights. Please try again.');
          return;
        }

        const data = await response.json();
        setPanelContent(data);

        // Trigger usage refresh
        setUsageRefreshTrigger(prev => prev + 1);
      } catch (error) {
        console.error('Panel load error:', error);

        // Network or other errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
          showError('Network error. Please check your connection and try again.');
        } else {
          showError('An unexpected error occurred. Please try again.');
        }
      } finally {
        setIsLoadingContent(false);
      }
    }
  };

  const handleClosePanel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedPanel(null);
  };

  const handleSelectConversation = async (conversationId: string | null) => {
    if (!conversationId) return;

    try {
      // Fetch the conversation with all messages
      const response = await fetch(`/api/conversations/${conversationId}`);

      if (!response.ok) {
        showError('Failed to load conversation.');
        return;
      }

      const data = await response.json();
      const conversation = data.conversation;

      // Load messages into the chat
      const loadedMessages: Message[] = conversation.messages.map((msg: any) => ({
        id: msg.id,
        type: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.createdAt),
      }));

      setMessages(loadedMessages);
      setCurrentConversationId(conversationId);

      // Close any expanded panel to show the chat
      setExpandedPanel(null);
    } catch (error) {
      console.error('Failed to load conversation:', error);
      showError('An unexpected error occurred while loading the conversation.');
    }
  };

  const handleNewConversation = () => {
    // Clear the current conversation and start fresh
    setMessages([]);
    setCurrentConversationId(null);
    setPanelContent(null);
    setLastQuery('');

    // Close any expanded panel
    setExpandedPanel(null);
  };

  return (
    <div className={styles.dashboardWrapper}>
      <div className={styles.dashboard}>
      <div className={styles.chatHeader}>
        <ConversationSelector
          currentConversationId={currentConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          refreshTrigger={conversationRefreshTrigger}
        />
      </div>
      <ChatInput onSearch={handleSearch} isLoading={isLoadingContent} usageRefreshTrigger={usageRefreshTrigger} />
      <div className={styles.panelsContainer}>
      <div className={styles.gridExpanded}>
        {/* Chat Conversation - Show when no panel is expanded */}
        {!expandedPanel && (
          <div className={`${styles.chatArea} ${messages.length > 0 ? styles.chatAreaWithMessages : ''}`}>
            <ChatConversation
              messages={messages}
              isStreaming={isLoadingContent}
              onSuggestionClick={handleSearch}
              onSaveVerse={addVerse}
              onGeneratePrayerFromChat={handleGeneratePrayerFromChat}
            />
          </div>
        )}

        {/* Expanded Panel - Only show if a panel is selected */}
        {expandedPanel && panels.map((panel) => {
          const isExpanded = expandedPanel === panel.id;
          if (!isExpanded) return null;

          return (
            <div
              key={panel.id}
              className={`${styles.panel} ${styles.panelExpanded} ${
                (panel.id === 'prophecy' || panel.id === 'insight' || panel.id === 'life' || panel.id === 'daily')
                  ? styles.prophecyExpanded
                  : ''
              }`}
              onClick={() => handlePanelClick(panel.id)}
            >
              <button
                className={styles.closeButton}
                onClick={handleClosePanel}
                aria-label="Close panel"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div className={styles.panelContent}>
                {panel.id === 'insight' && <InsightPanel content={panelContent?.insight} />}
                {panel.id === 'life' && <LifePanel content={panelContent?.life} onSaveVerse={addVerse} />}
                {panel.id === 'prophecy' && <ProphecyPanel content={panelContent?.prophecy} />}
                {panel.id === 'daily' && <DailyPanel content={panelContent?.daily} />}
              </div>
              {isLoadingContent && (
                <div className={styles.panelLoadingOverlay}>
                  <div className={styles.loadingContent}>
                    <div className={styles.loadingSpinner}></div>
                    <div className={styles.loadingText}>Seeking wisdom from Scripture...</div>
                    <div className={styles.loadingSubtext}>Preparing your biblical insights</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Small Panels Container - Always show all 4 panels */}
        <div className={styles.collapsedPanelsContainer}>
          {panels.map((panel) => {
            const isCurrentlyExpanded = expandedPanel === panel.id;

            return (
              <div
                key={panel.id}
                className={`${styles.panel} ${styles.panelCollapsed} ${
                  isCurrentlyExpanded ? styles.panelCollapsedActive : ''
                }`}
                onClick={() => handlePanelClick(panel.id)}
              >
                <div className={styles.panelContent}>
                  {panel.id === 'insight' && <InsightPanel isPreview={true} />}
                  {panel.id === 'life' && <LifePanel isPreview={true} />}
                  {panel.id === 'prophecy' && <ProphecyPanel isPreview={true} />}
                  {panel.id === 'daily' && <DailyPanel isPreview={true} />}
                </div>
                {isLoadingContent && (
                  <div className={styles.collapsedPanelLoadingOverlay}>
                    <div className={styles.smallLoadingSpinner}></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      </div>
      </div>

      <aside className={styles.widgetsSidebar}>
        <ContextualWidgets myVerses={myVerses} onLoadHistory={handleLoadHistory} onDeleteVerse={deleteVerse} prayerRefreshTrigger={prayerRefreshTrigger} />
      </aside>
    </div>
  );
}
