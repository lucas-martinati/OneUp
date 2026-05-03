import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import { useBackHandler } from '../../hooks/useBackHandler';
import { CardioFullscreenMap } from './CardioFullscreenMap';
import { MAP_TILES } from '../../config/mapTiles';
import 'leaflet/dist/leaflet.css';

// Dark map tiles (CartoDB Dark Matter)
const TILE_URL = MAP_TILES.dark;

// Fit bounds component - zoom in to fill the container
function FitBounds({ gpsTrack }) {
  const map = useMap();
  
  useEffect(() => {
    if (!gpsTrack || gpsTrack.length < 2) return;
    const bounds = gpsTrack.map(p => [p.lat, p.lng]);
    // Minimal padding = zoom to fill as much of the container as possible
    map.fitBounds(bounds, { padding: [10, 10], maxZoom: 17, animate: false });
  }, [gpsTrack, map]);
  
  return null;
}

export const CardioMap = React.memo(({ gpsTrack, height = '160px', onShowFullscreen, onExpandChange, session }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const handleExpand = () => {
    if (!gpsTrack || gpsTrack.length < 2) return;
    if (onShowFullscreen) {
      onShowFullscreen(gpsTrack);
    } else {
      setExpanded(true);
      onExpandChange?.(true);
    }
  };

  const handleClose = () => {
    setExpanded(false);
    onExpandChange?.(false);
  };

  // Handle back button to close expanded map
  useBackHandler(() => {
    if (expanded) {
      handleClose();
      return true;
    }
    return false;
  }, expanded);

  const positions = useMemo(() => {
    if (!gpsTrack) return [];
    return gpsTrack.map(p => [p.lat, p.lng]);
  }, [gpsTrack]);

  // No GPS data
  if (!gpsTrack || gpsTrack.length < 2) {
    return (
      <div style={{
        width: '100%', height,
        borderRadius: 'var(--radius-md)',
        background: '#1a1a24',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid var(--border-subtle)',
        color: 'var(--text-secondary)', fontSize: '0.75rem', opacity: 0.5
      }}>
        {t('cardio.noGpsTrack')}
      </div>
    );
  }

  // Fullscreen modal
  if (expanded) {
    return (
      <CardioFullscreenMap
        gpsTrack={gpsTrack}
        session={session}
        onClose={handleClose}
      />
    );
  }

  // Compact view
  return (
    <div
      onClick={handleExpand}
      style={{
        width: '100%', height,
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        position: 'relative',
        border: '1px solid var(--border-subtle)',
        cursor: 'pointer',
      }}
      className="hover-lift"
    >
      <MapContainer
        center={[gpsTrack[0].lat, gpsTrack[0].lng]}
        zoom={15}
        style={{ height: '100%', width: '100%', background: '#1a1a2e' }}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        boxZoom={false}
        keyboard={false}
      >
        <TileLayer url={TILE_URL} attribution="" />
        <FitBounds gpsTrack={gpsTrack} />
        
        <Polyline
          positions={positions}
          pathOptions={{ color: '#8b5cf6', weight: 4 }}
        />
        <Polyline
          positions={positions}
          pathOptions={{ color: '#c084fc', weight: 2 }}
        />
        
        <CircleMarker
          center={positions[0]}
          radius={6}
          pathOptions={{ fillColor: '#10b981', fillOpacity: 1, color: '#fff', weight: 2 }}
        />
        <CircleMarker
          center={positions[positions.length - 1]}
          radius={6}
          pathOptions={{ fillColor: '#ef4444', fillOpacity: 1, color: '#fff', weight: 2 }}
        />
      </MapContainer>

      {/* Tap hint */}
      <div style={{
        position: 'absolute', top: '8px', left: '8px',
        display: 'flex', alignItems: 'center', gap: '4px',
        background: 'rgba(0,0,0,0.6)',
        padding: '4px 8px', borderRadius: 'var(--radius-sm)',
        fontSize: '0.6rem', color: '#fff', zIndex: 1000
      }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 15l-2 5L9 9l5 2-5 2 2 5 5-2z" />
        </svg>
        {t('cardio.tap')}
      </div>
    </div>
  );
});