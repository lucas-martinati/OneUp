import React, { useState, useCallback, useRef, useDeferredValue, Suspense, lazy } from 'react';
import { X, Award } from '@utils/icons';
import { IconButton } from '@components/ui';
import { SegmentedControl } from '@components/ui/SegmentedControl';
import { useTranslation } from 'react-i18next';
import { computeAllStats } from '@hooks/useComputedStats';
import { useExerciseConfig } from '@hooks/useExerciseConfig';
import { canAccessFeature, FEATURES } from '@utils/entitlements';
import { BADGE_DEFINITIONS } from '@config/badgeDefinitions';
import { Z_INDEX } from '@utils/zIndex';
import { useBackHandler } from '@hooks/useBackHandler';
import { getSessionHistory, removeSession } from '@features/share/services/sessionHistoryService';
import { getExerciseLabel } from '@utils/exerciseLabel';
import { SharePanel } from '@features/share/components/SharePanel';
import { useProgressStore } from '@store/useProgressStore';
import { useSettingsStore } from '@store/useSettingsStore';
import { useComputedStatsFromStore } from '@hooks/useComputedStatsFromStore';
import { useSubscription } from '@contexts/SubscriptionContext';
import { useExercises } from '@contexts/ExercisesContext';
import { useCardio } from '@features/cardio/useCardio';
import { CATEGORIES, buildFullCategoryOrder, buildFullCategoryColors, isUserCategory } from '@config/categories';
import { StatsFilters } from './StatsFilters';
import { StatsOverviewCards } from './StatsOverviewCards';
import { StatsHighlights } from './StatsHighlights';
import { MonthlyActivityChart } from './MonthlyActivityChart';
import { ExerciseBreakdown } from './ExerciseBreakdown';
import { SessionHistoryList } from './SessionHistoryList';
import { AchievementsShowcase } from './AchievementsShowcase';

// Lazy load Recharts components
const RadarChartPanel = lazy(() => import('./RadarChartPanel'));
const ConsistencyPieChart = lazy(() => import('./ConsistencyPieChart'));
const DailyRepsChart = lazy(() => import('./DailyRepsChart'));
const WeightEvolutionChart = lazy(() => import('./WeightEvolutionChart'));
const DifficultyEvolutionChart = lazy(() => import('./DifficultyEvolutionChart'));
const CardioStatsPanel = lazy(() => import('@features/cardio/CardioStatsPanel').then(m => ({ default: m.CardioStatsPanel })));
const SessionDetailModal = lazy(() => import('@features/share/components/SessionDetailModal').then(m => ({ default: m.SessionDetailModal })));

