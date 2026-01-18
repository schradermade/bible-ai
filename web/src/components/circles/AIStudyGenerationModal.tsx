'use client';

import { useState, useEffect } from 'react';
import styles from './ai-study-generation-modal.module.css';

interface Intention {
  id: string;
  userId: string;
  userName: string;
  selectedTopics: string[];
  depthLevel: number;
  currentSeason: string;
  studyPace: string;
  heartQuestion: string | null;
}

interface GeneratedDay {
  dayNumber: number;
  title: string;
  content: string;
  reflection: string;
  prayer: string;
  verseReference: string;
  verseText: string;
}

interface GeneratedStudy {
  title: string;
  description: string;
  duration: number;
  days: GeneratedDay[];
}

interface AIStudyGenerationModalProps {
  circleId: string;
  intentions: Intention[];
  onClose: () => void;
  onStudyCreated: () => void;
}

const TOPIC_LABELS: Record<string, string> = {
  faith_doubt: 'Faith & Doubt',
  relationships: 'Relationships',
  purpose: 'Purpose',
  prayer: 'Prayer',
  scripture_study: 'Scripture Study',
  spiritual_growth: 'Spiritual Growth',
  forgiveness: 'Forgiveness',
  hope_healing: 'Hope & Healing',
};

const SEASON_LABELS: Record<string, string> = {
  seeking: 'Seeking answers',
  growing: 'Growing deeper',
  struggling: 'Struggling with doubt',
  celebrating: 'Celebrating breakthrough',
  distant: 'Feeling distant',
  serving: 'Ready to serve',
};

const PACE_LABELS: Record<string, string> = {
  light: 'Light (5-10 min)',
  moderate: 'Moderate (15-20 min)',
  deep: 'Deep (25-30 min)',
};

export default function AIStudyGenerationModal({
  circleId,
  intentions,
  onClose,
  onStudyCreated,
}: AIStudyGenerationModalProps) {
  const [duration, setDuration] = useState<7 | 21>(7);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStudy, setGeneratedStudy] = useState<GeneratedStudy | null>(null);
  const [error, setError] = useState('');
  const [isCreatingStudy, setIsCreatingStudy] = useState(false);

  // Calculate aggregated data
  const aggregatedData = calculateAggregatedData(intentions);

  async function handleGenerate() {
    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/ai/generate-collaborative-study', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          circleId,
          duration,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate study');
      }

      setGeneratedStudy(data.study);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleStartStudy() {
    if (!generatedStudy) return;

    setIsCreatingStudy(true);
    setError('');

    try {
      const response = await fetch(`/api/circles/${circleId}/studies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aiGenerated: true,
          generatedPlan: generatedStudy,
          duration,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create study');
      }

      onStudyCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsCreatingStudy(false);
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>

        {!generatedStudy ? (
          <>
            <h2 className={styles.modalTitle}>Generate Collaborative Study</h2>

            {/* Duration Selection */}
            <div className={styles.durationStep}>
              <h3>Choose Study Duration</h3>
              <div className={styles.durationOptions}>
                <button
                  className={`${styles.durationCard} ${
                    duration === 7 ? styles.selected : ''
                  }`}
                  onClick={() => setDuration(7)}
                >
                  <div className={styles.durationNumber}>7 Days</div>
                  <div className={styles.durationDesc}>One Week Journey</div>
                </button>
                <button
                  className={`${styles.durationCard} ${
                    duration === 21 ? styles.selected : ''
                  }`}
                  onClick={() => setDuration(21)}
                >
                  <div className={styles.durationNumber}>21 Days</div>
                  <div className={styles.durationDesc}>Three Week Deep Dive</div>
                </button>
              </div>
            </div>

            {/* Preview Aggregated Data */}
            <div className={styles.previewSection}>
              <h4>What the AI will consider:</h4>
              <div className={styles.aggregatedData}>
                <div className={styles.dataCard}>
                  <span className={styles.dataLabel}>Top Topics:</span>
                  <span className={styles.dataValue}>{aggregatedData.topicsText}</span>
                </div>
                <div className={styles.dataCard}>
                  <span className={styles.dataLabel}>Avg Depth:</span>
                  <span className={styles.dataValue}>
                    Level {aggregatedData.avgDepth}/10
                  </span>
                </div>
                <div className={styles.dataCard}>
                  <span className={styles.dataLabel}>Seasons:</span>
                  <span className={styles.dataValue}>{aggregatedData.seasonsText}</span>
                </div>
                <div className={styles.dataCard}>
                  <span className={styles.dataLabel}>Preferred Pace:</span>
                  <span className={styles.dataValue}>{aggregatedData.paceText}</span>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && <div className={styles.error}>{error}</div>}

            {/* Generate Button */}
            <button
              className={styles.generateButton}
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <span className={styles.spinner}></span>
                  Generating personalized study...
                </>
              ) : (
                'Generate Study with AI'
              )}
            </button>
          </>
        ) : (
          <>
            {/* Generated Study Preview */}
            <div className={styles.generatedPreview}>
              <h2 className={styles.studyTitle}>{generatedStudy.title}</h2>
              <p className={styles.description}>{generatedStudy.description}</p>

              {/* Show first day as preview */}
              <div className={styles.dayPreview}>
                <h4>Day 1: {generatedStudy.days[0].title}</h4>
                <div className={styles.versePreview}>
                  {generatedStudy.days[0].verseReference}
                </div>
                <p className={styles.contentPreview}>
                  {generatedStudy.days[0].content.substring(0, 250)}
                  {generatedStudy.days[0].content.length > 250 ? '...' : ''}
                </p>
              </div>

              {/* Error Message */}
              {error && <div className={styles.error}>{error}</div>}

              <div className={styles.previewActions}>
                <button
                  className={styles.regenerateButton}
                  onClick={handleGenerate}
                  disabled={isGenerating || isCreatingStudy}
                >
                  {isGenerating ? 'Regenerating...' : 'Regenerate'}
                </button>
                <button
                  className={styles.startStudyButton}
                  onClick={handleStartStudy}
                  disabled={isGenerating || isCreatingStudy}
                >
                  {isCreatingStudy ? 'Starting Study...' : 'Start This Study'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function calculateAggregatedData(intentions: Intention[]) {
  // Aggregate topics
  const topicCounts: Record<string, number> = {};
  intentions.forEach((intention) => {
    intention.selectedTopics.forEach((topic) => {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });
  });

  const sortedTopics = Object.entries(topicCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([topic, count]) => `${TOPIC_LABELS[topic]} (${count})`);

  // Average depth
  const avgDepth = Math.round(
    intentions.reduce((sum, i) => sum + i.depthLevel, 0) / intentions.length
  );

  // Aggregate seasons
  const seasonCounts: Record<string, number> = {};
  intentions.forEach((intention) => {
    seasonCounts[intention.currentSeason] =
      (seasonCounts[intention.currentSeason] || 0) + 1;
  });

  const sortedSeasons = Object.entries(seasonCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([season, count]) => `${SEASON_LABELS[season]} (${count})`);

  // Aggregate pace
  const paceCounts: Record<string, number> = {};
  intentions.forEach((intention) => {
    paceCounts[intention.studyPace] = (paceCounts[intention.studyPace] || 0) + 1;
  });

  const mostCommonPace = Object.entries(paceCounts).sort(([, a], [, b]) => b - a)[0][0];

  return {
    topicsText: sortedTopics.join(', '),
    avgDepth,
    seasonsText: sortedSeasons.join(', '),
    paceText: PACE_LABELS[mostCommonPace],
  };
}
