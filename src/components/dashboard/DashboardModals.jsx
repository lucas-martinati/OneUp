import React, { Suspense, lazy } from 'react';
import { CATEGORIES, isUserCategory } from '@config/categories';
import { EXERCISES, CARDIO_EXERCISES } from '@config/exercises';
import { WEIGHT_EXERCISES } from '@config/weights';

import { useProgressStore } from '@store/useProgressStore';
import { useSettingsStore } from '@store/useSettingsStore';
import { useCloudSyncStore } from '@store/useCloudSyncStore';
import { useComputedStatsStore } from '@store/useComputedStatsStore';
import { useUIStore } from '@store/useUIStore';
import { useSubscription } from '@contexts/SubscriptionContext';
import { useExercises } from '@contexts/ExercisesContext';
import { useExerciseConfig } from '@hooks/useExerciseConfig';

const Calendar = lazy(() => import('../stats/Calendar').then(m => ({ default: m.Calendar })));
const Stats = lazy(() => import('../stats/Stats').then(m => ({ default: m.Stats })));
const Settings = lazy(() => import('../settings/Settings').then(m => ({ default: m.Settings })));
const ExercisePanel = lazy(() => import('../exercises/ExercisePanel').then(m => ({ default: m.ExercisePanel })));
const Leaderboard = lazy(() => import('../social/Leaderboard').then(m => ({ default: m.Leaderboard })));
const Achievements = lazy(() => import('../feedback/Achievements').then(m => ({ default: m.Achievements })));
const WorkoutSession = lazy(() => import('../exercises/WorkoutSession').then(m => ({ default: m.WorkoutSession })));
const CustomExercisesModal = lazy(() => import('../exercises/CustomExercisesModal').then(m => ({ default: m.CustomExercisesModal })));
const CategoryManagerModal = lazy(() => import('../exercises/CategoryManagerModal').then(m => ({ default: m.CategoryManagerModal })));
const AdminPanel = lazy(() => import('../admin/AdminPanel').then(m => ({ default: m.AdminPanel })));

