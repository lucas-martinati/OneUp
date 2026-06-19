import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useBackHandler } from '@hooks/useBackHandler';
import { X, Clock, Target, TrendingUp, Footprints } from '@utils/icons';
import { IconButton } from'@components/ui';
import { MAP_TILES } from '@config/mapTiles';

const TILE_URL = MAP_TILES.dark;

// Fit bounds component to handle zoom correctly
function FullscreenFitBounds({ gpsTrack }) {
  const map = useMap();

  useEffect(() => {
    if (!gpsTrack || gpsTrack.length < 2) return;
    const timer = setTimeout(() => {
      map.invalidateSize();
      const bounds = gpsTrack.map(p => [p.lat, p.lng]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17, animate: false });
    }, 50);
    return () => clearTimeout(timer);
  }, [gpsTrack, map]);

  return null;
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h${m.toString().padStart(2, '0')}`;
  return `${m}min`;
}

function formatDistance(meters) {
  if (!meters || meters <= 0) return '—';
  return `${(meters / 1000).toFixed(2)}`;
}

function formatSpeed(speedMs, type, t) {
  if (!speedMs || speedMs <= 0) return { value: '—', label: t('cardio.units.kmh') };
  if (type === 'running') {
    const secondsPerKm = 1000 / speedMs;
    const mins = Math.floor(secondsPerKm / 60);
    const secs = Math.floor(secondsPerKm % 60);
    return { value: `${mins}:${secs.toString().padStart(2, '0')}`, label: t('cardio.units.minKm') };
  }
  return { value: `${(speedMs * 3.6).toFixed(1)}`, label: t('cardio.units.kmh') };
}

export function CardioFullscreenMap({ gpsTrack, title, session, onClose }) {
  const { t } = useTranslation();
  
  // Back handler for Android/iOS physical back button
  useBackHandler(() => {
    onClose();
    return true;
  }, true);

  const stats = useMemo(() => {
    if (!session) return null;
    const speed = session.avgSpeed || session.averageSpeed || 0;
    const elevation = session.elevationGain || session.elevation || 0;
    const speedInfo = formatSpeed(speed, session.type, t);
    
    return [
      { icon: Target, label: t('cardio.units.km'), value: formatDistance(session.distance), color: '#8b5cf6' },
      { icon: Clock, label: '', value: formatDuration(session.duration), color: '#a78bfa' },
      ...(speed > 0 ? [{ icon: TrendingUp, label: speedInfo.label, value: speedInfo.value, color: '#c084fc' }] : []),
      ...(elevation > 0 ? [{ icon: TrendingUp, label: t('cardio.units.m'), value: `+${elevation}`, color: '#6d28d9' }] : []),
    ];
  }, [session, t]);

  if (!gpsTrack || gpsTrack.length < 2) return null;

  const positions = gpsTrack.map(p => [p.lat, p.lng]);
  const lats = positions.map(p => p[0]);
  const lngs = positions.map(p => p[1]);
  const initialBounds = [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ];

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0,
      background: '#08080f',
      zIndex: 9999,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Full-bleed map */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer
          bounds={initialBounds}
          boundsOptions={{ padding: [50, 50], maxZoom: 17 }}
          style={{ height: '100%', width: '100%', background: '#0d0d1a' }}
          zoomControl={false}
          scrollWheelZoom={true}
          dragging={true}
          touchZoom={true}
          doubleClickZoom={true}
          boxZoom={true}
          keyboard={true}
        >
          <TileLayer url={TILE_URL} attribution="" />
          <FullscreenFitBounds gpsTrack={gpsTrack} />

          {/* Outer glow line */}
          <Polyline
            positions={positions}
            pathOptions={{ color: '#8b5cf6', weight: 8, opacity: 0.25, lineCap: 'round', lineJoin: 'round' }}
          />
          {/* Main track */}
          <Polyline
            positions={positions}
            pathOptions={{ color: '#8b5cf6', weight: 4, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }}
          />
          {/* Inner highlight */}
          <Polyline
            positions={positions}
            pathOptions={{ color: '#c084fc', weight: 1.5, opacity: 0.8, lineCap: 'round', lineJoin: 'round' }}
          />

          {/* Start marker — outer halo */}
          <CircleMarker
            center={positions[0]}
            radius={16}
            pathOptions={{ fillColor: '#10b981', fillOpacity: 0.12, color: '#10b981', weight: 1, opacity: 0.3 }}
          />
          <CircleMarker
            center={positions[0]}
            radius={7}
            pathOptions={{ fillColor: '#10b981', fillOpacity: 1, color: '#fff', weight: 2.5 }}
          />

          {/* End marker — outer halo */}
          <CircleMarker
            center={positions[positions.length - 1]}
            radius={16}
            pathOptions={{ fillColor: '#ef4444', fillOpacity: 0.12, color: '#ef4444', weight: 1, opacity: 0.3 }}
          />
          <CircleMarker
            center={positions[positions.length - 1]}
            radius={7}
            pathOptions={{ fillColor: '#ef4444', fillOpacity: 1, color: '#fff', weight: 2.5 }}
          />
        </MapContainer>

        {/* Top gradient fade */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '120px',
          background: 'linear-gradient(to bottom, rgba(8,8,15,0.85) 0%, rgba(8,8,15,0.4) 50%, transparent 100%)',
          pointerEvents: 'none', zIndex: 1000
        }} />

        {/* Bottom gradient fade */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '160px',
          background: 'linear-gradient(to top, rgba(8,8,15,0.9) 0%, rgba(8,8,15,0.5) 40%, transparent 100%)',
          pointerEvents: 'none', zIndex: 1000
        }} />

        {/* Floating header */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          paddingTop: 'calc(12px + env(safe-area-inset-top))',
          padding: 'calc(12px + env(safe-area-inset-top)) 16px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          zIndex: 1001
        }}>
          {/* Legend pills (Left) */}
          <div style={{
            display: 'flex', gap: '6px',
          }}>
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '6px',
              padding: '8px 10px', borderRadius: '12px',
              background: 'rgba(15, 15, 25, 0.7)',
              backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                <span style={{ fontSize: '0.65rem', fontWeight: '700', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>{t('cardio.start')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px #ef4444' }} />
                <span style={{ fontSize: '0.65rem', fontWeight: '700', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>{t('cardio.finish')}</span>
              </div>
            </div>
          </div>

          {/* Title (Center) */}
          <div style={{
            position: 'absolute', left: '50%', transform: 'translateX(-50%)',
            padding: '8px 16px',
            borderRadius: '20px',
            background: 'rgba(15, 15, 25, 0.7)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <Footprints size={14} color="#a78bfa" />
            <span style={{
              fontSize: '0.8rem', fontWeight: '700', color: '#fff',
              letterSpacing: '0.3px'
            }}>
              {title || t('cardio.gpsTrack')}
            </span>
          </div>

          {/* Close button (Right) */}
          <IconButton icon={X} variant="glass" onClick={onClose} className="hover-lift" aria-label="Close" />
        </div>

        {/* Floating stats bar */}
        {stats && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
            padding: '0 16px calc(16px + env(safe-area-inset-bottom))',
            zIndex: 1001,
            display: 'flex', justifyContent: 'center',
          }}>
            <div style={{
              display: 'flex', gap: '8px',
              padding: '12px 16px',
              borderRadius: '20px',
              background: 'rgba(12, 12, 22, 0.75)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}>
              {stats.map((stat, i) => (
                <React.Fragment key={i}>
                  {i > 0 && (
                    <div style={{
                      width: '1px', alignSelf: 'stretch',
                      background: 'rgba(255,255,255,0.08)', margin: '2px 0'
                    }} />
                  )}
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: '2px', minWidth: '52px',
                  }}>
                    <stat.icon size={13} color={stat.color} style={{ opacity: 0.7 }} />
                    <div style={{
                      display: 'flex', alignItems: 'baseline', gap: '2px'
                    }}>
                      <span style={{
                        fontSize: '1rem', fontWeight: '800', color: '#fff',
                        lineHeight: 1
                      }}>
                        {stat.value}
                      </span>
                      {stat.label && (
                        <span style={{
                          fontSize: '0.55rem', fontWeight: '600',
                          color: 'rgba(255,255,255,0.4)',
                          textTransform: 'uppercase'
                        }}>
                          {stat.label}
                        </span>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
