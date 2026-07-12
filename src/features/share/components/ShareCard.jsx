import React, { useRef, useState, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getIcon, EXERCISE_ICONS, SOCIAL_ICONS, SHARE_ICONS,
  Clock, Award, Flame
} from '@utils/icons';
import { getExerciseLabel, getExerciseColor } from '@utils/exerciseLabel';
import { APP_URL_DISPLAY } from '@config/app';
import { parseLocalDate } from '@shared/dateUtils';
import { formatDuration } from '@utils/formatters';
import { useExerciseConfig } from '@hooks/useExerciseConfig';
import { DifficultyBadge } from '@components/ui/DifficultyBadge';
import { useExercises } from '@contexts/ExercisesContext';
import { buildCardModel, CARD_WIDTH, resolveCardFormat } from '@features/share/services/cardModel';
import { CARD_THEMES } from './cardThemes';

const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
const INITIAL_EXTRAS = { hero: 0, footer: 0, format: null };

function formatDate(dateStr, lang) {
  try {
    const d = parseLocalDate(dateStr);
    return d.toLocaleDateString(lang || undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

/** Big primary stat — the one number the card is about. */
function HeroStat({ value, label, isVisible }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
      maxHeight: isVisible ? '120px' : '0px',
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'scale(1)' : 'scale(0.9)',
      overflow: 'hidden',
      transition: `all 0.4s ${SPRING}`,
    }}>
      <span style={{
        fontSize: '64px', fontWeight: 800, color: '#ffffff',
        lineHeight: 1, letterSpacing: '-0.03em',
      }}>{value}</span>
      <span style={{
        fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase', letterSpacing: '2px',
        whiteSpace: 'nowrap',
      }}>{label}</span>
    </div>
  );
}

/** Secondary metric tile; collapses horizontally when its option is off. */
function MetricTile({ icon: Icon, value, label, color, isVisible = true }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: '6px', minWidth: 0,
      padding: isVisible ? '14px 12px' : '14px 0',
      borderRadius: '16px',
      background: isVisible ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0)',
      border: `1px solid ${isVisible ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0)'}`,
      flex: isVisible ? 1 : 0,
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(10px)',
      width: isVisible ? 'auto' : 0,
      pointerEvents: 'none',
      overflow: 'hidden',
      transition: `all 0.4s ${SPRING}`,
    }}>
      <div style={{ color, transition: 'color 0.5s ease' }}>
        <Icon size={20} color="currentColor" strokeWidth={2.5} />
      </div>
      <span style={{
        fontSize: '22px', fontWeight: 800, color: '#ffffff',
        lineHeight: 1, letterSpacing: '-0.02em', whiteSpace: 'nowrap',
      }}>{value}</span>
      <span style={{
        fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center',
        whiteSpace: 'nowrap',
      }}>{label}</span>
    </div>
  );
}

function SessionIcons({ exercises, size = 13 }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
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
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <span style={{
        fontSize: '10px', color: 'rgba(255,255,255,0.4)', width: '64px', flexShrink: 0,
        fontWeight: 500,
      }}>
        {formatDate(session.date, lang)}
      </span>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {hasName && (
          <>
            <span style={{
              fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.8)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {session.name}
            </span>
            {session.exercises?.length > 0 && <SessionIcons exercises={session.exercises} />}
          </>
        )}
        {!hasName && session.exercises?.length > 0 && (
          <SessionIcons exercises={session.exercises} size={15} />
        )}
        {!hasName && !session.exercises?.length && (
          <span style={{
            fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)',
          }}>
            {t('dashboard.session')}
          </span>
        )}
      </div>
      <span style={{
        fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontWeight: 500,
      }}>
        {formatDuration(session.duration)}
      </span>
    </div>
  );
}

