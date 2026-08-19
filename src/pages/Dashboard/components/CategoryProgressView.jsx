import React from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Star, FolderPlus, Plus } from '@utils/icons';
import { UI_ICONS, DynamicIcon } from '@utils/icons';
import { getDailyGoal } from '@config/exercises';
import { parseTimestamp } from '@shared/dateUtils';
import { formatTime } from '@utils/formatters';
import { isPerfectDay } from '@utils/statUtils';
import { getExerciseLabel } from '@utils/exerciseLabel';

import { WEIGHT_EXERCISES_MAP } from '@config/weights';
import { StreakFlame, WeightBadge, EmptyState, Card, Button, Stack } from '@components/ui';
import styles from '@styles/CategoryProgressView.module.css';

export const CategoryProgressView = React.memo(({
    isFuture, effectiveStart, dayNumber, today, getExerciseCount, completions, computedStats,
    pauseCloudSync, setShowCounter,
    activeExerciseId, onSelectExercise, exercisesList, exercisesMap, title, categoryColor, onManageCustom, onAddCustom, onManageCategories, getConfig
}) => {
    const { t, i18n } = useTranslation();
    const safeSelectedExercise = exercisesMap[activeExerciseId] || exercisesList[0];

    const currentDiff = safeSelectedExercise ? getConfig(safeSelectedExercise.id, today).difficulty : 1;
    const dailyGoal = safeSelectedExercise ? (getDailyGoal(safeSelectedExercise, dayNumber, currentDiff) || 1) : 1;
    const currentCount = safeSelectedExercise ? getExerciseCount(today, safeSelectedExercise.id) : 0;
    const isExerciseDone = safeSelectedExercise ? (completions[today]?.[safeSelectedExercise.id]?.isCompleted || currentCount >= dailyGoal) : false;
    const progress = Math.min((dayNumber / 365) * 100, 100);

    const isDayPerfect = isPerfectDay(completions[today], exercisesList);


    const renderContent = () => {
        if (exercisesList.length === 0) {
            return (
                <div className="flex-col flex-center" style={{ padding: '16px' }}>
                    <EmptyState
                        title={t('dashboard.noExercisesConfigured')}
                        actionLabel={onAddCustom || onManageCustom ? t('customExercises.create') : undefined}
                        onAction={onAddCustom || onManageCustom}
                    />
                </div>
            );
        }

        if (isFuture) {
            return (
                <Card variant="premium" padding="xl" style={{
                    textAlign: 'center', maxWidth: '320px'
                }}>
                    <h2 className="panel-title">{t('dashboard.waiting')}</h2>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                        {t('dashboard.challengeStarts')} <br />
                        <strong style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>{effectiveStart}</strong>
                    </p>
                </Card>
            );
        }

        const showAddBtn = onManageCustom && exercisesList.length < 12;
        const itemCount = exercisesList.length + (showAddBtn ? 1 : 0);
        const addBtnSizing = getTileSizing(itemCount);

        return (
            <>
                {/* ── Exercise Selector ── */}
                <div className="exercise-grid flex-row flex-wrap flex-justify-center">
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
                            itemCount={itemCount}
                        />
                    ))}
                    {showAddBtn && (
                        <Button
                            variant="ghost"
                            onClick={onAddCustom || onManageCustom}
                            className="exercise-button"
                            aria-label={t('customExercises.create')}
                            title={t('customExercises.create')}
                            style={{
                                flex: addBtnSizing.flex,
                                minWidth: 'clamp(60px, 18vw, 100px)',
                                maxWidth: addBtnSizing.maxWidth,
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                gap: 'var(--exercise-btn-gap, clamp(2px, 0.4vh, 5px))',
                                padding: 'var(--exercise-btn-padding, clamp(8px, 1.2vh, 12px) clamp(4px, 0.8vw, 8px))',
                                borderRadius: 'var(--radius-md)',
                                minHeight: addBtnSizing.minHeight,
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1.5px dashed rgba(255, 255, 255, 0.25)',
                                cursor: 'pointer',
                                color: 'var(--text-secondary)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <Plus size={18} style={{ opacity: 0.8 }} />
                            <span style={{ fontSize: 'var(--tile-label-size, clamp(0.55rem, 1.25vh, 0.78rem))', fontWeight: '700' }}>
                                {t('common.add')}
                            </span>
                        </Button>
                    )}
                </div>

                {/* ── Progress ring + Counter button + Completion status (grouped) ── */}
                <div className="flex-col flex-align-center gap-responsive">
                    <div className="flex-center pos-relative" style={{
                        width: 'var(--bottom-btn-size, clamp(96px, 16vh, 140px))',
                        height: 'var(--bottom-btn-size, clamp(96px, 16vh, 140px))'
                    }}>
                        {/* Ambient halo behind the counter button */}
                        <div style={{
                            position: 'absolute', inset: '-45%', borderRadius: '50%',
                            background: `radial-gradient(circle, ${safeSelectedExercise.color}${isExerciseDone ? '35' : '20'} 0%, transparent 65%)`,
                            pointerEvents: 'none',
                            transition: 'background 0.6s ease',
                            animation: 'blobHaloPulse 4s ease-in-out infinite'
                        }} />
                        {/* Counter open button */}
                        <Button
                            variant="ghost"
                            aria-label={`${getExerciseLabel(safeSelectedExercise)} counter`}
                            onClick={() => { pauseCloudSync?.(); setShowCounter(true); }}
                            className="ripple counter-button"
                            style={{
                                width: '100%', height: '100%',
                                background: isExerciseDone
                                    ? `linear-gradient(135deg, ${safeSelectedExercise.color} 0%, ${safeSelectedExercise.gradient[1]} 100%)`
                                    : 'linear-gradient(135deg, #161726 0%, #0c0d16 100%)',
                                border: isExerciseDone ? 'none' : `2px solid ${safeSelectedExercise.color}50`,
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center', gap: '2px',
                                transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease',
                                willChange: 'transform',
                                transform: isExerciseDone ? 'scale(1.1)' : 'scale(1)',
                                boxShadow: isExerciseDone
                                    ? `0 0 45px ${safeSelectedExercise.color}99, 0 8px 28px ${safeSelectedExercise.color}55, 0 0 0 4px ${safeSelectedExercise.color}33`
                                    : `0 8px 24px rgba(0, 0, 0, 0.45), 0 0 20px ${safeSelectedExercise.color}30`,
                                cursor: 'pointer',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
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
                                    <UI_ICONS.Check size={28} color="white" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))', position: 'relative', zIndex: 1 }} />
                                    <span style={{
                                        fontSize: 'clamp(0.65rem, 1.4vh, 0.82rem)',
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
                                    <DynamicIcon icon={safeSelectedExercise.icon} size={25} color={safeSelectedExercise.color} style={{ filter: `drop-shadow(0 0 8px ${safeSelectedExercise.color}80)`, position: 'relative', zIndex: 1 }} />
                                    <span style={{ fontSize: 'clamp(0.6rem, 1.3vh, 0.78rem)', color: safeSelectedExercise.color, fontWeight: '800', position: 'relative', zIndex: 1, textShadow: `0 0 10px ${safeSelectedExercise.color}40` }}>
                                        {safeSelectedExercise.type === 'timer'
                                            ? `${formatTime(currentCount)}/${formatTime(dailyGoal)}`
                                            : `${currentCount}/${dailyGoal}`}
                                    </span>
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Completion status */}
                    {(() => {
                        let statusColor = 'var(--text-secondary)';
                        if (isExerciseDone) {
                            statusColor = safeSelectedExercise.color;
                        }

                        const completedTime = completions[today]?.[safeSelectedExercise.id]?.timestamp;
                        const parsedDate = completedTime ? parseTimestamp(completedTime) : null;
                        const timeStr = (parsedDate && !Number.isNaN(parsedDate.getTime()))
                            ? parsedDate.toLocaleTimeString(i18n.language || [], { hour: '2-digit', minute: '2-digit' })
                            : null;
                        const showDoneText = isExerciseDone && !!timeStr;

                        return (
                            <div
                                className="done-status-text flex-align-center"
                                style={{
                                    color: statusColor,
                                    fontWeight: '700',
                                    fontSize: 'var(--done-text-size, clamp(0.65rem, 2.2vw, 0.85rem))',
                                    margin: 'var(--done-text-margin, clamp(2px, 0.4vh, 6px)) 0 0 0',
                                    opacity: isExerciseDone ? 1 : 0.6,
                                    height: '1.2em',
                                    lineHeight: '1.2em',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}
                            >
                                {showDoneText ? t('dashboard.doneAt', { time: timeStr }) : '\u00A0'}
                            </div>
                        );
                    })()}
                </div>
            </>
        );
    };

    return (
        <div
            className={`flex-col flex-justify-center flex-align-center full-width pos-relative hide-scrollbar gap-responsive dashboard-slide-bg ${isDayPerfect ? styles.goldBg : ''}`}
            style={{
                minHeight: '100%',
                paddingTop: title ? '8px' : 0,
                transition: 'background 0.6s ease-in-out, opacity 0.6s ease-in-out',
                overflow: 'hidden'
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
                <Stack align="center" gap="xs" style={{ width: '100%' }}>
                    <div style={{
                        fontSize: 'var(--category-title-size, 0.82rem)', fontWeight: '800',
                        color: isDayPerfect ? '#ffdf00' : (categoryColor || 'var(--text-secondary)'),
                        textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.9,
                        textShadow: isDayPerfect ? '0 0 10px rgba(255,223,0,0.5)' : 'none',
                        textAlign: 'center'
                    }}>
                        {title}
                    </div>
                    {(onManageCustom || onManageCategories) && (
                        <Stack direction="row" align="center" justify="center" gap={6}>
                            {onManageCategories && (
                                <Button
                                    variant="ghost"
                                    onClick={onManageCategories}
                                    aria-label={t('customCategories.title')}
                                    title={t('customCategories.title')}
                                    
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                                        padding: '3px 10px', borderRadius: '12px',
                                        background: 'rgba(139, 92, 246, 0.15)',
                                        border: '1px solid rgba(139, 92, 246, 0.35)',
                                        color: '#a78bfa', fontSize: '0.72rem', fontWeight: '700',
                                        cursor: 'pointer', transition: 'all 0.2s ease',
                                        boxShadow: '0 2px 8px rgba(109, 40, 217, 0.25)'
                                    }}
                                >
                                    <FolderPlus size={12} />
                                    <span>{t('customCategories.titleShort') || 'Catégories'}</span>
                                </Button>
                            )}
                            {onManageCustom && (
                                <Button
                                    variant="ghost"
                                    onClick={onManageCustom}
                                    aria-label={t('customExercises.title')}
                                    title={t('customExercises.title')}
                                    
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                                        padding: '3px 10px', borderRadius: '12px',
                                        background: 'rgba(255, 255, 255, 0.08)',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        color: 'var(--text-primary)', fontSize: '0.72rem', fontWeight: '700',
                                        cursor: 'pointer', transition: 'all 0.2s ease',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
                                    }}
                                >
                                    <Settings size={12} />
                                    <span>{t('common.edit')}</span>
                                </Button>
                            )}
                        </Stack>
                    )}
                </Stack>
            )}
            {renderContent()}
        </div>
    );
});

