import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CSSConfetti } from './feedback/CSSConfetti';
import { NotificationManager } from './social/NotificationManager';
import { ConflictOverlay } from './ui/ConflictOverlay';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { DashboardActions } from './dashboard/DashboardActions';
import { CategoryNav } from './dashboard/CategoryNav';
import { Day100Overlay, Day100HackModal, Day100UnhackAnimation, useDay100Logic } from '../features/events/Day100Event';
import { useAchievementToast } from '../hooks/useAchievementToast';
import { CATEGORIES, buildFullCategoryOrder, buildFullCategoryColors, isUserCategory } from '../config/categories';
import { useBackHandler } from '../hooks/useBackHandler';
import { useModalManager } from '../hooks/useModalManager';
import { useNewAchievement } from '../hooks/useNewAchievement';
import { useAnnouncement } from '../features/announcements/useAnnouncement';
import { AnnouncementOverlay } from '../features/announcements/AnnouncementOverlay';

// New Extracted Hooks/Components
import { useDashboardState } from '../hooks/useDashboardState';
import { useDashboardSelection } from '../hooks/useDashboardSelection';
import { DashboardSlideRenderer } from './dashboard/DashboardSlideRenderer';
import { DashboardModals } from './dashboard/DashboardModals';

// Contexts
import { useProgressContext } from '../contexts/ProgressContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useExercises } from '../contexts/ExercisesContext';
import { useExerciseConfig } from '../hooks/useExerciseConfig';

import { setSoundSettingsGetter } from '../utils/soundManager';
import { EXERCISES, getDailyGoal } from '../config/exercises';
import { canAccessFeature, FEATURES } from '../utils/entitlements';

