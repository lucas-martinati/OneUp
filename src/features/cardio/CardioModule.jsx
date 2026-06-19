import React, { Suspense, lazy, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCardio } from './useCardio';
import { useSwipe } from '@hooks/useSwipe';
import { useAuth } from '@contexts/AuthContext';
import { CardioWeeklyGoal } from './CardioWeeklyGoal';
import { CardioMap } from './CardioMap';
import { CardioLastSession } from './CardioLastSession';
import { CardioStreak } from './CardioStreak';
import { stravaService } from '@services/stravaService';
import { ChevronRight, Link2, CheckCircle2 } from '@utils/icons';
import { SegmentedControl } from'@components/ui/SegmentedControl';
import { GoogleIcon } from'@components/ui/GoogleIcon';
import { GoogleSignInButton } from'@components/ui/GoogleSignInButton';

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
  const auth = useAuth();
  const [showHistory, setShowHistory] = useState(false);
  const {
    activeMode, setActiveMode,
    weekNumber, weeklyDistance, weeklyGoal,
    lastSession, streak, sessions, loading, refresh,
    isDifficultyMismatch, savedDifficulty, currentDifficulty, invalidateCurrentWeek
  } = useCardio();

  const [, setMapExpanded] = useState(false);
  const mapExpandedRef = React.useRef(false);
  const handleMapExpandChange = (val) => { mapExpandedRef.current = val; setMapExpanded(val); };

  const swipeHandlers = useSwipe({
    onSwipeLeft: () => {
      if (activeMode === 'running' && !mapExpandedRef.current) setActiveMode('cycling');
    },
    onSwipeRight: () => {
      if (activeMode === 'cycling' && !mapExpandedRef.current) setActiveMode('running');
    }
  });

  const [stravaConnected, setStravaConnected] = useState(false);

  const needsGoogleLogin = !auth.isSignedIn;
  const needsStravaLogin = auth.isSignedIn && !stravaConnected;
  // Fake demo values for the paywall
  const isDemo = needsGoogleLogin || needsStravaLogin;
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
      <div 
        className="cardio-module fade-in" 
        {...swipeHandlers}
        style={{
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
            {t('common.cardio')}
          </h2>

          <SegmentedControl 
            value={activeMode}
            onChange={setActiveMode}
            options={[
              { id: 'running', label: t('exercises.running'), icon: '🏃' },
              { id: 'cycling', label: t('exercises.cycling'), icon: '🚴' }
            ]}
          />
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
                isDifficultyMismatch={isDifficultyMismatch}
                savedDifficulty={savedDifficulty}
                currentDifficulty={currentDifficulty}
                onInvalidate={invalidateCurrentWeek}
              />

              {/* Map */}
              <CardioMap gpsTrack={displaySession?.gpsTrack} onExpandChange={handleMapExpandChange} session={displaySession} />

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

        {/* Unified Cardio Login Wall — same design for both auth steps, with a
            3-step progress (Google → Strava → auto-sync). The accent follows
            the current step; the background follows the active theme/event. */}
        {isDemo && (() => {
          const onGoogleStep = needsGoogleLogin;
          const accent = onGoogleStep ? '#4285F4' : '#fc4c02';
          const steps = [
            { label: t('cardio.googleWallStep1'), color: '#4285F4', done: auth.isSignedIn, active: needsGoogleLogin },
            { label: t('cardio.googleWallStep2'), color: '#fc4c02', done: stravaConnected, active: needsStravaLogin },
            { label: t('cardio.googleWallStep3'), color: '#34A853', done: false, active: false },
          ];
          return (
            <div className="fade-in cardio-login-wall" style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: 'var(--surface-section)',
              backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
              zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '28px', textAlign: 'center', gap: '12px', borderRadius: 'inherit',
              overflow: 'hidden',
              boxShadow: 'inset 0 0 60px rgba(0,0,0,0.35), 0 0 80px rgba(0,0,0,0.3)'
            }}>
              {/* Ambient glows — luminous reminders of the brand colors */}
              <div style={{
                position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)',
                width: '200px', height: '200px', borderRadius: '50%',
                background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`,
                pointerEvents: 'none', animation: 'cardioGlowFloat 6s ease-in-out infinite'
              }} />
              <div style={{
                position: 'absolute', bottom: '-40px', right: '-20px',
                width: '150px', height: '150px', borderRadius: '50%',
                background: `radial-gradient(circle, ${onGoogleStep ? 'rgba(234,67,53,0.12)' : 'rgba(252,140,2,0.14)'} 0%, transparent 70%)`,
                pointerEvents: 'none', animation: 'cardioGlowFloat 8s ease-in-out infinite reverse'
              }} />

              {/* Icon for the current step */}
              <div style={{
                width: '72px', height: '72px', borderRadius: '20px',
                background: `linear-gradient(145deg, ${accent}26, ${accent}0d)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${accent}40`,
                boxShadow: `0 12px 40px ${accent}33, 0 0 0 6px ${accent}0f`,
                position: 'relative', zIndex: 1
              }}>
                {onGoogleStep
                  ? <GoogleIcon size={30} />
                  : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="38"
                      height="38"
                      viewBox="0 0 64 64"
                      style={{ objectFit: 'contain' }}
                      aria-label="Strava"
                    >
                      <path d="M41.03 47.852l-5.572-10.976h-8.172L41.03 64l13.736-27.124h-8.18" fill="#f9b797" />
                      <path d="M27.898 21.944l7.564 14.928h11.124L27.898 0 9.234 36.876H20.35" fill="#f05222" />
                    </svg>
                  )}
              </div>

              <h2 style={{
                margin: 0, fontSize: 'clamp(1.15rem, 2.7vh, 1.45rem)', fontWeight: '800',
                background: `linear-gradient(135deg, var(--text-primary) 0%, ${accent} 170%)`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
              }}>
                {onGoogleStep ? t('cardio.googleWallTitle') : t('cardio.stravaWallTitle')}
              </h2>
              <p style={{
                color: 'var(--text-secondary)', fontSize: 'clamp(0.76rem, 1.45vh, 0.9rem)',
                lineHeight: '1.6', margin: 0, maxWidth: '260px'
              }}>
                {onGoogleStep ? t('cardio.googleWallDesc') : t('cardio.stravaWallDesc')}
              </p>

              {/* 3-step progress indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '6px 0 4px' }}>
                {steps.map((step, i) => {
                  const lit = step.active || step.done;
                  return (
                    <React.Fragment key={i}>
                      {i > 0 && <div style={{ width: '16px', height: '1px', background: steps[i - 1].done ? `${steps[i - 1].color}66` : 'var(--border-subtle)' }} />}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        padding: '4px 8px', borderRadius: '8px',
                        background: lit ? `${step.color}18` : 'var(--surface-subtle)',
                        border: `1px solid ${lit ? step.color + '40' : 'var(--border-subtle)'}`,
                        fontSize: '0.6rem', fontWeight: '700',
                        color: lit ? step.color : 'var(--text-secondary)',
                        opacity: lit ? 1 : 0.5,
                        whiteSpace: 'nowrap'
                      }}>
                        <span style={{
                          width: '14px', height: '14px', borderRadius: '50%', fontSize: '0.5rem',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: lit ? `${step.color}25` : 'var(--surface-muted)',
                          fontWeight: '900'
                        }}>{step.done ? '✓' : i + 1}</span>
                        {step.label}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Action button for the current step */}
              {onGoogleStep ? (
                <GoogleSignInButton
                  onClick={() => auth.signIn()}
                  className="hover-lift"
                  style={{ width: 'auto', marginTop: '8px' }}
                />
              ) : (
                <button onClick={handleConnectStrava} className="hover-lift cardio-strava-btn" style={{
                  marginTop: '8px', padding: '14px 30px', borderRadius: '16px',
                  background: 'linear-gradient(145deg, #fc4c02, #d94400)', color: 'white',
                  fontWeight: '800', fontSize: 'clamp(0.85rem, 1.6vh, 0.95rem)',
                  border: 'none', cursor: 'pointer',
                  boxShadow: '0 8px 28px rgba(252, 76, 2, 0.45), inset 0 1px 0 rgba(255,255,255,0.15)',
                  display: 'flex', gap: '8px', alignItems: 'center', letterSpacing: '0.3px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  <Link2 size={18} /> {t('cardio.connectTitle')}
                </button>
              )}
            </div>
          );
        })()}
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


