import React from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Star, FolderPlus } from '@utils/icons';
import { UI_ICONS, DynamicIcon } from '@utils/icons';
import { getDailyGoal } from '@config/exercises';
import { formatTime, parseTimestamp } from '@utils/dateUtils';
import { isPerfectDay } from '@utils/statUtils';
import { getExerciseLabel } from '@utils/exerciseLabel';

import { WEIGHT_EXERCISES_MAP } from '@config/weights';
import { StreakFlame, WeightBadge } from '@components/ui';
import styles from '@styles/DashboardSlide.module.css';

export const DashboardSlide = React.memo(({
    isFuture, effectiveStart, dayNumber, today, getExerciseCount, completions, computedStats,
    isCounterTransitioning, prevDayNumber, pauseCloudSync, setShowCounter,
    activeExerciseId, onSelectExercise, exercisesList, exercisesMap, title, categoryColor, onManageCustom, onManageCategories, getConfig
}) => {
    const { t, i18n } = useTranslation();
    const safeSelectedExercise = exercisesMap[activeExerciseId] || exercisesList[0];

    if (!safeSelectedExercise) {
        return (
            <div className="flex-col flex-center full-height text-center" style={{ padding: '20px' }}>
                {title && <h2 className="panel-title">{title}</h2>}
                <div style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>{t('dashboard.noExercisesConfigured')}</div>
                {onManageCustom && (
                    <button onClick={onManageCustom} className="hover-lift" style={{
                        padding: '12px 24px', borderRadius: 'var(--radius-md)', background: '#8b5cf6', color: 'white', fontWeight: '700', border: 'none'
                    }}>
                        {t('dashboard.configure')}
                    </button>
                )}
            </div>
        );
    }

    const currentDiff = getConfig(safeSelectedExercise.id, today).difficulty;
    const dailyGoal = getDailyGoal(safeSelectedExercise, dayNumber, currentDiff) || 1;
    const currentCount = getExerciseCount(today, safeSelectedExercise.id);
    const isExerciseDone = completions[today]?.[safeSelectedExercise.id]?.isCompleted || currentCount >= dailyGoal;
    const progress = Math.min((dayNumber / 365) * 100, 100);

    const isDayPerfect = isPerfectDay(completions[today], exercisesList);

    // Compact sizes whenever the tile grid is at full height (4 rows = 10+
    // exercises) — with or without a category title row. Pages with fewer
    // tiles (e.g. weights) keep the same sizes as a small category.
    const gridRows = Math.ceil(exercisesList.length / 3);
    const isCompact = gridRows >= 4;

    let dayNumAnimation = '';
    if (isCounterTransitioning) {
        dayNumAnimation = isDayPerfect
            ? 'gradientShift 4s ease infinite, counterSlideUp 1s ease-out'
            : 'rainbowFlow 6s ease infinite, counterSlideUp 1s ease-out';
    } else {
        dayNumAnimation = isDayPerfect
            ? 'gradientShift 4s ease infinite, numberRoll 0.5s ease-out'
            : 'rainbowFlow 6s ease infinite, numberRoll 0.5s ease-out';
    }

    let prevDayNumAnimation = '';
    if (isDayPerfect) {
        prevDayNumAnimation = 'gradientShift 4s ease infinite, counterSlideDown 1s ease-out forwards';
    } else {
        prevDayNumAnimation = 'rainbowFlow 6s ease infinite, counterSlideDown 1s ease-out forwards';
    }

    return (
        <div
            className={`flex-col flex-justify-evenly flex-align-center full-width full-height pos-relative hide-scrollbar gap-responsive dashboard-slide-bg ${isDayPerfect ? styles.goldBg : ''}`}
            style={{
                paddingTop: title ? 'var(--dashboard-slide-padding-top, clamp(6px, 1vh, 12px))' : '0',
                transition: 'all 0.6s ease-in-out',
                overflow: 'hidden',
                ...(isCompact ? {
                    '--exercise-btn-min-height': 'var(--exercise-btn-min-height-with-title, var(--exercise-btn-min-height))',
                    '--done-text-margin': 'var(--done-text-margin-with-title, var(--done-text-margin))',
                    '--done-text-size': 'var(--done-text-size-with-title, var(--done-text-size))'
                } : {}),
                // Hero + counter button only shrink when a title row eats space on top
                ...(isCompact && title ? {
                    '--day-label-size': 'var(--day-label-size-with-title, var(--day-label-size))',
                    '--day-num-height': 'var(--day-num-height-with-title, var(--day-num-height))',
                    '--day-num-font-size': 'var(--day-num-font-size-with-title, var(--day-num-font-size))',
                    '--bottom-btn-size': 'var(--bottom-btn-size-with-title, var(--bottom-btn-size))'
                } : {})
            }}
        >
            {isDayPerfect && (
                <>
                    {[
                        { top: '10%', left: '15%', size: 12, delay: '0s' },
                        { top: '20%', right: '10%', size: 8, delay: '1s' },
                        { bottom: '15%', left: '10%', size: 10, delay: '2s' },
                        { bottom: '25%', right: '15%', size: 7, delay: '3.5s' }
                    ].map((s, idx) => (
                        <Star
                            key={idx}
                            className="sparkle-icon"
                            size={s.size}
                            fill="#FFD700"
                            style={{
                                top: s.top, left: s.left, right: s.right, bottom: s.bottom,
                                animationDelay: s.delay, opacity: 0.4
                            }}
                        />
                    ))}
                </>
            )}
            {title && (
                <div className="flex-align-center" style={{ gap: '8px' }}>
                    <div style={{
                        fontSize: 'var(--category-title-size, 0.8rem)', fontWeight: '800',
                        color: isDayPerfect ? '#ffdf00' : (categoryColor || 'var(--text-secondary)'),
                        textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.8,
                        textShadow: isDayPerfect ? '0 0 10px rgba(255,223,0,0.5)' : 'none'
                    }}>
                        {title}
                    </div>
                    {onManageCustom && (
                        <button onClick={onManageCustom} aria-label="Manage custom exercises" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', opacity: 0.6, padding: '4px' }}>
                            <Settings size={14} />
                        </button>
                    )}
                    {onManageCategories && (
                        <button onClick={onManageCategories} aria-label="Manage categories" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', opacity: 0.6, padding: '4px' }}>
                            <FolderPlus size={14} />
                        </button>
                    )}
                </div>
            )}
            {!isFuture ? (
                <>
                    {/* Day & Goal Hero Section */}
                    <div style={{ textAlign: 'center', position: 'relative' }}>
                        <div style={{
                            fontSize: 'var(--day-label-size, clamp(0.75rem, 1.6vh, 1rem))',
                            lineHeight: 1.2,
                            color: isDayPerfect ? '#ffdf00' : 'var(--text-secondary)',
                            textTransform: 'uppercase', letterSpacing: '4px',
                            marginBottom: '2px', fontWeight: '700',
                            textShadow: isDayPerfect ? '0 0 8px rgba(255,223,0,0.4)' : 'none',
                        }} className="day-label">
                            <span className="day-label-text">{t('dashboard.day')}</span>
                        </div>

                        {/* Big animated day number */}
                        <div className="flex-center pos-relative overflow-hidden day-number-container" style={{
                            height: 'var(--day-num-height, clamp(2.4rem, 8vh, 6.5rem))',
                            marginBottom: 'clamp(2px, 0.4vh, 6px)',
                            filter: isDayPerfect ? 'drop-shadow(0 0 15px rgba(251,191,36,0.2))' : 'none'
                        }}>
                            {isCounterTransitioning && prevDayNumber && (
                                <div className={`day-number-anim ${isDayPerfect ? 'gold-text' : 'rainbow-gradient'}`} style={{
                                    position: 'absolute', fontSize: 'var(--day-num-font-size, clamp(2.2rem, 7.5vh, 6rem))', fontWeight: '800', lineHeight: 1,
                                    animation: prevDayNumAnimation
                                }}>
                                    {prevDayNumber}
                                </div>
                            )}
                            <div
                                key={dayNumber}
                                className={`day-number ${isDayPerfect ? 'gold-text' : 'rainbow-gradient'}`}
                                data-text={dayNumber}
                                style={{
                                    fontSize: 'var(--day-num-font-size, clamp(2.2rem, 7.5vh, 6rem))', fontWeight: '800', lineHeight: 1,
                                    animation: dayNumAnimation
                                }}
                            >
                                {dayNumber}
                            </div>
                        </div>
                    </div>

                    {/* ── Exercise Selector ── */}
                    <div className="exercise-grid flex-row flex-wrap flex-justify-center" style={{
                        gap: 'var(--exercise-btn-gap, clamp(4px, 1vh, 8px))', width: '100%', maxWidth: '640px',
                        padding: '2px'
                    }}>
                        {exercisesList.map(ex => (
                            <ExerciseButton
                                key={ex.id}
                                ex={ex}
                                isActive={ex.id === activeExerciseId}
                                dayNumber={dayNumber}
                                today={today}
                                getExerciseCount={getExerciseCount}
                                completions={completions}
                                computedStats={computedStats}
                                onSelect={onSelectExercise}
                                getConfig={getConfig}
                            />
                        ))}
                    </div>

                    {/* ── Progress ring + Counter button + Completion status (grouped) ── */}
                    <div className="flex-col flex-align-center gap-responsive">
                        <div className="flex-center pos-relative" style={{
                            width: 'var(--bottom-btn-size, clamp(72px, 12vh, 110px))',
                            height: 'var(--bottom-btn-size, clamp(72px, 12vh, 110px))'
                        }}>
                            {/* Ambient halo behind the counter button */}
                            <div style={{
                                position: 'absolute', inset: '-45%', borderRadius: '50%',
                                background: `radial-gradient(circle, ${safeSelectedExercise.color}${isExerciseDone ? '38' : '24'} 0%, transparent 62%)`,
                                pointerEvents: 'none',
                                transition: 'background 0.6s ease'
                            }} />
                            {/* Counter open button */}
                            <button
                                aria-label={`${getExerciseLabel(safeSelectedExercise)} counter`}
                                onClick={() => { pauseCloudSync?.(); setShowCounter(true); }}
                                className="ripple counter-button"
                                style={{
                                    width: '100%', height: '100%',
                                    background: isExerciseDone
                                        ? `linear-gradient(135deg, ${safeSelectedExercise.color} 0%, ${safeSelectedExercise.gradient[1]} 100%)`
                                        : 'transparent',
                                    border: 'none',
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center', gap: '1px',
                                    transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                    willChange: 'transform',
                                    transform: isExerciseDone ? 'scale(1.1)' : 'scale(1)',
                                    boxShadow: isExerciseDone
                                        ? `0 0 50px ${safeSelectedExercise.color}aa, 0 8px 30px ${safeSelectedExercise.color}55, 0 0 0 4px ${safeSelectedExercise.color}33, inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.1)`
                                        : `0 0 16px ${safeSelectedExercise.color}33`,
                                    cursor: 'pointer',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                {/* Year progress ring — child of the button so it inherits the
                                    exact blob shape (border-radius: inherit). Filled arc = day/365.
                                    Hidden once the exercise is done (no longer relevant). Colors via
                                    CSS variables (per-exercise; event themes may override them). */}
                                {!isExerciseDone && (
                                    <div
                                        className="counter-ring"
                                        aria-hidden="true"
                                        style={{
                                            '--ring-c1': safeSelectedExercise.gradient[0],
                                            '--ring-c2': safeSelectedExercise.gradient[1],
                                            '--ring-track': `${safeSelectedExercise.color}26`,
                                            '--ring-progress': `${Math.min(progress, 100)}%`
                                        }}
                                    />
                                )}
                                {isExerciseDone ? (
                                    <>
                                        <div style={{
                                            position: 'absolute',
                                            inset: 0,
                                            background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)',
                                            pointerEvents: 'none'
                                        }} />
                                        <UI_ICONS.Check size={26} color="white" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))', position: 'relative', zIndex: 1 }} />
                                        <span style={{
                                            fontSize: 'clamp(0.5rem, 1.2vh, 0.7rem)',
                                            color: 'white',
                                            fontWeight: '800',
                                            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                                            position: 'relative',
                                            zIndex: 1
                                        }}>
                                            {safeSelectedExercise.type === 'timer'
                                                ? `${formatTime(dailyGoal)}/${formatTime(dailyGoal)}`
                                                : `${dailyGoal}/${dailyGoal}`
                                            }
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <DynamicIcon icon={safeSelectedExercise.icon} size={22} color={safeSelectedExercise.color} />
                                        <span style={{ fontSize: 'clamp(0.45rem, 1.2vh, 0.65rem)', color: safeSelectedExercise.color, fontWeight: '700' }}>
                                            {safeSelectedExercise.type === 'timer'
                                                ? `${formatTime(currentCount)}/${formatTime(dailyGoal)}`
                                                : `${currentCount}/${dailyGoal}`}
                                        </span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Completion status (under button with spacing) */}
                        {(() => {
                            const exData = completions[today]?.[activeExerciseId];
                            const completedAt = exData?.timestamp ? parseTimestamp(exData.timestamp) : null;
                            const timeStr = completedAt
                                ? completedAt.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })
                                : null;
                            const showDoneText = isExerciseDone && !!timeStr;
                            return (
                                <div
                                    className={showDoneText ? "scale-in" : ""}
                                    style={{
                                        color: 'var(--text-secondary)',
                                        fontWeight: '500',
                                        marginTop: 'var(--done-text-margin, clamp(4px, 0.8vh, 6px))',
                                        opacity: showDoneText ? 0.75 : 0,
                                        visibility: showDoneText ? 'visible' : 'hidden',
                                        fontSize: 'var(--done-text-size, clamp(0.65rem, 2.5vw, 0.85rem))',
                                        transition: 'opacity 0.2s ease, visibility 0.2s ease',
                                        pointerEvents: 'none',
                                        textAlign: 'center',
                                        minHeight: '1.2em'
                                    }}
                                >
                                    {showDoneText ? t('dashboard.doneAt', { time: timeStr }) : '\u00A0'}
                                </div>
                            );
                        })()}
                    </div>
                </>
            ) : (
                <div className="glass-premium" style={{
                    textAlign: 'center', padding: 'var(--spacing-xl)',
                    borderRadius: 'var(--radius-xl)', maxWidth: '320px'
                }}>
                    <h2 className="panel-title">{t('dashboard.waiting')}</h2>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                        {t('dashboard.challengeStarts')} <br />
                        <strong style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>{effectiveStart}</strong>
                    </p>
                </div>
            )}
        </div>
    );
});

