import { LevelStreakDetails } from '@components/ui/LevelStreakDetails';
import { LevelEmblem } from '@components/ui/LevelEmblem';
import { getStreakRecordLevel } from '@shared/exerciseLevels.js';
import { useTranslation } from 'react-i18next';
import { DynamicIcon, Trophy } from '@utils/icons';
import { getExerciseLabel } from '@utils/exerciseLabel';
import { CATEGORIES, isUserCategory } from '@config/categories';
import { Card, StreakFlame, WeightBadge } from '@components/ui';
import { useExercises } from '@contexts/ExercisesContext';
import styles from './ExerciseBreakdown.module.css';

/** Per-exercise totals and consistency, grouped by category. */
export function ExerciseBreakdown({
    enrichedExerciseStats,
    fullCategoryOrder, fullCategoryColors,
    hasCardio, cardioSessions = [],
    settings
}) {
    const { t, i18n } = useTranslation();
    const { customCategoriesMap } = useExercises();
    const numberFormat = new Intl.NumberFormat(i18n.language);
    const distanceFormat = new Intl.NumberFormat(i18n.language, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

    if (enrichedExerciseStats.length === 0) return null;

    return (
        <div className={styles.categories}>
            {fullCategoryOrder.map(catId => {
                const catStats = enrichedExerciseStats.filter(ex => ex.categoryId === catId);
                if (catStats.length === 0) return null;
                const catLabel = isUserCategory(catId)
                    ? customCategoriesMap[catId]?.name || catId
                    : {
                        [CATEGORIES.BODYWEIGHT]: t('common.bodyweight'),
                        [CATEGORIES.WEIGHTS]: t('common.weights'),
                        [CATEGORIES.CUSTOM]: t('common.custom'),
                        [CATEGORIES.CARDIO]: t('common.cardio')
                    }[catId];

                return (
                    <section key={catId} className={styles.category} aria-label={catLabel} style={{ '--category-color': fullCategoryColors[catId] || 'var(--accent-glow)' }}>
                        <div className={styles.categoryHeader}>
                            <h3>{catLabel}</h3>
                            <span>{t('common.exerciseCount', { count: catStats.length })}</span>
                        </div>
                        <div className={styles.exercises}>
                            {catStats.map(ex => {
                                const weekly = ex.id === 'running' || ex.id === 'cycling';
                                const isCardio = hasCardio && weekly;
                                const sessions = isCardio ? cardioSessions.filter(s => s.type === ex.id) : [];
                                const total = isCardio
                                    ? distanceFormat.format(sessions.reduce((sum, s) => sum + (s.distance || 0), 0) / 1000)
                                    : numberFormat.format(ex.totalReps || 0);
                                const rate = Math.min(100, Math.max(0, ex.completionRate || 0));
                                const label = getExerciseLabel(ex, t);

                                return (
                                    <Card as="article" key={ex.id} aria-label={label} color={ex.color} padding="none" className={styles.exercise} style={{ '--exercise-color': ex.color || 'var(--accent-glow)' }}>
                                        <div className={styles.content}>
                                            <div className={styles.header}>
                                                <div className={styles.icon} aria-hidden="true">
                                                    <DynamicIcon icon={ex.icon} size={20} color="var(--exercise-color)" />
                                                </div>
                                                <div className={styles.identity}>
                                                    <h4 className={styles.name}>{label}</h4>
                                                    {ex.categoryId === CATEGORIES.WEIGHTS && (
                                                        <WeightBadge weight={settings?.exerciseWeights?.[ex.id] ?? ex.defaultWeight} color={ex.color} />
                                                    )}
                                                </div>
                                                <div className={styles.total}>
                                                    <span className={styles.value}>{total}</span>
                                                    <span className={styles.unit}>{t(isCardio ? 'cardio.units.km' : 'common.reps')}</span>
                                                </div>
                                            </div>

                                            {(ex.streak > 0 || ex.maxStreak > 0) && (
                                                <div className={styles.highlights}>
                                                    <StreakFlame streak={ex.streak} level={ex.streakLevel} active={ex.streakActive} weekly={weekly} />
                                                    {ex.maxStreak > 0 && (
                                                        <div className={styles.record}>
                                                            <Trophy size={13} aria-hidden="true" />
                                                            <span>{t('levels.record')}</span>
                                                            <strong>{numberFormat.format(ex.maxStreak)} {t(weekly ? 'common.weeksAbbr' : 'common.daysAbbr')}</strong>
                                                            <LevelEmblem level={getStreakRecordLevel(ex.levelStreaks, ex.maxStreak)} size={22} />
                                                </div>
                                            )}
                                                </div>
                                            )}

                                            <div className={styles.progress}>
                                                <div className={styles.progressLabel}>
                                                    <span>{isCardio
                                                        ? t('cardio.sessionsCount', { count: sessions.length })
                                                        : <>{t('stats.completedDays')} <strong>{numberFormat.format(ex.daysCompleted || 0)}</strong></>}
                                                    </span>
                                                    <strong>{numberFormat.format(rate)}%</strong>
                                                </div>
                                                <div className={styles.track} role="progressbar" aria-label={`${label} · ${t('stats.completedDays')}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={rate}>
                                                    <div className={styles.fill} style={{ width: `${rate}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                        {ex.levelStreaks?.length > 0 && (
                                            <div className={styles.levels}>
                                                <LevelStreakDetails levels={ex.levelStreaks} weekly={weekly} />
                                            </div>
                                        )}
                                    </Card>
                                );
                            })}
                        </div>
                    </section>
                );
            })}
        </div>
    );
}
