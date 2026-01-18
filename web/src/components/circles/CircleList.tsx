'use client';

import { useState, useEffect } from 'react';
import styles from './circle-list.module.css';
import CreateCircleModal from './CreateCircleModal';

interface Circle {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count: {
    members: number;
    plans: number;
  };
  members: Array<{
    userId: string;
    role: string;
  }>;
  plans: Array<{
    id: string;
    title: string;
    duration: number;
    startDate: string;
    status: string;
  }>;
}

export default function CircleList() {
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchCircles();
  }, []);

  const fetchCircles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/circles');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch circles');
      }

      setCircles(data.circles || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch circles');
    } finally {
      setLoading(false);
    }
  };

  const handleCircleCreated = (newCircle: Circle) => {
    setCircles((prev) => [newCircle, ...prev]);
    setShowCreateModal(false);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading circles...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Study Circles</h1>
        <button
          className={styles.createButton}
          onClick={() => setShowCreateModal(true)}
        >
          + Create Circle
        </button>
      </div>

      {circles.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>⭕</div>
          <h2 className={styles.emptyTitle}>No circles yet</h2>
          <p className={styles.emptyDescription}>
            Create your first study circle to invite friends and study the Bible
            together.
          </p>
          <button
            className={styles.emptyCreateButton}
            onClick={() => setShowCreateModal(true)}
          >
            Create Your First Circle
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {circles.map((circle) => (
            <a
              key={circle.id}
              href={`/circles/${circle.id}`}
              className={styles.card}
            >
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{circle.name}</h3>
                <div className={styles.memberCount}>
                  👥 {circle._count.members} {circle._count.members === 1 ? 'member' : 'members'}
                </div>
              </div>

              {circle.description && (
                <p className={styles.cardDescription}>{circle.description}</p>
              )}

              <div className={styles.cardMeta}>
                {(() => {
                  const activePlan = circle.plans?.find((p) => p.status === 'active');
                  return activePlan ? (
                    <div className={styles.currentStudy}>
                      <span className={styles.studyLabel}>Currently studying:</span>
                      <span className={styles.studyName}>
                        {activePlan.title.replace(/^\d+-Day (Journey|Deep Dive): /, '')}
                      </span>
                      <span className={styles.studyDuration}>
                        ({activePlan.duration} days)
                      </span>
                    </div>
                  ) : (
                    <div className={styles.noStudy}>
                      No active study • Ready for a new journey
                    </div>
                  );
                })()}
              </div>
            </a>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateCircleModal
          onClose={() => setShowCreateModal(false)}
          onCircleCreated={handleCircleCreated}
        />
      )}
    </div>
  );
}