/** reps / weight / difficulty of one exercise — shown at every density. */
function ExerciseValue({ ex, t, fontSize }) {
  return (
    <span style={{
      fontSize, fontWeight: 700, color: '#10b981',
      display: 'flex', alignItems: 'center',
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {ex.type === 'timer' ? `${ex.reps}s` : `×${ex.reps}`}
      {ex.weight ? ` • ${ex.weight} ${t('weight.kg')}` : ''}
      <DifficultyBadge difficulty={ex.difficulty} />
    </span>
  );
}

/**
 * Exercise block with density tiers. The content is always complete —
 * only the presentation compresses as the number of items grows:
 *   detailed (≤4): full-width rows • grid (≤12): 2-column tiles
 *   compact (>12): 2-column single-line chips
 */
function ExerciseBlock({ exercises, density, t }) {
  if (density === 'detailed') {
    return (
      <div className="flex-col gap-4">
        {exercises.map((ex, i) => {
          const Icon = getIcon(ex.icon);
          return (
            <div key={ex.id || i} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px', borderRadius: '14px',
              background: `${getExerciseColor(ex)}0a`,
            }}>
              <Icon size={18} color={getExerciseColor(ex)} />
              <span style={{
                flex: 1, fontSize: '14px', fontWeight: 600,
                color: getExerciseColor(ex),
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {getExerciseLabel(ex, t)}
              </span>
              <ExerciseValue ex={ex} t={t} fontSize="13px" />
            </div>
          );
        })}
      </div>
    );
  }

  const isCompact = density === 'compact';
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      gap: isCompact ? '4px' : '6px',
    }}>
      {exercises.map((ex, i) => {
        const Icon = getIcon(ex.icon);
        const color = getExerciseColor(ex);
        if (isCompact) {
          return (
            <div key={ex.id || i} style={{
              display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0,
              padding: '6px 10px', borderRadius: '10px',
              background: `${color}0a`,
            }}>
              <Icon size={13} color={color} style={{ flexShrink: 0 }} />
              <span style={{
                flex: 1, fontSize: '11px', fontWeight: 600, color,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {getExerciseLabel(ex, t)}
              </span>
              <ExerciseValue ex={ex} t={t} fontSize="11px" />
            </div>
          );
        }
        return (
          <div key={ex.id || i} style={{
            display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0,
            padding: '10px 12px', borderRadius: '12px',
            background: `${color}0a`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
              <Icon size={15} color={color} style={{ flexShrink: 0 }} />
              <span style={{
                flex: 1, fontSize: '12px', fontWeight: 600, color,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {getExerciseLabel(ex, t)}
              </span>
            </div>
            <ExerciseValue ex={ex} t={t} fontSize="12px" />
          </div>
        );
      })}
    </div>
  );
}

function SectionLabel({ color, children }) {
  return (
    <div style={{
      fontSize: '10px', fontWeight: 700,
      color, opacity: 0.7,
      textTransform: 'uppercase', letterSpacing: '1.2px',
      marginBottom: '5px',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </div>
  );
}

function PerfectBadge({ t }) {
  return (
    <div style={{
      padding: '4px 10px', borderRadius: '8px',
      background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.05))',
      border: '1px solid rgba(251,191,36,0.4)',
      boxShadow: '0 0 10px rgba(251,191,36,0.15)',
      color: '#fbbf24', fontSize: '10px', fontWeight: 800,
      textTransform: 'uppercase', letterSpacing: '1px',
      display: 'flex', alignItems: 'center', gap: '5px',
      height: 'fit-content', flexShrink: 0,
      whiteSpace: 'nowrap',
    }}>
      <Award size={11} color="#fbbf24" fill="#fbbf24" />
      {t('common.perfectDays')}
    </div>
  );
}

/**
 * ShareCard — visual card rendered for export at a fixed logical width
 * (CARD_WIDTH, exported ×2 = 1080px). The height snaps to the smallest
 * standard ratio (1:1 → 4:5 → 9:16) that fits the content; measured extra
 * space is redistributed as breathing room around the hero stat and above
 * the footer. Beyond 9:16 the card grows freely — content is never cut.
 *
 * Modes: 'session' (current workout) | 'global' (stats screen).
 */
export function ShareCard({ cardRef, sessionData, stats, sessionHistory, completions, getDayNumber, settings, options, mode = 'session', isPro = false, onFormatChange }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { getConfig } = useExerciseConfig();
  const { customCategories, exercisesByUserCategory, customExercises } = useExercises();

  const model = buildCardModel({
    mode, options, isPro,
    sessionData, stats, completions, getDayNumber, settings,
    customCategories, exercisesByUserCategory, customExercises,
    getConfig, t,
  });
  const {
    isGlobal, activeThemeKey, allExercises, categories, showSections,
    dailyCategories, showDailySections, filteredDailyExercises, categoryChips,
    density, totalReps, duration, streak, streakActive, exerciseCount,
    totalDays, maxStreak,
  } = model;

  const currentTheme = CARD_THEMES[activeThemeKey] || CARD_THEMES.dark;

  // ── Auto-format: measure natural height, snap to the closest standard
  // ratio, redistribute the extra as breathing space (hero / footer).
  const frameRef = useRef(null);
  const extrasRef = useRef(INITIAL_EXTRAS);
  const [extras, setExtras] = useState(INITIAL_EXTRAS);

  const setFrameRef = (node) => {
    frameRef.current = node;
    if (cardRef) cardRef.current = node;
  };

  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const update = () => {
      const measured = el.offsetHeight;
      if (!measured) return;
      const current = extrasRef.current;
      const natural = measured - current.hero - current.footer;
      const fmt = resolveCardFormat(natural);
      const extra = Math.max(0, fmt.height - natural);
      const next = {
        hero: Math.round(extra * 0.45),
        footer: Math.round(extra * 0.55),
        format: fmt.key,
      };
      const drift = Math.abs(next.hero - current.hero) + Math.abs(next.footer - current.footer);
      if (drift > 1 || next.format !== current.format) {
        extrasRef.current = next;
        setExtras(next);
        onFormatChange?.(fmt.key);
      }
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [onFormatChange]);

  const dateStr = sessionData?.date
    ? formatDate(sessionData.date, lang)
    : formatDate(new Date().toISOString(), lang);

  const heroVisible = !!options.showVolume;
  const tiles = isGlobal
    ? [
        { key: 'days', visible: !!options.showExercises, icon: SHARE_ICONS.Target, value: totalDays, label: t('leaderboard.activeDays'), color: '#34d399' },
        { key: 'best', visible: !!options.showDuration, icon: SOCIAL_ICONS.Award, value: `${maxStreak}j`, label: t('common.bestStreak'), color: currentTheme.accent },
      ]
    : [
        { key: 'duration', visible: !!options.showDuration, icon: Clock, value: formatDuration(duration), label: t('share.duration'), color: currentTheme.accent },
        { key: 'exercises', visible: !!options.showExercises, icon: EXERCISE_ICONS.Dumbbell, value: exerciseCount, label: t('share.exercises'), color: '#34d399' },
      ];
  const anyTileVisible = tiles.some(tile => tile.visible);

  const showDaily = isGlobal && options.showDailyExercises && filteredDailyExercises.length > 0;
  const showHistory = options.showSessionHistory && sessionHistory.length > 0;

  return (
    <div
      ref={setFrameRef}
      style={{
        width: `${CARD_WIDTH}px`,
        borderRadius: '28px',
        overflow: 'hidden',
        fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
        position: 'relative',
      }}
    >
      {/* Background gradients for smooth theme transition */}
      {Object.entries(CARD_THEMES).map(([key, themeObj]) => (
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

      {/* Accent glows */}
      <div style={{
        position: 'absolute', top: '-60px', right: '-60px',
        width: '220px', height: '220px', borderRadius: '50%',
        background: options.showStreak && streak > 0
          ? 'rgba(249,115,22,0.18)'
          : currentTheme.glow1,
        filter: 'blur(28px)',
        transition: 'background 0.5s ease',
      }} />
      <div style={{
        position: 'absolute', bottom: '-45px', left: '-45px',
        width: '170px', height: '170px', borderRadius: '50%',
        background: currentTheme.glow2,
        filter: 'blur(22px)',
        transition: 'background 0.5s ease',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 1,
        padding: '30px 28px 24px',
        display: 'flex', flexDirection: 'column', gap: '16px',
      }}>
        {/* Header: logo + wordmark + date, streak badge on the right */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src="/logo-64x64.webp"
              alt=""
              width={40}
              height={40}
              style={{ borderRadius: '12px', display: 'block' }}
            />
            <div>
              <div style={{
                fontSize: '24px', fontWeight: 800, lineHeight: 1.1,
                color: currentTheme.accent,
                transition: 'color 0.5s ease',
              }}>
                OneUp
              </div>
              <div style={{
                fontSize: '10px', fontWeight: 600, marginTop: '2px',
                color: 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase', letterSpacing: '1.5px',
              }}>
                {dateStr}
              </div>
            </div>
          </div>

          {/* Top-right: streak badge or accent flame */}
          <div style={{ position: 'relative', height: '44px', minWidth: '96px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <div style={{
              position: 'absolute', right: 0,
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '8px 16px', borderRadius: '16px',
              background: streakActive
                ? 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(239,68,68,0.15))'
                : 'rgba(255,255,255,0.06)',
              border: streakActive
                ? '1px solid rgba(249,115,22,0.35)'
                : '1px solid rgba(255,255,255,0.08)',
              opacity: options.showStreak && streak > 0 ? 1 : 0,
              transform: options.showStreak && streak > 0 ? 'scale(1)' : 'scale(0.8)',
              pointerEvents: 'none',
              transition: `all 0.4s ${SPRING}`,
            }}>
              <Flame size={22} color={streakActive ? '#f97316' : '#888'} fill={streakActive ? '#f97316' : 'none'} />
              <span style={{
                fontSize: '18px', fontWeight: 800,
                color: streakActive ? '#f97316' : '#888', lineHeight: 1,
              }}>
                {streak}
              </span>
            </div>
            <div style={{
              position: 'absolute', right: 0,
              width: '44px', height: '44px', borderRadius: '14px',
              backgroundColor: `${currentTheme.accent}26`,
              border: `1px solid ${currentTheme.accent}33`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: !(options.showStreak && streak > 0) ? 1 : 0,
              transform: !(options.showStreak && streak > 0) ? 'scale(1)' : 'scale(0.8)',
              pointerEvents: 'none',
              transition: `all 0.4s ${SPRING}, background-color 0.5s ease, border-color 0.5s ease`,
            }}>
              <Flame size={20} color={currentTheme.accent} style={{ transition: 'color 0.5s ease' }} />
            </div>
          </div>
        </div>

        {/* Session title or global label */}
        {isGlobal && (
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%', gap: '10px' }}>
            <div className="flex-1-min0">
              <div style={{
                fontSize: '13px', fontWeight: 700,
                color: activeThemeKey === 'gold' ? '#fbbf24' : 'rgba(255,255,255,0.6)',
                textTransform: 'uppercase', letterSpacing: '1px',
              }}>
                {t('share.globalStats')}
              </div>
              {categoryChips.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: '6px' }}>
                  {categoryChips.map(chip => (
                    <span key={chip.key} style={{
                      fontSize: '9px', fontWeight: 700,
                      color: chip.color,
                      padding: '3px 8px', borderRadius: '5px',
                      background: `${chip.color}15`,
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                      marginRight: '6px', marginBottom: '4px', display: 'inline-block',
                      whiteSpace: 'nowrap',
                    }}>
                      {chip.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {!showDailySections && activeThemeKey === 'gold' && <PerfectBadge t={t} />}
          </div>
        )}
        {!isGlobal && sessionData?.name && (
          <div style={{
            fontSize: '16px', fontWeight: 700, color: 'rgba(255,255,255,0.9)',
            textAlign: 'center',
          }}>
            {sessionData.name}
          </div>
        )}

        {/* Hero stat + secondary tiles. Snap breathing space lands here. */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '16px',
          paddingTop: `${Math.round(extras.hero / 2)}px`,
          paddingBottom: `${extras.hero - Math.round(extras.hero / 2)}px`,
        }}>
          <HeroStat
            isVisible={heroVisible}
            value={totalReps.toLocaleString()}
            label={isGlobal ? t('stats.totalReps') : t('customExercises.typeReps')}
          />
          <div style={{
            display: 'flex', gap: '10px',
            maxHeight: anyTileVisible ? '120px' : '0px',
            opacity: anyTileVisible ? 1 : 0,
            overflow: 'hidden',
            transition: `all 0.4s ${SPRING}`,
          }}>
            {tiles.map(tile => (
              <MetricTile
                key={tile.key}
                isVisible={tile.visible}
                icon={tile.icon}
                value={tile.value}
                label={tile.label}
                color={tile.color}
              />
            ))}
          </div>
        </div>

        {/* Exercise list (session mode) — categorized if showWeights */}
        {!isGlobal && allExercises.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {showSections ? (
              categories.map(cat => (
                <div key={cat.key}>
                  <SectionLabel color={cat.color}>{cat.label}</SectionLabel>
                  <ExerciseBlock exercises={cat.exercises} density={density} t={t} />
                </div>
              ))
            ) : (
              <ExerciseBlock exercises={allExercises} density={density} t={t} />
            )}
          </div>
        )}

        {/* Daily exercises (global mode) */}
        {isGlobal && (
          <div style={{
            display: 'flex', flexDirection: 'column',
            gap: showDaily ? '12px' : '0px',
            maxHeight: showDaily ? `${filteredDailyExercises.length * 60 + 200}px` : '0px',
            opacity: showDaily ? 1 : 0,
            overflow: 'hidden',
            transition: `all 0.4s ${SPRING}`,
          }}>
            <SectionLabel color={currentTheme.accent}>
              {formatDate(options.globalDate || new Date().toISOString().split('T')[0], lang)}
            </SectionLabel>
            {showDailySections ? (
              dailyCategories.map(cat => (
                <div key={cat.key}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                  }}>
                    <SectionLabel color={cat.color}>{cat.label}</SectionLabel>
                    {cat.isPerfect && <PerfectBadge t={t} />}
                  </div>
                  <ExerciseBlock exercises={cat.exercises} density={density} t={t} />
                </div>
              ))
            ) : (
              <ExerciseBlock exercises={filteredDailyExercises} density={density} t={t} />
            )}
          </div>
        )}

        {/* Session history mini list */}
        <div style={{
          padding: showHistory ? '14px' : '0 14px',
          borderRadius: '16px',
          background: 'rgba(255,255,255,0.03)',
          border: showHistory ? '1px solid rgba(255,255,255,0.05)' : '0px solid rgba(255,255,255,0)',
          maxHeight: showHistory ? `${Math.min(sessionHistory.length, 5) * 60 + 60}px` : '0px',
          opacity: showHistory ? 1 : 0,
          overflow: 'hidden',
          transition: `all 0.4s ${SPRING}`,
        }}>
          <div style={{
            fontSize: '10px', fontWeight: 700,
            color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase', letterSpacing: '1.2px',
            marginBottom: '8px',
          }}>
            {t('share.recentSessions')}
          </div>
          {sessionHistory.slice(0, 5).map((session, i) => (
            <HistoryRow key={session.id || i} session={session} t={t} lang={lang} />
          ))}
        </div>

        {/* Footer — branding CTA. Snap pushes it to the bottom edge. */}
        <div style={{
          marginTop: `${extras.footer}px`,
          paddingTop: '14px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <img
              src="/logo-64x64.webp"
              alt=""
              width={20}
              height={20}
              style={{ borderRadius: '6px', display: 'block', flexShrink: 0 }}
            />
            <span style={{
              fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.85)',
              whiteSpace: 'nowrap',
            }}>
              {APP_URL_DISPLAY}
            </span>
          </div>
          <span style={{
            fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.45)',
            textAlign: 'right',
            whiteSpace: 'nowrap',
          }}>
            {t('share.footerTagline')}
          </span>
        </div>
      </div>
    </div>
  );
}
