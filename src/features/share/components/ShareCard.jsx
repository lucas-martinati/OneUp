import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  getIcon, EXERCISE_ICONS, UI_ICONS, SOCIAL_ICONS, SHARE_ICONS,
  Clock, Target, Award, Flame 
} from '../../../utils/icons';
import { getExerciseLabel, getExerciseColor, isCustomExercise } from '../../../utils/exerciseLabel';
import { sumExerciseReps } from '../../../utils/stats';
import { CATEGORIES } from '../../../config/categories';
import { WEIGHT_EXERCISES } from '../../../config/weights';
import { formatDuration } from '../../../utils/dateUtils';

function formatDate(dateStr, lang) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(lang || undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

// eslint-disable-next-line no-unused-vars
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
        const Icon = getIcon(ex.icon);
        return <Icon key={ex.id || i} size={size} color={getExerciseColor(ex)} />;
      })}
    </div>
  );
}

function HistoryRow({ session, t, lang }) {
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
        {formatDate(session.date, lang)}
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
            {t('dashboard.session', 'S\u00e9ance')}
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
        const Icon = getIcon(ex.icon);
        return (
          <div key={ex.id || i} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '7px 10px', borderRadius: '10px',
            background: `${getExerciseColor(ex)}0a`,
          }}>
            <Icon size={13} color={getExerciseColor(ex)} />
            <span style={{
              flex: 1, fontSize: '0.7rem', fontWeight: 600,
              color: getExerciseColor(ex),
            }}>
              {getExerciseLabel(ex, t)}
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
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const weightIds = WEIGHT_EXERCISES.map(e => e.id);
  const isGlobal = mode === 'global';
  const allExercises = sessionData?.exercises || [];
  const sessionType = sessionData?.type || CATEGORIES.BODYWEIGHT;

  const theme = options.theme || 'dark';
  const THEMES = {
    dark: { bg: 'linear-gradient(165deg, #0f0f1a 0%, #0a0a14 40%, #0d0d18 100%)', accent: '#818cf8', glow1: 'rgba(129,140,248,0.15)', glow2: 'rgba(139,92,246,0.1)', streakGlow: 'rgba(249,115,22,0.18)' },
    ocean: { bg: 'linear-gradient(165deg, #0a1628 0%, #061018 40%, #081420 100%)', accent: '#06b6d4', glow1: 'rgba(6,182,212,0.15)', glow2: 'rgba(14,116,144,0.1)', streakGlow: 'rgba(34,211,238,0.18)' },
    sunset: { bg: 'linear-gradient(165deg, #1a0a0a 0%, #0f0505 40%, #150808 100%)', accent: '#f97316', glow1: 'rgba(249,115,22,0.15)', glow2: 'rgba(220,38,38,0.1)', streakGlow: 'rgba(249,115,22,0.2)' },
    forest: { bg: 'linear-gradient(165deg, #0a1a0f 0%, #050d07 40%, #081209 100%)', accent: '#22c55e', glow1: 'rgba(34,197,94,0.15)', glow2: 'rgba(20,83,45,0.1)', streakGlow: 'rgba(74,222,128,0.18)' },
    purple: { bg: 'linear-gradient(165deg, #120a1a 0%, #0a0610 40%, #0f0814 100%)', accent: '#a855f7', glow1: 'rgba(168,85,247,0.15)', glow2: 'rgba(126,34,206,0.1)', streakGlow: 'rgba(192,132,252,0.18)' },
  };
  const currentTheme = THEMES[theme] || THEMES.dark;

  // Categorize exercises
  const isWeightEx = (ex) => weightIds.includes(ex.id);
  const isCustomEx = (ex) => isCustomExercise(ex.id) || (!weightIds.includes(ex.id) && sessionType === CATEGORIES.CUSTOM);
  const hasWeightEx = allExercises.some(isWeightEx);
  const hasCustomEx = allExercises.some(isCustomEx);
  const showCategoriesSeparately = options.showWeights && (hasWeightEx || hasCustomEx);

  const bodyweightExercises = showCategoriesSeparately
    ? allExercises.filter(ex => !isWeightEx(ex) && !isCustomEx(ex))
    : allExercises;
  const weightExercises = allExercises.filter(isWeightEx);
  const customExercises = allExercises.filter(isCustomEx);
  const categories = [
    bodyweightExercises.length > 0 && { key: CATEGORIES.BODYWEIGHT, exercises: bodyweightExercises, label: t('common.bodyweight'), color: '#34d399' },
    weightExercises.length > 0 && { key: CATEGORIES.WEIGHTS, exercises: weightExercises, label: t('common.weights'), color: '#f97316' },
    customExercises.length > 0 && { key: CATEGORIES.CUSTOM, exercises: customExercises, label: t('common.custom'), color: '#8b5cf6' },
  ].filter(Boolean);
  const showSections = showCategoriesSeparately && categories.length > 1;

  // For global mode, filter sessions by selected categories and recompute stats
  const selectedCats = isGlobal
    ? (options.statsCategories || Object.values(CATEGORIES))
    : null;
  const filteredStats = isGlobal ? (() => {
    let totalReps = 0;
    let exerciseCount = 0;
    
    if (stats && stats.exerciseStats && stats.exerciseStats.length > 0) {
      const countedIds = new Set();
      
      for (const ex of stats.exerciseStats) {
        if (ex.totalReps > 0 && ex.id) {
          let cat = CATEGORIES.BODYWEIGHT;
          if (isWeightEx(ex)) cat = CATEGORIES.WEIGHTS;
          else if (isCustomEx(ex)) cat = CATEGORIES.CUSTOM;
          
          if (selectedCats.includes(cat)) {
            totalReps += ex.totalReps;
            if (!countedIds.has(ex.id)) {
              countedIds.add(ex.id);
              exerciseCount++;
            }
          }
        }
      }
    } else if (stats?.globalTotalReps) {
      totalReps = stats.globalTotalReps;
      const countedIds = new Set();
      if (stats.exerciseStats) {
        for (const ex of stats.exerciseStats) {
          if (ex.totalReps > 0 && ex.id) {
            let cat = CATEGORIES.BODYWEIGHT;
            if (isWeightEx(ex)) cat = CATEGORIES.WEIGHTS;
            else if (isCustomEx(ex)) cat = CATEGORIES.CUSTOM;
            
            if (selectedCats.includes(cat) && !countedIds.has(ex.id)) {
              countedIds.add(ex.id);
              exerciseCount++;
            }
          }
        }
      }
      if (exerciseCount === 0) {
        exerciseCount = stats.exerciseStats?.filter(ex => ex.totalReps > 0).length || 0;
      }
    }
    return { totalReps, exerciseCount };
  })() : null;

  const totalReps = isGlobal
    ? (filteredStats?.totalReps || 0)
    : sumExerciseReps(allExercises);
  const duration = sessionData?.duration || 0;
  const streak = stats?.displayStreak || 0;
  const streakActive = stats?.streakActive || false;
  const exerciseCount = isGlobal ? (filteredStats?.exerciseCount || 0) : allExercises.length;
  const totalDays = isGlobal ? (stats?.totalDays || 0) : 0;
  const maxStreak = stats?.maxStreak || 0;
  const dateStr = sessionData?.date
    ? formatDate(sessionData.date, lang)
    : formatDate(new Date().toISOString(), lang);

  return (
    <div
      ref={cardRef}
      style={{
        width: '100%',
        maxWidth: '360px',
        borderRadius: '20px',
        overflow: 'hidden',
        fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
        position: 'relative',
      }}
    >
      {/* Background gradient or image */}
      <div style={{
        position: 'absolute', inset: 0,
        background: options.backgroundImage 
          ? `center / cover no-repeat url(${options.backgroundImage})`
          : currentTheme.bg,
      }} />
      
      {/* Overlay for readability when background image is present */}
      {options.backgroundImage && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(10,10,18,0.75)',
        }} />
      )}

      {/* Accent glow */}
      <div style={{
        position: 'absolute', top: '-40px', right: '-40px',
        width: '160px', height: '160px', borderRadius: '50%',
        background: options.showStreak && streak > 0
          ? 'rgba(249,115,22,0.18)'
          : currentTheme.glow1,
        filter: 'blur(20px)',
      }} />
      <div style={{
        position: 'absolute', bottom: '-30px', left: '-30px',
        width: '120px', height: '120px', borderRadius: '50%',
        background: currentTheme.glow2,
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
              background: `linear-gradient(135deg, ${currentTheme.accent}, ${currentTheme.accent})`,
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
              background: `linear-gradient(135deg, ${currentTheme.accent}33, ${currentTheme.accent}26)`,
              border: `1px solid ${currentTheme.accent}33`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Flame size={18} color={currentTheme.accent} />
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
              const cats = options.statsCategories || Object.values(CATEGORIES);
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
                      {t(`common.${cat}`, cat)}
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
                <>
                  <MetricCard icon={EXERCISE_ICONS.Zap} value={totalReps.toLocaleString()} label={t('stats.totalReps', 'Total reps')} color="#fbbf24" />
                  <MetricCard icon={SHARE_ICONS.Target} value={totalDays} label={t('leaderboard.activeDays', 'Active days')} color="#34d399" />
                  <MetricCard icon={SOCIAL_ICONS.Award} value={`${maxStreak}j`} label={t('common.bestStreak', 'Best streak')} color="#8b5cf6" />
                </>
              )}
            </>
          ) : (
            <>
              {options.showDuration && (
                <MetricCard icon={SHARE_ICONS.Clock} value={formatDuration(duration)} label={t('share.duration', 'Dur\u00e9e')} color="#818cf8" />
              )}
              {options.showVolume && (
                <MetricCard icon={EXERCISE_ICONS.Zap} value={totalReps} label={t('customExercises.typeReps', 'Reps')} color="#fbbf24" />
              )}
              {options.showExercises && (
                <MetricCard icon={EXERCISE_ICONS.Dumbbell} value={exerciseCount} label={t('share.exercises', 'Exercices')} color="#34d399" />
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
              <HistoryRow key={session.id || i} session={session} t={t} lang={lang} />
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