export function Stats({ initialCategory, onClose, onOpenAchievements, onOpenStore }) {

    // ── Store consumption ──
    const completions = useProgressStore(s => s.completions);
    const getDayNumber = useProgressStore(s => s.getDayNumber);
    const settings = useSettingsStore(s => s.settings);
    const globalStats = useComputedStatsFromStore();
    const { isPro, hadPro } = useSubscription();
    // For stats viewing, previously having pro is enough
    const hasProAccess = isPro || hadPro;
    const { exercisesByCategory: exercisesList, customCategories, exercisesByUserCategory } = useExercises();
    const fullCategoryOrder = buildFullCategoryOrder(customCategories);
    const fullCategoryColors = buildFullCategoryColors(customCategories);
    const { getConfig } = useExerciseConfig();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedSession, setSelectedSession] = useState(null);
    const [activeCategories, setActiveCategories] = useState(() => {
        if (initialCategory === 'global') return ['standard', 'weights', 'custom'];
        if (initialCategory === 'cardio') return ['cardio'];
        if (isUserCategory(initialCategory)) return [initialCategory];
        return [initialCategory || 'standard'];
    });
    const [showFilters, setShowFilters] = useState(false);
    const isClosingRef = useRef(false);

    // Deferred copy of the selected categories: the filter chips toggle
    // instantly (urgent state), while the heavy stats recompute below reads
    // this deferred value so it never blocks the toggle interaction.
    const deferredCategories = useDeferredValue(activeCategories);
    // useDeferredValue returns the previous (stale) reference while a recompute
    // is pending, so this is true exactly while the stats are catching up.
    const statsPending = activeCategories !== deferredCategories;

    const hasCardio = activeCategories.includes('cardio');
    const onlyCardio = hasCardio && activeCategories.length === 1;
    const cardioData = useCardio();
    const cardioKm = onlyCardio ? cardioData.allSessions.reduce((sum, s) => sum + (s.distance || 0), 0) / 1000 : null;

    const handleClose = useCallback(() => {
        if (isClosingRef.current) return;
        isClosingRef.current = true;
        onClose();
    }, [onClose]);

    // Touch gesture handlers for mobile swipe category switching
    const touchStartRef = useRef({ x: 0, y: 0, time: 0 });

    const handleTouchStart = useCallback((e) => {
        const touch = e.touches[0];
        touchStartRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now()
        };
    }, []);

    const handleTouchEnd = useCallback((e) => {
        const touch = e.changedTouches[0];
        const start = touchStartRef.current;
        const diffX = start.x - touch.clientX;
        const diffY = start.y - touch.clientY;
        const duration = Date.now() - start.time;

        // Swipe horizontal threshold: 60px, vertical deviation < horizontal * 0.6, duration < 300ms
        if (Math.abs(diffX) > 60 && Math.abs(diffY) < Math.abs(diffX) * 0.6 && duration < 300) {
            const tabs = ['overview', 'charts', 'details'];
            const currentIndex = tabs.indexOf(activeTab);
            if (diffX > 0) {
                // Swipe left -> Next tab
                if (currentIndex < tabs.length - 1) {
                    setActiveTab(tabs[currentIndex + 1]);
                }
            } else {
                // Swipe right -> Previous tab
                if (currentIndex > 0) {
                    setActiveTab(tabs[currentIndex - 1]);
                }
            }
        }
    }, [activeTab]);

    // Handle back button
    useBackHandler(() => {
        if (selectedSession) {
            setSelectedSession(null);
            return true;
        }
        if (showFilters) {
            setShowFilters(false);
            return true;
        }
        handleClose();
        return true;
    }, true);

    const exercises = React.useMemo(() => {
        let list = [];
        if (deferredCategories.includes('standard')) list.push(...(exercisesList.standard || []).map(e => ({ ...e, categoryId: CATEGORIES.BODYWEIGHT })));
        if (deferredCategories.includes('weights')) list.push(...(exercisesList.weights || []).map(e => ({ ...e, categoryId: CATEGORIES.WEIGHTS })));
        if (deferredCategories.includes('custom')) list.push(...(exercisesList.custom || []).map(e => ({ ...e, categoryId: CATEGORIES.CUSTOM })));
        if (deferredCategories.includes('cardio')) list.push(...(exercisesList.cardio || []).map(e => ({ ...e, categoryId: CATEGORIES.CARDIO })));
        // User-created categories
        customCategories.forEach(cat => {
            if (deferredCategories.includes(cat.id)) {
                list.push(...(exercisesByUserCategory[cat.id] || []).map(e => ({ ...e, categoryId: cat.id })));
            }
        });
        return list;
    }, [deferredCategories, exercisesList, customCategories, exercisesByUserCategory]);

    // Cardio reps are now computed inside computeAllStats directly from
    // completions (goal-based, capped per validated week) — this only needs
    // to carry the raw session list through for the weekly streak calculation.
    const localCardioData = React.useMemo(() => ({
        allSessions: cardioData?.allSessions || [],
    }), [cardioData.allSessions]);

    const userStartDate = useProgressStore(s => s.userStartDate);
    const frozenDays = useProgressStore(s => s.frozenDays);

    const computedStats = React.useMemo(() => {
        if (canAccessFeature(FEATURES.MERGED_STATS, { isPro: hasProAccess }) && deferredCategories.length === 4) return globalStats;
        return computeAllStats(completions, settings, getDayNumber, exercises, false, {}, getConfig, localCardioData, userStartDate, frozenDays);
    }, [deferredCategories, completions, settings, getDayNumber, exercises, globalStats, hasProAccess, getConfig, localCardioData, userStartDate, frozenDays]);

    // All values come from computedStats
    const {
        totalDays, maxStreak, displayStreak, streakActive, successRate,
        perfectDays, totalExerciseCompletions, globalTotalReps,
        exerciseStats, radarData, champion,
        monthlyActivityByExercise, monthlyActivityTotal,
        pieData, trackedCount,
        bestDayDate, bestDayReps, bestDayExReps,
        dailyRepsData
    } = computedStats;

    const exercisesMapForStats = React.useMemo(() => {
        const map = {};
        exercises.forEach(e => { map[e.id] = e; });
        return map;
    }, [exercises]);

    const enrichedExerciseStats = React.useMemo(() => {
        return exerciseStats.map(ex => {
            const found = exercisesMapForStats[ex.id];
            return { ...ex, categoryId: found?.categoryId || ex.categoryId };
        }).filter(ex => ex.categoryId); // Only keep exercises that are in the active categories
    }, [exerciseStats, exercisesMapForStats]);

    const activeData = pieData.filter(d => d.value > 0).map(d => ({
        ...d,
        name: t('stats.pieLabels.' + d.id)
    }));
    const translatedRadarData = radarData.map(d => {
        const ex = exercisesMapForStats[d.exId];
        return {
            ...d,
            subject: getExerciseLabel(ex, t)
        };
    });

    const [sessionHistory, setSessionHistory] = useState(() => getSessionHistory());

    const handleDeleteSession = useCallback((sessionId) => {
        const updated = removeSession(sessionId);
        setSessionHistory(updated);
    }, []);

    const handleSessionNameChange = useCallback((sessionId, newName) => {
        setSessionHistory(prev => prev.map(s => s.id === sessionId ? { ...s, name: newName } : s));
    }, []);

    // Share button reused at the bottom of every tab (consistent spacing).
    const shareBlock = (
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <SharePanel
                sessionData={{ date: new Date().toISOString(), exercises: [], duration: 0, name: t('stats.title') }}
                stats={globalStats}
                variant="stats"
                mode="global"
                activeCategories={activeCategories}
            />
        </div>
    );

    return (
        <div className="fade-in modal-overlay" style={{ zIndex: Z_INDEX.MODAL }}>
            <div className="modal-content"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {/* ── Header ──────────────────────────────────────────────── */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: 'var(--spacing-md)'
                }}>
                    <h2 className="panel-title" style={{ margin: 0 }}>
                        {t('stats.title')}
                    </h2>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={onOpenAchievements} className="hover-lift" style={{
                            background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,191,36,0.1))',
                            border: '1px solid rgba(251,191,36,0.3)', borderRadius: '12px',
                            padding: '8px 12px', display: 'flex', alignItems: 'center',
                            gap: '8px', color: '#fbbf24', cursor: 'pointer',
                            minHeight: 'var(--touch-min)'
                        }}>
                            <Award size={18} />
                            <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>
                                {globalStats.badgeCount}/{BADGE_DEFINITIONS.length}
                            </span>
                        </button>
                        <IconButton icon={X} variant="glass" onClick={onClose} className="hover-lift" aria-label="Close" />
                    </div>
                </div>

                <StatsFilters
                    showFilters={showFilters} setShowFilters={setShowFilters}
                    activeCategories={activeCategories} setActiveCategories={setActiveCategories}
                    fullCategoryOrder={fullCategoryOrder} fullCategoryColors={fullCategoryColors}
                    customCategories={customCategories}
                    hasProAccess={hasProAccess} onOpenStore={onOpenStore}
                />

                {/* ── Section tabs: keep each view short, no endless scroll ── */}
                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                    <SegmentedControl
                        options={[
                            { id: 'overview', label: t('common.overview') },
                            { id: 'charts', label: t('stats.tabCharts') },
                            { id: 'details', label: t('stats.tabDetails') },
                        ]}
                        value={activeTab}
                        onChange={setActiveTab}
                        style={{ width: '100%' }}
                    />
                </div>

                {/* ── Tab: Overview ─────────────────────────────────────── */}
                {activeTab === 'overview' && (
                    <>
                        <AchievementsShowcase stats={globalStats} onOpen={onOpenAchievements} />

                        <StatsOverviewCards
                            onlyCardio={onlyCardio} cardioKm={cardioKm} cardioSessionsCount={cardioData.allSessions.length}
                            globalTotalReps={globalTotalReps} exercisesCount={exercises?.length || 0} totalDays={totalDays}
                            displayStreak={displayStreak} streakActive={streakActive} maxStreak={maxStreak} successRate={successRate}
                            totalExerciseCompletions={totalExerciseCompletions} perfectDays={perfectDays}
                            pending={statsPending}
                        />

                        <StatsHighlights
                            champion={champion}
                            bestDayDate={bestDayDate} bestDayReps={bestDayReps} bestDayExReps={bestDayExReps}
                            exercises={exercises}
                            pending={statsPending}
                        />

                        {shareBlock}

                        {/* ── Motivational footer ───────────────────────── */}
                        <div className="glass slide-up" style={{
                            marginBottom: 'var(--spacing-md)', padding: 'var(--spacing-sm) var(--spacing-md)',
                            borderRadius: 'var(--radius-lg)', textAlign: 'center',
                            background: 'linear-gradient(135deg, rgba(14,165,233,0.1), rgba(6,182,212,0.1))'
                        }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                💪 <strong style={{ color: '#0ea5e9' }}>{t('stats.quote')}</strong>
                            </p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px', opacity: 0.7 }}>
                                {t('stats.quoteSub')}
                            </p>
                        </div>
                    </>
                )}

                {/* ── Tab: Charts (heavy Recharts only mount on demand) ── */}
                {activeTab === 'charts' && (
                    <Suspense fallback={
                        <div className="glass-premium" style={{
                            padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)',
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            height: '200px', marginBottom: 'var(--spacing-md)'
                        }}>
                            <div style={{ color: 'var(--text-secondary)' }}>{t('stats.loadingCharts')}</div>
                        </div>
                    }>
                        <MonthlyActivityChart
                            monthlyActivityTotal={monthlyActivityTotal}
                            monthlyActivityByExercise={monthlyActivityByExercise}
                            exercises={exercises}
                        />
                        <DailyRepsChart
                            dailyRepsData={dailyRepsData}
                            title={t('stats.dailyReps')}
                            t={t}
                        />
                        {activeCategories.includes('weights') && hasProAccess && (
                            <WeightEvolutionChart
                                title={t('weight.title')}
                                t={t}
                                getConfig={getConfig}
                                completions={completions}
                            />
                        )}
                        <DifficultyEvolutionChart
                            title={t('stats.difficultyEvolution')}
                            t={t}
                            getConfig={getConfig}
                            completions={completions}
                            exercises={exercises}
                        />
                        <RadarChartPanel
                            radarData={translatedRadarData}
                            globalTotalReps={globalTotalReps}
                            title={t('stats.muscleBalance')}
                        />
                        <ConsistencyPieChart
                            activeData={activeData}
                            trackedCount={trackedCount}
                            title={t('stats.consistency')}
                            subTitle={t('stats.basedOnManual', { count: trackedCount })}
                            emptyTitle={t('stats.notEnoughData')}
                            emptySub={t('stats.completeForHabits')}
                        />
                        {hasCardio && <CardioStatsPanel />}
                    </Suspense>
                )}
                {activeTab === 'charts' && shareBlock}

                {/* ── Tab: Details (per-exercise breakdown + history) ──── */}
                {activeTab === 'details' && (
                    <>
                        <ExerciseBreakdown
                            enrichedExerciseStats={enrichedExerciseStats}
                            fullCategoryOrder={fullCategoryOrder} fullCategoryColors={fullCategoryColors}
                            customCategories={customCategories}
                            hasCardio={hasCardio} cardioSessions={cardioData.allSessions}
                        />

                        {/* ── Session History ──────────────────────────── */}
                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                            <SessionHistoryList
                                sessionHistory={sessionHistory}
                                onSelectSession={setSelectedSession}
                            />
                        </div>

                        {shareBlock}
                    </>
                )}

                {/* ── Session Detail Modal (lazy) ──────────────────────────── */}
                <Suspense fallback={null}>
                    {selectedSession && (
                        <SessionDetailModal
                            session={selectedSession}
                            onClose={() => setSelectedSession(null)}
                            onDelete={handleDeleteSession}
                            onNameChange={handleSessionNameChange}
                            stats={globalStats}
                            isPro={hasProAccess}
                        />
                    )}
                </Suspense>
            </div>
        </div>
    );
}
