import React from 'react';
import { useTranslation } from 'react-i18next';
import { Flame } from '@utils/icons';

export const CardioStreak = React.memo(({ streak }) => {
  const { t } = useTranslation();
  const isActive = streak > 0;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: 'clamp(8px, 1.2vh, 14px) clamp(12px, 2vw, 18px)',
      borderRadius: 'var(--radius-md)',
      background: isActive
        ? 'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(239,68,68,0.08))'
        : 'var(--surface-subtle)',
      border: isActive
        ? '1px solid rgba(249,115,22,0.2)'
        : '1px solid var(--border-subtle)',
      transition: 'all 0.3s ease',
      width: '100%',
    }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%',
        background: isActive
          ? 'linear-gradient(135deg, rgba(249,115,22,0.25), rgba(239,68,68,0.25))'
          : 'var(--surface-muted)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0
      }}>
        <Flame
          size={18}
          color={isActive ? '#f97316' : 'var(--text-secondary)'}
          style={{ opacity: isActive ? 1 : 0.4 }}
        />
      </div>

      <div className="flex-1-min0">
        <div style={{
          fontSize: 'clamp(0.65rem, 1.2vh, 0.8rem)',
          color: 'var(--text-secondary)', fontWeight: '600',
          textTransform: 'uppercase', letterSpacing: '1px',
          marginBottom: '2px'
        }}>
          {t('cardio.streak')}
        </div>
        <div style={{
          fontSize: 'clamp(1.1rem, 2.4vh, 1.5rem)',
          fontWeight: '800',
          color: isActive ? '#f97316' : 'var(--text-secondary)',
          lineHeight: 1
        }}>
          {streak} <span style={{
            fontSize: 'clamp(0.65rem, 1.2vh, 0.8rem)',
            fontWeight: '600', opacity: 0.7
          }}>{t('cardio.streakWeeks')}</span>
        </div>
      </div>
    </div>
  );
});
