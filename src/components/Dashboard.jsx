import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CSSConfetti } from './feedback/CSSConfetti';
import { NotificationManager } from './social/NotificationManager';
import { ConflictOverlay } from './ui/ConflictOverlay';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { DashboardNavBar } from './dashboard/DashboardNavBar';
import { SessionBubble } from './dashboard/SessionBubble';
import { CategoryNav } from './dashboard/CategoryNav';
import { DashboardEvents } from '@features/events';
import { useAchievementToast } from '@hooks/useAchievementToast';
import { CATEGORIES, buildFullCategoryOrder, buildFullCategoryColors, isUserCategory } from '@config/categories';
import { useBackHandler } from '@hooks/useBackHandler';
import { useNewAchievement } from '@hooks/useNewAchievement';
import { useAnnouncement } from '@features/announcements/useAnnouncement';
import { AnnouncementOverlay } from '@features/announcements/AnnouncementOverlay';

// New Extracted Hooks/Components
import { useDashboardState } from '@hooks/useDashboardState';
import { useDashboardSelection } from '@hooks/useDashboardSelection';
import { DashboardSlideRenderer } from './dashboard/DashboardSlideRenderer';
import { DashboardModals } from './dashboard/DashboardModals';

// Contexts
import { useAuth } from '@contexts/AuthContext';
import { useProgressStore } from '@store/useProgressStore';
import { useSettingsStore } from '@store/useSettingsStore';
import { useCloudSyncStore } from '@store/useCloudSyncStore';
import { useComputedStatsStore } from '@store/useComputedStatsStore';
import { useUIStore } from '@store/useUIStore';
import { useSubscription } from '@contexts/SubscriptionContext';
import { useExercises } from '@contexts/ExercisesContext';
import { useExerciseConfig } from '@hooks/useExerciseConfig';

import { setSoundSettingsGetter } from '@utils/soundManager';
import { clearWorkoutSession } from '@utils/workoutSessionStorage';
import { getDailyGoal } from '@config/exercises';
import { canAccessFeature, FEATURES } from '@utils/entitlements';
import { isAdminEmail } from '@config/admin';

