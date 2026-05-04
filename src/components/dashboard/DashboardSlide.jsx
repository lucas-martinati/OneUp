import React from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Star, FolderPlus } from '../../utils/icons';
import { UI_ICONS, DynamicIcon } from '../../utils/icons';
import { getDailyGoal } from '../../config/exercises';
import { formatTime, parseTimestamp } from '../../utils/dateUtils';
import { isPerfectDay } from '../../utils/statUtils';
import { getExerciseLabel } from '../../utils/exerciseLabel';

import { WEIGHT_EXERCISES_MAP } from '../../config/weights';

export const DashboardSlide = React.memo(({
    isFuture, effectiveStart, dayNumber, today, getExerciseCount, completions, computedStats,
    isCounterTransitioning, prevDayNumber, pauseCloudSync, setShowCounter,
    activeExerciseId, onSelectExercise, exercisesList, exercisesMap, title, categoryColor, onManageCustom, onManageCategories, isDay100, getConfig
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

    return (
        <div
            className={`flex-col flex-justify-evenly flex-align-center full-width full-height pos-relative overflow-hidden gap-responsive ${isDay100 ? 'dashboard-glitch-bg' : (isDayPerfect ? 'dashboard-gold-bg' : '')}`}
            style={{
                paddingTop: title ? '12px' : '0',
                transition: 'all 0.6s ease-in-out'
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
                        fontSize: '0.8rem', fontWeight: '800',
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
                            fontSize: 'clamp(0.75rem, 1.6vh, 1rem)',
                            color: isDay100 ? '#ef4444' : (isDayPerfect ? '#ffdf00' : 'var(--text-secondary)'),
                            textTransform: 'uppercase', letterSpacing: '4px',
                            marginBottom: '2px', fontWeight: '700',
                            textShadow: isDay100 ? '0 0 10px rgba(239, 68, 68, 0.8)' : (isDayPerfect ? '0 0 8px rgba(255,223,0,0.4)' : 'none'),
                            fontFamily: isDay100 ? 'monospace' : 'inherit'
                        }} className={isDay100 ? 'hacked-title' : ''}>
                            {isDay100 ? 'SYSTEM_OVERRIDE' : t('dashboard.day')}
                        </div>

                        {/* Big animated day number */}
                        <div className="flex-center pos-relative overflow-hidden" style={{
                            height: 'clamp(3.2rem, 9vh, 7rem)',
                            marginBottom: 'clamp(2px, 0.5vh, 6px)',
                            filter: isDay100 ? 'drop-shadow(0 0 15px rgba(239,68,68,0.4))' : (isDayPerfect ? 'drop-shadow(0 0 15px rgba(251,191,36,0.2))' : 'none')
                        }}>
                            {isCounterTransitioning && prevDayNumber && (
                                <div className={isDay100 ? 'glitch-text' : (isDayPerfect ? 'gold-text' : 'rainbow-gradient')} style={{
                                    position: 'absolute', fontSize: 'clamp(3rem, 8.5vh, 6.5rem)', fontWeight: '800', lineHeight: 1,
                                    animation: isDay100
                                        ? 'textGlitch 0.6s infinite, counterSlideDown 1s ease-out forwards'
                                        : (isDayPerfect
                                            ? 'gradientShift 4s ease infinite, counterSlideDown 1s ease-out forwards'
                                            : 'rainbowFlow 6s ease infinite, counterSlideDown 1s ease-out forwards')
                                }}>
                                    {prevDayNumber}
                                </div>
                            )}
                            <div
                                key={dayNumber}
                                className={isDay100 ? 'glitch-text' : (isDayPerfect ? 'gold-text' : 'rainbow-gradient')}
                                data-text={isDay100 ? dayNumber : undefined}
                                style={{
                                    fontSize: 'clamp(3rem, 8.5vh, 6.5rem)', fontWeight: '800', lineHeight: 1,
                                    animation: isDay100
                                        ? (isCounterTransitioning ? 'textGlitch 0.6s infinite, counterSlideUp 1s ease-out' : 'textGlitch 0.6s infinite')
                                        : (isCounterTransitioning
                                            ? (isDayPerfect ? 'gradientShift 4s ease infinite, counterSlideUp 1s ease-out' : 'rainbowFlow 6s ease infinite, counterSlideUp 1s ease-out')
                                            : (isDayPerfect ? 'gradientShift 4s ease infinite, numberRoll 0.5s ease-out' : 'rainbowFlow 6s ease infinite, numberRoll 0.5s ease-out'))
                                }}
                            >
                                {dayNumber}
                            </div>
                        </div>
                    </div>

                    {/* ── Exercise Selector ── */}
                    <div className="exercise-grid flex-row flex-wrap flex-justify-center" style={{
                        gap: 'clamp(6px, 1.2vw, 10px)', width: '100%', maxWidth: '640px',
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
                                isDay100={isDay100}
                                getConfig={getConfig}
                            />
                        ))}
                    </div>

                    {/* ── Progress ring + Counter button + Completion status (grouped) ── */}
                    <div className="flex-col flex-align-center gap-responsive">
                        <div className="flex-center pos-relative" style={{
                            width: 'clamp(72px, 12vh, 110px)',
                            height: 'clamp(72px, 12vh, 110px)'
                        }}>
                            {/* Year progress ring */}
                            <svg viewBox="0 0 100 100" className={isDay100 ? 'day100-ring' : ''} style={{
                                position: 'absolute', top: '50%', left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '100%', height: '100%',
                                pointerEvents: 'none',
                                overflow: 'visible'
                            }}>
                                <circle cx="50" cy="50" r="52" fill="none" stroke="var(--progress-track)" strokeWidth="3.5" />
                                <circle
                                    className="progress-ring-circle"
                                    cx="50" cy="50" r="51" fill="none"
                                    stroke={`url(#dashGrad-${activeExerciseId})`}
                                    strokeWidth="4"
                                    strokeDasharray={2 * Math.PI * 52}
                                    strokeDashoffset={2 * Math.PI * 52 - (progress / 100) * 2 * Math.PI * 52}
                                    strokeLinecap="round"
                                    transform="rotate(-90 50 50)"
                                />
                                <defs>
                                    <linearGradient id={`dashGrad-${activeExerciseId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor={safeSelectedExercise.gradient[0]} />
                                        <stop offset="100%" stopColor={safeSelectedExercise.gradient[1]} />
                                    </linearGradient>
                                </defs>
                            </svg>

                            {/* Counter open button */}
                            <button
                                aria-label={`${getExerciseLabel(safeSelectedExercise)} counter`}
                                onClick={() => { pauseCloudSync?.(); setShowCounter(true); }}
                                className={`ripple ${isDay100 ? 'hacked-button' : ''}`}
                                style={{
                                    width: '100%', height: '100%', borderRadius: '50%',
                                    background: isExerciseDone
                                        ? `linear-gradient(135deg, ${safeSelectedExercise.color} 0%, ${safeSelectedExercise.gradient[1]} 100%)`
                                        : 'transparent',
                                    border: isExerciseDone ? 'none' : `2.5px solid ${safeSelectedExercise.color}`,
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
                        {isExerciseDone && (() => {
                            const exData = completions[today]?.[activeExerciseId];
                            const completedAt = exData?.timestamp ? parseTimestamp(exData.timestamp) : null;
                            const timeStr = completedAt
                                ? completedAt.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })
                                : null;
                            return timeStr ? (
                                <div className="scale-in" style={{
                                    color: 'var(--text-secondary)', fontWeight: '500',
                                    marginTop: '8px', opacity: 0.75,
                                    fontSize: 'clamp(0.7rem, 2.8vw, 0.95rem)'
                                }}>
                                    {t('dashboard.doneAt', { time: timeStr })}
                                </div>
                            ) : null;
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
    getExerciseCount, completions, computedStats, onSelect, isDay100, getConfig
}) => {
    const statsEx = computedStats.exerciseStats?.find(e => e.id === ex.id);
    const exStreak = statsEx ? statsEx.streak : 0;
    const exCount = getExerciseCount(today, ex.id);
    const { difficulty: exDiff, weight } = getConfig(ex.id, today);
    const exGoal = getDailyGoal(ex, dayNumber, exDiff);
    const exDone = completions[today]?.[ex.id]?.isCompleted || exCount >= exGoal;

    return (
        <button
            onClick={() => onSelect(ex.id)}
            className={`hover-lift ${isDay100 ? 'day100-exercise-btn' : ''}`}
            style={{
                flex: '1 1 calc(33.333% - 10px)',
                minWidth: 'clamp(70px, 20vw, 100px)',
                maxWidth: '130px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 'clamp(3px, 0.5vh, 6px)',
                padding: 'clamp(8px, 1.2vh, 12px) clamp(6px, 1vw, 10px)',
                borderRadius: 'var(--radius-md)',
                minHeight: 'var(--touch-min)',
                background: exDone
                    ? `linear-gradient(135deg, ${ex.color}20, ${ex.gradient[1]}18)`
                    : isActive
                        ? `linear-gradient(135deg, ${ex.color}28, ${ex.gradient[0]}28)`
                        : 'var(--surface-subtle)',
                border: exDone
                    ? `1.5px solid ${ex.color}66`
                    : isActive
                        ? `1.5px solid ${ex.color}88`
                        : '1.5px solid var(--border-muted)',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                position: 'relative',
                '--done-color': `${ex.color}55`,
                '--done-color-dim': `${ex.color}12`,
                animation: exDone ? 'doneGlow 3s ease-in-out infinite' : 'none',
                boxShadow: exDone ? `0 0 8px ${ex.color}33` : 'none'
            }}
        >
            {/* Done checkmark */}
            {exDone && (
                <div style={{
                    position: 'absolute', top: '-4px', right: '-4px',
                    width: '16px', height: '16px', borderRadius: '50%',
                    background: `linear-gradient(135deg, ${ex.gradient[0]}, ${ex.gradient[1]})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 0 8px ${ex.color}66`,
                    animation: 'checkPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    zIndex: 1
                }}>
                    <span style={{ fontSize: '9px', color: 'white', fontWeight: '700', lineHeight: 1 }}>✓</span>
                </div>
            )}
            <DynamicIcon
                icon={ex.icon}
                size={20}
                color={exDone ? ex.color : isActive ? ex.color : 'var(--text-secondary)'}
                style={{ transition: 'color 0.2s ease' }}
            />
            <span style={{
                fontSize: 'clamp(0.6rem, 1.4vh, 0.8rem)', fontWeight: '600',
                color: exDone ? ex.color : isActive ? ex.color : 'var(--text-secondary)',
                textAlign: 'center', lineHeight: '1.1',
                transition: 'color 0.2s ease'
            }}>
                {getExerciseLabel(ex)}
            </span>
            <span style={{
                fontSize: 'clamp(0.65rem, 1.5vh, 0.85rem)', fontWeight: '700',
                color: exDone ? ex.color : isActive ? ex.color : 'var(--text-secondary)',
                opacity: exDone ? 1 : isActive ? 1 : 0.6,
                transition: 'color 0.2s ease',
                textDecorationLine: exDone ? 'line-through' : 'none',
                textDecorationColor: `${ex.color}88`
            }}>
                {ex.type === 'timer'
                                                ? (exDone ? formatTime(exGoal) : `${formatTime(exCount)}/${formatTime(exGoal)}`)
                                                : (exDone ? exGoal : `${exCount}/${exGoal}`)
                                            }
            </span>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '-2px' }}>
                {WEIGHT_EXERCISES_MAP[ex.id] && (
                    <span style={{
                        fontSize: 'clamp(0.5rem, 1.1vh, 0.65rem)',
                        color: exDone ? ex.color : isActive ? ex.color : 'var(--text-secondary)',
                        opacity: exDone ? 1 : 0.8,
                        filter: exDone ? 'none' : 'grayscale(50%)'
                    }}>
                        🏋️{weight}kg
                    </span>
                )}
                {exStreak > 0 && (
                    <span style={{
                        fontSize: 'clamp(0.5rem, 1.1vh, 0.65rem)',
                        color: exDone ? ex.color : isActive ? ex.color : 'var(--text-secondary)',
                        opacity: exDone ? 1 : 0.6,
                        filter: exDone ? 'none' : 'grayscale(100%)'
                    }}>
                        🔥{exStreak}
                    </span>
                )}
            </div>
        </button>
    );
});
