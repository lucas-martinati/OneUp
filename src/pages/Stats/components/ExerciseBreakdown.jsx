import React from 'react';
import { useTranslation } from 'react-i18next';
import { DynamicIcon } from '@utils/icons';
import { getExerciseLabel } from '@utils/exerciseLabel';
import { CATEGORIES, isUserCategory } from '@config/categories';
import { StreakFlame } from '@components/ui';
import { useExercises } from '@contexts/ExercisesContext';

/** Per-exercise breakdown list, grouped by category. */
export function ExerciseBreakdown({
    enrichedExerciseStats,
    fullCategoryOrder, fullCategoryColors,
    hasCardio, cardioSessions
}) {
    const { t } = useTranslation();
    const { customCategoriesMap } = useExercises();

    if (enrichedExerciseStats.length === 0) return null;

    return (
        <div className="glass-premium" style={{
            padding: 'var(--space-6)', borderRadius: 'var(--radius-lg)',
            background: 'var(--surface-section)'
        }}>
            <div className="flex-col gap-8">
                {fullCategoryOrder.map((catId, index) => {
                    const catStats = enrichedExerciseStats.filter(ex => ex.categoryId === catId);
                    if (catStats.length === 0) return null;
                    let catLabel;
                    if (isUserCategory(catId)) {
                        const catDef = customCategoriesMap[catId];
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
                                        padding: '8px 12px', borderRadius: 'var(--radius-md)',
                                        background: `${ex.color}10`, border: `1px solid ${ex.color}20`,
                                        display: 'flex', flexDirection: 'column', gap: '6px',
                                        marginBottom: '6px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                                                <div style={{ 
                                                    width: '28px', height: '28px', borderRadius: '8px', 
                                                    background: `${ex.color}1a`, border: `1px solid ${ex.color}33`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                                                }}>
                                                    <DynamicIcon icon={ex.icon} size={14} color={ex.color} />
                                                </div>
                                                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {getExerciseLabel(ex, t)}
                                                </span>
                                                <StreakFlame streak={ex.streak} active={ex.streakActive} />
                                            </div>
                                            
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                                {ex.maxStreak > 0 && (
                                                    <span style={{
                                                        fontSize: '0.6rem', color: '#fbbf24',
                                                        background: 'rgba(251,191,36,0.1)',
                                                        padding: '2px 6px', borderRadius: '8px',
                                                        fontWeight: '700'
                                                    }}>
                                                        {t('stats.maxDays', { count: ex.maxStreak })}
                                                    </span>
                                                )}
                                                <div style={{ fontSize: '0.95rem', fontWeight: '800', color: ex.color, fontVariantNumeric: 'tabular-nums' }}>
                                                    {hasCardio && (ex.id === 'running' || ex.id === 'cycling') ? 
                                                        `${((cardioSessions.filter(s => s.type === ex.id).reduce((sum, s) => sum + (s.distance || 0), 0)) / 1000).toFixed(1)} ${t('cardio.units.km')}`
                                                        : ex.totalReps.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                                <div style={{ 
                                                    height: '100%', borderRadius: '2px', width: `${ex.completionRate}%`, 
                                                    background: ex.color,
                                                    boxShadow: `0 0 10px ${ex.color}80`,
                                                    transition: 'width 0.6s ease'
                                                }} />
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {hasCardio && (ex.id === 'running' || ex.id === 'cycling') ? (
                                                    <span style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                                                        {t('cardio.sessionsCount', { count: cardioSessions.filter(s => s.type === ex.id).length })}
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                                                        {ex.daysCompleted}{t('common.daysAbbr')}
                                                    </span>
                                                )}
                                                <div style={{ fontSize: '0.65rem', fontWeight: '700', color: ex.color, minWidth: '35px', textAlign: 'right' }}>
                                                    {(ex.completionRate || 0).toFixed(1)}%
                                                </div>
                                            </div>
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
