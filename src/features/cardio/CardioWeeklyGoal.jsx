import React from 'react';
import { useTranslation } from 'react-i18next';
import { LevelEmblem } from '@components/ui/LevelEmblem';
import { getLevelForCount } from '@shared/exerciseLevels.js';

export const CardioWeeklyGoal = React.memo(({ distance, goal, weekNumber }) => {
  const { t } = useTranslation();
  const count = Math.floor(distance * 1000);
  const target = Math.ceil(goal * 1000);
  const level = getLevelForCount(count, target);
  const progress = goal > 0 ? Math.min(100, Math.max(0, distance / goal * 100)) : 0;
  const isComplete = goal > 0 && distance >= goal;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'clamp(4px, 0.8vh, 8px)', flexShrink: 0 }}>
      <div style={{ width: '100%' }}>
        {/* Label row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          marginBottom: 'clamp(3px, 0.6vh, 6px)'
        }}>
          <span style={{
            fontSize: 'clamp(0.72rem, 1.5vh, 0.88rem)',
            color: 'var(--text-secondary)', fontWeight: '700',
            textTransform: 'uppercase', letterSpacing: '1.5px'
          }}>
            {t('cardio.weeklyGoal')}
          </span>
          <span style={{
            fontSize: 'clamp(0.65rem, 1.3vh, 0.75rem)',
            color: 'var(--text-secondary)', opacity: 0.7, fontWeight: '600'
          }}>
            {t('common.weeksAbbr')} {weekNumber}
          </span>
        </div>

        {/* Big distance number */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '6px', marginBottom: 'clamp(4px, 0.8vh, 8px)'
        }}>
          <span style={{
            fontSize: 'clamp(1.6rem, 3.6vh, 2.5rem)',
            fontWeight: '800',
            color: isComplete ? 'var(--success)' : 'var(--text-primary)',
            lineHeight: 1,
            transition: 'color 0.3s ease'
          }}>
            {distance.toFixed(1)}
          </span>
          <span style={{
            fontSize: 'clamp(0.9rem, 2vh, 1.2rem)',
            fontWeight: '700',
            color: 'var(--text-secondary)',
            opacity: 0.85
          }}>
            / {goal.toFixed(1)} {t('cardio.units.km')}
          </span>
          <LevelEmblem level={level} size={28} />
        </div>

        {/* Progress bar */}
        <div role="progressbar" aria-label={t('levels.progress')} aria-valuemin={0} aria-valuemax={10} aria-valuenow={level}
          style={{ width: '100%', height: '8px', borderRadius: 'var(--radius-full)', background: 'var(--progress-track)', overflow: 'hidden',
            maskImage: 'repeating-linear-gradient(to right, #000 0, #000 calc(10% - 2px), transparent calc(10% - 2px), transparent 10%)' }}>
          <div className="cardio-progress-fill" style={{ width: `${progress}%`, height: '100%', borderRadius: 'inherit',
            background: isComplete ? 'linear-gradient(90deg, var(--success), #34d399)' : 'var(--gradient-glow)',
            transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: isComplete ? '0 0 12px rgba(16, 185, 129, 0.5)' : '0 0 8px rgba(139, 92, 246, 0.4)' }} />
        </div>

        {isComplete && (
          <div className="scale-in" style={{
            marginTop: '6px',
            fontSize: 'clamp(0.65rem, 1.3vh, 0.8rem)',
            color: 'var(--success)',
            fontWeight: '700',
            display: 'flex', alignItems: 'center', gap: '4px'
          }}>
            ✓ {t('levels.complete')}
          </div>
        )}
      </div>
    </div>
  );
});
