'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import styles from './privacy-settings-modal.module.css';

interface PrivacySettings {
  shareProgress: boolean;
  shareReflections: boolean;
  shareVerses: boolean;
  sharePrayers: boolean;
}

interface PrivacySettingsModalProps {
  circleId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export default function PrivacySettingsModal({
  circleId,
  isOpen,
  onClose,
  onUpdate,
}: PrivacySettingsModalProps) {
  const { user } = useUser();
  const [settings, setSettings] = useState<PrivacySettings>({
    shareProgress: true,
    shareReflections: false,
    shareVerses: false,
    sharePrayers: false,
  });
  const [originalSettings, setOriginalSettings] = useState<PrivacySettings>({
    shareProgress: true,
    shareReflections: false,
    shareVerses: false,
    sharePrayers: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen, circleId]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/circles/${circleId}/members/${user?.id}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch settings');
      }

      const memberSettings = {
        shareProgress: data.member.shareProgress,
        shareReflections: data.member.shareReflections,
        shareVerses: data.member.shareVerses,
        sharePrayers: data.member.sharePrayers,
      };

      setSettings(memberSettings);
      setOriginalSettings(memberSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch(
        `/api/circles/${circleId}/members/${user?.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update settings');
      }

      setOriginalSettings(settings);
      onUpdate?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setSettings(originalSettings);
    setError(null);
    onClose();
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Privacy Settings</h2>
            <p className={styles.subtitle}>
              Control what you share with your circle
            </p>
          </div>
          <button className={styles.closeButton} onClick={handleCancel}>
            <svg viewBox="0 0 24 24" className={styles.closeIcon}>
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.loadingSpinner} />
            <span>Loading settings...</span>
          </div>
        ) : (
          <>
            <div className={styles.content}>
              <div className={styles.settingGroup}>
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <div className={styles.settingHeader}>
                      <span className={styles.settingIcon}>📊</span>
                      <div>
                        <div className={styles.settingLabel}>Share Progress</div>
                        <div className={styles.settingDescription}>
                          Let members see which days you've completed
                        </div>
                      </div>
                    </div>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={settings.shareProgress}
                      onChange={(e) =>
                        setSettings({ ...settings, shareProgress: e.target.checked })
                      }
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <div className={styles.settingHeader}>
                      <span className={styles.settingIcon}>💭</span>
                      <div>
                        <div className={styles.settingLabel}>Share Reflections</div>
                        <div className={styles.settingDescription}>
                          Allow others to see your personal reflections
                        </div>
                      </div>
                    </div>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={settings.shareReflections}
                      onChange={(e) =>
                        setSettings({ ...settings, shareReflections: e.target.checked })
                      }
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <div className={styles.settingHeader}>
                      <span className={styles.settingIcon}>📖</span>
                      <div>
                        <div className={styles.settingLabel}>Share Verses</div>
                        <div className={styles.settingDescription}>
                          Share verses you save with your circle
                        </div>
                      </div>
                    </div>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={settings.shareVerses}
                      onChange={(e) =>
                        setSettings({ ...settings, shareVerses: e.target.checked })
                      }
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <div className={styles.settingHeader}>
                      <span className={styles.settingIcon}>🙏</span>
                      <div>
                        <div className={styles.settingLabel}>Share Prayers</div>
                        <div className={styles.settingDescription}>
                          Share your prayer requests with the circle
                        </div>
                      </div>
                    </div>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={settings.sharePrayers}
                      onChange={(e) =>
                        setSettings({ ...settings, sharePrayers: e.target.checked })
                      }
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>
              </div>

              <div className={styles.preview}>
                <div className={styles.previewHeader}>
                  <svg viewBox="0 0 24 24" className={styles.previewIcon}>
                    <path
                      d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                  <span className={styles.previewTitle}>What others see</span>
                </div>
                <div className={styles.previewContent}>
                  {settings.shareProgress && (
                    <div className={styles.previewItem}>
                      <span className={styles.previewItemIcon}>✓</span>
                      <span>Your study progress and completion status</span>
                    </div>
                  )}
                  {settings.shareReflections && (
                    <div className={styles.previewItem}>
                      <span className={styles.previewItemIcon}>✓</span>
                      <span>Your reflections and insights</span>
                    </div>
                  )}
                  {settings.shareVerses && (
                    <div className={styles.previewItem}>
                      <span className={styles.previewItemIcon}>✓</span>
                      <span>Verses you save and share</span>
                    </div>
                  )}
                  {settings.sharePrayers && (
                    <div className={styles.previewItem}>
                      <span className={styles.previewItemIcon}>✓</span>
                      <span>Your prayer requests</span>
                    </div>
                  )}
                  {!settings.shareProgress &&
                    !settings.shareReflections &&
                    !settings.shareVerses &&
                    !settings.sharePrayers && (
                      <div className={styles.previewEmpty}>
                        Others won't see any of your activity
                      </div>
                    )}
                </div>
              </div>
            </div>

            <div className={styles.footer}>
              <button
                className={styles.cancelButton}
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className={styles.saveButton}
                onClick={handleSave}
                disabled={saving || !hasChanges}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
