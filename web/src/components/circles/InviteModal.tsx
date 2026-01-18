'use client';

import { useState } from 'react';
import styles from './invite-modal.module.css';

interface InviteModalProps {
  circleId: string;
  circleName: string;
  onClose: () => void;
  onInviteSent?: () => void;
}

export default function InviteModal({
  circleId,
  circleName,
  onClose,
  onInviteSent,
}: InviteModalProps) {
  const [invitationUrl, setInvitationUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [inviteMode, setInviteMode] = useState<'link' | 'email'>('email');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [invitationSent, setInvitationSent] = useState(false);

  const sendEmailInvitation = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (!firstName.trim()) {
      setError('Please enter their first name');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/circles/${circleId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          firstName: firstName.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send invitation');
      }

      setInvitationSent(true);
      setEmail('');
      setFirstName('');
      setTimeout(() => setInvitationSent(false), 3000);

      // Notify parent to refresh circle data
      if (onInviteSent) {
        onInviteSent();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to send invitation'
      );
    } finally {
      setLoading(false);
    }
  };

  const generateInvitation = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/circles/${circleId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create invitation');
      }

      setInvitationUrl(data.invitation.url);

      // Notify parent to refresh circle data
      if (onInviteSent) {
        onInviteSent();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create invitation'
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!invitationUrl) return;

    try {
      await navigator.clipboard.writeText(invitationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Invite Members</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.circleInfo}>
            <div className={styles.circleIcon}>👥</div>
            <div>
              <div className={styles.circleName}>{circleName}</div>
              <div className={styles.circleHint}>
                Invite members via email or shareable link
              </div>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className={styles.modeToggle}>
            <button
              className={`${styles.modeButton} ${inviteMode === 'email' ? styles.modeButtonActive : ''}`}
              onClick={() => setInviteMode('email')}
            >
              📧 Email Invitation
            </button>
            <button
              className={`${styles.modeButton} ${inviteMode === 'link' ? styles.modeButtonActive : ''}`}
              onClick={() => setInviteMode('link')}
            >
              🔗 Share Link
            </button>
          </div>

          {/* Email Invitation Mode */}
          {inviteMode === 'email' && (
            <div className={styles.emailSection}>
              <p className={styles.description}>
                Enter their first name and email address to send a direct invitation. They'll receive a personalized link to join {circleName}.
              </p>
              <div className={styles.emailForm}>
                <input
                  type="text"
                  className={styles.emailInput}
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={loading}
                />
                <input
                  type="email"
                  className={styles.emailInput}
                  placeholder="friend@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendEmailInvitation()}
                  disabled={loading}
                />
                <button
                  className={styles.sendButton}
                  onClick={sendEmailInvitation}
                  disabled={loading || !email.trim() || !firstName.trim()}
                >
                  {loading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
              {invitationSent && (
                <div className={styles.success}>
                  ✓ Invitation sent successfully!
                </div>
              )}
            </div>
          )}

          {/* Link Invitation Mode */}
          {inviteMode === 'link' && !invitationUrl && (
            <div className={styles.generateSection}>
              <p className={styles.description}>
                Generate a shareable invitation link that anyone can use to join
                your circle. The link will expire in 7 days.
              </p>
              <button
                className={styles.generateButton}
                onClick={generateInvitation}
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate Invitation Link'}
              </button>
            </div>
          )}

          {inviteMode === 'link' && invitationUrl && (
            <div className={styles.linkSection}>
              <label className={styles.label}>Invitation Link</label>
              <div className={styles.linkContainer}>
                <input
                  type="text"
                  className={styles.linkInput}
                  value={invitationUrl}
                  readOnly
                  onClick={(e) => e.currentTarget.select()}
                />
                <button
                  className={styles.copyButton}
                  onClick={copyToClipboard}
                >
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
              <div className={styles.hint}>
                This link expires in 7 days. Anyone with this link can join the
                circle.
              </div>
            </div>
          )}

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.info}>
            <div className={styles.infoIcon}>ℹ️</div>
            <div className={styles.infoText}>
              <strong>Privacy by default:</strong> New members will share their
              study progress by default, but reflections, verses, and prayers
              remain private until they choose to share.
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.doneButton} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
