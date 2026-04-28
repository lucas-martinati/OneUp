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
            / {goal.toFixed(1)} km
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

      {/* Difficulty Mismatch Alert */}
      {isDifficultyMismatch && (
        <div className="fade-in" style={{
          padding: 'clamp(12px, 1.8vh, 16px)',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.05))',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 0 20px rgba(139, 92, 246, 0.05)',
          animation: 'slideUp 0.4s ease-out'
        }}>
          <div style={{
            fontSize: '0.8rem',
            color: 'var(--text-primary)',
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ 
              fontSize: '1rem', 
              filter: 'drop-shadow(0 0 8px var(--accent-glow))',
              animation: 'pulse 2s infinite' 
            }}>⚙️</span>
            {t('cardio.difficultyModified')}
          </div>
          <div style={{
            fontSize: '0.7rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.5',
            opacity: 0.9
          }}>
            {t('cardio.difficultyMismatchDesc', { saved: savedDifficulty, current: currentDifficulty })}
          </div>
          <button
            onClick={onInvalidate}
            className="hover-lift"
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--gradient-glow)',
              color: 'white',
              border: 'none',
              fontSize: '0.7rem',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
              alignSelf: 'flex-start',
              transition: 'all 0.2s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            {t('cardio.revalidate')}
          </button>
        </div>
      )}
    </div>
  );
});
