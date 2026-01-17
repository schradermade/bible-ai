'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './invitation-accept.module.css';

interface Invitation {
  id: string;
  circleId: string;
  expiresAt: string;
  circle: {
    id: string;
    name: string;
    description: string | null;
    maxMembers: number;
    _count: {
      members: number;
    };
  };
}

interface InvitationAcceptProps {
  token: string;
}

export default function InvitationAccept({ token }: InvitationAcceptProps) {
  const router = useRouter();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInvitation();
  }, [token]);

  const fetchInvitation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invitations/${token}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch invitation');
      }

      setInvitation(data.invitation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      setAccepting(true);
      setError(null);

      const response = await fetch(`/api/invitations/${token}/accept`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to accept invitation');
      }

      // Redirect to the circle
      router.push(`/circles/${data.circleId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    try {
      setAccepting(true);
      setError(null);

      const response = await fetch(`/api/invitations/${token}/decline`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to decline invitation');
      }

      // Redirect to circles list
      router.push('/circles');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline invitation');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading invitation...</div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon}>⚠️</div>
          <h1 className={styles.errorTitle}>Invitation Not Available</h1>
          <p className={styles.errorMessage}>
            {error || 'This invitation is no longer valid.'}
          </p>
          <a href="/circles" className={styles.homeLink}>
            Go to Circles
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.icon}>⭕</div>
          <h1 className={styles.title}>You're Invited!</h1>
        </div>

        <div className={styles.circleInfo}>
          <h2 className={styles.circleName}>{invitation.circle.name}</h2>
          {invitation.circle.description && (
            <p className={styles.circleDescription}>
              {invitation.circle.description}
            </p>
          )}
          <div className={styles.circleMeta}>
            {invitation.circle._count.members} of {invitation.circle.maxMembers}{' '}
            members
          </div>
        </div>

        <div className={styles.info}>
          <h3 className={styles.infoTitle}>What is a Study Circle?</h3>
          <p className={styles.infoText}>
            Study Circles are small groups (2-8 people) that study the Bible
            together. Each member progresses through their own study plan while
            sharing progress, insights, and encouragement.
          </p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.actions}>
          <button
            className={styles.declineButton}
            onClick={handleDecline}
            disabled={accepting}
          >
            Decline
          </button>
          <button
            className={styles.acceptButton}
            onClick={handleAccept}
            disabled={accepting}
          >
            {accepting ? 'Accepting...' : 'Accept Invitation'}
          </button>
        </div>

        <div className={styles.footer}>
          <div className={styles.footerIcon}>🔒</div>
          <div className={styles.footerText}>
            Your reflections, verses, and prayers remain private by default. You
            choose what to share with your circle.
          </div>
        </div>
      </div>
    </div>
  );
}