export function Dashboard() {
    const { t } = useTranslation();

    // ── Contexts ──
    const {
        getDayNumber, completions, startDate, userStartDate,
        settings, getExerciseCount,
        pauseCloudSync, computedStats,
        conflictData, onResolveConflict
    } = useProgressContext();
    const { getConfig } = useExerciseConfig();
    const { isPro } = useSubscription();
    const { customExercises, customExercisesMap, customCategories, exercisesByUserCategory } = useExercises();
    
    const { showAnnouncement, announcement, dismissAnnouncement } = useAnnouncement();

    // ── Modals ──
    const { modals, openModal, closeModal, anyModalOpen, handleBack } = useModalManager(
        { calendar: false, stats: false, settings: false, counter: false, leaderboard: false, achievements: false, session: false, customExercises: false, categoryManager: false },
        ['counter', 'session']
    );
    const setShowCalendar = (v) => v ? openModal('calendar') : closeModal('calendar');
    const setShowStats = (v) => v ? openModal('stats') : closeModal('stats');
    const setShowSettings = (v) => v ? openModal('settings') : closeModal('settings');
    const setShowCounter = (v) => v ? openModal('counter') : closeModal('counter');
    const setShowLeaderboard = (v) => v ? openModal('leaderboard') : closeModal('leaderboard');
    const setShowAchievements = (v) => v ? openModal('achievements') : closeModal('achievements');
    const setShowSession = (v) => v ? openModal('session') : closeModal('session');
    const setShowCustomExercisesModal = (v) => v ? openModal('customExercises') : closeModal('customExercises');
    const setShowCategoryManager = (v) => v ? openModal('categoryManager') : closeModal('categoryManager');

    const [openStoreDirectly, setOpenStoreDirectly] = useState(false);
    const [customExModalCatId, setCustomExModalCatId] = useState(null);

    // ── Slides State ──
    const fullCategoryOrder = useMemo(() => buildFullCategoryOrder(customCategories), [customCategories]);
    const fullCategoryColors = useMemo(() => buildFullCategoryColors(customCategories), [customCategories]);
    const defaultSlide = fullCategoryOrder.indexOf(CATEGORIES.BODYWEIGHT);
    const [activeSlide, setActiveSlide] = useState(defaultSlide);
    const [renderedSlides, setRenderedSlides] = useState(() => new Set([defaultSlide]));
    const scrollContainerRef = useRef(null);

    useEffect(() => {
        queueMicrotask(() => {
            setRenderedSlides(prev => prev.has(activeSlide) ? prev : new Set(prev).add(activeSlide));
        });
    }, [activeSlide]);

    // Defer mounting off-screen slides to improve initial load performance
    useEffect(() => {
        const timer = setTimeout(() => {
            setRenderedSlides(prev => prev.size === fullCategoryOrder.length ? prev : new Set(fullCategoryOrder.map((_, i) => i)));
        }, 1500);
        return () => clearTimeout(timer);
    }, [fullCategoryOrder]);

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

    const { showAchievement, AchievementToast: AchievementToastComponent } = useAchievementToast(() => {
        setShowStats(true);
        setTimeout(() => setShowAchievements(true), 100);
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
    const isDay100 = dayNumber === 100;

    // ── Day 100 hack event flow ──
    const isDayPerfectStandard = useMemo(() => {
        if (!isDay100) return false;
        return EXERCISES.length > 0 && EXERCISES.every(ex => {
            const count = getExerciseCount(today, ex.id);
            const exDiff = getConfig(ex.id, today).difficulty;
            const goal = getDailyGoal(ex, dayNumber, exDiff);
            return completions[today]?.[ex.id]?.isCompleted || count >= goal;
        });
    }, [isDay100, today, completions, dayNumber, getExerciseCount, getConfig]);

    const {
        hackActive, showDay100Modal, showUnhackAnim, day100Unhacked,
        handleDay100ModalDismiss, handleUnhackComplete
    } = useDay100Logic(dayNumber, isDayPerfectStandard);

    useBackHandler(handleBack, anyModalOpen);

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
            {showDay100Modal && <Day100HackModal onDismiss={handleDay100ModalDismiss} />}
            {showUnhackAnim && <Day100UnhackAnimation onComplete={handleUnhackComplete} />}
            {hackActive && <Day100Overlay />}
            
            <div className={`flex-col full-height fade-in gap-responsive ${hackActive ? 'day100-global day100-flicker' : ''} ${day100Unhacked ? 'day100-unhacking' : ''}`} style={{
                paddingBottom: 'clamp(2px, 0.5vh, 8px)'
            }}>
                <DashboardHeader
                    setShowSettings={setShowSettings}
                    setShowStats={setShowStats}
                    setShowLeaderboard={setShowLeaderboard}
                    pauseCloudSync={pauseCloudSync}
                    streakActive={computedStats.streakActive}
                    displayStreak={computedStats.displayStreak}
                    selectedExercise={selectedExercise}
                    totalReps={totalReps}
                    isDay100={hackActive}
                />

                <main className="flex-1 flex-col pos-relative" style={{ minHeight: 0 }}>
                    <div
                        ref={scrollContainerRef}
                        onScroll={(e) => {
                            const slideHeight = e.target.clientHeight;
                            if (slideHeight === 0) return;
                            const newSlide = Math.round(e.target.scrollTop / slideHeight);
                            if (newSlide >= 0 && newSlide < fullCategoryOrder.length) {
                                setActiveSlide(prev => prev !== newSlide ? newSlide : prev);
                            }
                        }}
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
                            setShowCounter={setShowCounter} setShowCustomExercisesModal={setShowCustomExercisesModal} setCustomExModalCatId={setCustomExModalCatId} setShowCategoryManager={setShowCategoryManager} setShowSettings={setShowSettings} setOpenStoreDirectly={setOpenStoreDirectly}
                            hackActive={hackActive}
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

                <DashboardActions
                    setShowCalendar={setShowCalendar}
                    setShowSession={setShowSession}
                    pauseCloudSync={pauseCloudSync}
                    selectedExercise={selectedExercise}
                    activeCategoryColor={fullCategoryColors[fullCategoryOrder[effectiveSlide]]}
                    isDay100={hackActive}
                />

                <DashboardModals
                    showCalendar={modals.calendar} setShowCalendar={setShowCalendar}
                    showStats={modals.stats} setShowStats={setShowStats}
                    showSettings={modals.settings} setShowSettings={setShowSettings}
                    showCounter={modals.counter} setShowCounter={setShowCounter}
                    showLeaderboard={modals.leaderboard} setShowLeaderboard={setShowLeaderboard}
                    showAchievements={modals.achievements} setShowAchievements={setShowAchievements}
                    showSession={modals.session} setShowSession={setShowSession}
                    showCustomExercisesModal={modals.customExercises} setShowCustomExercisesModal={setShowCustomExercisesModal}
                    showCategoryManager={modals.categoryManager} setShowCategoryManager={setShowCategoryManager}
                    openStoreDirectly={openStoreDirectly} setOpenStoreDirectly={setOpenStoreDirectly}
                    currentCatKey={currentCatKey} effectiveSlide={effectiveSlide}
                    selectedExercise={selectedExercise} selectedExerciseId={globalSelectedId}
                    dailyGoal={dailyGoal} currentCount={currentCount} isExerciseDone={isExerciseDone}
                    dayNumber={dayNumber} today={today}
                    customExModalCatId={customExModalCatId} setCustomExModalCatId={setCustomExModalCatId}
                />
            </div>
        </>
    );
}
