import React, { Suspense, lazy, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCardio } from './useCardio';
import { useSwipe } from '@hooks/useSwipe';
import { useAuth } from '@contexts/AuthContext';
import { CardioWeeklyGoal } from './CardioWeeklyGoal';
import { CardioMap } from './CardioMap';
import { CardioLastSession } from './CardioLastSession';
import { CardioStreak } from './CardioStreak';
import { Capacitor } from '@capacitor/core';
import { healthConnectService } from '@services/healthConnectService';
import { ChevronRight, CheckCircle2, Activity } from '@utils/icons';
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
  const { t, i18n } = useTranslation();
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

  const isWeb = Capacitor.getPlatform() === 'web';
  const [healthConnected, setHealthConnected] = useState(false);
  const [healthAvailable, setHealthAvailable] = useState(false);

  const needsGoogleLogin = !auth.isSignedIn;
  // A "cardio source" is any connected provider (Health Connect).
  const hasCardioSource = healthConnected;
  const needsCardioSource = auth.isSignedIn && !hasCardioSource;
  // Fake demo values for the paywall
  const isDemo = !isWeb && (needsGoogleLogin || needsCardioSource);
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
    let cancelled = false;
    const checkStatus = async () => {
      const hcAvailable = await healthConnectService.isAvailable();
      const hc = hcAvailable ? await healthConnectService.isAuthenticated() : false;
      if (cancelled) return;
      setHealthAvailable(hcAvailable);
      setHealthConnected(hc);
    };
    checkStatus();

    // Provider dispatches connected event; re-check everything and refresh.
    const onConnected = () => { checkStatus(); refresh(); };
    window.addEventListener('cardio-source-connected', onConnected);
    return () => {
      cancelled = true;
      window.removeEventListener('cardio-source-connected', onConnected);
    };
  }, [refresh]);

  const handleConnectHealth = async () => {
    if (healthConnected) {
      await healthConnectService.disconnect();
      setHealthConnected(false);
    } else {
      const granted = await healthConnectService.connect();
      // connect() dispatches 'cardio-source-connected' on success, but reflect
      // the result immediately in case the event listener missed it.
      if (granted) setHealthConnected(true);
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

        {(() => {
          if (isWeb) return (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            textAlign: 'center',
            padding: '24px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--surface-subtle)',
            border: '1px solid var(--border-subtle)',
            backdropFilter: 'blur(12px)',
            margin: '20px 0',
            position: 'relative'
          }}>
            {/* Soft decorative background glow */}
            <div style={{
              position: 'absolute',
              width: '100px',
              height: '100px',
              background: 'radial-gradient(circle, rgba(66,133,244,0.15) 0%, transparent 70%)',
              pointerEvents: 'none',
              top: '10%',
              left: '10%'
            }} />
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              background: 'rgba(66, 133, 244, 0.1)',
              border: '1px solid rgba(66, 133, 244, 0.2)',
              marginBottom: '8px',
              boxShadow: '0 8px 24px rgba(66, 133, 244, 0.15)'
            }}>
              📱
            </div>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '800',
              color: 'var(--text-primary)',
              margin: 0
            }}>
              {t('cardio.webRestrictionTitle')}
            </h3>
            <p style={{
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              maxWidth: '280px',
              margin: 0,
              opacity: 0.9
            }}>
              {t('cardio.webRestrictionDesc')}
            </p>
            <a 
              href="https://play.google.com/store/apps/details?id=com.lucasm548.oneup" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover-lift"
              style={{
                marginTop: '16px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                background: '#0a0a0a',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                padding: '10px 20px',
                borderRadius: '12px',
                textDecoration: 'none',
                color: '#ffffff',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25), 0 2px 8px rgba(66, 133, 244, 0.1)',
                transition: 'all 0.25s ease',
              }}
            >
              {/* Official Google Play Triangle SVG (2022 Rounded Version) */}
              <svg viewBox="0 0 29 32" width="20" height="22" style={{ flexShrink: 0 }}>
                <path d="M13.54 15.28.12 29.34a3.64 3.64 0 0 0 5.33 2.16l15.1-8.6z" fill="#ea4335"/>
                <path d="m27.11 12.89-6.53-3.74-7.35 6.45 7.38 7.28 6.48-3.7a3.55 3.55 0 0 0 0-6.29z" fill="#fbbc04"/>
                <path d="M.12 2.66a3.46 3.46 0 0 0-.12.92v24.84a3.66 3.66 0 0 0 .12.92L14 15.64Z" fill="#4285f4"/>
                <path d="m13.64 16 6.94-6.85L5.5.51A3.72 3.72 0 0 0 3.63 0 3.64 3.64 0 0 0 .12 2.65Z" fill="#34a853"/>
              </svg>
              
              {/* Typography Column */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
                <span style={{ 
                  fontSize: '0.58rem', 
                  fontWeight: '600', 
                  color: 'rgba(255, 255, 255, 0.55)', 
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  marginBottom: '2px'
                }}>
                  {i18n.language?.startsWith('fr') ? 'Disponible sur' : 'Get it on'}
                </span>
                <span style={{ 
                  fontSize: '1rem', 
                  fontWeight: '700', 
                  color: '#ffffff',
                  letterSpacing: '0.2px'
                }}>
                  Google Play
                </span>
              </div>
            </a>
          </div>
          );
          if (loading) return (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flex: 1, color: 'var(--text-secondary)', opacity: 0.5,
            fontSize: '0.8rem'
          }}>
            {t('common.loading')}
          </div>
          );
          return (
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
              {!isDemo && healthAvailable && (
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
                      onClick={handleConnectHealth}
                      style={{
                        flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)',
                        background: healthConnected ? 'rgba(66, 133, 244, 0.1)' : 'var(--surface-subtle)',
                        border: `1px solid ${healthConnected ? '#4285F4' : 'var(--border-muted)'}`,
                        color: healthConnected ? '#4285F4' : 'var(--text-primary)',
                        fontSize: '0.7rem', fontWeight: '700',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        cursor: 'pointer', transition: 'all 0.2s ease'
                      }}
                    >
                      {healthConnected ? <CheckCircle2 size={12} /> : <Activity size={12} />}
                      {t('cardio.healthConnect')}
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
          );
        })()}

        {/* Unified Cardio Login Wall — a frosted-glass teaser that lets the demo
            content peek through behind a glass card. */}
        {isDemo && (() => {
          const onGoogleStep = needsGoogleLogin;
          const accent = onGoogleStep ? '#4285F4' : '#34A853';
          const steps = [
            { label: t('cardio.googleWallStep1'), color: '#4285F4', done: auth.isSignedIn, active: needsGoogleLogin },
            { label: t('cardio.healthConnect'), color: '#34A853', done: hasCardioSource, active: needsCardioSource }
          ];
          return (
            <div
              className="fade-in cardio-login-wall"
              style={{
                '--cardio-accent': accent,
                '--cardio-accent-glow': `${accent}26`,
                '--cardio-accent-soft': `${accent}2e`,
                '--cardio-accent-border': `${accent}55`,
                '--cardio-accent-shadow': `${accent}3a`,
              }}
            >
              {/* Ambient glows — luminous reminders of the brand colors */}
              <div className="cardio-wall-glow" style={{
                top: '-50px', left: '50%', marginLeft: '-90px',
                width: '180px', height: '180px',
                background: `radial-gradient(circle, ${accent}2e 0%, transparent 70%)`,
              }} />
              <div className="cardio-wall-glow" style={{
                bottom: '-40px', right: '-30px',
                width: '150px', height: '150px',
                animationDirection: 'reverse', animationDuration: '9s',
                background: `radial-gradient(circle, ${onGoogleStep ? 'rgba(234,67,53,0.14)' : 'rgba(52,168,83,0.16)'} 0%, transparent 70%)`,
              }} />

              <div className="cardio-login-card">
                {/* Icon for the current step */}
                <div className="cardio-wall-icon">
                  {onGoogleStep
                    ? <GoogleIcon size={28} />
                    : <Activity size={28} color="#34A853" />}
                </div>

                <h2 className="cardio-wall-title">
                  {onGoogleStep ? t('cardio.googleWallTitle') : t('cardio.healthConnect')}
                </h2>
                <p className="cardio-wall-desc">
                  {onGoogleStep ? t('cardio.googleWallDesc') : t('cardio.stravaWallDesc')}
                </p>

                {/* 2-step progress indicator — vertical connected stepper so the
                    longer translated labels never overflow the card. */}
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '210px', margin: '2px 0' }}>
                  {steps.map((step, i) => {
                    const lit = step.active || step.done;
                    return (
                      <React.Fragment key={i}>
                        {i > 0 && (
                          <div style={{
                            width: '2px', height: '10px', marginLeft: '10px', borderRadius: '2px',
                            background: steps[i - 1].done ? `${steps[i - 1].color}66` : 'var(--border-subtle)'
                          }} />
                        )}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          opacity: lit ? 1 : 0.55
                        }}>
                          <span style={{
                            width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.62rem', fontWeight: '900',
                            background: lit ? `${step.color}22` : 'var(--surface-muted)',
                            border: `1px solid ${lit ? step.color + '55' : 'var(--border-subtle)'}`,
                            color: lit ? step.color : 'var(--text-secondary)'
                          }}>{step.done ? '✓' : i + 1}</span>
                          <span style={{
                            fontSize: '0.74rem', fontWeight: '700', textAlign: 'left',
                            color: lit ? 'var(--text-primary)' : 'var(--text-secondary)'
                          }}>{step.label}</span>
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
                    style={{ width: 'auto', marginTop: '6px' }}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', marginTop: '6px' }}>
                    {healthAvailable && (
                      <button onClick={handleConnectHealth} className="hover-lift" style={{
                        padding: '12px 26px', borderRadius: '16px',
                        background: 'linear-gradient(145deg, #4285F4, #3367d6)', color: 'white',
                        fontWeight: '800', fontSize: 'clamp(0.8rem, 1.5vh, 0.9rem)',
                        border: 'none', cursor: 'pointer',
                        boxShadow: '0 8px 28px rgba(66, 133, 244, 0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
                        display: 'flex', gap: '8px', alignItems: 'center', letterSpacing: '0.3px',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}>
                        <Activity size={18} /> {t('cardio.healthConnect')}
                      </button>
                    )}
                  </div>
                )}
              </div>
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


