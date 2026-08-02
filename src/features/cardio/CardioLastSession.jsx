import React from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Target, TrendingUp } from '@utils/icons';

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
function formatDistance(meters, t) {
  if (!meters || meters <= 0) return '—';
  return `${(meters / 1000).toFixed(1)} ${t('cardio.units.km')}`;
}

/**
 * Format m/s to either Pace (min/km) for running or Speed (km/h) for others
 */
function formatSpeed(speedMs, type, t) {
  if (!speedMs || speedMs <= 0) return '—';
  if (type === 'running') {
    const secondsPerKm = 1000 / speedMs;
    const mins = Math.floor(secondsPerKm / 60);
    const secs = Math.floor(secondsPerKm % 60);
    return `${mins}:${secs.toString().padStart(2, '0')} ${t('cardio.units.minKm')}`;
  }
  return `${(speedMs * 3.6).toFixed(1)} ${t('cardio.units.kmh')}`;
}

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div style={{
    flex: '1 1 calc(50% - 4px)',
    background: 'var(--surface-subtle)',
    borderRadius: 'var(--radius-md)',
    padding: 'clamp(6px, 1.2vh, 12px)',
    border: '1px solid var(--border-subtle)',
    display: 'flex', flexDirection: 'column', gap: '2px',
    minWidth: '0', flexShrink: 0,
    transition: 'background-color 0.2s ease, border-color 0.2s ease'
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      color: 'var(--text-secondary)',
      fontSize: 'clamp(0.65rem, 1.2vh, 0.78rem)',
      fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px'
    }}>
      <Icon size={14} color={color || 'var(--accent-glow)'} />
      {label}
    </div>
    <div style={{
      fontSize: 'clamp(0.95rem, 2vh, 1.35rem)',
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

  const speed = session.avgSpeed || session.averageSpeed || 0;
  const elevation = session.elevationGain || session.elevation || 0;

  return (
    <div style={{ width: '100%', flexShrink: 0 }}>
      <div style={{
        fontSize: 'clamp(0.72rem, 1.5vh, 0.88rem)',
        color: 'var(--text-secondary)', fontWeight: '700',
        textTransform: 'uppercase', letterSpacing: '1.5px',
        marginBottom: 'clamp(4px, 0.8vh, 8px)'
      }}>
        {t('cardio.lastSession')}
      </div>

      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '6px',
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
          value={formatDistance(session.distance, t)}
          color="#8b5cf6"
        />
        <StatCard
          icon={TrendingUp}
          label={t('cardio.elevation')}
          value={elevation > 0 ? `+${elevation}${t('cardio.units.m')}` : '—'}
          color="#6d28d9"
        />
        <StatCard
          icon={TrendingUp}
          label={session.type === 'running' ? t('cardio.pace') : t('cardio.avgSpeed')}
          value={formatSpeed(speed, session.type, t)}
          color="#c084fc"
        />
      </div>
    </div>
  );
});
