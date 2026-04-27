import React, { Suspense, lazy, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCardio } from './useCardio';
import { CardioWeeklyGoal } from './CardioWeeklyGoal';
import { CardioMap } from './CardioMap';
import { CardioLastSession } from './CardioLastSession';
import { CardioStreak } from './CardioStreak';
import { stravaService } from '../../services/stravaService';
import { Capacitor } from '@capacitor/core';
import { ChevronRight, Play, Link2, CheckCircle2 } from '../../utils/icons';

const MODES = [
  { key: 'running', emoji: '🏃' },
  { key: 'cycling', emoji: '🚴' },
];

const CardioHistory = lazy(() => import('./CardioHistory').then(m => ({ default: m.CardioHistory })));

const FAKE_GPS_TRACK = [
  { lat: 48.8647, lng: 2.3290 },
  { lat: 48.8633, lng: 2.3275 },
  { lat: 48.8622, lng: 2.3262 },
  { lat: 48.8610, lng: 2.3248 },
  { lat: 48.8601, lng: 2.3235 },
  { lat: 48.8595, lng: 2.3220 },
  { lat: 48.8598, lng: 2.3205 },
  { lat: 48.8608, lng: 2.3198 },
  { lat: 48.8620, lng: 2.3208 },
  { lat: 48.8635, lng: 2.3225 },
  { lat: 48.8650, lng: 2.3245 },
  { lat: 48.8660, lng: 2.3260 },
  { lat: 48.8658, lng: 2.3278 },
  { lat: 48.8647, lng: 2.3290 }
];

// Impure values should be defined outside or in effects
const DEMO_START_TIME = Date.now() - 86400000 * 2;

