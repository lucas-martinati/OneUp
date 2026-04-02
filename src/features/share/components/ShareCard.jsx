import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dumbbell, Flame, Zap, Clock, Target, Award } from 'lucide-react';
import ICON_MAP from '../../../utils/iconMap';

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0min';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h${m > 0 ? String(m).padStart(2, '0') : ''}`;
  return `${m}min`;
}

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

function MetricCard({ icon: Icon, value, label, color }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: '4px', flex: 1, minWidth: 0,
    }}>
      <Icon size={18} color={color} strokeWidth={2.5} />
      <span style={{
        fontSize: '1.2rem', fontWeight: 800, color: '#ffffff',
        lineHeight: 1, letterSpacing: '-0.02em',
      }}>{value}</span>
      <span style={{
        fontSize: '0.6rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase', letterSpacing: '0.5px',
      }}>{label}</span>
    </div>
  );
}

function HistoryRow({ session, t }) {
  const exCount = session.exercises?.length || 0;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <span style={{
        fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', width: '52px', flexShrink: 0,
        fontWeight: 500,
      }}>
        {formatDate(session.date)}
      </span>
      <span style={{
        flex: 1, fontSize: '0.6rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {session.name || t('share.session', 'S\u00e9ance')}
      </span>
      <span style={{
        fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500,
      }}>
        {formatDuration(session.duration)}
      </span>
      <span style={{
        fontSize: '0.55rem', color: 'rgba(129,140,248,0.8)', fontWeight: 600,
      }}>
        {exCount} ex
      </span>
    </div>
  );
}

/**
 * ShareCard - Visual card rendered for export.
 * Supports two modes:
 *   - 'session': current workout session data
 *   - 'global': global stats from Stats screen
 */
export function ShareCard({ cardRef, sessionData, stats, sessionHistory, options, mode = 'session' }) {
  const { t } = useTranslation();

  const isGlobal = mode === 'global';
  const exercises = sessionData?.exercises || [];
  const totalReps = isGlobal
    ? (stats?.globalTotalReps || 0)
    : exercises.reduce((sum, ex) => sum + (ex.reps || 0), 0);
  const duration = sessionData?.duration || 0;
  const streak = stats?.displayStreak || 0;
  const streakActive = stats?.streakActive || false;
  const exerciseCount = isGlobal ? (stats?.totalExerciseCompletions || 0) : exercises.length;
  const totalDays = stats?.totalDays || 0;
  const maxStreak = stats?.maxStreak || 0;
  const dateStr = sessionData?.date
    ? formatDate(sessionData.date)
    : formatDate(new Date().toISOString());

  return (
    <div
      ref={cardRef}
      style={{
        width: '360px',
        borderRadius: '20px',
        overflow: 'hidden',
        fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
        position: 'relative',
      }}
    >
      {/* Background gradient */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(165deg, #0f0f1a 0%, #0a0a14 40%, #0d0d18 100%)',
      }} />

      {/* Accent glow */}
      <div style={{
        position: 'absolute', top: '-40px', right: '-40px',
        width: '160px', height: '160px', borderRadius: '50%',
        background: options.showStreak && streak > 0
          ? 'radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(129,140,248,0.15) 0%, transparent 70%)',
        filter: 'blur(20px)',
      }} />
      <div style={{
        position: 'absolute', bottom: '-30px', left: '-30px',
        width: '120px', height: '120px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
        filter: 'blur(15px)',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 1,
        padding: '24px 20px 20px',
        display: 'flex', flexDirection: 'column', gap: '16px',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{
              fontSize: '0.55rem', fontWeight: 600,
              color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase', letterSpacing: '1.5px',
            }}>
              {dateStr}
            </div>
            <div style={{
              fontSize: '1.3rem', fontWeight: 800, marginTop: '4px',
              background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              OneUp
            </div>
          </div>

          {/* Top-right icon: flame with streak or default icon */}
          {options.showStreak && streak > 0 ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: '14px',
              background: streakActive
                ? 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(239,68,68,0.15))'
                : 'rgba(255,255,255,0.06)',
              border: streakActive
                ? '1px solid rgba(249,115,22,0.35)'
                : '1px solid rgba(255,255,255,0.08)',
            }}>
              <Flame
                size={20}
                color={streakActive ? '#f97316' : '#888'}
                fill={streakActive ? '#f97316' : 'none'}
              />
              <span style={{
                fontSize: '1.1rem', fontWeight: 800,
                color: streakActive ? '#f97316' : '#888',
                lineHeight: 1,
              }}>
                {streak}
              </span>
            </div>
          ) : (
            <div style={{
              width: '36px', height: '36px', borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(129,140,248,0.2), rgba(139,92,246,0.15))',
              border: '1px solid rgba(129,140,248,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Flame size={18} color="#818cf8" />
            </div>
          )}
        </div>

        {/* Session title or global label */}
        {isGlobal ? (
          <div style={{
            fontSize: '0.75rem', fontWeight: 600,
            color: 'rgba(255,255,255,0.5)',
            textTransform: 'uppercase', letterSpacing: '1px',
          }}>
            {t('share.globalStats', 'Statistiques globales')}
          </div>
        ) : sessionData?.name ? (
          <div style={{
            fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)',
          }}>
            {sessionData.name}
          </div>
        ) : null}

        {/* Metrics row */}
        <div style={{
          display: 'flex', gap: '8px',
          padding: '16px 12px',
          borderRadius: '16px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {isGlobal ? (
            <>
              {options.showVolume && (
                <MetricCard icon={Zap} value={totalReps.toLocaleString()} label={t('share.totalReps', 'Reps totales')} color="#fbbf24" />
              )}
              {options.showExercises && (
                <MetricCard icon={Target} value={totalDays} label={t('share.activeDays', 'Jours actifs')} color="#34d399" />
              )}
              {options.showDuration && maxStreak > 0 && (
                <MetricCard icon={Award} value={`${maxStreak}j`} label={t('share.bestStreak', 'Meilleure s\u00e9rie')} color="#8b5cf6" />
              )}
            </>
          ) : (
            <>
              {options.showDuration && (
                <MetricCard icon={Clock} value={formatDuration(duration)} label={t('share.duration', 'Dur\u00e9e')} color="#818cf8" />
              )}
              {options.showVolume && (
                <MetricCard icon={Zap} value={totalReps} label={t('share.volume', 'Volume')} color="#fbbf24" />
              )}
              {options.showExercises && (
                <MetricCard icon={Dumbbell} value={exerciseCount} label={t('share.exercises', 'Exercices')} color="#34d399" />
              )}
            </>
          )}
        </div>

        {/* Exercise list (session mode only) */}
        {!isGlobal && exercises.length > 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '4px',
          }}>
            {exercises.map((ex, i) => {
              const Icon = ICON_MAP[ex.icon] || Dumbbell;
              return (
                <div key={ex.id || i} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '7px 10px', borderRadius: '10px',
                  background: `${ex.color || '#818cf8'}0a`,
                }}>
                  <Icon size={13} color={ex.color || '#818cf8'} />
                  <span style={{
                    flex: 1, fontSize: '0.7rem', fontWeight: 600,
                    color: ex.color || '#818cf8',
                  }}>
                    {ex.label || ex.id}
                  </span>
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700, color: '#10b981',
                  }}>
                    {ex.type === 'timer' ? `${ex.reps}s` : `\u00d7${ex.reps}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Session history mini list */}
        {options.showSessionHistory && sessionHistory.length > 0 && (
          <div style={{
            padding: '12px',
            borderRadius: '14px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{
              fontSize: '0.55rem', fontWeight: 700,
              color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase', letterSpacing: '1px',
              marginBottom: '8px',
            }}>
              {t('share.recentSessions', 'S\u00e9ances r\u00e9centes')}
            </div>
            {sessionHistory.slice(0, 5).map((session, i) => (
              <HistoryRow key={session.id || i} session={session} t={t} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: '4px',
        }}>
          <span style={{
            fontSize: '0.5rem', color: 'rgba(255,255,255,0.25)',
            fontWeight: 500,
          }}>
            oneup.app
          </span>
          <div style={{
            display: 'flex', gap: '3px',
          }}>
            {['#818cf8', '#fbbf24', '#34d399', '#ef4444', '#8b5cf6'].map(c => (
              <div key={c} style={{
                width: '4px', height: '4px', borderRadius: '50%', background: c, opacity: 0.6,
              }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
