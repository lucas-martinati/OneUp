import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import 'leaflet/dist/leaflet.css';
import { X, Clock, Target, TrendingUp, Gauge, ChevronDown, Activity } from '@utils/icons';
import { updateCardioSessionName } from '@services/cardioService';
import { IconButton, InlineNameEditor } from '@components/ui';
import { useBackHandler } from '@hooks/useBackHandler';
import { CardioMap } from './CardioMap';
import { CardioFullscreenMap } from './CardioFullscreenMap';
import { parseTimestamp } from '@shared/dateUtils';

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h${m.toString().padStart(2, '0')}`;
  return `${m}min`;
}

function formatDate(timestamp, lang) {
  if (!timestamp) return '—';
  const d = parseTimestamp(timestamp);
  return d.toLocaleDateString(lang || undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Pace (min/km) for running, speed (km/h) otherwise. averageSpeed is in m/s. */
function formatSpeed(speedMs, type) {
  if (!speedMs || speedMs <= 0) return '—';
  if (type === 'running') {
    const secondsPerKm = 1000 / speedMs;
    const mins = Math.floor(secondsPerKm / 60);
    const secs = Math.floor(secondsPerKm % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  return (speedMs * 3.6).toFixed(1);
}

function getSpeed(session) {
  return session.averageSpeed || session.avgSpeed || 0;
}

function getElevation(session) {
  return session.elevation || session.elevationGain || 0;
}

const StatChip = ({ icon: Icon, label, value, unit }) => (
  <div className="cardio-stat-chip">
    <div className="cardio-stat-chip-label">
      <Icon size={12} color="var(--accent-glow)" />
      {label}
    </div>
    <div className="cardio-stat-chip-value">
      {value}{unit && value !== '—' && <span style={{ fontSize: '0.7em', fontWeight: 700, color: 'var(--text-secondary)', marginLeft: '2px' }}>{unit}</span>}
    </div>
  </div>
);

function SessionCard({ session, mode, t, lang }) {
  const [expanded, setExpanded] = useState(false);
  const [overrideName, setOverrideName] = useState(undefined);
  
  const hasGps = session.gpsTrack && session.gpsTrack.length > 1;
  const type = session.type || mode;
  const speed = getSpeed(session);
  const elevation = getElevation(session);
  
  const currentName = overrideName !== undefined ? overrideName : session.name;
  const defaultTitle = type === 'running' ? t('exercises.running') : t('exercises.cycling');

  const handleSaveName = async (newName) => {
    const finalName = newName || null;
    if (finalName !== currentName) {
      setOverrideName(finalName);
      await updateCardioSessionName(session.id, finalName);
    }
  };

  return (
    <div
      onClick={() => hasGps && setExpanded(!expanded)}
      className={`cardio-session-card hover-lift${hasGps ? ' is-tappable' : ''}${expanded ? ' is-open' : ''}`}
    >
      {/* Header row */}
      <div style={{
        padding: 'clamp(12px, 1.6vh, 16px)',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: 'var(--radius-md)',
          background: 'var(--gradient-glow)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.25rem', flexShrink: 0,
          boxShadow: '0 4px 14px rgba(139,92,246,0.28)',
        }}>
          {type === 'running' ? '🏃' : '🚴'}
        </div>

        <div className="flex-1-min0">
          <div style={{ marginBottom: '2px' }}>
            <InlineNameEditor
              value={currentName}
              onSave={handleSaveName}
              emptyLabel={defaultTitle}
              placeholder={defaultTitle}
              textStyle={{ fontSize: 'clamp(0.82rem, 1.55vh, 0.98rem)' }}
              iconSize={12}
              showAddButton={false}
            />
          </div>
          <div style={{
            fontSize: 'clamp(0.65rem, 1.2vh, 0.78rem)',
            color: 'var(--text-secondary)',
            fontWeight: '500',
          }}>
            {formatDate(session.startTime, lang)}
          </div>
        </div>

        {hasGps && (
          <div className="cardio-session-chevron">
            <ChevronDown size={16} />
          </div>
        )}
      </div>

      {/* Stats row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${elevation > 0 ? 4 : 3}, 1fr)`,
        gap: '8px',
        padding: '0 clamp(12px, 1.6vh, 16px) clamp(12px, 1.6vh, 16px)',
      }}>
        <StatChip
          icon={Target}
          label={t('cardio.distance')}
          value={session.distance ? (session.distance / 1000).toFixed(1) : '—'}
          unit={t('cardio.units.km')}
        />
        <StatChip
          icon={Clock}
          label={t('cardio.duration')}
          value={formatDuration(session.duration)}
        />
        <StatChip
          icon={type === 'running' ? Activity : Gauge}
          label={type === 'running' ? t('cardio.pace') : t('cardio.avgSpeed')}
          value={formatSpeed(speed, type)}
          unit={type === 'running' ? t('cardio.units.minKm') : t('cardio.units.kmh')}
        />
        {elevation > 0 && (
          <StatChip
            icon={TrendingUp}
            label={t('cardio.elevation')}
            value={`+${Math.round(elevation)}`}
            unit={t('cardio.units.m')}
          />
        )}
      </div>

      {/* Map (below stats) */}
      {hasGps && expanded && (
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          height: '190px',
          flexShrink: 0,
        }}>
          <CardioMap
            gpsTrack={session.gpsTrack}
            height="100%"
            session={session}
            onShowFullscreen={(gpsTrack) => {
              window.dispatchEvent(new CustomEvent('show-cardio-fullscreen', {
                detail: { gpsTrack, session }
              }));
            }}
          />
        </div>
      )}
    </div>
  );
}