const ExerciseButton = React.memo(({
    ex, isActive, dayNumber, today,
    getExerciseCount, completions, computedStats, onSelect, getConfig
}) => {
    const statsEx = computedStats.exerciseStats?.find(e => e.id === ex.id);
    const exStreak = statsEx ? statsEx.streak : 0;
    const exStreakActive = !!statsEx?.streakActive;
    const exCount = getExerciseCount(today, ex.id);
    const { difficulty: exDiff, weight } = getConfig(ex.id, today);
    const exGoal = getDailyGoal(ex, dayNumber, exDiff);
    const exDone = completions[today]?.[ex.id]?.isCompleted || exCount >= exGoal;
    const exPct = exDone ? 100 : Math.min(100, (exCount / Math.max(exGoal, 1)) * 100);

    let btnBg = `linear-gradient(160deg, ${ex.color}0d 0%, var(--surface-subtle) 80%)`;
    if (exDone) {
        btnBg = `linear-gradient(160deg, ${ex.color}26 0%, ${ex.gradient[1]}14 100%)`;
    } else if (isActive) {
        btnBg = `linear-gradient(160deg, ${ex.color}2e 0%, ${ex.gradient[0]}16 100%)`;
    }

    let btnBorder = '1.5px solid var(--border-muted)';
    if (exDone) {
        btnBorder = `1.5px solid ${ex.color}66`;
    } else if (isActive) {
        btnBorder = `1.5px solid ${ex.color}88`;
    }

    let btnBoxShadow = 'none';
    if (exDone) {
        btnBoxShadow = `0 0 8px ${ex.color}33`;
    } else if (isActive) {
        btnBoxShadow = `0 4px 16px ${ex.color}22`;
    }

    const textThemeColor = (exDone || isActive) ? ex.color : 'var(--text-secondary)';
    const textPrimaryColor = (exDone || isActive) ? ex.color : 'var(--text-primary)';
    const textOpacity = (exDone || isActive) ? 1 : 0.75;

    let timeOrCountLabel = '';
    if (ex.type === 'timer') {
        timeOrCountLabel = exDone ? formatTime(exGoal) : `${formatTime(exCount)}/${formatTime(exGoal)}`;
    } else {
        timeOrCountLabel = exDone ? exGoal : `${exCount}/${exGoal}`;
    }

    return (
        <button
            onClick={() => onSelect(ex.id)}
            className="hover-lift exercise-button"
            style={{
                flex: '1 1 calc(33.333% - 8px)',
                minWidth: 'clamp(60px, 18vw, 100px)',
                maxWidth: '130px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 'var(--exercise-btn-gap, clamp(2px, 0.4vh, 5px))',
                padding: 'var(--exercise-btn-padding, clamp(8px, 1.2vh, 12px) clamp(4px, 0.8vw, 8px))',
                borderRadius: 'var(--radius-md)',
                minHeight: 'var(--exercise-btn-min-height, clamp(44px, 7.2vh, 58px))',
                background: btnBg,
                border: btnBorder,
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                position: 'relative',
                overflow: 'hidden',
                '--done-color': `${ex.color}55`,
                '--done-color-dim': `${ex.color}12`,
                animation: exDone ? 'doneGlow 3s ease-in-out infinite' : 'none',
                boxShadow: btnBoxShadow
            }}
        >
            {/* Done checkmark (top-right corner) */}
            {exDone && (
                <div style={{
                    position: 'absolute', top: '3px', right: '3px',
                    width: '15px', height: '15px', borderRadius: '50%',
                    background: `linear-gradient(135deg, ${ex.gradient[0]}, ${ex.gradient[1]})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 0 8px ${ex.color}66`,
                    animation: 'checkPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    zIndex: 1
                }}>
                    <span style={{ fontSize: '8px', color: 'white', fontWeight: '700', lineHeight: 1 }}>✓</span>
                </div>
            )}
            {/* Streak badge (top-left corner — keeps the tile height stable).
                Flame stays colored only when the streak is active today. */}
            <StreakFlame
                streak={exStreak}
                active={exStreakActive}
                variant="badge"
                style={{ position: 'absolute', top: '3px', left: '3px', zIndex: 1 }}
            />
            {/* Icon in a tinted chip — always carries the exercise color */}
            <div style={{
                width: 'var(--tile-icon-size, clamp(24px, 3.6vh, 30px))', height: 'var(--tile-icon-size, clamp(24px, 3.6vh, 30px))',
                borderRadius: '30%',
                background: `${ex.color}${exDone || isActive ? '2e' : '16'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.25s ease'
            }}>
                <DynamicIcon
                    icon={ex.icon}
                    size={16}
                    color={ex.color}
                    style={{ transition: 'opacity 0.2s ease', opacity: exDone || isActive ? 1 : 0.85 }}
                />
            </div>
            <span style={{
                fontSize: 'var(--tile-label-size, clamp(0.55rem, 1.25vh, 0.78rem))', fontWeight: '600',
                color: textThemeColor,
                textAlign: 'center', lineHeight: '1.1',
                transition: 'color 0.2s ease'
            }}>
                {getExerciseLabel(ex)}
            </span>
            <span style={{
                fontSize: 'var(--tile-count-size, clamp(0.6rem, 1.35vh, 0.82rem))', fontWeight: '700',
                lineHeight: 1.2,
                color: textPrimaryColor,
                opacity: textOpacity,
                transition: 'color 0.2s ease',
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap'
            }}>
                <span style={{
                    textDecorationLine: exDone ? 'line-through' : 'none',
                    textDecorationColor: `${ex.color}88`
                }}>
                    {timeOrCountLabel}
                </span>
                {WEIGHT_EXERCISES_MAP[ex.id] && (
                    <WeightBadge weight={weight} color={ex.color} style={{ marginLeft: '5px' }} />
                )}
            </span>
            {/* Per-tile progress bar */}
            <div style={{
                position: 'absolute', left: 0, right: 0, bottom: 0,
                height: '3px',
                background: `${ex.color}14`
            }}>
                <div style={{
                    height: '100%',
                    width: `${exPct}%`,
                    background: `linear-gradient(90deg, ${ex.gradient[0]}, ${ex.gradient[1]})`,
                    boxShadow: exPct > 0 ? `0 0 6px ${ex.color}88` : 'none',
                    transition: 'width 0.4s ease'
                }} />
            </div>
        </button>
    );
});