export function Dashboard() {
    const { t } = useTranslation();
    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

    const handleDiscardSession = useCallback(() => {
        setShowDiscardConfirm(true);
    }, []);

    const auth = useAuth();
    const isAdmin = isAdminEmail(auth?.user?.email);

    // ── Stores ──
    const getDayNumber = useProgressStore(s => s.getDayNumber);
    const completions = useProgressStore(s => s.completions);
    const startDate = useProgressStore(s => s.startDate);
    const userStartDate = useProgressStore(s => s.userStartDate);
    const getExerciseCount = useProgressStore(s => s.getExerciseCount);
    const loadFromCloud = useProgressStore(s => s.loadFromCloud);
    const syncWithCloud = useProgressStore(s => s.syncWithCloud);
    const hasGuestData = useProgressStore(s => s.hasGuestData);
    const clearAnonymousData = useProgressStore(s => s.clearAnonymousData);
    const mergeWithAnonymousData = useProgressStore(s => s.mergeWithAnonymousData);
    const settings = useSettingsStore(s => s.settings);
    const updateSettings = useSettingsStore(s => s.updateSettings);
    const conflictData = useCloudSyncStore(s => s.conflictData);
    const rawResolveConflict = useCloudSyncStore(s => s.onResolveConflict);
    const computedStats = useComputedStatsStore(s => s.stats);
    const { getConfig } = useExerciseConfig();
    const { isPro } = useSubscription();
    const { customExercises, customExercisesMap, customCategories, exercisesByUserCategory } = useExercises();

    // ── UI store (modals + session UI) ──
    const openModal = useUIStore(s => s.openModal);
    const openAchievements = useUIStore(s => s.openAchievements);
    const closeTopModal = useUIStore(s => s.closeTopModal);
    const anyModalOpen = useUIStore(s => s.modalStack.length > 0);
    const sessionInProgress = useUIStore(s => s.sessionInProgress);
    const setSessionInProgress = useUIStore(s => s.setSessionInProgress);
    const openSession = useUIStore(s => s.openSession);

    const confirmDiscard = useCallback(() => {
        clearWorkoutSession();
        setSessionInProgress(false);
        setShowDiscardConfirm(false);
    }, [setSessionInProgress]);

    const onResolveConflict = useCallback((action) => rawResolveConflict(action, {
      loadFromCloud, syncWithCloud, hasGuestData, clearAnonymousData, mergeWithAnonymousData, updateSettings,
    }), [rawResolveConflict, loadFromCloud, syncWithCloud, hasGuestData, clearAnonymousData, mergeWithAnonymousData, updateSettings]);

    const { showAnnouncement, announcement, dismissAnnouncement } = useAnnouncement();

    // ── Slides State ──
    const fullCategoryOrder = useMemo(() => buildFullCategoryOrder(customCategories), [customCategories]);
    const fullCategoryColors = useMemo(() => buildFullCategoryColors(customCategories), [customCategories]);
    const defaultSlide = fullCategoryOrder.indexOf(CATEGORIES.BODYWEIGHT);
    const [activeSlide, setActiveSlide] = useState(defaultSlide);
    const renderedSlides = useMemo(() => {
        const set = new Set();
        set.add(activeSlide);
        if (activeSlide > 0) set.add(activeSlide - 1);
        if (activeSlide < fullCategoryOrder.length - 1) set.add(activeSlide + 1);
        return set;
    }, [activeSlide, fullCategoryOrder.length]);
    const scrollContainerRef = useRef(null);
    const handleIntersection = useCallback((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const slideIndex = parseInt(entry.target.getAttribute('data-slide-index'), 10);
                if (!isNaN(slideIndex)) {
                    setActiveSlide(slideIndex);
                }
            }
        });
    }, []);

    // Use IntersectionObserver to track the active slide (more performant than onScroll)
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const observer = new IntersectionObserver(handleIntersection, {
            root: container,
            threshold: 0.5
        });

        const observeChildren = () => {
            Array.from(container.children).forEach(child => {
                if (child.classList.contains('dashboard-slide-container')) {
                    observer.observe(child);
                }
            });
        };

        observeChildren();
        return () => observer.disconnect();
    }, [fullCategoryOrder, renderedSlides, handleIntersection]);

    // Scroll to default slide (bodyweight) on mount
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (el) {
            requestAnimationFrame(() => el.scrollTo({ top: el.clientHeight * defaultSlide, behavior: 'instant' }));
        }
    }, [defaultSlide]);

    const isCatAccessible = (catKey) => {
        if (catKey === CATEGORIES.WEIGHTS) return canAccessFeature(FEATURES.WEIGHTS, { isPro });
        if (catKey === CATEGORIES.CUSTOM) return canAccessFeature(FEATURES.CUSTOM_EXERCISES, { isPro });
        if (isUserCategory(catKey)) return canAccessFeature(FEATURES.CUSTOM_CATEGORIES, { isPro });
        return true;
    };

    const requestedCatKey = fullCategoryOrder[activeSlide];
    const effectiveSlide = isCatAccessible(requestedCatKey) ? activeSlide : defaultSlide;
    const currentCatKey = fullCategoryOrder[effectiveSlide];

    // ── Extracted Hooks ──
    const {
        today, isCounterTransitioning, prevDayNumber, showDayConfetti, setShowDayConfetti
    } = useDashboardState();

    const {
        classicSelected, weightsSelected, customSelected, userCatSelected,
        globalSelectedId, selectedExercise, handleSelectExercise
    } = useDashboardSelection(currentCatKey, customExercises, customExercisesMap, exercisesByUserCategory);

    useEffect(() => {
        setSoundSettingsGetter(() => settings);
    }, [settings]);

    const { showAchievement, AchievementToast: AchievementToastComponent } = useAchievementToast((badgeId) => {
        openModal('stats');
        setTimeout(() => openAchievements(badgeId), 100);
    });

    const { achievement: detectedAchievement, clearAchievement } = useNewAchievement(computedStats, t);
    useEffect(() => {
        if (detectedAchievement?.id) {
            showAchievement(detectedAchievement.id);
            clearAchievement();
        }
    }, [detectedAchievement, showAchievement, clearAchievement]);

    const dayNumber = useMemo(() => getDayNumber(today), [getDayNumber, today]);

    const isExerciseDone = completions[today]?.[globalSelectedId]?.isCompleted || false;
    const currentCount = getExerciseCount(today, globalSelectedId);
    const currentDiff = getConfig(globalSelectedId, today).difficulty;
    const dailyGoal = getDailyGoal(selectedExercise, dayNumber, currentDiff) || 1;

    // For Cardio slide, compute total from running and cycling stats, else use computedStats
    const totalReps = currentCatKey === CATEGORIES.CARDIO
        ? ((computedStats.exerciseReps?.['running'] || 0) + (computedStats.exerciseReps?.['cycling'] || 0))
        : (computedStats.exerciseReps?.[globalSelectedId] || 0);

    const effectiveStart = userStartDate || startDate;
    const isFuture = today < effectiveStart;

    useBackHandler(closeTopModal, anyModalOpen);

    useEffect(() => {
        if (anyModalOpen) {
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none';
            document.documentElement.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
            document.documentElement.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
            document.documentElement.style.overflow = '';
        };
    }, [anyModalOpen]);

    return (
        <>
            <ConflictOverlay conflictData={conflictData} onResolveConflict={onResolveConflict} />
            {showAnnouncement && <AnnouncementOverlay announcement={announcement} onDismiss={dismissAnnouncement} />}
            <NotificationManager />
            <CSSConfetti
                active={showDayConfetti}
                colors={['#6d28d9', '#8b5cf6', '#0ea5e9', '#f093fb', '#fbbf24', '#10b981']}
                onDone={() => setShowDayConfetti(false)}
                reducedParticles={settings?.performanceMode === 'low'}
            />
            {AchievementToastComponent}
            <DashboardEvents
                dayNumber={dayNumber}
                today={today}
                getExerciseCount={getExerciseCount}
                getConfig={getConfig}
                completions={completions}
            />

            <div className="flex-col full-height fade-in gap-responsive" style={{
                paddingBottom: 'clamp(1px, 0.3vh, 6px)'
            }}>
                <DashboardHeader
                    isAdmin={isAdmin}
                    streakActive={computedStats.streakActive}
                    displayStreak={computedStats.displayStreak}
                    selectedExercise={selectedExercise}
                    totalReps={totalReps}
                />

                {sessionInProgress && !anyModalOpen && (
                    <SessionBubble
                        onResume={() => openSession('running')}
                        onDiscard={handleDiscardSession}
                    />
                )}

                <main className="flex-1 flex-col pos-relative" style={{ minHeight: 0 }}>
                    <div
                        ref={scrollContainerRef}
                        style={{
                            flex: 1, overflowY: anyModalOpen ? 'hidden' : 'auto', overflowX: 'hidden',
                            scrollSnapType: 'y mandatory',
                            display: 'flex', flexDirection: 'column', width: '100%',
                            scrollbarWidth: 'none', msOverflowStyle: 'none'
                        }}
                    >
                        <DashboardSlideRenderer
                            fullCategoryOrder={fullCategoryOrder}
                            renderedSlides={renderedSlides}
                            isFuture={isFuture} effectiveStart={effectiveStart} dayNumber={dayNumber} today={today}
                            isCounterTransitioning={isCounterTransitioning} prevDayNumber={prevDayNumber}
                            classicSelected={classicSelected} weightsSelected={weightsSelected} customSelected={customSelected} userCatSelected={userCatSelected} handleSelectExercise={handleSelectExercise}
                            customCategories={customCategories}
                        />
                    </div>

                    <CategoryNav
                        fullCategoryOrder={fullCategoryOrder}
                        activeSlide={activeSlide}
                        customCategories={customCategories}
                        scrollContainerRef={scrollContainerRef}
                        anyModalOpen={anyModalOpen}
                    />
                </main>

                <DashboardNavBar
                    selectedExercise={selectedExercise}
                    activeCategoryColor={fullCategoryColors[fullCategoryOrder[effectiveSlide]]}
                />

                <DashboardModals
                    currentCatKey={currentCatKey} effectiveSlide={effectiveSlide}
                    selectedExercise={selectedExercise} selectedExerciseId={globalSelectedId}
                    dailyGoal={dailyGoal} currentCount={currentCount} isExerciseDone={isExerciseDone}
                    dayNumber={dayNumber} today={today}
                />

                <ConfirmDialog
                    open={showDiscardConfirm}
                    message={t('dashboard.discardConfirm')}
                    onConfirm={confirmDiscard}
                    onCancel={() => setShowDiscardConfirm(false)}
                    destructive
                    confirmLabel={t('dashboard.discard')}
                />
            </div>
        </>
    );
}
