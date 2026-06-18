import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  getIcon, EXERCISE_ICONS, SOCIAL_ICONS, SHARE_ICONS,
  Clock, Award, Flame 
} from '../../../utils/icons';
import { getExerciseLabel, getExerciseColor, isCustomExercise } from '../../../utils/exerciseLabel';
import { sumExerciseReps } from '../../../utils/stats';
import { CATEGORIES, CATEGORY_COLORS, CATEGORY_ORDER, buildFullCategoryOrder, buildFullCategoryColors, isUserCategory } from '../../../config/categories';
import { EXERCISES, CARDIO_EXERCISES, getDailyGoal } from '../../../config/exercises';
import { WEIGHT_EXERCISES } from '../../../config/weights';
import { formatDuration, getLocalDateStr, getCurrentWeekNumber } from '../../../utils/dateUtils';
import { useExerciseConfig } from '../../../hooks/useExerciseConfig';
import { DifficultyBadge } from '../../../components/ui/DifficultyBadge';
import { useExercises } from '../../../contexts/ExercisesContext';
import { THEMES as GLOBAL_THEMES } from '../../../config/themes';

function formatDate(dateStr, lang) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(lang || undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

function MetricCard({ icon: Icon, value, label, color, isVisible = true }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: '4px', minWidth: 0,
      flex: isVisible ? 1 : 0,
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(10px)',
      width: isVisible ? 'auto' : 0,
      pointerEvents: isVisible ? 'auto' : 'none',
      overflow: 'hidden',
      transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '100%' }}>
        <div style={{ color: color, transition: 'color 0.5s ease' }}>
          <Icon size={18} color="currentColor" strokeWidth={2.5} />
        </div>
        <span style={{
          fontSize: '1.2rem', fontWeight: 800, color: '#ffffff',
          lineHeight: 1, letterSpacing: '-0.02em',
        }}>{value}</span>
        <span style={{
          fontSize: '0.6rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)',
          textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center',
          whiteSpace: 'nowrap'
        }}>{label}</span>
      </div>
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
            {t('dashboard.session')}
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
              display: 'flex', alignItems: 'center'
            }}>
              {ex.type === 'timer' ? `${ex.reps}s` : `\u00d7${ex.reps}`}
              {ex.weight ? ` • ${ex.weight} ${t('weight.kg')}` : ''}
              <DifficultyBadge difficulty={ex.difficulty} />
            </span>
          </div>
        );
      })}
    </div>
  );
}

