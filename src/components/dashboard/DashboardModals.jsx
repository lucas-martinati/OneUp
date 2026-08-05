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

const Calendar = lazy(() => import('@components/stats/Calendar').then(m => ({ default: m.Calendar })));
const Stats = lazy(() => import('@components/stats/Stats').then(m => ({ default: m.Stats })));
const Settings = lazy(() => import('@components/settings/Settings').then(m => ({ default: m.Settings })));
const ExercisePanel = lazy(() => import('@components/exercises/ExercisePanel').then(m => ({ default: m.ExercisePanel })));
const Leaderboard = lazy(() => import('@components/social/Leaderboard').then(m => ({ default: m.Leaderboard })));
const Achievements = lazy(() => import('@components/feedback/Achievements').then(m => ({ default: m.Achievements })));
const WorkoutSession = lazy(() => import('@components/exercises/WorkoutSession').then(m => ({ default: m.WorkoutSession })));
const CustomDataManagerModal = lazy(() => import('@components/exercises/CustomDataManagerModal').then(m => ({ default: m.CustomDataManagerModal })));
const AdminPanel = lazy(() => import('@components/admin/AdminPanel').then(m => ({ default: m.AdminPanel })));
const ProUnlockedModal = lazy(() => import('@components/dashboard/ProUnlockedModal').then(m => ({ default: m.ProUnlockedModal })));
const ProExpiredModal = lazy(() => import('@components/dashboard/ProExpiredModal').then(m => ({ default: m.ProExpiredModal })));
const SupporterUnlockedModal = lazy(() => import('@components/dashboard/SupporterUnlockedModal').then(m => ({ default: m.SupporterUnlockedModal })));

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
    const {
        isPro,
        showProUnlockedModal, closeProUnlockedModal, confirmProUnlockedModal,
        showProExpiredModal, closeProExpiredModal, confirmProExpiredModal,
        showSupporterUnlockedModal, closeSupporterUnlockedModal, confirmSupporterUnlockedModal
    } = useSubscription();
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
    const customManagerCatId = useUIStore(s => s.customManagerCatId);
    const customManagerInitialTab = useUIStore(s => s.customManagerInitialTab);
    const customManagerInitialView = useUIStore(s => s.customManagerInitialView);
    const openAchievements = useUIStore(s => s.openAchievements);
    const closeAchievements = useUIStore(s => s.closeAchievements);
    const highlightedBadgeId = useUIStore(s => s.highlightedBadgeId);
    const sessionMode = useUIStore(s => s.sessionMode);
    const setSessionInProgress = useUIStore(s => s.setSessionInProgress);

    let activeStatusModal = null;
    if (showProUnlockedModal) {
        activeStatusModal = (
            <Suspense fallback={null}>
                <ProUnlockedModal
                    open={showProUnlockedModal}
                    onClose={closeProUnlockedModal}
                    onConfirm={confirmProUnlockedModal}
                />
            </Suspense>
        );
    } else if (showProExpiredModal) {
        activeStatusModal = (
            <Suspense fallback={null}>
                <ProExpiredModal
                    open={showProExpiredModal}
                    onClose={closeProExpiredModal}
                    onConfirm={confirmProExpiredModal}
                    onReSubscribe={openStore}
                />
            </Suspense>
        );
    } else if (showSupporterUnlockedModal) {
        activeStatusModal = (
            <Suspense fallback={null}>
                <SupporterUnlockedModal
                    open={showSupporterUnlockedModal}
                    onClose={closeSupporterUnlockedModal}
                    onConfirm={confirmSupporterUnlockedModal}
                />
            </Suspense>
        );
    }

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
            {modals.customManager && isPro && (
                <Suspense fallback={null}>
                    <CustomDataManagerModal
                        onClose={() => { closeModal('customManager'); resumeCloudSync?.(); }}
                        customExercisesHook={customExercisesHook}
                        customCategoriesHook={customCategoriesHook}
                        exercisesByUserCategory={exercisesByUserCategory}
                        defaultCustomExercises={defaultCustomExercises}
                        computedStats={computedStats}
                        categoryId={customManagerCatId}
                        initialTab={customManagerInitialTab}
                        initialView={customManagerInitialView}
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
            {/* Affichage séquentiel de la modale de statut active (file d'attente sans superposition) */}
            {activeStatusModal}
        </>
    );
}