export function DashboardModals({
    currentCatKey, effectiveSlide,
    selectedExercise, selectedExerciseId, dailyGoal, currentCount, isExerciseDone,
    dayNumber, today
}) {
    const startDate = useProgressStore(s => s.startDate);
    const completions = useProgressStore(s => s.completions);
    const getDayNumber = useProgressStore(s => s.getDayNumber);
    const updateExerciseCount = useProgressStore(s => s.updateExerciseCount);
    const settings = useSettingsStore(s => s.settings);
    const resumeCloudSync = useCloudSyncStore(s => s.resumeCloudSync);
    const computedStats = useComputedStatsStore(s => s.stats);
    const { getConfig } = useExerciseConfig();
    const { isPro } = useSubscription();
    const {
        customExercisesHook, customCategoriesHook,
        defaultCustomExercises, exercisesByUserCategory
    } = useExercises();

    // ── UI store ──
    const modals = useUIStore(s => s.modals);
    const closeModal = useUIStore(s => s.closeModal);
    const openStore = useUIStore(s => s.openStore);
    const closeSettings = useUIStore(s => s.closeSettings);
    const openStoreDirectly = useUIStore(s => s.openStoreDirectly);
    const customExModalCatId = useUIStore(s => s.customExModalCatId);
    const closeCustomExercises = useUIStore(s => s.closeCustomExercises);
    const openAchievements = useUIStore(s => s.openAchievements);
    const closeAchievements = useUIStore(s => s.closeAchievements);
    const highlightedBadgeId = useUIStore(s => s.highlightedBadgeId);
    const sessionMode = useUIStore(s => s.sessionMode);
    const setSessionInProgress = useUIStore(s => s.setSessionInProgress);

    return (
        <>
            {modals.calendar && (
                <Suspense fallback={null}>
                    <Calendar
                        startDate={startDate}
                        completions={completions}
                        exercises={isUserCategory(currentCatKey)
                            ? (exercisesByUserCategory[currentCatKey] || [])
                            : {
                                [CATEGORIES.BODYWEIGHT]: EXERCISES,
                                [CATEGORIES.WEIGHTS]: WEIGHT_EXERCISES,
                                [CATEGORIES.CARDIO]: CARDIO_EXERCISES,
                                [CATEGORIES.CUSTOM]: defaultCustomExercises
                            }[currentCatKey]}
                        isCustom={currentCatKey === CATEGORIES.CUSTOM || isUserCategory(currentCatKey)}
                        getDayNumber={getDayNumber}
                        onClose={() => closeModal('calendar')}
                        settings={settings}
                        getConfig={getConfig}
                    />
                </Suspense>
            )}
            {modals.stats && (
                <Suspense fallback={null}>
                    <Stats
                        initialCategory={isUserCategory(currentCatKey) ? currentCatKey : {
                            [CATEGORIES.BODYWEIGHT]: 'standard',
                            [CATEGORIES.WEIGHTS]: 'weights',
                            [CATEGORIES.CARDIO]: 'cardio',
                            [CATEGORIES.CUSTOM]: 'custom'
                        }[currentCatKey]}
                        onClose={() => closeModal('stats')}
                        onOpenAchievements={(badgeId) => openAchievements(badgeId)}
                        onOpenStore={openStore}
                    />
                </Suspense>
            )}
            {modals.settings && (
                <Suspense fallback={null}>
                    <Settings
                        defaultShowStore={openStoreDirectly}
                        onClose={closeSettings}
                    />
                </Suspense>
            )}
            {modals.counter && selectedExercise && (
                <Suspense fallback={null}>
                    <ExercisePanel
                        exerciseConfig={selectedExercise}
                        onClose={() => { closeModal('counter'); resumeCloudSync?.(); }}
                        dailyGoal={dailyGoal}
                        currentCount={currentCount}
                        onUpdateCount={(newCount) => {
                            // Pass `today` so an already-completed exercise keeps its
                            // locked completion-day difficulty/weight instead of the live global one.
                            const { weight, difficulty } = getConfig(selectedExerciseId, today);
                            updateExerciseCount(today, selectedExerciseId, newCount, dailyGoal, weight, difficulty);
                        }}
                        isCompleted={isExerciseDone}
                        dayNumber={dayNumber}
                    />
                </Suspense>
            )}
            {modals.leaderboard && (
                <Suspense fallback={null}>
                    <Leaderboard
                        onClose={() => closeModal('leaderboard')}
                        activeSlide={effectiveSlide}
                    />
                </Suspense>
            )}
            {modals.achievements && (
                <Suspense fallback={null}>
                    <Achievements
                        completions={completions}
                        exercises={EXERCISES}
                        onClose={closeAchievements}
                        settings={settings}
                        getDayNumber={getDayNumber}
                        highlightedBadgeId={highlightedBadgeId}
                        computedStats={computedStats}
                    />
                </Suspense>
            )}
            {modals.session && (
                <Suspense fallback={null}>
                    <WorkoutSession
                        onClose={() => { closeModal('session'); resumeCloudSync?.(); }}
                        today={today}
                        dayNumber={dayNumber}
                        activeSlide={effectiveSlide}
                        sessionMode={sessionMode}
                        setSessionInProgress={setSessionInProgress}
                    />
                </Suspense>
            )}
            {modals.customExercises && isPro && (
                <Suspense fallback={null}>
                    <CustomExercisesModal
                        onClose={() => { closeCustomExercises(); resumeCloudSync?.(); }}
                        customExercisesHook={customExercisesHook}
                        customCategoriesHook={customCategoriesHook}
                        computedStats={computedStats}
                        categoryId={customExModalCatId}
                    />
                </Suspense>
            )}
            {modals.categoryManager && isPro && (
                <Suspense fallback={null}>
                    <CategoryManagerModal
                        onClose={() => closeModal('categoryManager')}
                        customCategoriesHook={customCategoriesHook}
                        exercisesByUserCategory={exercisesByUserCategory}
                        defaultCustomExercises={defaultCustomExercises}
                    />
                </Suspense>
            )}
            {modals.admin && (
                <Suspense fallback={null}>
                    <AdminPanel
                        onClose={() => closeModal('admin')}
                    />
                </Suspense>
            )}
        </>
    );
}
