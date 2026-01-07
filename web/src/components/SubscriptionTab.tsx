'use client';

import { useEffect, useState } from 'react';
import styles from './subscription-tab.module.css';

type BillingStatus = {
  isActive: boolean;
  cancelAtPeriodEnd: boolean;
  usageCount: number;
  usageLimit: number;
  periodStart: string;
  periodEnd: string;
};

export default function SubscriptionTab() {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchBillingStatus();
  }, []);

  const fetchBillingStatus = async () => {
    try {
      const response = await fetch('/api/billing/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch billing status:', error);
    } finally {
      setLoading(false);
    }
  };

  const startCheckout = async () => {
    setActionLoading(true);
    try {
      const response = await fetch('/api/billing/checkout', { method: 'POST' });
      const payload = await response.json();
      if (payload?.url) {
        window.location.href = payload.url;
      }
    } finally {
      setActionLoading(false);
    }
  };

  const updateSubscription = async (action: 'cancel' | 'resume') => {
    setActionLoading(true);
    try {
      await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      await fetchBillingStatus();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading subscription details...</div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Unable to load subscription details.</div>
      </div>
    );
  }

  const usagePercent =
    status.usageLimit > 0
      ? Math.min(100, Math.round((status.usageCount / status.usageLimit) * 100))
      : 0;

  const periodStart = new Date(status.periodStart);
  const periodEnd = new Date(status.periodEnd);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Subscription</h2>
        <div className={styles.statusBadge}>
          {status.isActive ? (
            <span className={styles.statusActive}>Plus Active</span>
          ) : (
            <span className={styles.statusFree}>Free Plan</span>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.planCard}>
          <div className={styles.planHeader}>
            <h3 className={styles.planTitle}>
              {status.isActive ? 'Berea Study Plus' : 'Berea Study Free'}
            </h3>
            <div className={styles.planPrice}>
              {status.isActive ? '$8/mo' : '$0'}
            </div>
          </div>
          <ul className={styles.planFeatures}>
            {status.isActive ? (
              <>
                <li>100 AI insights per month</li>
                <li>Save and revisit every insight</li>
                <li>Priority processing and support</li>
              </>
            ) : (
              <>
                <li>10 AI insights per month</li>
                <li>Session-based responses</li>
                <li>Community-grade support</li>
              </>
            )}
          </ul>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.usageCard}>
          <div className={styles.usageHeader}>
            <div>
              <h3 className={styles.usageTitle}>Monthly Usage</h3>
              <p className={styles.period}>
                {periodStart.toLocaleDateString()} – {periodEnd.toLocaleDateString()}
              </p>
            </div>
            <div className={styles.usageCount}>
              {status.usageCount}/{status.usageLimit}
            </div>
          </div>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          <p className={styles.progressLabel}>{usagePercent}% of monthly limit</p>
        </div>
      </div>

      {status.isActive && status.cancelAtPeriodEnd && (
        <div className={styles.notice}>
          Your subscription will cancel at the end of the current billing period.
        </div>
      )}

      <div className={styles.actions}>
        {!status.isActive ? (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={startCheckout}
            disabled={actionLoading}
          >
            {actionLoading ? 'Redirecting...' : 'Upgrade to Plus'}
          </button>
        ) : status.cancelAtPeriodEnd ? (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => updateSubscription('resume')}
            disabled={actionLoading}
          >
            {actionLoading ? 'Working...' : 'Resume Subscription'}
          </button>
        ) : (
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => updateSubscription('cancel')}
            disabled={actionLoading}
          >
            {actionLoading ? 'Working...' : 'Cancel Subscription'}
          </button>
        )}
      </div>
    </div>
  );
}
