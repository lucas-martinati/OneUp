import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import 'leaflet/dist/leaflet.css';
import { X, Clock, Target, Footprints } from '../../utils/icons';
import { Capacitor } from '@capacitor/core';
import { useBackHandler } from '../../hooks/useBackHandler';
import { CardioMap } from './CardioMap';
import { CardioFullscreenMap } from './CardioFullscreenMap';
import { parseTimestamp } from '../../utils/dateUtils';


function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  return `${m}min`;
}

function formatDate(timestamp) {
  if (!timestamp) return '—';
  const d = parseTimestamp(timestamp);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function SessionCard({ session, mode }) {
  const [expanded, setExpanded] = useState(false);
  const hasGps = session.gpsTrack && session.gpsTrack.length > 1;

  return (
    <div 
      onClick={() => hasGps && setExpanded(!expanded)}
      className="hover-lift" 
      style={{
        background: 'var(--surface-subtle)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        flexShrink: 0,
        cursor: hasGps ? 'pointer' : 'default',
      }}>
      {/* Header row */}
      <div style={{
        padding: 'clamp(12px, 1.6vh, 18px)',
        display: 'flex', alignItems: 'center', gap: '14px',
      }}>
        <div style={{
          width: '42px', height: '42px', borderRadius: 'var(--radius-md)',
          background: 'var(--gradient-glow)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.2rem', flexShrink: 0,
          boxShadow: '0 2px 8px rgba(139,92,246,0.2)',
        }}>
          {mode === 'running' ? '🏃' : '🚴'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 'clamp(0.75rem, 1.4vh, 0.9rem)',
            fontWeight: '700',
            color: 'var(--text-primary)',
            marginBottom: '3px',
          }}>
            {formatDate(session.startTime)}
          </div>
          <div style={{
            display: 'flex', gap: '12px',
            fontSize: 'clamp(0.65rem, 1.2vh, 0.8rem)',
            color: 'var(--text-secondary)',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Target size={11} />
              {session.distance ? `${(session.distance / 1000).toFixed(1)} km` : '—'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Clock size={11} />
              {formatDuration(session.duration)}
            </span>
            {session.avgSpeed > 0 && (
              <span>{session.avgSpeed.toFixed(1)} km/h</span>
            )}
          </div>
        </div>

        {session.elevationGain > 0 && (
          <div style={{
            textAlign: 'right', flexShrink: 0,
            fontSize: 'clamp(0.7rem, 1.3vh, 0.85rem)',
            fontWeight: '700',
            color: 'var(--accent-glow)',
          }}>
            +{session.elevationGain}m
          </div>
        )}

        {hasGps && (
          <div
            style={{
              width: '36px', height: '36px',
              borderRadius: 'var(--radius-md)',
              background: expanded ? 'var(--gradient-glow)' : 'var(--surface-hover)',
              border: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff',
              flexShrink: 0,
              transition: 'all 0.2s ease',
            }}
          >
            <Footprints size={16} />
          </div>
        )}
      </div>

      {/* Map (below stats) */}
      {hasGps && expanded && (
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          height: '180px',
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
  const { t } = useTranslation();
  const [fullscreenSession, setFullscreenSession] = useState(null);

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
        <div className="modal-content" style={{ maxWidth: '600px', width: '100%', margin: '0 auto' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 'var(--spacing-md)',
            flexShrink: 0
          }}>
            <h2 className="panel-title rainbow-gradient" style={{ margin: 0 }}>
              {t('cardio.history')}
            </h2>
            <button
              onClick={onClose}
              className="hover-lift glass"
              style={{
                width: 'var(--touch-min)', height: 'var(--touch-min)',
                borderRadius: '50%', background: 'var(--surface-hover)',
                border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-primary)', cursor: 'pointer',
              }}
            >
              <X size={22} />
            </button>
          </div>

          <div className="custom-scrollbar" style={{
            flex: 1, overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: '10px',
            margin: '0 -10px', padding: '0 10px'
          }}>
          {sessions.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '60px 20px',
              color: 'var(--text-secondary)', opacity: 0.5,
              fontSize: 'clamp(0.8rem, 1.5vh, 1rem)',
            }}>
              {t('cardio.noSessions')}
            </div>
          ) : (
            sessions.map((session, idx) => (
              <SessionCard
                key={`${session.id || 'session'}-${idx}`}
                session={session}
                mode={mode}
              />
            ))
          )}
        </div>
      </div>
    </div>

      {/* Fullscreen map modal */}
      {fullscreenSession && (
        <CardioFullscreenMap
          gpsTrack={fullscreenSession.gpsTrack}
          title={formatDate(fullscreenSession.session.startTime)}
          onClose={() => setFullscreenSession(null)}
        />
      )}
    </>
  );
}

export default CardioHistory;