'use client';

import { useState, useEffect } from 'react';
import styles from './progress-heatmap.module.css';

interface DayProgress {
  dayNumber: number;
  completed: boolean;
  completedAt?: string | null;
  activityCount?: number;
}

interface MemberProgress {
  userId: string;
  userName: string;
  days: DayProgress[];
}

interface ProgressHeatmapProps {
  circleId: string;
  studyPlanId: string;
  totalDays: number;
}

export default function ProgressHeatmap({
  circleId,
  studyPlanId,
  totalDays,
}: ProgressHeatmapProps) {
  const [progress, setProgress] = useState<MemberProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{
    userId: string;
    dayNumber: number;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    fetchProgress();
  }, [circleId, studyPlanId]);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/circles/${circleId}/studies/${studyPlanId}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch progress');
      }

      // Transform the data into heatmap format
      const memberProgress: MemberProgress[] = data.studyPlan.memberPlans.map(
        (mp: any) => {
          const days: DayProgress[] = [];
          for (let i = 1; i <= totalDays; i++) {
            const day = mp.studyPlan.days.find((d: any) => d.dayNumber === i);
            days.push({
              dayNumber: i,
              completed: day?.completed || false,
              completedAt: day?.completedAt || null,
              activityCount: 0, // TODO: Add activity count from reflections/prayers/verses
            });
          }
          return {
            userId: mp.userId,
            userName: mp.userId.substring(0, 20),
            days,
          };
        }
      );

      setProgress(memberProgress);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch progress');
    } finally {
      setLoading(false);
    }
  };

  const handleCellHover = (
    userId: string,
    dayNumber: number,
    event: React.MouseEvent
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setHoveredCell({
      userId,
      dayNumber,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  const handleCellLeave = () => {
    setHoveredCell(null);
  };

  const getTooltipData = () => {
    if (!hoveredCell) return null;

    const member = progress.find((m) => m.userId === hoveredCell.userId);
    if (!member) return null;

    const day = member.days.find((d) => d.dayNumber === hoveredCell.dayNumber);
    if (!day) return null;

    return {
      userName: member.userName,
      day: day,
    };
  };

  const getCellClass = (day: DayProgress) => {
    if (!day.completed) return styles.cellEmpty;

    // Calculate how recent the completion was
    if (day.completedAt) {
      const completedDate = new Date(day.completedAt);
      const now = new Date();
      const hoursSince = (now.getTime() - completedDate.getTime()) / (1000 * 60 * 60);

      if (hoursSince < 24) return styles.cellLevel4; // Most recent
      if (hoursSince < 72) return styles.cellLevel3;
      if (hoursSince < 168) return styles.cellLevel2; // Within a week
      return styles.cellLevel1;
    }

    return styles.cellLevel1;
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return 'just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Progress Overview</h3>
        </div>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner} />
          <span>Loading heatmap...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Progress Overview</h3>
        </div>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  const tooltipData = getTooltipData();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Progress Overview</h3>
        <button className={styles.refreshButton} onClick={fetchProgress}>
          <svg viewBox="0 0 24 24" className={styles.refreshIcon}>
            <path
              d="M23 4v6h-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </button>
      </div>

      <div className={styles.heatmapWrapper}>
        <div className={styles.heatmap}>
          {/* Day headers */}
          <div className={styles.dayHeaders}>
            <div className={styles.cornerCell} />
            {Array.from({ length: totalDays }, (_, i) => (
              <div key={i} className={styles.dayHeader}>
                {i + 1}
              </div>
            ))}
          </div>

          {/* Member rows */}
          {progress.map((member) => (
            <div key={member.userId} className={styles.memberRow}>
              <div className={styles.memberLabel}>
                <div className={styles.memberAvatar}>
                  {member.userId.substring(0, 2).toUpperCase()}
                </div>
                <span className={styles.memberName}>{member.userName}</span>
              </div>
              <div className={styles.dayCells}>
                {member.days.map((day) => (
                  <div
                    key={day.dayNumber}
                    className={`${styles.cell} ${getCellClass(day)}`}
                    onMouseEnter={(e) =>
                      handleCellHover(member.userId, day.dayNumber, e)
                    }
                    onMouseLeave={handleCellLeave}
                  >
                    {day.completed && (
                      <svg viewBox="0 0 24 24" className={styles.checkmark}>
                        <path
                          d="M5 12l5 5L20 7"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <span className={styles.legendLabel}>Less</span>
        <div className={`${styles.legendCell} ${styles.cellEmpty}`} />
        <div className={`${styles.legendCell} ${styles.cellLevel1}`} />
        <div className={`${styles.legendCell} ${styles.cellLevel2}`} />
        <div className={`${styles.legendCell} ${styles.cellLevel3}`} />
        <div className={`${styles.legendCell} ${styles.cellLevel4}`} />
        <span className={styles.legendLabel}>More</span>
      </div>

      {/* Tooltip */}
      {hoveredCell && tooltipData && (
        <div
          className={styles.tooltip}
          style={{
            left: `${hoveredCell.x}px`,
            top: `${hoveredCell.y - 10}px`,
          }}
        >
          <div className={styles.tooltipContent}>
            <div className={styles.tooltipHeader}>
              <strong>{tooltipData.userName}</strong>
              <span> - Day {hoveredCell.dayNumber}</span>
            </div>
            {tooltipData.day.completed ? (
              <>
                <div className={styles.tooltipStatus}>
                  <span className={styles.tooltipStatusIcon}>✓</span>
                  Completed
                </div>
                {tooltipData.day.completedAt && (
                  <div className={styles.tooltipTime}>
                    {formatRelativeTime(tooltipData.day.completedAt)}
                  </div>
                )}
              </>
            ) : (
              <div className={styles.tooltipStatus}>
                <span className={styles.tooltipStatusIcon}>○</span>
                Not completed
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
