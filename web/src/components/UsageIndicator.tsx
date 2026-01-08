'use client';

import { useEffect, useState } from 'react';
import styles from './usage-indicator.module.css';

interface UsageData {
  used: number;
  limit: number;
  remaining: number;
  isSubscribed: boolean;
}

export default function UsageIndicator() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/usage');
      if (response.ok) {
        const data = await response.json();
        setUsage(data);
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !usage) {
    return null;
  }

  const percentageUsed = (usage.used / usage.limit) * 100;
  const isNearLimit = percentageUsed >= 80;
  const isAtLimit = usage.remaining === 0;

  return (
    <div className={`${styles.usageIndicator} ${isNearLimit ? styles.warning : ''}`}>
      <div className={styles.usageHeader}>
        <span className={styles.usageLabel}>
          {isAtLimit ? 'Limit Reached' : 'AI Searches'}
        </span>
        <span className={styles.usageCount}>
          {usage.remaining} of {usage.limit} remaining
        </span>
      </div>
      <div className={styles.progressBar}>
        <div
          className={`${styles.progressFill} ${isAtLimit ? styles.progressAtLimit : ''} ${isNearLimit && !isAtLimit ? styles.progressNearLimit : ''}`}
          style={{ width: `${percentageUsed}%` }}
        />
      </div>
      {isAtLimit && !usage.isSubscribed && (
        <div className={styles.upgradePrompt}>
          <span>Upgrade to continue using AI insights</span>
        </div>
      )}
      {isNearLimit && !isAtLimit && (
        <div className={styles.warningText}>
          {usage.isSubscribed
            ? `${usage.remaining} searches left this month`
            : `Upgrade for ${100 - usage.limit} more searches per month`}
        </div>
      )}
    </div>
  );
}
