'use client';

import { useState } from 'react';
import styles from './study-intentions-form.module.css';

interface CircleMember {
  id: string;
  userId: string;
  userName?: string;
  role: string;
}

interface Intention {
  id: string;
  userId: string;
  userName?: string;
}

interface StudyIntentionsFormProps {
  circleId: string;
  members: CircleMember[];
  intentions: Intention[];
  onSubmit: () => void;
}

const TOPIC_OPTIONS = [
  { id: 'faith_doubt', label: 'Faith & Doubt', emoji: '🌱' },
  { id: 'relationships', label: 'Relationships', emoji: '💕' },
  { id: 'purpose', label: 'Purpose', emoji: '🎯' },
  { id: 'prayer', label: 'Prayer', emoji: '🙏' },
  { id: 'scripture_study', label: 'Scripture Study', emoji: '📖' },
  { id: 'spiritual_growth', label: 'Spiritual Growth', emoji: '🌿' },
  { id: 'forgiveness', label: 'Forgiveness', emoji: '🕊️' },
  { id: 'hope_healing', label: 'Hope & Healing', emoji: '✨' },
];

const SEASON_OPTIONS = [
  { id: 'seeking', label: 'Seeking answers', emoji: '🔍' },
  { id: 'growing', label: 'Growing deeper', emoji: '🌱' },
  { id: 'struggling', label: 'Struggling with doubt', emoji: '⛈️' },
  { id: 'celebrating', label: 'Celebrating breakthrough', emoji: '🎉' },
  { id: 'distant', label: 'Feeling distant', emoji: '🌫️' },
  { id: 'serving', label: 'Ready to serve', emoji: '💪' },
];

const PACE_OPTIONS = [
  { id: 'light', time: '5-10 min', label: 'Light Reading' },
  { id: 'moderate', time: '15-20 min', label: 'Moderate Study' },
  { id: 'deep', time: '25-30 min', label: 'Deep Dive' },
];

export default function StudyIntentionsForm({
  circleId,
  members,
  intentions,
  onSubmit,
}: StudyIntentionsFormProps) {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [depthLevel, setDepthLevel] = useState(5);
  const [currentSeason, setCurrentSeason] = useState('');
  const [studyPace, setStudyPace] = useState('');
  const [heartQuestion, setHeartQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toggleTopic = (topicId: string) => {
    setSelectedTopics((prev) => {
      if (prev.includes(topicId)) {
        return prev.filter((t) => t !== topicId);
      } else {
        if (prev.length >= 3) {
          return prev;
        }
        return [...prev, topicId];
      }
    });
  };

  const isValid =
    selectedTopics.length > 0 && currentSeason && studyPace;

  const getUserInitials = (userName?: string) => {
    if (!userName) return '?';
    return userName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const hasCompleted = (userId: string) => {
    return intentions.some((intention) => intention.userId === userId);
  };

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/circles/${circleId}/study-intentions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedTopics,
          depthLevel,
          currentSeason,
          studyPace,
          heartQuestion: heartQuestion.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit input');
      }

      onSubmit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <div className={styles.scrollIcon}>📜</div>
        <h2>Share Your Study Input</h2>
        <p className={styles.subtitle}>
          Share where you are—Berea AI will use everyone's input to generate a study that fits your whole circle. Once submitted, your circle host can generate the plan.
        </p>
      </div>

      {/* Member Completion Status */}
      <div className={styles.memberStatusSection}>
        <h3 className={styles.memberStatusTitle}>Study Contribution Status</h3>
        <div className={styles.memberAvatars}>
          {members.map((member) => {
            const completed = hasCompleted(member.userId);
            const displayName = member.userName || member.userId;
            const initials = getUserInitials(member.userName);

            return (
              <div key={member.id} className={styles.memberAvatarItem}>
                <div
                  className={`${styles.memberAvatar} ${
                    completed ? styles.completed : styles.pending
                  }`}
                >
                  {initials}
                  {completed && (
                    <div className={styles.completionBadge}>✓</div>
                  )}
                </div>
                <div className={styles.memberName}>{displayName}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Topic Cards */}
      <div className={styles.section}>
        <h3>What themes are speaking to your heart?</h3>
        <p className={styles.sectionSubtitle}>Select 1-3 topics that resonate most</p>
        <div className={styles.topicGrid}>
          {TOPIC_OPTIONS.map((topic) => (
            <button
              key={topic.id}
              className={`${styles.topicCard} ${
                selectedTopics.includes(topic.id) ? styles.selected : ''
              }`}
              onClick={() => toggleTopic(topic.id)}
              type="button"
            >
              <span className={styles.topicEmoji}>{topic.emoji}</span>
              <span className={styles.topicLabel}>{topic.label}</span>
            </button>
          ))}
        </div>
        {selectedTopics.length === 3 && (
          <p className={styles.limitMessage}>Maximum 3 topics selected</p>
        )}
      </div>

      {/* Depth Slider */}
      <div className={styles.section}>
        <h3>How deep would you like to go?</h3>
        <div className={styles.sliderContainer}>
          <input
            type="range"
            min="1"
            max="10"
            value={depthLevel}
            onChange={(e) => setDepthLevel(parseInt(e.target.value))}
            className={styles.depthSlider}
          />
          <div className={styles.sliderLabels}>
            <span>Foundational Truths</span>
            <span>Deep Theological Dive</span>
          </div>
        </div>
        <div className={styles.depthIndicator}>Level {depthLevel}/10</div>
      </div>

      {/* Current Season */}
      <div className={styles.section}>
        <h3>Where are you in your journey right now?</h3>
        <div className={styles.seasonOptions}>
          {SEASON_OPTIONS.map((season) => (
            <button
              key={season.id}
              className={`${styles.seasonButton} ${
                currentSeason === season.id ? styles.selected : ''
              }`}
              onClick={() => setCurrentSeason(season.id)}
              type="button"
            >
              <span className={styles.seasonEmoji}>{season.emoji}</span>
              <span className={styles.seasonLabel}>{season.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Study Pace */}
      <div className={styles.section}>
        <h3>What daily pace fits your life right now?</h3>
        <div className={styles.paceOptions}>
          {PACE_OPTIONS.map((pace) => (
            <button
              key={pace.id}
              className={`${styles.paceCard} ${
                studyPace === pace.id ? styles.selected : ''
              }`}
              onClick={() => setStudyPace(pace.id)}
              type="button"
            >
              <div className={styles.paceTime}>{pace.time}</div>
              <div className={styles.paceLabel}>{pace.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Heart Question */}
      <div className={styles.section}>
        <h3>One question you're hoping to explore?</h3>
        <p className={styles.optional}>(Optional, but encouraged)</p>
        <textarea
          className={styles.heartQuestionInput}
          placeholder="What's one thing you're hoping this study helps you explore?"
          value={heartQuestion}
          onChange={(e) => setHeartQuestion(e.target.value)}
          maxLength={300}
        />
        <div className={styles.charCount}>{heartQuestion.length}/300</div>
      </div>

      {/* Error Message */}
      {error && <div className={styles.error}>{error}</div>}

      {/* Submit Button */}
      <button
        className={styles.submitIntentionButton}
        onClick={handleSubmit}
        disabled={!isValid || isSubmitting}
        type="button"
      >
        {isSubmitting ? 'Submitting Your Input...' : 'Submit Your Input'}
      </button>
    </div>
  );
}