function darkenHex(hex, factor) {
  if (!hex || !hex.startsWith('#')) return hex;
  let color = hex.replace('#', '');
  if (color.length === 3) color = color.split('').map(c => c + c).join('');
  let r = parseInt(color.substring(0, 2), 16);
  let g = parseInt(color.substring(2, 4), 16);
  let b = parseInt(color.substring(4, 6), 16);
  r = Math.floor(r * factor);
  g = Math.floor(g * factor);
  b = Math.floor(b * factor);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function hexToRgba(hex, alpha) {
  if (!hex || !hex.startsWith('#')) return hex;
  let color = hex.replace('#', '');
  if (color.length === 3) color = color.split('').map(c => c + c).join('');
  let r = parseInt(color.substring(0, 2), 16);
  let g = parseInt(color.substring(2, 4), 16);
  let b = parseInt(color.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const THEMES = {};
GLOBAL_THEMES.forEach(t => {
  THEMES[t.key] = {
    bg: `linear-gradient(165deg, ${t.color} 0%, ${darkenHex(t.color, 0.6)} 40%, ${darkenHex(t.color, 0.8)} 100%)`,
    accent: t.accent,
    glow1: hexToRgba(t.accent, 0.15),
    glow2: hexToRgba(t.accent2 || t.accent, 0.1),
    streakGlow: hexToRgba(t.accent, 0.18)
  };
});
// Add gold theme for perfect days
THEMES.gold = { 
  bg: 'linear-gradient(165deg, #1a1305 0%, #171104 40%, #1f1b0a 100%)', 
  accent: '#fbbf24', 
  glow1: 'rgba(251,191,36,0.15)', 
  glow2: 'rgba(245,158,11,0.1)', 
  streakGlow: 'rgba(251,191,36,0.18)' 
};

/**
 * ShareCard - Visual card rendered for export.
 * Supports two modes:
 *   - 'session': current workout session data
 *   - 'global': global stats from Stats screen
 */
export function ShareCard({ cardRef, sessionData, stats, sessionHistory, completions, getDayNumber, settings, options, mode = 'session' }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { getConfig } = useExerciseConfig();
  const { customCategories } = useExercises();
  const fullCategoryOrder = buildFullCategoryOrder(customCategories);
  const fullCategoryColors = buildFullCategoryColors(customCategories);

  const weightIds = WEIGHT_EXERCISES.map(e => e.id);
  const isGlobal = mode === 'global';
  const allExercises = (sessionData?.exercises || []).map(ex => ({
    ...ex,
    difficulty: ex.difficulty || (getConfig ? getConfig(ex.id, sessionData?.date).difficulty : 1.0)
  }));
  const sessionType = sessionData?.type || CATEGORIES.BODYWEIGHT;

  let activeThemeKey = options.theme || 'dark';
  let dailyExercises = [];
  let dailyStandardDone = false;
  let dailyWeightsDone = false;

  if (isGlobal && options.showDailyExercises && completions) {
    const targetDate = options.globalDate || new Date().toISOString().split('T')[0];
    const dayNum = getDayNumber ? getDayNumber(targetDate) : 1;
    const dayData = completions[targetDate];
    if (dayData) {
      const allKnownExercises = [...EXERCISES, ...WEIGHT_EXERCISES, ...CARDIO_EXERCISES, ...(stats?.customExercises || [])];
      for (const [exId, exStats] of Object.entries(dayData)) {
        if (exStats?.isCompleted) {
          const knownEx = allKnownExercises.find(e => e.id === exId);
          if (knownEx && !CARDIO_EXERCISES.some(c => c.id === exId)) {
             const conf = getConfig(exId, targetDate);
             dailyExercises.push({
               ...knownEx,
               reps: exStats.count || getDailyGoal(knownEx, dayNum, conf.difficulty) || knownEx.reps || 0,
               weight: exStats.weight,
               difficulty: conf.difficulty
             });
          }
        }
      }

      // Special handling for Cardio: if done anytime in the week, show it as done
      for (const cardio of CARDIO_EXERCISES) {
        let isDoneInWeek = false;
        let weekDate = null;
        
        // Look back until previous Monday to find if done in CURRENT week
        const targetD = new Date(targetDate);
        const dayOfWeek = targetD.getDay(); // 0 is Sunday
        const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        
        for (let i = 0; i <= daysSinceMonday; i++) {
          const checkDate = new Date(targetDate);
          checkDate.setDate(checkDate.getDate() - i);
          const dateStr = getLocalDateStr(checkDate);
          if (completions[dateStr]?.[cardio.id]?.isCompleted) {
            isDoneInWeek = true;
            weekDate = dateStr;
            break;
          }
        }
        
        if (isDoneInWeek) {
          const conf = getConfig(cardio.id, weekDate);
          const weekNum = getCurrentWeekNumber(settings?.startDate || stats?.firstActiveDate, new Date(targetDate));
          dailyExercises.push({
            ...cardio,
            reps: getDailyGoal(cardio, weekNum, conf.difficulty, true),
            difficulty: conf.difficulty
          });
        }
      }

      dailyStandardDone = EXERCISES.every(ex => dayData[ex.id]?.isCompleted);
      dailyWeightsDone = WEIGHT_EXERCISES.length > 0 && WEIGHT_EXERCISES.every(ex => dayData[ex.id]?.isCompleted);
      const isDailyExercisesPerfect = dailyStandardDone || dailyWeightsDone;

      if (isDailyExercisesPerfect) {
        activeThemeKey = 'gold';
      }
    }
  }

  const currentTheme = THEMES[activeThemeKey] || THEMES.dark;

  // Categorize exercises
  const isWeightEx = (ex) => weightIds.includes(ex.id);
  const isCustomEx = (ex) => isCustomExercise(ex.id) || (!weightIds.includes(ex.id) && sessionType === CATEGORIES.CUSTOM);
  const isCardioEx = (ex) => ex.id === 'running' || ex.id === 'cycling';
  const hasWeightEx = allExercises.some(isWeightEx);
  const hasCustomEx = allExercises.some(isCustomEx);
  const hasCardioEx = allExercises.some(isCardioEx);
  const showCategoriesSeparately = options.showWeights && (hasWeightEx || hasCustomEx || hasCardioEx);

  const bodyweightExercises = showCategoriesSeparately
    ? allExercises.filter(ex => !isWeightEx(ex) && !isCustomEx(ex))
    : allExercises;
  const weightExercises = allExercises.filter(isWeightEx);
  const customExercises = allExercises.filter(isCustomEx);
  const categories = fullCategoryOrder.map(key => {
    let exList = [];
    if (key === CATEGORIES.BODYWEIGHT) exList = bodyweightExercises;
    if (key === CATEGORIES.WEIGHTS) exList = weightExercises;
    if (key === CATEGORIES.CUSTOM) exList = customExercises;
    if (key === CATEGORIES.CARDIO) exList = allExercises.filter(isCardioEx);
    if (exList.length === 0) return null;
    let label;
    if (isUserCategory(key)) {
      const catDef = customCategories.find(c => c.id === key);
      label = catDef?.name || key;
    } else {
      const catDef = customCategories.find(c => c.id === key);
      label = catDef?.name || t(`common.${key}`);
    }
    return { 
      key, 
      exercises: exList, 
      label, 
      color: fullCategoryColors[key] 
    };
  }).filter(Boolean);
  const showSections = showCategoriesSeparately && categories.length > 1;

  const selectedCats = isGlobal
    ? (options.statsCategories || Object.values(CATEGORIES))
    : Object.values(CATEGORIES);

  const filteredDailyExercises = isGlobal ? dailyExercises.filter(ex => {
    if (isCustomEx(ex)) return selectedCats.includes(CATEGORIES.CUSTOM);
    if (isWeightEx(ex)) return selectedCats.includes(CATEGORIES.WEIGHTS);
    if (isCardioEx(ex)) return selectedCats.includes(CATEGORIES.CARDIO);
    return selectedCats.includes(CATEGORIES.BODYWEIGHT);
  }) : dailyExercises;

  // Categorize daily exercises (for global mode)
  const hasDailyWeightEx = filteredDailyExercises.some(isWeightEx);
  const hasDailyCustomEx = filteredDailyExercises.some(isCustomEx);
  const hasDailyCardioEx = filteredDailyExercises.some(isCardioEx);
  const shouldSeparateDaily = hasDailyWeightEx || hasDailyCustomEx || hasDailyCardioEx;

  const dailyBodyweight = shouldSeparateDaily ? filteredDailyExercises.filter(ex => !isWeightEx(ex) && !isCustomEx(ex) && !isCardioEx(ex)) : filteredDailyExercises;
  const dailyWeight = shouldSeparateDaily ? filteredDailyExercises.filter(isWeightEx) : [];
  const dailyCustom = shouldSeparateDaily ? filteredDailyExercises.filter(isCustomEx) : [];
  const dailyCardio = shouldSeparateDaily ? filteredDailyExercises.filter(isCardioEx) : [];
  const dailyCategories = fullCategoryOrder.map(key => {
    let exList = [];
    let isPerfect = false;
    if (key === CATEGORIES.BODYWEIGHT) { exList = dailyBodyweight; isPerfect = dailyStandardDone; }
    if (key === CATEGORIES.WEIGHTS) { exList = dailyWeight; isPerfect = dailyWeightsDone; }
    if (key === CATEGORIES.CUSTOM) exList = dailyCustom;
    if (key === CATEGORIES.CARDIO) exList = dailyCardio;
    
    if (exList.length === 0) return null;
    let label;
    if (isUserCategory(key)) {
      const catDef = customCategories.find(c => c.id === key);
      label = catDef?.name || key;
    } else {
      const catDef = customCategories.find(c => c.id === key);
      label = catDef?.name || t(`common.${key}`);
    }
    return {
      key,
      exercises: exList,
      label,
      color: fullCategoryColors[key],
      isPerfect
    };
  }).filter(Boolean);
  const showDailySections = shouldSeparateDaily && dailyCategories.length > 1;

  // For global mode, recompute stats for top section
  const filteredStats = isGlobal ? (() => {
    let totalReps = 0;
    let exerciseCount = 0;
    
    if (stats && stats.exerciseStats && stats.exerciseStats.length > 0) {
      const countedIds = new Set();
      
      for (const ex of stats.exerciseStats) {
        if (ex.totalReps > 0 && ex.id) {
          let cat = CATEGORIES.BODYWEIGHT;
          if (isWeightEx(ex)) cat = CATEGORIES.WEIGHTS;
          else if (isCardioEx(ex)) cat = CATEGORIES.CARDIO;
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
      if (selectedCats.includes(CATEGORIES.CARDIO)) {
        totalReps += ((stats?.exerciseReps?.['running'] || 0) + (stats?.exerciseReps?.['cycling'] || 0));
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
        maxWidth: '420px',
        borderRadius: '20px',
        overflow: 'hidden',
        fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
        position: 'relative',
      }}
    >
      {/* Background gradients for smooth transition */}
      {Object.entries(THEMES).map(([key, themeObj]) => (
        <div key={key} style={{
          position: 'absolute', inset: 0,
          background: themeObj.bg,
          opacity: (!options.backgroundImage && activeThemeKey === key) ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }} />
      ))}
      
      <div style={{
        position: 'absolute', inset: 0,
        backgroundColor: 'transparent',
        backgroundImage: options.backgroundImage ? `url(${options.backgroundImage})` : 'none',
        backgroundPosition: `${options.bgPosX ?? 50}% ${options.bgPosY ?? 50}%`,
        backgroundSize: options.bgSize && options.bgSize !== 100 ? `${options.bgSize}%` : 'cover',
        backgroundRepeat: 'no-repeat',
        opacity: options.backgroundImage ? 1 : 0,
      }} />
      
      {/* Overlay for readability when background image is present */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(10,10,18,0.75)',
        opacity: options.backgroundImage ? 1 : 0,
        pointerEvents: 'none',
      }} />

      {/* Accent glow */}
      <div style={{
        position: 'absolute', top: '-40px', right: '-40px',
        width: '160px', height: '160px', borderRadius: '50%',
        background: options.showStreak && streak > 0
          ? 'rgba(249,115,22,0.18)'
          : currentTheme.glow1,
        filter: 'blur(20px)',
        transition: 'background 0.5s ease',
      }} />
      <div style={{
        position: 'absolute', bottom: '-30px', left: '-30px',
        width: '120px', height: '120px', borderRadius: '50%',
        background: currentTheme.glow2,
        filter: 'blur(15px)',
        transition: 'background 0.5s ease',
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
              color: currentTheme.accent,
              transition: 'color 0.5s ease',
            }}>
              OneUp
            </div>
          </div>

          {/* Top-right: flame badge or default */}
          <div style={{ position: 'relative', height: '36px', minWidth: '80px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <div style={{
              position: 'absolute', right: 0,
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: '14px',
              background: streakActive
                ? 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(239,68,68,0.15))'
                : 'rgba(255,255,255,0.06)',
              border: streakActive
                ? '1px solid rgba(249,115,22,0.35)'
                : '1px solid rgba(255,255,255,0.08)',
              opacity: options.showStreak && streak > 0 ? 1 : 0,
              transform: options.showStreak && streak > 0 ? 'scale(1)' : 'scale(0.8)',
              pointerEvents: options.showStreak && streak > 0 ? 'auto' : 'none',
              transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}>
              <Flame size={20} color={streakActive ? '#f97316' : '#888'} fill={streakActive ? '#f97316' : 'none'} />
              <span style={{
                fontSize: '1.1rem', fontWeight: 800,
                color: streakActive ? '#f97316' : '#888', lineHeight: 1,
              }}>
                {streak}
              </span>
            </div>
            <div style={{
              position: 'absolute', right: 0,
              width: '36px', height: '36px', borderRadius: '12px',
              backgroundColor: `${currentTheme.accent}26`,
              border: `1px solid ${currentTheme.accent}33`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: !(options.showStreak && streak > 0) ? 1 : 0,
              transform: !(options.showStreak && streak > 0) ? 'scale(1)' : 'scale(0.8)',
              pointerEvents: !(options.showStreak && streak > 0) ? 'auto' : 'none',
              transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.5s ease, border-color 0.5s ease',
            }}>
              <Flame size={18} color={currentTheme.accent} style={{ transition: 'color 0.5s ease' }} />
            </div>
          </div>
        </div>

        {/* Session title or global label */}
        {isGlobal ? (
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%', gap: '8px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '0.75rem', fontWeight: 700,
                color: activeThemeKey === 'gold' ? '#fbbf24' : 'rgba(255,255,255,0.6)',
                textTransform: 'uppercase', letterSpacing: '1px',
              }}>
                {t('share.globalStats')}
              </div>
              {(() => {
                const catsRaw = options.statsCategories || fullCategoryOrder;
                const cats = fullCategoryOrder.filter(c => catsRaw.includes(c));
                const allSelected = cats.length === fullCategoryOrder.length;
                if (allSelected) return null;
                return (
                  <div style={{
                    display: 'flex', flexWrap: 'wrap', marginTop: '6px',
                  }}>
                    {cats.map(cat => {
                      const catColor = fullCategoryColors[cat] || '#818cf8';
                      let label;
                      if (isUserCategory(cat)) {
                        const catDef = customCategories.find(c => c.id === cat);
                        label = catDef?.name || cat;
                      } else {
                        const catDef = customCategories.find(c => c.id === cat);
                        label = catDef?.name || t(`common.${cat}`, cat);
                      }
                      return (
                        <span key={cat} style={{
                          fontSize: '0.5rem', fontWeight: 700,
                          color: catColor,
                          padding: '2px 6px', borderRadius: '4px',
                          background: `${catColor}15`,
                          textTransform: 'uppercase', letterSpacing: '0.5px',
                          marginRight: '6px', marginBottom: '4px', display: 'inline-block',
                          whiteSpace: 'nowrap'
                        }}>
                          {label}
                        </span>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
            {!showDailySections && activeThemeKey === 'gold' && (
              <div style={{
                padding: '3px 8px', borderRadius: '6px',
                background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.05))',
                border: '1px solid rgba(251,191,36,0.4)',
                boxShadow: '0 0 10px rgba(251,191,36,0.15)',
                color: '#fbbf24', fontSize: '0.55rem', fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '1px',
                display: 'flex', alignItems: 'center', marginLeft: 'auto', height: 'fit-content'
              }}>
                <Award size={10} color="#fbbf24" fill="#fbbf24" style={{ marginRight: '4px' }} />
                {t('common.perfectDays')}
              </div>
            )}
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
              <MetricCard isVisible={options.showVolume} icon={EXERCISE_ICONS.Zap} value={totalReps.toLocaleString()} label={t('stats.totalReps')} color="#fbbf24" />
              <MetricCard isVisible={options.showExercises} icon={SHARE_ICONS.Target} value={totalDays} label={t('leaderboard.activeDays')} color="#34d399" />
              <MetricCard isVisible={options.showDuration} icon={SOCIAL_ICONS.Award} value={`${maxStreak}j`} label={t('common.bestStreak')} color={currentTheme.accent} />
            </>
          ) : (
            <>
              <MetricCard isVisible={options.showDuration} icon={Clock} value={formatDuration(duration)} label={t('share.duration')} color={currentTheme.accent} />
              <MetricCard isVisible={options.showVolume} icon={EXERCISE_ICONS.Zap} value={totalReps} label={t('customExercises.typeReps')} color="#fbbf24" />
              <MetricCard isVisible={options.showExercises} icon={EXERCISE_ICONS.Dumbbell} value={exerciseCount} label={t('share.exercises')} color="#34d399" />
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

        {/* Global Daily Exercises (global mode) */}
        {isGlobal && (
          <div style={{ 
            display: 'flex', flexDirection: 'column', 
            gap: options.showDailyExercises && filteredDailyExercises.length > 0 ? '10px' : '0px',
            maxHeight: options.showDailyExercises && filteredDailyExercises.length > 0 ? '1000px' : '0px',
            opacity: options.showDailyExercises && filteredDailyExercises.length > 0 ? 1 : 0,
            overflow: 'hidden',
            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            paddingTop: options.showDailyExercises && filteredDailyExercises.length > 0 ? '4px' : '0px',
          }}>
            <div style={{
              fontSize: '0.55rem', fontWeight: 700,
              color: currentTheme.accent, opacity: 0.7,
              textTransform: 'uppercase', letterSpacing: '1px',
              marginBottom: '4px',
            }}>
              {formatDate(options.globalDate || new Date().toISOString().split('T')[0], lang)}
            </div>
            {showDailySections ? (
              dailyCategories.map(cat => (
                <div key={cat.key} style={{ transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                    marginBottom: '4px',
                  }}>
                    <div style={{
                      fontSize: '0.55rem', fontWeight: 700,
                      color: cat.color, opacity: 0.7,
                      textTransform: 'uppercase', letterSpacing: '1px',
                    }}>
                      {cat.label}
                    </div>
                    {cat.isPerfect && (
                      <div style={{
                        padding: '3px 8px', borderRadius: '6px',
                        background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.05))',
                        border: '1px solid rgba(251,191,36,0.4)',
                        boxShadow: '0 0 10px rgba(251,191,36,0.15)',
                        color: '#fbbf24', fontSize: '0.55rem', fontWeight: 800,
                        textTransform: 'uppercase', letterSpacing: '1px',
                        display: 'flex', alignItems: 'center', gap: '4px'
                      }}>
                        <Award size={10} color="#fbbf24" fill="#fbbf24" />
                        {t('common.perfectDays')}
                      </div>
                    )}
                  </div>
                  <ExerciseList exercises={cat.exercises} t={t} />
                </div>
              ))
            ) : (
              <ExerciseList exercises={filteredDailyExercises} t={t} />
            )}
          </div>
        )}

        {/* Session history mini list */}
        <div style={{
          padding: options.showSessionHistory && sessionHistory.length > 0 ? '12px' : '0 12px',
          borderRadius: '14px',
          background: 'rgba(255,255,255,0.03)',
          border: options.showSessionHistory && sessionHistory.length > 0 ? '1px solid rgba(255,255,255,0.05)' : '0px solid rgba(255,255,255,0)',
          maxHeight: options.showSessionHistory && sessionHistory.length > 0 ? '400px' : '0px',
          opacity: options.showSessionHistory && sessionHistory.length > 0 ? 1 : 0,
          overflow: 'hidden',
          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}>
          <div style={{
            fontSize: '0.55rem', fontWeight: 700,
            color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase', letterSpacing: '1px',
            marginBottom: '8px',
          }}>
            {t('share.recentSessions')}
          </div>
          {sessionHistory.slice(0, 5).map((session, i) => (
            <HistoryRow key={session.id || i} session={session} t={t} lang={lang} />
          ))}
        </div>

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
