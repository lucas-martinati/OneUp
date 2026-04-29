import React from 'react';
import { useTranslation } from 'react-i18next';

export const CardioWeeklyGoal = React.memo(({ 
  distance, goal, weekNumber, 
  isDifficultyMismatch, savedDifficulty, currentDifficulty, onInvalidate 
}) => {
  const { t } = useTranslation();
  const progress = goal > 0 ? Math.min((distance / goal) * 100, 100) : 0;
  const isComplete = distance >= goal;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ width: '100%' }}>
        {/* Label row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          marginBottom: '8px'
        }}>
          <span style={{
            fontSize: 'clamp(0.7rem, 1.4vh, 0.85rem)',
            color: 'var(--text-secondary)', fontWeight: '600',
            textTransform: 'uppercase', letterSpacing: '1.5px'
          }}>
            {t('cardio.weeklyGoal')}
          </span>
          <span style={{
            fontSize: 'clamp(0.6rem, 1.1vh, 0.7rem)',
            color: 'var(--text-secondary)', opacity: 0.6
          }}>
            {t('cardio.week')} {weekNumber}
          </span>
        </div>

        {/* Big distance number */}
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '10px'
        }}>
          <span style={{
            fontSize: 'clamp(1.6rem, 3.5vh, 2.4rem)',
            fontWeight: '800',
            color: isComplete ? 'var(--success)' : 'var(--text-primary)',
            lineHeight: 1,
            transition: 'color 0.3s ease'
          }}>
            {distance.toFixed(1)}
          </span>
          <span style={{
            fontSize: 'clamp(0.85rem, 1.8vh, 1.1rem)',
            fontWeight: '600',
            color: 'var(--text-secondary)',
            opacity: 0.8
          }}>
            / {goal.toFixed(1)} {t('cardio.units.km')}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{
          width: '100%', height: '8px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--progress-track)',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div
            className="cardio-progress-fill"
            style={{
              width: `${progress}%`,
              height: '100%',
              borderRadius: 'var(--radius-full)',
              background: isComplete
                ? 'linear-gradient(90deg, var(--success), #34d399)'
                : 'var(--gradient-glow)',
              transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: isComplete
                ? '0 0 12px rgba(16, 185, 129, 0.5)'
                : '0 0 8px rgba(139, 92, 246, 0.4)',
            }}
          />
        </div>

        {/* Difficulty Mismatch Alert - Integrated between progress and map */}
        {isDifficultyMismatch && (
          <div className="fade-in" style={{
            marginTop: '12px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(139, 92, 246, 0.08)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Accent side border */}
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px',
              background: 'var(--gradient-glow)'
            }} />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
              <span style={{ 
                fontSize: '1.1rem', 
                filter: 'drop-shadow(0 0 8px var(--accent-glow))',
                animation: 'pulse 2s infinite' 
              }}>⚙️</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ 
                  fontSize: '0.65rem', 
                  color: 'var(--text-primary)', 
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '1px'
                }}>
                  {t('cardio.difficultyModified')}
                </span>
                <span style={{ 
                  fontSize: '0.6rem', 
                  color: 'var(--text-secondary)',
                  lineHeight: '1.3',
                  opacity: 0.8
                }}>
                  {t('cardio.difficultyMismatchDesc', { saved: savedDifficulty, current: currentDifficulty })}
                </span>
              </div>
            </div>

            <button
              onClick={onInvalidate}
              className="hover-lift"
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--gradient-glow)',
                color: 'white',
                border: 'none',
                fontSize: '0.65rem',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
            >
              {t('cardio.revalidate')}
            </button>
          </div>
        )}

        {isComplete && !isDifficultyMismatch && (
          <div className="scale-in" style={{
            marginTop: '8px',
            fontSize: 'clamp(0.65rem, 1.3vh, 0.8rem)',
            color: 'var(--success)',
            fontWeight: '700',
            display: 'flex', alignItems: 'center', gap: '4px'
          }}>
            ✓ {t('cardio.goalReached')}
          </div>
        )}
      </div>
    </div>
  );
});
