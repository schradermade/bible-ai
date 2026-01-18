'use client';

import { useState } from 'react';
import styles from './onboarding-modal.module.css';

interface OnboardingModalProps {
  isOpen: boolean;
  circleName: string;
  onComplete: (settings: {
    shareProgress: boolean;
    shareReflections: boolean;
    shareVerses: boolean;
    sharePrayers: boolean;
  }) => void;
  onSkip: () => void;
}

const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Study Circles!',
    icon: '🎉',
  },
  {
    id: 'concept',
    title: 'How Circles Work',
    icon: '📖',
  },
  {
    id: 'privacy',
    title: 'Your Privacy Settings',
    icon: '🔒',
  },
  {
    id: 'ready',
    title: "You're All Set!",
    icon: '✨',
  },
];

export default function OnboardingModal({
  isOpen,
  circleName,
  onComplete,
  onSkip,
}: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [settings, setSettings] = useState({
    shareProgress: true,
    shareReflections: false,
    shareVerses: false,
    sharePrayers: false,
  });

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(settings);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = STEPS[currentStep];

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Step indicators */}
        <div className={styles.stepIndicators}>
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`${styles.stepIndicator} ${
                index === currentStep ? styles.stepActive : ''
              } ${index < currentStep ? styles.stepCompleted : ''}`}
            >
              <div className={styles.stepDot} />
              {index < STEPS.length - 1 && <div className={styles.stepLine} />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className={styles.content}>
          <div className={styles.iconWrapper}>
            <span className={styles.icon}>{currentStepData.icon}</span>
          </div>

          <h2 className={styles.title}>{currentStepData.title}</h2>

          {/* Step 1: Welcome */}
          {currentStep === 0 && (
            <div className={styles.stepContent}>
              <p className={styles.description}>
                You've joined <strong>{circleName}</strong>! Study Circles let you
                share your Bible study journey with close friends and family.
              </p>
              <div className={styles.featureList}>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>✓</span>
                  <div>
                    <div className={styles.featureTitle}>Individual Progress</div>
                    <div className={styles.featureDescription}>
                      Complete your study plan on your own schedule
                    </div>
                  </div>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>✓</span>
                  <div>
                    <div className={styles.featureTitle}>Shared Context</div>
                    <div className={styles.featureDescription}>
                      See what others are learning and share your insights
                    </div>
                  </div>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>✓</span>
                  <div>
                    <div className={styles.featureTitle}>Privacy First</div>
                    <div className={styles.featureDescription}>
                      You control what you share with your circle
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Concept */}
          {currentStep === 1 && (
            <div className={styles.stepContent}>
              <p className={styles.description}>
                Study Circles support your personal journey while connecting you
                with others studying the same content.
              </p>
              <div className={styles.conceptCards}>
                <div className={styles.conceptCard}>
                  <div className={styles.conceptCardIcon}>📚</div>
                  <div className={styles.conceptCardTitle}>Your Study</div>
                  <div className={styles.conceptCardDescription}>
                    Read Scripture, reflect, and progress through your personal study
                    plan
                  </div>
                </div>
                <div className={styles.conceptCard}>
                  <div className={styles.conceptCardIcon}>👥</div>
                  <div className={styles.conceptCardTitle}>Circle Activity</div>
                  <div className={styles.conceptCardDescription}>
                    Share reflections, pray for each other, and celebrate progress
                    together
                  </div>
                </div>
              </div>
              <div className={styles.note}>
                <strong>Remember:</strong> Everyone progresses at their own pace.
                There's no pressure to keep up or compete.
              </div>
            </div>
          )}

          {/* Step 3: Privacy */}
          {currentStep === 2 && (
            <div className={styles.stepContent}>
              <p className={styles.description}>
                Choose what you'd like to share with your circle. You can change
                these settings anytime.
              </p>
              <div className={styles.privacySettings}>
                <label className={styles.privacySetting}>
                  <div className={styles.privacyInfo}>
                    <div className={styles.privacyLabel}>
                      <span className={styles.privacyIcon}>📊</span>
                      Share my progress
                    </div>
                    <div className={styles.privacyDescription}>
                      Let members see which days I've completed
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.shareProgress}
                    onChange={(e) =>
                      setSettings({ ...settings, shareProgress: e.target.checked })
                    }
                    className={styles.checkbox}
                  />
                </label>

                <label className={styles.privacySetting}>
                  <div className={styles.privacyInfo}>
                    <div className={styles.privacyLabel}>
                      <span className={styles.privacyIcon}>💭</span>
                      Share my reflections
                    </div>
                    <div className={styles.privacyDescription}>
                      Allow others to see my personal reflections
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.shareReflections}
                    onChange={(e) =>
                      setSettings({ ...settings, shareReflections: e.target.checked })
                    }
                    className={styles.checkbox}
                  />
                </label>

                <label className={styles.privacySetting}>
                  <div className={styles.privacyInfo}>
                    <div className={styles.privacyLabel}>
                      <span className={styles.privacyIcon}>📖</span>
                      Share verses I save
                    </div>
                    <div className={styles.privacyDescription}>
                      Share meaningful verses with the circle
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.shareVerses}
                    onChange={(e) =>
                      setSettings({ ...settings, shareVerses: e.target.checked })
                    }
                    className={styles.checkbox}
                  />
                </label>

                <label className={styles.privacySetting}>
                  <div className={styles.privacyInfo}>
                    <div className={styles.privacyLabel}>
                      <span className={styles.privacyIcon}>🙏</span>
                      Share my prayer requests
                    </div>
                    <div className={styles.privacyDescription}>
                      Let the circle pray for my needs
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.sharePrayers}
                    onChange={(e) =>
                      setSettings({ ...settings, sharePrayers: e.target.checked })
                    }
                    className={styles.checkbox}
                  />
                </label>
              </div>
            </div>
          )}

          {/* Step 4: Ready */}
          {currentStep === 3 && (
            <div className={styles.stepContent}>
              <p className={styles.description}>
                You're ready to start your journey with {circleName}!
              </p>
              <div className={styles.readyCard}>
                <div className={styles.readyCardIcon}>🎯</div>
                <div className={styles.readyCardTitle}>Next Steps</div>
                <div className={styles.readyCardList}>
                  <div className={styles.readyCardItem}>
                    1. Start or join a study plan with your circle
                  </div>
                  <div className={styles.readyCardItem}>
                    2. Progress through your study at your own pace
                  </div>
                  <div className={styles.readyCardItem}>
                    3. Share insights and support circle members
                  </div>
                </div>
              </div>
              <div className={styles.encouragement}>
                <strong>Remember:</strong> Study Circles are about mutual
                encouragement and Scripture-centered community. Take it one day at a
                time!
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          {currentStep > 0 && (
            <button className={styles.backButton} onClick={handleBack}>
              ← Back
            </button>
          )}
          <button className={styles.skipButton} onClick={onSkip}>
            Skip
          </button>
          <button className={styles.nextButton} onClick={handleNext}>
            {currentStep === STEPS.length - 1 ? "Let's Go!" : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
