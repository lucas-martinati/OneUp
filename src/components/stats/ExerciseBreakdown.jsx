import React from 'react';
import { useTranslation } from 'react-i18next';
import { DynamicIcon } from '@utils/icons';
import { getExerciseLabel } from '@utils/exerciseLabel';
import { CATEGORIES, isUserCategory } from '@config/categories';
import { StreakFlame } from '../ui';

/** Per-exercise breakdown list, grouped by category. */
export function ExerciseBreakdown({
    enrichedExerciseStats,
    fullCategoryOrder, fullCategoryColors, customCategories,
    hasCardio, cardioSessions
}) {
    const { t } = useTranslation();

    if (enrichedExerciseStats.length === 0) return null;

    return (
        <div className="glass-premium" style={{
            padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)',
            marginBottom: 'var(--spacing-md)',
            background: 'var(--surface-section)'
        }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {fullCategoryOrder.map((catId, index) => {
                    const catStats = enrichedExerciseStats.filter(ex => ex.categoryId === catId);
                    if (catStats.length === 0) return null;
                    let catLabel;
                    if (isUserCategory(catId)) {
                        const catDef = customCategories.find(c => c.id === catId);
                        catLabel = catDef?.name || catId;
                    } else {
                        catLabel = {
                            [CATEGORIES.BODYWEIGHT]: t('common.bodyweight'),
                            [CATEGORIES.WEIGHTS]: t('common.weights'),
                            [CATEGORIES.CUSTOM]: t('common.custom'),
                            [CATEGORIES.CARDIO]: t('common.cardio')
                        }[catId];
                    }
                    const catColor = fullCategoryColors[catId] || '#8b5cf6';

                    return (
                        <React.Fragment key={catId}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                marginTop: index > 0 ? '12px' : '4px', marginBottom: '4px',
                                opacity: 0.8
                            }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: catColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {catLabel}
                                </div>
                                <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, ${catColor}40, transparent)` }}></div>
                            </div>
                            {catStats.map(ex => {
                                return (
                                    <div key={ex.id} style={{
                                        padding: '10px 12px', borderRadius: 'var(--radius-md)',
                                        background: `${ex.color}10`,
                                        border: `1px solid ${ex.color}25`
                                    }}>
                                        {/* Top row: icon, label, badges */}
                                        <div style={{
                                            display: 'flex', alignItems: 'center',
                                            gap: '10px', marginBottom: '6px'
                                        }}>
                                            <div style={{
                                                width: '32px', height: '32px', borderRadius: '50%',
                                                background: `${ex.color}20`, display: 'flex',
                                                alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                            }}>
                                                <DynamicIcon icon={ex.icon} size={16} color={ex.color} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{
                                                    display: 'flex', alignItems: 'center',
                                                    justifyContent: 'space-between'
                                                }}>
                                                    <span style={{
                                                        fontSize: '0.85rem', fontWeight: '700',
                                                        color: ex.color
                                                    }}>{getExerciseLabel(ex, t)}</span>
                                                    <div style={{
                                                        display: 'flex', alignItems: 'center', gap: '6px'
                                                    }}>
                                                        {ex.maxStreak > 0 && (
                                                            <span style={{
                                                                fontSize: '0.6rem', color: '#fbbf24',
                                                                background: 'rgba(251,191,36,0.1)',
                                                                padding: '2px 6px', borderRadius: '8px',
                                                                fontWeight: '600'
                                                            }}>
                                                                {t('stats.maxDays', { count: ex.maxStreak })}
                                                            </span>
                                                        )}
                                                        <StreakFlame streak={ex.streak} active={ex.streakActive} />
                                                    </div>
                                                </div>
                                                {/* Sub-stats row */}
                                                <div style={{
                                                    display: 'flex', alignItems: 'center',
                                                    gap: '8px', marginTop: '2px'
                                                }}>
                                                    {hasCardio && (ex.id === 'running' || ex.id === 'cycling') ? (
                                                        <>
                                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                                                {((cardioSessions.filter(s => s.type === ex.id).reduce((sum, s) => sum + (s.distance || 0), 0)) / 1000).toFixed(1)} {t('cardio.units.km')}
                                                            </span>
                                                            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', opacity: 0.5 }}>·</span>
                                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                                                {t('cardio.sessionsCount', { count: cardioSessions.filter(s => s.type === ex.id).length })}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                                                {ex.totalReps.toLocaleString()} {t('common.reps')}
                                                            </span>
                                                            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', opacity: 0.5 }}>·</span>
                                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                                                {ex.daysCompleted}{t('common.daysAbbr')}
                                                            </span>
                                                            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', opacity: 0.5 }}>·</span>
                                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                                                {ex.completionRate}%
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {/* Mini progress bar */}
                                        <div style={{
                                            height: '3px', borderRadius: '2px',
                                            background: 'var(--progress-track-thin)', overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                height: '100%', borderRadius: '2px',
                                                width: `${ex.completionRate}%`,
                                                background: `linear-gradient(90deg, ${ex.color}, ${ex.color}88)`,
                                                transition: 'width 0.6s ease'
                                            }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    )
                })}
            </div>
        </div>
    );
}
