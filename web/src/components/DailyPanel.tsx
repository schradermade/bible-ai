'use client';

import styles from './daily-panel.module.css';

interface DailyPanelProps {
  content?: {
    title: string;
    date: string;
    scripture: {
      reference: string;
      text: string;
    };
    reflection: string;
    prayer: string;
    actionStep: string;
  };
  isPreview?: boolean;
}

export default function DailyPanel({ content, isPreview = false }: DailyPanelProps) {
  // Default content for demonstration
  const defaultContent = {
    title: 'Finding Peace in the Storm',
    date: new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    scripture: {
      reference: 'Philippians 4:6-7',
      text: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.',
    },
    reflection: 'When we face struggles—whether depression, anxiety, or uncertainty—God invites us to bring our burdens to Him. This passage reminds us that peace isn\'t found in the absence of problems, but in the presence of God. His peace transcends our understanding because it doesn\'t depend on our circumstances; it flows from His unchanging character and faithful promises.',
    prayer: 'Heavenly Father, thank You for inviting me to cast my anxieties upon You. Help me to trust in Your sovereignty and rest in Your peace. Guard my heart and mind as I navigate today\'s challenges. Amen.',
    actionStep: 'Take 5 minutes today to write down your worries, then intentionally pray through each one, releasing them to God.',
  };

  const displayContent = content || defaultContent;

  if (isPreview) {
    return (
      <div className={styles.dailyPreview}>
        <div className={styles.previewIcon}>🙏</div>
        <div className={styles.previewContent}>
          <div className={styles.previewLabel}>Today's Devotional</div>
          <div className={styles.previewScripture}>{displayContent.scripture.reference}</div>
          <div className={styles.previewTitle}>{displayContent.title}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dailyPanel}>
      <div className={styles.header}>
        <div className={styles.datebadge}>{displayContent.date}</div>
        <h3 className={styles.title}>{displayContent.title}</h3>
      </div>

      <div className={styles.scriptureSection}>
        <div className={styles.scriptureLabel}>Today's Scripture</div>
        <div className={styles.scriptureReference}>{displayContent.scripture.reference}</div>
        <p className={styles.scriptureText}>"{displayContent.scripture.text}"</p>
      </div>

      <div className={styles.reflectionSection}>
        <div className={styles.sectionLabel}>Reflection</div>
        <p className={styles.reflectionText}>{displayContent.reflection}</p>
      </div>

      <div className={styles.prayerSection}>
        <div className={styles.sectionLabel}>Prayer</div>
        <p className={styles.prayerText}>{displayContent.prayer}</p>
      </div>

      <div className={styles.actionSection}>
        <div className={styles.actionLabel}>Today's Action Step</div>
        <p className={styles.actionText}>{displayContent.actionStep}</p>
      </div>
    </div>
  );
}
