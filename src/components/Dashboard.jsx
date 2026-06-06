import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CSSConfetti } from './feedback/CSSConfetti';
import { NotificationManager } from './social/NotificationManager';
import { ConflictOverlay } from './ui/ConflictOverlay';
import { ConfirmDialog } from './ui/ConfirmDialog';
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
import { useProgressStore } from '../store/useProgressStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useCloudSyncStore } from '../store/useCloudSyncStore';
import { useComputedStatsStore } from '../store/useComputedStatsStore';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useExercises } from '../contexts/ExercisesContext';
import { useExerciseConfig } from '../hooks/useExerciseConfig';

import { setSoundSettingsGetter } from '../utils/soundManager';
import { EXERCISES, getDailyGoal } from '../config/exercises';
import { canAccessFeature, FEATURES } from '../utils/entitlements';

export function Dashboard() {
    const { t } = useTranslation();
    const [sessionInProgress, setSessionInProgress] = useState(() => localStorage.getItem('sessionStarted') === 'true');
    const [sessionMode, setSessionMode] = useState('config');
    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

    const handleDiscardSession = useCallback(() => {
        setShowDiscardConfirm(true);
    }, []);

    const confirmDiscard = useCallback(() => {
        localStorage.removeItem('sessionStarted');
        localStorage.removeItem('workout_session_queue');
        localStorage.removeItem('workout_session_current_idx');
        localStorage.removeItem('workout_session_start_time');
        localStorage.removeItem('workout_session_name');
        localStorage.removeItem('workout_session_active_slide');
        setSessionInProgress(false);
        setShowDiscardConfirm(false);
    }, []);

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
    const pauseCloudSync = useCloudSyncStore(s => s.pauseCloudSync);
    const conflictData = useCloudSyncStore(s => s.conflictData);
    const rawResolveConflict = useCloudSyncStore(s => s.onResolveConflict);
    const computedStats = useComputedStatsStore(s => s.stats);
    const { getConfig } = useExerciseConfig();
    const { isPro } = useSubscription();
    const { customExercises, customExercisesMap, customCategories, exercisesByUserCategory } = useExercises();

    const onResolveConflict = useCallback((action) => rawResolveConflict(action, {
      loadFromCloud, syncWithCloud, hasGuestData, clearAnonymousData, mergeWithAnonymousData, updateSettings,
    }), [rawResolveConflict, loadFromCloud, syncWithCloud, hasGuestData, clearAnonymousData, mergeWithAnonymousData, updateSettings]);
    
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
    const renderedSlides = useMemo(() => {
        const set = new Set();
        set.add(activeSlide);
        if (activeSlide > 0) set.add(activeSlide - 1);
        if (activeSlide < fullCategoryOrder.length - 1) set.add(activeSlide + 1);
        return set;
    }, [activeSlide, fullCategoryOrder.length]);
    const scrollContainerRef = useRef(null);

    // Use IntersectionObserver to track the active slide (more performant than onScroll)
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const slideIndex = parseInt(entry.target.getAttribute('data-slide-index'), 10);
                    if (!isNaN(slideIndex)) {
                        setActiveSlide(prev => prev !== slideIndex ? slideIndex : prev);
                    }
                }
            });
        }, {
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
    }, [fullCategoryOrder, renderedSlides]);

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

                {sessionInProgress && (
                    <div className="glass-premium" style={{
                        margin: 'var(--spacing-xs) var(--spacing-md) 0 var(--spacing-md)',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-lg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'linear-gradient(135deg, rgba(129, 140, 248, 0.12), rgba(139, 92, 246, 0.12))',
                        border: '1px solid rgba(139, 92, 246, 0.25)',
                        gap: '12px',
                        flexWrap: 'wrap'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: '#a78bfa',
                                boxShadow: '0 0 8px #a78bfa',
                                display: 'inline-block'
                            }} />
                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                                {t('dashboard.inProgress')}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={handleDiscardSession}
                                className="hover-lift"
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.25)',
                                    color: '#f87171',
                                    fontSize: '0.7rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {t('dashboard.discard')}
                            </button>
                            <button
                                onClick={() => {
                                    setSessionMode('running');
                                    setShowSession(true);
                                }}
                                className="hover-lift"
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    background: 'linear-gradient(135deg, #818cf8, #6366f1)',
                                    border: 'none',
                                    color: 'white',
                                    fontSize: '0.7rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {t('dashboard.resume')}
                            </button>
                        </div>
                    </div>
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
                    setSessionMode={setSessionMode}
                    sessionInProgress={sessionInProgress}
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
                    sessionMode={sessionMode} setSessionInProgress={setSessionInProgress}
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
