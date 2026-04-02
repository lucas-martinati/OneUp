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

function resolveExerciseName(ex, t) {
  // If label has uppercase or accented chars, it's a proper name
  if (ex.label && /[A-Z\u00C0-\u017F]/.test(ex.label)) return ex.label;
  // If id starts with custom_, just use the label as-is (no i18n)
  if (ex.id?.startsWith('custom_')) return ex.label || ex.id;
  // Try i18n lookup, fallback to label or id
  return t('exercises.' + ex.id, { defaultValue: ex.label || ex.id });
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

function SessionIcons({ exercises, size = 11 }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', alignItems: 'center' }}>
      {exercises.map((ex, i) => {
        const Icon = ICON_MAP[ex.icon] || Dumbbell;
        return <Icon key={ex.id || i} size={size} color={ex.color || '#818cf8'} />;
      })}
    </div>
  );
}

function HistoryRow({ session, t }) {
  const hasName = session.name && session.name.trim().length > 0;

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
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {hasName ? (
          <>
            <span style={{
              fontSize: '0.6rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {session.name}
            </span>
            {session.exercises?.length > 0 && <SessionIcons exercises={session.exercises} />}
          </>
        ) : session.exercises?.length > 0 ? (
          <SessionIcons exercises={session.exercises} size={13} />
        ) : (
          <span style={{
            fontSize: '0.6rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)',
          }}>
            {t('share.session', 'S\u00e9ance')}
          </span>
        )}
      </div>
      <span style={{
        fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500,
      }}>
        {formatDuration(session.duration)}
      </span>
    </div>
  );
}

function ExerciseList({ exercises, t }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
              {resolveExerciseName(ex, t)}
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

  const WEIGHT_IDS = ['biceps_curl','hammer_curl','bench_press','overhead_press','squat_weights','deadlift','barbell_row'];
  const isGlobal = mode === 'global';
  const allExercises = sessionData?.exercises || [];
  const sessionType = sessionData?.type || 'bodyweight';

  // Categorize exercises
  const isWeightEx = (ex) => WEIGHT_IDS.includes(ex.id);
  const isCustomEx = (ex) => ex.id?.startsWith('custom_') || (!WEIGHT_IDS.includes(ex.id) && sessionType === 'custom');
  const hasWeightEx = allExercises.some(isWeightEx);
  const hasCustomEx = allExercises.some(isCustomEx);
  const showCategoriesSeparately = options.showWeights && (hasWeightEx || hasCustomEx);

  const bodyweightExercises = showCategoriesSeparately
    ? allExercises.filter(ex => !isWeightEx(ex) && !isCustomEx(ex))
    : allExercises;
  const weightExercises = allExercises.filter(isWeightEx);
  const customExercises = allExercises.filter(isCustomEx);
  const categories = [
    bodyweightExercises.length > 0 && { key: 'bodyweight', exercises: bodyweightExercises, label: t('share.bodyweight', 'Poids du corps'), color: '#34d399' },
    weightExercises.length > 0 && { key: 'weights', exercises: weightExercises, label: t('share.weights', 'Musculation'), color: '#f97316' },
    customExercises.length > 0 && { key: 'custom', exercises: customExercises, label: t('share.customEx', 'Perso'), color: '#8b5cf6' },
  ].filter(Boolean);
  const showSections = showCategoriesSeparately && categories.length > 1;

  // For global mode, filter sessions by selected categories and recompute stats
  const selectedCats = isGlobal
    ? (options.statsCategories || ['bodyweight', 'weights', 'custom'])
    : null;
  const filteredHistory = isGlobal
    ? (sessionHistory || []).filter(s => selectedCats.includes(s.type || 'bodyweight'))
    : sessionHistory;
  const filteredStats = isGlobal ? (() => {
    let totalReps = 0;
    const uniqueDays = new Set();
    let exerciseCount = 0;
    for (const s of filteredHistory) {
      if (s.date) uniqueDays.add(s.date.slice(0, 10));
      for (const ex of (s.exercises || [])) {
        totalReps += (ex.reps || 0);
        exerciseCount++;
      }
    }
    return { totalReps, totalDays: uniqueDays.size, exerciseCount };
  })() : null;

  const totalReps = isGlobal
    ? (filteredStats?.totalReps || 0)
    : allExercises.reduce((sum, ex) => sum + (ex.reps || 0), 0);
  const duration = sessionData?.duration || 0;
  const streak = stats?.displayStreak || 0;
  const streakActive = stats?.streakActive || false;
  const exerciseCount = isGlobal ? (filteredStats?.exerciseCount || 0) : allExercises.length;
  const totalDays = isGlobal ? (filteredStats?.totalDays || 0) : 0;
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

          {/* Top-right: flame badge or default */}
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
              <Flame size={20} color={streakActive ? '#f97316' : '#888'} fill={streakActive ? '#f97316' : 'none'} />
              <span style={{
                fontSize: '1.1rem', fontWeight: 800,
                color: streakActive ? '#f97316' : '#888', lineHeight: 1,
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
          <div>
            <div style={{
              fontSize: '0.75rem', fontWeight: 600,
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase', letterSpacing: '1px',
            }}>
              {t('share.globalStats', 'Statistiques globales')}
            </div>
            {(() => {
              const cats = options.statsCategories || ['bodyweight','weights','custom'];
              const allSelected = cats.length === 3;
              if (allSelected) return null;
              const catColors = { bodyweight: '#34d399', weights: '#f97316', custom: '#8b5cf6' };
              return (
                <div style={{
                  display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap',
                }}>
                  {cats.map(cat => (
                    <span key={cat} style={{
                      fontSize: '0.5rem', fontWeight: 700,
                      color: catColors[cat] || '#818cf8',
                      padding: '2px 6px', borderRadius: '4px',
                      background: `${catColors[cat] || '#818cf8'}15`,
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}>
                      {t(`share.cat.${cat}`, cat)}
                    </span>
                  ))}
                </div>
              );
            })()}
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
                <MetricCard icon={Zap} value={totalReps} label={t('share.reps', 'Reps')} color="#fbbf24" />
              )}
              {options.showExercises && (
                <MetricCard icon={Dumbbell} value={exerciseCount} label={t('share.exercises', 'Exercices')} color="#34d399" />
              )}
            </>
          )}
        </div>

        {/* Exercise list (session mode) - separated by type if showWeights and pro */}
        {!isGlobal && allExercises.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {showSections ? (
              categories.map(cat => (
                <div key={cat.key}>
                  <div style={{
                    fontSize: '0.55rem', fontWeight: 700,
                    color: cat.color, opacity: 0.7,
                    textTransform: 'uppercase', letterSpacing: '1px',
                    marginBottom: '4px',
                  }}>
                    {cat.label}
                  </div>
                  <ExerciseList exercises={cat.exercises} t={t} />
                </div>
              ))
            ) : (
              <ExerciseList exercises={allExercises} t={t} />
            )}
          </div>
        )}

        {/* Session history mini list */}
        {options.showSessionHistory && filteredHistory.length > 0 && (
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
            {filteredHistory.slice(0, 5).map((session, i) => (
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