export function CardioHistory({ sessions, mode, onClose }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [fullscreenSession, setFullscreenSession] = useState(null);

  // Aggregate stats for the summary banner
  const summary = useMemo(() => {
    const totalDistance = sessions.reduce((s, x) => s + (x.distance || 0), 0) / 1000;
    const totalDuration = sessions.reduce((s, x) => s + (x.duration || 0), 0);
    return {
      count: sessions.length,
      distance: totalDistance,
      hours: totalDuration / 3600,
    };
  }, [sessions]);

  // Group sessions by month for visual rhythm (sessions are already sorted desc)
  const groups = useMemo(() => {
    const map = new Map();
    sessions.forEach((s) => {
      const d = parseTimestamp(s.startTime);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!map.has(key)) {
        const label = d.toLocaleDateString(lang || undefined, { month: 'long', year: 'numeric' });
        map.set(key, { key, label, items: [] });
      }
      map.get(key).items.push(s);
    });
    return [...map.values()];
  }, [sessions, lang]);

  // Listen for fullscreen events from child CardioMap
  useEffect(() => {
    const handleFullscreen = (e) => {
      setFullscreenSession(e.detail);
    };
    window.addEventListener('show-cardio-fullscreen', handleFullscreen);
    return () => window.removeEventListener('show-cardio-fullscreen', handleFullscreen);
  }, []);

  // Handle back button to close fullscreen map or the history panel itself
  useBackHandler(() => {
    if (fullscreenSession) {
      setFullscreenSession(null);
      return true;
    }
    onClose();
    return true;
  }, true);

  return (
    <>
      <div className="modal-overlay" style={{ zIndex: 200 }}>
        <div className="modal-content">
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 'var(--spacing-md)',
            flexShrink: 0
          }}>
            <h2 className="panel-title rainbow-gradient" style={{ margin: 0 }}>
              {t('cardio.history')}
            </h2>
            <IconButton icon={X} variant="glass" onClick={onClose} className="hover-lift" aria-label="Close" />
          </div>

          {sessions.length > 0 && (
            <div className="cardio-hist-summary">
              <div className="cardio-hist-summary-item">
                <div className="cardio-hist-summary-value">{summary.count}</div>
                <div className="cardio-hist-summary-label">{mode === 'running' ? t('exercises.running') : t('exercises.cycling')}</div>
              </div>
              <div className="cardio-hist-summary-divider" />
              <div className="cardio-hist-summary-item">
                <div className="cardio-hist-summary-value">
                  {summary.distance.toFixed(1)}<span>{t('cardio.units.km')}</span>
                </div>
                <div className="cardio-hist-summary-label">{t('cardio.distance')}</div>
              </div>
              <div className="cardio-hist-summary-divider" />
              <div className="cardio-hist-summary-item">
                <div className="cardio-hist-summary-value">
                  {summary.hours >= 1 ? summary.hours.toFixed(1) : Math.round(summary.hours * 60)}
                  <span>{summary.hours >= 1 ? 'h' : 'min'}</span>
                </div>
                <div className="cardio-hist-summary-label">{t('cardio.duration')}</div>
              </div>
            </div>
          )}

          <div className="custom-scrollbar" style={{
            flex: 1, overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: '10px',
            margin: '0 -10px', padding: '0 10px'
          }}>
          {sessions.length === 0 ? (
            <div style={{
              flex: 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '14px', padding: '50px 20px', textAlign: 'center',
            }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.8rem',
                background: 'var(--surface-subtle)',
                border: '1px solid var(--border-subtle)',
              }}>
                {mode === 'running' ? '🏃' : '🚴'}
              </div>
              <div style={{
                color: 'var(--text-secondary)',
                fontSize: 'clamp(0.8rem, 1.5vh, 0.95rem)',
                maxWidth: '220px', lineHeight: 1.5,
              }}>
                {t('cardio.noSessions')}
              </div>
            </div>
          ) : (
            groups.map((group) => (
              <React.Fragment key={group.key}>
                <div className="cardio-hist-month">{group.label}</div>
                {group.items.map((session, idx) => (
                  <SessionCard
                    key={`${session.id || 'session'}-${idx}`}
                    session={session}
                    mode={mode}
                    t={t}
                    lang={lang}
                  />
                ))}
              </React.Fragment>
            ))
          )}
        </div>
      </div>
    </div>

      {/* Fullscreen map modal */}
      {fullscreenSession && (
        <CardioFullscreenMap
          gpsTrack={fullscreenSession.gpsTrack}
          title={formatDate(fullscreenSession.session.startTime, lang)}
          session={fullscreenSession.session}
          onClose={() => setFullscreenSession(null)}
        />
      )}
    </>
  );
}
