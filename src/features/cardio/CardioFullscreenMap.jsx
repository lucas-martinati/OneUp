import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useBackHandler } from '../../hooks/useBackHandler';

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

// Fit bounds component to handle zoom correctly
function FullscreenFitBounds({ gpsTrack }) {
  const map = useMap();

  useEffect(() => {
    if (!gpsTrack || gpsTrack.length < 2) return;
    const timer = setTimeout(() => {
      map.invalidateSize();
      const bounds = gpsTrack.map(p => [p.lat, p.lng]);
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 17, animate: false });
    }, 50);
    return () => clearTimeout(timer);
  }, [gpsTrack, map]);

  return null;
}

export function CardioFullscreenMap({ gpsTrack, title, onClose }) {
  const { t } = useTranslation();
  
  // Back handler for Android/iOS physical back button
  useBackHandler(() => {
    onClose();
    return true;
  }, true);

  if (!gpsTrack || gpsTrack.length < 2) return null;

  const positions = gpsTrack.map(p => [p.lat, p.lng]);
  const lats = positions.map(p => p[0]);
  const lngs = positions.map(p => p[1]);
  const initialBounds = [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ];

  return (
    <div className="modal-overlay" style={{ background: '#0a0a0f', zIndex: 9999 }}>
      <div className="modal-content" style={{ padding: 0 }}>
        {/* Header using centralized system padding */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--spacing-md)',
          paddingTop: 'calc(var(--spacing-md) + env(safe-area-inset-top))',
          background: '#12121a',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0
        }}>
          <span style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            {title || t('cardio.gpsTrack')}
          </span>
          <button
            onClick={onClose}
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

        {/* Map filling remaining space */}
        <div style={{ flex: 1, position: 'relative' }}>
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
            <FullscreenFitBounds gpsTrack={gpsTrack} />

            {/* Track line */}
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
          borderTop: '1px solid var(--border-subtle)',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom))'
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
    </div>
  );
}
