import React from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Target, TrendingUp } from '../../utils/icons';

/**
 * Format seconds to "Xh Ym" or "Ym Zs"
 */
function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

/**
 * Format meters to km with 1 decimal
 */
function formatDistance(meters) {
  if (!meters || meters <= 0) return '—';
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format m/s or km/h
 */
function formatSpeed(kmh) {
  if (!kmh || kmh <= 0) return '—';
  return `${kmh.toFixed(1)} km/h`;
}

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div style={{
    flex: '1 1 45%',
    background: 'var(--surface-subtle)',
    borderRadius: 'var(--radius-md)',
    padding: 'clamp(10px, 1.5vh, 16px)',
    border: '1px solid var(--border-subtle)',
    display: 'flex', flexDirection: 'column', gap: '4px',
    minWidth: '0',
    transition: 'all 0.2s ease'
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      color: 'var(--text-secondary)',
      fontSize: 'clamp(0.6rem, 1.2vh, 0.75rem)',
      fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px'
    }}>
      <Icon size={13} color={color || 'var(--accent-glow)'} />
      {label}
    </div>
    <div style={{
      fontSize: 'clamp(1rem, 2.2vh, 1.4rem)',
      fontWeight: '800',
      color: 'var(--text-primary)',
      lineHeight: 1.1
    }}>
      {value}
    </div>
  </div>
);

export const CardioLastSession = React.memo(({ session }) => {
  const { t } = useTranslation();

  if (!session) return null;

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        fontSize: 'clamp(0.7rem, 1.4vh, 0.85rem)',
        color: 'var(--text-secondary)', fontWeight: '600',
        textTransform: 'uppercase', letterSpacing: '1.5px',
        marginBottom: '10px'
      }}>
        {t('cardio.lastSession')}
      </div>

      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '8px',
        width: '100%'
      }}>
        <StatCard
          icon={Clock}
          label={t('cardio.duration')}
          value={formatDuration(session.duration)}
          color="#a78bfa"
        />
        <StatCard
          icon={Target}
          label={t('cardio.distance')}
          value={formatDistance(session.distance)}
          color="#8b5cf6"
        />
        <StatCard
          icon={TrendingUp}
          label={t('cardio.elevation')}
          value={session.elevationGain ? `+${session.elevationGain}m` : '—'}
          color="#6d28d9"
        />
        <StatCard
          icon={TrendingUp}
          label={t('cardio.avgSpeed')}
          value={formatSpeed(session.avgSpeed)}
          color="#c084fc"
        />
      </div>
    </div>
  );
});
