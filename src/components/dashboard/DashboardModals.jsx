import React, { Suspense, lazy } from 'react';
import { CATEGORIES, isUserCategory } from '../../config/categories';
import { EXERCISES, CARDIO_EXERCISES } from '../../config/exercises';
import { WEIGHT_EXERCISES } from '../../config/weights';

import { useProgressContext } from '../../contexts/ProgressContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useExercises } from '../../contexts/ExercisesContext';
import { useExerciseConfig } from '../../hooks/useExerciseConfig';

const Calendar = lazy(() => import('../stats/Calendar').then(m => ({ default: m.Calendar })));
const Stats = lazy(() => import('../stats/Stats').then(m => ({ default: m.Stats })));
const Settings = lazy(() => import('../settings/Settings').then(m => ({ default: m.Settings })));
const ExercisePanel = lazy(() => import('../exercises/ExercisePanel').then(m => ({ default: m.ExercisePanel })));
const Leaderboard = lazy(() => import('../social/Leaderboard').then(m => ({ default: m.Leaderboard })));
const Achievements = lazy(() => import('../feedback/Achievements').then(m => ({ default: m.Achievements })));
const WorkoutSession = lazy(() => import('../exercises/WorkoutSession').then(m => ({ default: m.WorkoutSession })));
const CustomExercisesModal = lazy(() => import('../exercises/CustomExercisesModal').then(m => ({ default: m.CustomExercisesModal })));
const CategoryManagerModal = lazy(() => import('../exercises/CategoryManagerModal').then(m => ({ default: m.CategoryManagerModal })));

export function DashboardModals({
    showCalendar, setShowCalendar,
    showStats, setShowStats,
    showSettings, setShowSettings,
    showCounter, setShowCounter,
    showLeaderboard, setShowLeaderboard,
    showAchievements, setShowAchievements,
    showSession, setShowSession,
    showCustomExercisesModal, setShowCustomExercisesModal,
    showCategoryManager, setShowCategoryManager,
    openStoreDirectly, setOpenStoreDirectly,
    currentCatKey, effectiveSlide,
    selectedExercise, selectedExerciseId, dailyGoal, currentCount, isExerciseDone,
    dayNumber, today,
    customExModalCatId, setCustomExModalCatId
}) {
    const { startDate, completions, getDayNumber, settings, computedStats, updateExerciseCount, resumeCloudSync } = useProgressContext();
    const { getConfig } = useExerciseConfig();
    const { isPro } = useSubscription();
    const {
        customExercisesHook, customCategoriesHook,
        defaultCustomExercises, exercisesByUserCategory
    } = useExercises();

    return (
        <>
            {showCalendar && (
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
                        onClose={() => setShowCalendar(false)}
                        settings={settings}
                        getConfig={getConfig}
                    />
                </Suspense>
            )}
            {showStats && (
                <Suspense fallback={null}>
                    <Stats
                        initialCategory={isUserCategory(currentCatKey) ? currentCatKey : {
                            [CATEGORIES.BODYWEIGHT]: 'standard',
                            [CATEGORIES.WEIGHTS]: 'weights',
                            [CATEGORIES.CARDIO]: 'cardio',
                            [CATEGORIES.CUSTOM]: 'custom'
                        }[currentCatKey]}
                        onClose={() => setShowStats(false)}
                        onOpenAchievements={() => { setShowAchievements(true); }}
                        onOpenStore={() => { setShowSettings(true); setOpenStoreDirectly(true); }}
                    />
                </Suspense>
            )}
            {showSettings && (
                <Suspense fallback={null}>
                    <Settings
                        defaultShowStore={openStoreDirectly}
                        onClose={() => { setShowSettings(false); setOpenStoreDirectly(false); }}
                    />
                </Suspense>
            )}
            {showCounter && selectedExercise && (
                <Suspense fallback={null}>
                    <ExercisePanel
                        exerciseConfig={selectedExercise}
                        onClose={() => { setShowCounter(false); resumeCloudSync?.(); }}
                        dailyGoal={dailyGoal}
                        currentCount={currentCount}
                        onUpdateCount={(newCount) => {
                            const { weight, difficulty } = getConfig(selectedExerciseId);
                            updateExerciseCount(today, selectedExerciseId, newCount, dailyGoal, weight, difficulty);
                        }}
                        isCompleted={isExerciseDone}
                        dayNumber={dayNumber}
                    />
                </Suspense>
            )}
            {showLeaderboard && (
                <Suspense fallback={null}>
                    <Leaderboard
                        onClose={() => setShowLeaderboard(false)}
                        activeSlide={effectiveSlide}
                    />
                </Suspense>
            )}
            {showAchievements && (
                <Suspense fallback={null}>
                    <Achievements
                        completions={completions}
                        exercises={EXERCISES}
                        onClose={() => { setShowAchievements(false); }}
                        settings={settings}
                        getDayNumber={getDayNumber}
                        highlightedBadgeId={null}
                        computedStats={computedStats}
                    />
                </Suspense>
            )}
            {showSession && (
                <Suspense fallback={null}>
                    <WorkoutSession
                        onClose={() => { setShowSession(false); resumeCloudSync?.(); }}
                        today={today}
                        dayNumber={dayNumber}
                        activeSlide={effectiveSlide}
                    />
                </Suspense>
            )}
            {showCustomExercisesModal && isPro && (
                <Suspense fallback={null}>
                    <CustomExercisesModal
                        onClose={() => { setShowCustomExercisesModal(false); setCustomExModalCatId(null); resumeCloudSync?.(); }}
                        customExercisesHook={customExercisesHook}
                        customCategoriesHook={customCategoriesHook}
                        computedStats={computedStats}
                        categoryId={customExModalCatId}
                    />
                </Suspense>
            )}
            {showCategoryManager && isPro && (
                <Suspense fallback={null}>
                    <CategoryManagerModal
                        onClose={() => setShowCategoryManager(false)}
                        customCategoriesHook={customCategoriesHook}
                        exercisesByUserCategory={exercisesByUserCategory}
                        defaultCustomExercises={defaultCustomExercises}
                    />
                </Suspense>
            )}
        </>
    );
}