const getTileSizing = (count) => {
    if (count <= 2) {
        return {
            flex: count === 1 ? '1 1 min(280px, 100%)' : '1 1 calc(50% - 10px)',
            maxWidth: count === 1 ? '350px' : '255px',
            minHeight: 'clamp(68px, 10.5vh, 88px)',
        };
    }
    if (count <= 4) {
        return {
            flex: '1 1 calc(50% - 10px)',
            maxWidth: '230px',
            minHeight: 'clamp(62px, 9.5vh, 80px)',
        };
    }
    if (count <= 6) {
        return {
            flex: '1 1 calc(33.333% - 8px)',
            maxWidth: '188px',
            minHeight: 'clamp(58px, 8.8vh, 74px)',
        };
    }
    return {
        flex: '1 1 calc(33.333% - 8px)',
        maxWidth: '172px',
        minHeight: 'var(--exercise-btn-min-height, clamp(48px, 7.5vh, 64px))',
    };
};

const ExerciseButton = React.memo(({
    ex, isActive, dayNumber, today,
    getExerciseCount, completions, computedStats, onSelect, getConfig, itemCount
}) => {
    const statsEx = computedStats.exerciseStats?.find(e => e.id === ex.id);
    const exStreak = statsEx ? statsEx.streak : 0;
    const exStreakActive = !!statsEx?.streakActive;
    const exCount = getExerciseCount(today, ex.id);
    const { difficulty: exDiff, weight } = getConfig(ex.id, today);
    const exGoal = getDailyGoal(ex, dayNumber, exDiff);
    const exDone = completions[today]?.[ex.id]?.isCompleted || exCount >= exGoal;
    const exPct = exDone ? 100 : Math.min(100, (exCount / Math.max(exGoal, 1)) * 100);

    const tileSizing = getTileSizing(itemCount || 4);

    let btnBg = `linear-gradient(160deg, ${ex.color}0d 0%, var(--surface-subtle) 80%)`;
    if (exDone) {
        btnBg = `linear-gradient(160deg, ${ex.color}26 0%, ${ex.gradient[1]}14 100%)`;
    } else if (isActive) {
        btnBg = `linear-gradient(160deg, ${ex.color}2e 0%, ${ex.gradient[0]}16 100%)`;
    }

    let btnBorder = '1.5px solid var(--border-default)';
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
        <Button
            variant="ghost"
            onClick={() => onSelect(ex.id)}
            className={`exercise-button${exDone ? ' exercise-done' : ''}`}
            style={{
                flex: tileSizing.flex,
                minWidth: 'clamp(60px, 18vw, 100px)',
                maxWidth: tileSizing.maxWidth,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 'var(--exercise-btn-gap, clamp(3px, 0.5vh, 6px))',
                padding: 'var(--exercise-btn-padding, clamp(8px, 1.2vh, 13px) clamp(6px, 0.9vw, 11px))',
                borderRadius: 'var(--radius-md)',
                minHeight: tileSizing.minHeight,
                background: btnBg,
                border: btnBorder,
                cursor: 'pointer',
                transition: 'background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease',
                position: 'relative',
                overflow: 'hidden',
                '--done-color': `${ex.color}55`,
                '--done-color-dim': `${ex.color}12`,
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
                width: 'var(--tile-icon-size, clamp(28px, 4.2vh, 35px))', height: 'var(--tile-icon-size, clamp(28px, 4.2vh, 35px))',
                borderRadius: '30%',
                background: `${ex.color}${exDone || isActive ? '2e' : '16'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.25s ease'
            }}>
                <DynamicIcon
                    icon={ex.icon}
                    size={18}
                    color={ex.color}
                    style={{ transition: 'opacity 0.2s ease', opacity: exDone || isActive ? 1 : 0.85 }}
                />
            </div>
            <span style={{
                fontSize: 'var(--tile-label-size, clamp(0.68rem, 1.4vh, 0.85rem))', fontWeight: '700',
                color: textThemeColor,
                textAlign: 'center', lineHeight: '1.1',
                transition: 'color 0.2s ease'
            }}>
                {getExerciseLabel(ex)}
            </span>
            <span style={{
                fontSize: 'var(--tile-count-size, clamp(0.72rem, 1.5vh, 0.9rem))', fontWeight: '800',
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
        </Button>
    );
});