export function CardioModule() {
  const { t } = useTranslation();
  const [showHistory, setShowHistory] = useState(false);
  const {
    activeMode, setActiveMode,
    weekNumber, weeklyDistance, weeklyGoal,
    lastSession, streak, sessions, loading, refresh
  } = useCardio();

  const [stravaConnected, setStravaConnected] = useState(false);

  // Fake demo values for the paywall
  const isDemo = !stravaConnected;
  const displayDistance = isDemo ? 12.5 : weeklyDistance;
  const displayGoal = isDemo ? 15 : weeklyGoal;
  const displayWeekNumber = isDemo ? 3 : weekNumber;
  const displayStreak = isDemo ? 4 : streak;
  const displaySession = React.useMemo(() => isDemo ? {
    type: activeMode,
    distance: 5240, // 5.24 km
    duration: 1620, // 27 mins
    elevationGain: 45,
    averageSpeed: 3.23,
    startTime: DEMO_START_TIME,
    gpsTrack: FAKE_GPS_TRACK,
  } : lastSession, [isDemo, activeMode, lastSession]);

  React.useEffect(() => {
    const checkStatus = async () => {
      setStravaConnected(await stravaService.isAuthenticated());
    };
    checkStatus();

    window.addEventListener('strava-connected', () => {
      setStravaConnected(true);
      refresh();
    });
    return () => window.removeEventListener('strava-connected', () => {});
  }, [refresh]);

  const handleConnectStrava = async () => {
    if (stravaConnected) {
      await stravaService.disconnect();
      setStravaConnected(false);
    } else {
      await stravaService.connect();
    }
  };

  return (
    <>
      <div className="cardio-module fade-in" style={{
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        padding: 'clamp(14px, 2vh, 22px)',
        gap: 'clamp(8px, 1.2vh, 14px)',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}>
        {/* Decorative glow */}
        <div style={{
          position: 'absolute', top: '-40px', right: '-40px',
          width: '120px', height: '120px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '12px', flexShrink: 0,
          opacity: isDemo ? 0.4 : 1, pointerEvents: isDemo ? 'none' : 'auto'
        }}>
          <h2 style={{
            fontSize: 'clamp(0.85rem, 1.8vh, 1.1rem)',
            fontWeight: '800',
            color: 'var(--text-primary)',
            margin: 0,
            letterSpacing: '-0.01em'
          }}>
            {t('cardio.title')}
          </h2>

          {/* Mode tabs - click anywhere to toggle */}
          <div
            onClick={() => setActiveMode(activeMode === 'running' ? 'cycling' : 'running')}
            style={{
              display: 'flex',
              background: 'var(--surface-subtle)',
              borderRadius: 'var(--radius-full)',
              padding: '3px',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
            }}>
            <button
              style={{
                padding: '8px 18px',
                borderRadius: 'var(--radius-full)',
                fontSize: 'clamp(0.7rem, 1.3vh, 0.85rem)',
                fontWeight: '700',
                border: 'none',
                display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'all 0.25s ease',
                background: activeMode === 'running'
                  ? 'var(--gradient-glow)'
                  : 'transparent',
                color: activeMode === 'running'
                  ? '#fff'
                  : 'var(--text-secondary)',
              }}
            >
              🏃 {t('exercises.running')}
            </button>
            <button
              style={{
                padding: '8px 18px',
                borderRadius: 'var(--radius-full)',
                fontSize: 'clamp(0.7rem, 1.3vh, 0.85rem)',
                fontWeight: '700',
                border: 'none',
                display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'all 0.25s ease',
                background: activeMode === 'cycling'
                  ? 'var(--gradient-glow)'
                  : 'transparent',
                color: activeMode === 'cycling'
                  ? '#fff'
                  : 'var(--text-secondary)',
              }}
            >
              🚴 {t('exercises.cycling')}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flex: 1, color: 'var(--text-secondary)', opacity: 0.5,
            fontSize: '0.8rem'
          }}>
            {t('common.loading')}
          </div>
        ) : (
          <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div className="custom-scrollbar" style={{
              flex: 1, overflowY: isDemo ? 'hidden' : 'auto', overflowX: 'hidden',
              display: 'flex', flexDirection: 'column',
              gap: 'clamp(8px, 1.2vh, 14px)',
              paddingBottom: '8px',
              scrollbarWidth: 'none',
              pointerEvents: isDemo ? 'none' : 'auto',
              userSelect: isDemo ? 'none' : 'auto',
              opacity: isDemo ? 0.8 : 1
            }}>
              {/* Weekly Goal */}
              <CardioWeeklyGoal
                distance={displayDistance}
                goal={displayGoal}
                weekNumber={displayWeekNumber}
              />

              {/* Map */}
              <CardioMap gpsTrack={displaySession?.gpsTrack} />

              {/* Last Session Stats */}
              <CardioLastSession session={displaySession} />

              {/* Streak + History row */}
              <div style={{
                display: 'flex', gap: '8px',
                flexShrink: 0
              }}>
                <div style={{ flex: 1 }}>
                  <CardioStreak streak={displayStreak} />
                </div>
                <button
                  onClick={() => !isDemo && setShowHistory(true)}
                  className="hover-lift"
                  style={{
                    padding: 'clamp(8px, 1.2vh, 14px) clamp(14px, 2vw, 20px)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface-subtle)',
                    border: '1px solid var(--border-muted)',
                    color: 'var(--text-primary)',
                    fontWeight: '700',
                    fontSize: 'clamp(0.65rem, 1.2vh, 0.8rem)',
                    display: 'flex', alignItems: 'center',
                    gap: '4px',
                    cursor: isDemo ? 'default' : 'pointer',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t('cardio.viewHistory')}
                  <ChevronRight size={14} color="var(--accent-glow)" />
                </button>
              </div>

              {/* Connection Section (only visible when connected) */}
              {!isDemo && (
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: '8px',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px dashed var(--border-subtle)',
                  marginTop: '8px'
                }}>
                  <div style={{
                    fontSize: '0.7rem', fontWeight: '800',
                    color: 'var(--text-secondary)', textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {t('cardio.connectTitle')}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handleConnectStrava}
                      style={{
                        flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)',
                        background: stravaConnected ? 'rgba(252, 76, 2, 0.1)' : 'var(--surface-subtle)',
                        border: `1px solid ${stravaConnected ? '#fc4c02' : 'var(--border-muted)'}`,
                        color: stravaConnected ? '#fc4c02' : 'var(--text-primary)',
                        fontSize: '0.7rem', fontWeight: '700',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        cursor: 'pointer', transition: 'all 0.2s ease'
                      }}
                    >
                      {stravaConnected ? <CheckCircle2 size={12} /> : <Link2 size={12} />}
                      Strava
                    </button>
                  </div>
                </div>
              )}

              {/* No sessions message */}
              {!isDemo && sessions.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '6px 0',
                  color: 'var(--text-secondary)',
                  fontSize: 'clamp(0.65rem, 1.2vh, 0.8rem)',
                  opacity: 0.6
                }}>
                  {t('cardio.noSessions')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* The Glass Wall Overlay - Covers the entire module */}
        {isDemo && (
          <div className="fade-in" style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'linear-gradient(to bottom, rgba(15, 15, 20, 0.75), rgba(15, 15, 20, 0.95))',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            zIndex: 10,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '24px', textAlign: 'center', gap: '16px',
            borderRadius: 'inherit',
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)'
          }}>
            <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: 'rgba(252, 76, 2, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(252, 76, 2, 0.3)', marginBottom: '8px',
                boxShadow: '0 8px 32px rgba(252, 76, 2, 0.25), 0 0 0 8px rgba(252, 76, 2, 0.05)'
            }}>
                <img src={`${import.meta.env.BASE_URL}strava-icon.svg`} alt="Strava" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
            </div>
            <h2 style={{ margin: 0, fontSize: 'clamp(1.3rem, 3vh, 1.6rem)', fontWeight: '800', color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                {t('cardio.stravaWallTitle', 'Connectez Strava')}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(0.85rem, 1.8vh, 1rem)', lineHeight: '1.6', margin: 0, maxWidth: '280px', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                {t('cardio.stravaWallDesc', 'Synchronisez automatiquement vos sessions de course et de vélo pour faire progresser votre streak globale.')}
            </p>
            <button onClick={handleConnectStrava} className="hover-lift" style={{
                marginTop: '16px', padding: '16px 32px', borderRadius: '30px',
                background: 'linear-gradient(135deg, #fc4c02, #e04302)', color: 'white',
                fontWeight: '800', fontSize: '1rem', border: 'none', cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(252, 76, 2, 0.5), inset 0 2px 4px rgba(255,255,255,0.2)',
                display: 'flex', gap: '10px', alignItems: 'center',
                letterSpacing: '0.5px'
            }}>
                <Link2 size={20} /> {t('cardio.connectTitle')}
            </button>
          </div>
        )}
      </div>

      {/* History Modal */}
      {showHistory && (
        <Suspense fallback={null}>
          <CardioHistory
            sessions={sessions}
            mode={activeMode}
            onClose={() => setShowHistory(false)}
          />
        </Suspense>
      )}
    </>
  );
}

export default CardioModule;
