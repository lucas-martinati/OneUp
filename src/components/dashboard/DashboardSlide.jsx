import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dumbbell, ArrowDownUp, ArrowUp, Zap, ChevronsUp, Footprints, Flame, Square, MoveDown, MoveDiagonal, Check, Settings as SettingsIcon } from 'lucide-react';
import { getDailyGoal } from '../../config/exercises';

const ICON_MAP = { Dumbbell, ArrowDownUp, ArrowUp, Zap, ChevronsUp, Footprints, Flame, Square, MoveDown, MoveDiagonal };

export const DashboardSlide = React.memo(({
    isFuture, effectiveStart, dayNumber, today, settings, getExerciseCount, completions, computedStats,
    isCounterTransitioning, prevDayNumber, numberKey, pauseCloudSync, setShowCounter,
    activeExerciseId, onSelectExercise, exercisesList, exercisesMap, title, onManageCustom
}) => {
    const { t } = useTranslation();
    const safeSelectedExercise = exercisesMap[activeExerciseId] || exercisesList[0];
    
    if (!safeSelectedExercise) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '20px', textAlign: 'center' }}>
                {title && <h2 style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>{title}</h2>}
                <div style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Vous n'avez pas encore configuré d'exercices ici.</div>
                {onManageCustom && (
                    <button onClick={onManageCustom} className="hover-lift" style={{
                        padding: '12px 24px', borderRadius: 'var(--radius-md)', background: '#8b5cf6', color: 'white', fontWeight: '700', border: 'none'
                    }}>
                        Configurer
                    </button>
                )}
            </div>
        );
    }

    const dailyGoal = getDailyGoal(safeSelectedExercise, dayNumber, settings?.difficultyMultiplier) || 1;
    const currentCount = getExerciseCount(today, safeSelectedExercise.id);
    const isExerciseDone = completions[today]?.[safeSelectedExercise.id]?.isCompleted || currentCount >= dailyGoal;
    const progress = Math.min((dayNumber / 365) * 100, 100);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'space-evenly', gap: 'clamp(4px, 0.8vh, 12px)',
            height: '100%', width: '100%', paddingTop: title ? '12px' : '0'
        }}>
            {title && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.8 }}>
                        {title}
                    </div>
                    {onManageCustom && (
                        <button onClick={onManageCustom} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', opacity: 0.6, padding: '4px' }}>
                            <SettingsIcon size={14} />
                        </button>
                    )}
                </div>
            )}
            {!isFuture ? (
                <>
                    {/* Day & Goal Hero Section */}
                    <div style={{ textAlign: 'center', position: 'relative' }}>
                        <div style={{
                            fontSize: 'clamp(0.75rem, 1.6vh, 1rem)', color: 'var(--text-secondary)',
                            textTransform: 'uppercase', letterSpacing: '4px',
                            marginBottom: '2px', fontWeight: '700'
                        }}>
                            {t('dashboard.day')}
                        </div>

                        {/* Big animated day number */}
                        <div style={{
                            position: 'relative', height: 'clamp(3.2rem, 9vh, 7rem)', overflow: 'hidden',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: 'clamp(2px, 0.5vh, 6px)'
                        }}>
                            {isCounterTransitioning && prevDayNumber && (
                                <div className="rainbow-gradient" style={{
                                    position: 'absolute', fontSize: 'clamp(3rem, 8.5vh, 6.5rem)', fontWeight: '800', lineHeight: 1,
                                    animation: 'rainbowFlow 6s ease infinite, counterSlideDown 1s ease-out forwards'
                                }}>
                                    {prevDayNumber}
                                </div>
                            )}
                            <div
                                key={isCounterTransitioning ? `new-${dayNumber}` : numberKey}
                                className="rainbow-gradient"
                                style={{
                                    fontSize: 'clamp(3rem, 8.5vh, 6.5rem)', fontWeight: '800', lineHeight: 1,
                                    animation: isCounterTransitioning
                                        ? 'rainbowFlow 6s ease infinite, counterSlideUp 1s ease-out'
                                        : 'rainbowFlow 6s ease infinite, numberRoll 0.5s ease-out'
                                }}
                            >
                                {dayNumber}
                            </div>
                        </div>
                    </div>

                    {/* ── Exercise Selector ── */}
                    <div className="exercise-grid" style={{
                        display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
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
                                settings={settings}
                                getExerciseCount={getExerciseCount}
                                completions={completions}
                                computedStats={computedStats}
                                onSelect={onSelectExercise}
                            />
                        ))}
                    </div>

                    {/* ── Progress ring + Counter button + Completion status (grouped) ── */}
                    <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        gap: 'clamp(4px, 0.8vh, 10px)'
                    }}>
                        <div style={{ 
                            position: 'relative', 
                            width: 'clamp(72px, 12vh, 110px)', 
                            height: 'clamp(72px, 12vh, 110px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center' 
                        }}>
                            {/* Year progress ring */}
                            <svg viewBox="0 0 100 100" style={{
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
                                onClick={() => { pauseCloudSync?.(); setShowCounter(true); }}
                                className="ripple"
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
                                        <div style={{
                                            position: 'absolute',
                                            top: '-50%',
                                            left: '-50%',
                                            width: '200%',
                                            height: '200%',
                                            background: `conic-gradient(from 0deg, transparent, ${safeSelectedExercise.color}44, transparent, ${safeSelectedExercise.color}44, transparent)`,
                                            animation: 'spin 2s linear infinite',
                                            pointerEvents: 'none'
                                        }} />
                                        <Check size={26} color="white" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))', position: 'relative', zIndex: 1 }} />
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
                                        {(() => { const I = ICON_MAP[safeSelectedExercise.icon] || Dumbbell; return <I size={22} color={safeSelectedExercise.color} />; })()}
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
                            const completedAt = exData?.timestamp ? new Date(exData.timestamp) : null;
                            const timeStr = completedAt
                                ? completedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
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
                    <h2 style={{ marginBottom: '12px', fontSize: '1.5rem' }}>{t('dashboard.waiting')}</h2>
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
    ex, isActive, dayNumber, today, settings,
    getExerciseCount, completions, computedStats, onSelect
}) => {
    const { t } = useTranslation();
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const ExIcon = ICON_MAP[ex.icon] || Dumbbell;
    const statsEx = computedStats.exerciseStats?.find(e => e.id === ex.id);
    const exStreak = statsEx ? statsEx.streak : 0;
    const exCount = getExerciseCount(today, ex.id);
    const exGoal = getDailyGoal(ex, dayNumber, settings?.difficultyMultiplier);
    const exDone = completions[today]?.[ex.id]?.isCompleted || exCount >= exGoal;

    return (
        <button
            onClick={() => onSelect(ex.id)}
            className="hover-lift"
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
            <ExIcon
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
                {ex.id.startsWith('custom_') ? (ex.label || ex.name) : t('exercises.' + ex.id)}
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
        </button>
    );
});
