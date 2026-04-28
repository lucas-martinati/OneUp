import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { X, Clock, Target, Footprints } from '../../utils/icons';
import { Capacitor } from '@capacitor/core';
import { useBackHandler } from '../../hooks/useBackHandler';
import { CardioMap } from './CardioMap';

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

// Fit bounds for fullscreen map - no animation to avoid zoom effect
function FullscreenFitBounds({ gpsTrack }) {
  const map = useMap();

  useEffect(() => {
    if (!gpsTrack || gpsTrack.length < 2) return;
    // Invalidate size then fit bounds without animation
    const timer = setTimeout(() => {
      map.invalidateSize();
      const bounds = gpsTrack.map(p => [p.lat, p.lng]);
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 17, animate: false });
    }, 50);
    return () => clearTimeout(timer);
  }, [gpsTrack, map]);

  return null;
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  return `${m}min`;
}

function formatDate(timestamp) {
  if (!timestamp) return '—';
  const d = new Date(timestamp);
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
  React.useEffect(() => {
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
      <div style={{
        position: 'fixed', inset: 0,
        background: 'var(--overlay-bg)',
        zIndex: 200,
        display: 'flex', flexDirection: 'column',
        animation: 'fadeIn 0.3s ease-out',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'clamp(14px, 2vh, 22px) clamp(16px, 3vw, 24px)',
          paddingTop: Capacitor.isNativePlatform() ? 'calc(env(safe-area-inset-top, 24px) + 10px)' : 'clamp(14px, 2vh, 22px)',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--surface-subtle)',
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
          padding: 'clamp(12px, 2vh, 20px) clamp(16px, 3vw, 24px)',
          display: 'flex', flexDirection: 'column', gap: '10px',
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
                key={session.id || idx}
                session={session}
                mode={mode}
              />
            ))
          )}
        </div>
      </div>

      {/* Fullscreen map modal */}
      {fullscreenSession && (() => {
        const positions = fullscreenSession.gpsTrack.map(p => [p.lat, p.lng]);
        // Compute initial bounds to avoid zoom animation
        const latLngs = fullscreenSession.gpsTrack.map(p => [p.lat, p.lng]);
        const lats = latLngs.map(p => p[0]);
        const lngs = latLngs.map(p => p[1]);
        const initialBounds = [
          [Math.min(...lats), Math.min(...lngs)],
          [Math.max(...lats), Math.max(...lngs)],
        ];
        return (
          <div style={{
            position: 'fixed', inset: 0,
            background: '#0a0a0f',
            zIndex: 9999,
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px',
              paddingTop: Capacitor.isNativePlatform() ? 'calc(env(safe-area-inset-top, 24px) + 10px)' : '16px',
              background: '#12121a',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              <span style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                {formatDate(fullscreenSession.session.startTime)}
              </span>
              <button
                onClick={() => setFullscreenSession(null)}
                style={{
                  background: 'var(--surface-muted)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-full)',
                  padding: '8px 16px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem', fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {t('common.close')}
              </button>
            </div>

            {/* Interactive fullscreen map */}
            <div style={{ flex: 1 }}>
              <MapContainer
                bounds={initialBounds}
                boundsOptions={{ padding: [30, 30], maxZoom: 17 }}
                style={{ height: '100%', width: '100%', background: '#1a1a2e' }}
                zoomControl={true}
                scrollWheelZoom={true}
                dragging={true}
                touchZoom={true}
                doubleClickZoom={true}
                boxZoom={true}
                keyboard={true}
              >
                <TileLayer url={TILE_URL} attribution="" />
                <FullscreenFitBounds gpsTrack={fullscreenSession.gpsTrack} />

                {/* Track line with glow */}
                <Polyline
                  positions={positions}
                  pathOptions={{ color: '#8b5cf6', weight: 5, opacity: 0.9 }}
                />
                <Polyline
                  positions={positions}
                  pathOptions={{ color: '#c084fc', weight: 2, opacity: 1 }}
                />

                {/* Start marker */}
                <CircleMarker
                  center={positions[0]}
                  radius={8}
                  pathOptions={{ fillColor: '#10b981', fillOpacity: 1, color: '#fff', weight: 2 }}
                />

                {/* End marker */}
                <CircleMarker
                  center={positions[positions.length - 1]}
                  radius={8}
                  pathOptions={{ fillColor: '#ef4444', fillOpacity: 1, color: '#fff', weight: 2 }}
                />
              </MapContainer>
            </div>

            {/* Legend */}
            <div style={{
              display: 'flex', justifyContent: 'center', gap: '32px',
              padding: '16px',
              background: '#12121a',
              borderTop: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{t('cardio.start')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{t('cardio.finish')}</span>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}

export default CardioHistory;