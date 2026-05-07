import React, { useEffect, useState, useMemo, useRef, Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { CSSConfetti } from './feedback/CSSConfetti';
import { NotificationManager } from './social/NotificationManager';
import { ConflictOverlay } from './ui/ConflictOverlay';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { DashboardSlide } from './dashboard/DashboardSlide';
import { DashboardActions } from './dashboard/DashboardActions';
import { CategoryNav } from './dashboard/CategoryNav';
import { Day100Overlay, Day100HackModal, Day100UnhackAnimation, useDay100Logic } from '../features/events/Day100Event';
import { useAchievementToast } from '../hooks/useAchievementToast';
import { ProPaywall } from './dashboard/ProPaywall';
import { CATEGORIES, CATEGORY_COLORS, CATEGORY_ORDER, buildFullCategoryOrder, buildFullCategoryColors, isUserCategory } from '../config/categories';
import { useBackHandler } from '../hooks/useBackHandler';
import { useModalManager } from '../hooks/useModalManager';
import { useNewAchievement } from '../hooks/useNewAchievement';
import { useAnnouncement } from '../features/announcements/useAnnouncement';
import { AnnouncementOverlay } from '../features/announcements/AnnouncementOverlay';

// Contexts
import { useProgressContext } from '../contexts/ProgressContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useExercises } from '../contexts/ExercisesContext';
import { useExerciseConfig } from '../hooks/useExerciseConfig';

const Calendar = lazy(() => import('./stats/Calendar').then(m => ({ default: m.Calendar })));
const Stats = lazy(() => import('./stats/Stats').then(m => ({ default: m.Stats })));
const Settings = lazy(() => import('./settings/Settings').then(m => ({ default: m.Settings })));
const ExercisePanel = lazy(() => import('./exercises/ExercisePanel').then(m => ({ default: m.ExercisePanel })));
const Leaderboard = lazy(() => import('./social/Leaderboard').then(m => ({ default: m.Leaderboard })));
const Achievements = lazy(() => import('./feedback/Achievements').then(m => ({ default: m.Achievements })));
const WorkoutSession = lazy(() => import('./exercises/WorkoutSession').then(m => ({ default: m.WorkoutSession })));
const CustomExercisesModal = lazy(() => import('./exercises/CustomExercisesModal').then(m => ({ default: m.CustomExercisesModal })));
const CategoryManagerModal = lazy(() => import('./exercises/CategoryManagerModal').then(m => ({ default: m.CategoryManagerModal })));
const CardioModule = lazy(() => import('../features/cardio/CardioModule').then(m => ({ default: m.CardioModule })));

import { setSoundSettingsGetter } from '../utils/soundManager';
import { getLocalDateStr } from '../utils/dateUtils';
import { EXERCISES, EXERCISES_MAP, CARDIO_EXERCISES, getDailyGoal } from '../config/exercises';
import { WEIGHT_EXERCISES, WEIGHT_EXERCISES_MAP } from '../config/weights';
import { canAccessFeature, FEATURES } from '../utils/entitlements';

export function Dashboard() {
    const { t } = useTranslation();

    // ── Consume contexts (replaces ~35 props) ────────────────────────

    const {
        getDayNumber, completions, startDate, userStartDate,
        scheduleNotification, settings,
        getExerciseCount, updateExerciseCount,
        pauseCloudSync, resumeCloudSync,
        computedStats,
        conflictData, onResolveConflict
    } = useProgressContext();
    const { getConfig } = useExerciseConfig();
    const { isPro } = useSubscription();
    const {
        customExercises, customExercisesMap,
        customExercisesHook,
        customCategories, customCategoriesHook,
        defaultCustomExercises,
        exercisesByUserCategory, exercisesMapByUserCategory
    } = useExercises();

    const [today, setToday] = useState(getLocalDateStr(new Date()));
    const { showAnnouncement, announcement, dismissAnnouncement } = useAnnouncement();

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
    const showCalendar = modals.calendar;
    const showStats = modals.stats;
    const showSettings = modals.settings;
    const showCounter = modals.counter;
    const showLeaderboard = modals.leaderboard;
    const showAchievements = modals.achievements;
    const showSession = modals.session;
    const showCustomExercisesModal = modals.customExercises;
    const showCategoryManager = modals.categoryManager;
    const fullCategoryOrder = useMemo(() => buildFullCategoryOrder(customCategories), [customCategories]);
    const fullCategoryColors = useMemo(() => buildFullCategoryColors(customCategories), [customCategories]);
    const defaultSlide = fullCategoryOrder.indexOf(CATEGORIES.BODYWEIGHT);
    const [activeSlide, setActiveSlide] = useState(defaultSlide);
    const [renderedSlides, setRenderedSlides] = useState(() => new Set([defaultSlide]));

    useEffect(() => {
        queueMicrotask(() => {
            setRenderedSlides(prev => {
                if (prev.has(activeSlide)) return prev;
                return new Set(prev).add(activeSlide);
            });
        });
    }, [activeSlide]);

    // Defer mounting off-screen slides to improve initial load performance
    useEffect(() => {
        const timer = setTimeout(() => {
            setRenderedSlides(prev => {
                if (prev.size === fullCategoryOrder.length) return prev;
                return new Set(fullCategoryOrder.map((_, i) => i));
            });
        }, 1500);
        return () => clearTimeout(timer);
    }, [fullCategoryOrder]);

    const [classicSelected, setClassicSelected] = useState(EXERCISES[0]?.id);
    const [weightsSelected, setWeightsSelected] = useState(WEIGHT_EXERCISES[0]?.id);
    const [customSelected, setCustomSelected] = useState(customExercises[0]?.id || 'custom_placeholder');
    const [userCatSelected, setUserCatSelected] = useState({});
    const [customExModalCatId, setCustomExModalCatId] = useState(null);
    const [isCounterTransitioning, setIsCounterTransitioning] = useState(false);
    const [prevDayNumber, setPrevDayNumber] = useState(null);
    const [showDayConfetti, setShowDayConfetti] = useState(false);
    const [openStoreDirectly, setOpenStoreDirectly] = useState(false);
    const scrollContainerRef = useRef(null);

    // Scroll to default slide (bodyweight) on mount
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (el) {
            requestAnimationFrame(() => {
                el.scrollTo({ top: el.clientHeight * defaultSlide, behavior: 'instant' });
            });
        }
    }, [defaultSlide]);

    const isCatAccessible = (catKey) => {
        if (catKey === CATEGORIES.WEIGHTS) return canAccessFeature(FEATURES.WEIGHTS, { isPro });
        if (catKey === CATEGORIES.CUSTOM) return canAccessFeature(FEATURES.CUSTOM_EXERCISES, { isPro });
        if (isUserCategory(catKey)) return canAccessFeature(FEATURES.CUSTOM_CATEGORIES, { isPro });
        return true; // Cardio and Bodyweight are always accessible
    };

    const requestedCatKey = fullCategoryOrder[activeSlide];
    const effectiveSlide = isCatAccessible(requestedCatKey) ? activeSlide : defaultSlide;
    const currentCatKey = fullCategoryOrder[effectiveSlide];
    
    const globalSelectedId = currentCatKey === CATEGORIES.CARDIO ? 'cardio' 
        : currentCatKey === CATEGORIES.BODYWEIGHT ? classicSelected 
        : currentCatKey === CATEGORIES.WEIGHTS ? weightsSelected 
        : isUserCategory(currentCatKey) ? (userCatSelected[currentCatKey] || (exercisesByUserCategory[currentCatKey]?.[0]?.id || null))
        : customSelected;
        
    const selectedExercise = useMemo(() => {
        if (currentCatKey === CATEGORIES.CARDIO) return { id: 'cardio', color: '#ef4444', gradient: ['#ef4444', '#dc2626'], icon: 'Heart', name: t('common.cardio') };
        if (currentCatKey === CATEGORIES.BODYWEIGHT) return EXERCISES_MAP[globalSelectedId] || EXERCISES[0];
        if (currentCatKey === CATEGORIES.WEIGHTS) return WEIGHT_EXERCISES_MAP[globalSelectedId] || WEIGHT_EXERCISES[0];
        return customExercisesMap[globalSelectedId] || customExercises[0] || { id: 'custom_placeholder', color: '#8b5cf6', gradient: ['#8b5cf6', '#7c3aed'], icon: 'Star', name: t('common.custom') };
    }, [currentCatKey, globalSelectedId, customExercises, customExercisesMap, t]);

    useEffect(() => {
        setSoundSettingsGetter(() => settings);
    }, [settings]);

    const { showAchievement, AchievementToast: AchievementToastComponent } = useAchievementToast(
        () => {
            setShowStats(true);
            setTimeout(() => setShowAchievements(true), 100);
        }
    );

    // Auto-detect new achievements and show toast
    const { achievement: detectedAchievement, clearAchievement } = useNewAchievement(computedStats, t);

    useEffect(() => {
        if (detectedAchievement && detectedAchievement.id) {
            showAchievement(detectedAchievement.id);
            clearAchievement();
        }
    }, [detectedAchievement, showAchievement, clearAchievement]);



    const dayNumber = useMemo(() => getDayNumber(today), [getDayNumber, today]);

    const selectedExerciseId = globalSelectedId;
    const isExerciseDone = completions[today]?.[selectedExerciseId]?.isCompleted || false;
    const currentCount = getExerciseCount(today, selectedExerciseId);
    const currentDiff = getConfig(selectedExerciseId, today).difficulty;
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
        hackActive,
        showDay100Modal,
        showUnhackAnim,
        day100Unhacked,
        handleDay100ModalDismiss,
        handleUnhackComplete
    } = useDay100Logic(dayNumber, isDayPerfectStandard);

    const displayStreak = computedStats.displayStreak;
    const streakActive = computedStats.streakActive;

    const handleSelectExercise = (id) => {
        if (currentCatKey === CATEGORIES.BODYWEIGHT) setClassicSelected(id);
        else if (currentCatKey === CATEGORIES.WEIGHTS) setWeightsSelected(id);
        else if (currentCatKey === CATEGORIES.CUSTOM) setCustomSelected(id);
        else if (isUserCategory(currentCatKey)) setUserCatSelected(prev => ({ ...prev, [currentCatKey]: id }));
    };

    useEffect(() => {
        const handleDayChange = () => {
            const currentDateStr = getLocalDateStr(new Date());
            if (currentDateStr !== today) {
                const previousDayNumber = getDayNumber(today);
                const newDayNumber = getDayNumber(currentDateStr);
                if (newDayNumber > previousDayNumber) {
                    setPrevDayNumber(previousDayNumber);
                    setIsCounterTransitioning(true);
                    setShowDayConfetti(true);
                    setTimeout(() => { setIsCounterTransitioning(false); setPrevDayNumber(null); }, 800);
                }
                setToday(currentDateStr);
                if (scheduleNotification) scheduleNotification(settings);
            }
        };
        handleDayChange();
        const interval = setInterval(handleDayChange, 10000);
        return () => clearInterval(interval);
    }, [today, getDayNumber, settings, scheduleNotification]);

    // Register modal manager back handler
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
                    streakActive={streakActive}
                    displayStreak={displayStreak}
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

                        {fullCategoryOrder.map((catKey, i) => {
                            const isRendered = renderedSlides.has(i);
                            if (!isRendered) {
                                return <div key={catKey} style={{ flex: '0 0 100%', scrollSnapAlign: 'start', height: '100%' }}></div>;
                            }

                            if (catKey === CATEGORIES.CARDIO) {
                                return (
                                    <div key={catKey} style={{ flex: '0 0 100%', scrollSnapAlign: 'start', height: '100%' }}>
                                        <Suspense fallback={null}>
                                            <CardioModule />
                                        </Suspense>
                                    </div>
                                );
                            }

                            if (catKey === CATEGORIES.BODYWEIGHT) {
                                return (
                                    <div key={catKey} style={{ flex: '0 0 100%', scrollSnapAlign: 'start', height: '100%' }}>
                                        <DashboardSlide
                                            isFuture={isFuture} effectiveStart={effectiveStart} dayNumber={dayNumber} today={today}
                                            getExerciseCount={getExerciseCount} completions={completions} computedStats={computedStats}
                                            isCounterTransitioning={isCounterTransitioning} prevDayNumber={prevDayNumber}
                                            pauseCloudSync={pauseCloudSync} setShowCounter={setShowCounter}
                                            activeExerciseId={classicSelected} onSelectExercise={handleSelectExercise}
                                            exercisesList={EXERCISES} exercisesMap={EXERCISES_MAP}
                                            isDay100={isDay100}
                                            getConfig={getConfig}
                                        />
                                    </div>
                                );
                            }

                            if (catKey === CATEGORIES.WEIGHTS) {
                                return (
                                    <div key={catKey} style={{ flex: '0 0 100%', scrollSnapAlign: 'start', height: '100%' }}>
                                        {canAccessFeature(FEATURES.WEIGHTS, { isPro }) ? (
                                            <DashboardSlide
                                                title={t('common.weights')}
                                                categoryColor={CATEGORY_COLORS[CATEGORIES.WEIGHTS]}
                                                isFuture={isFuture} effectiveStart={effectiveStart} dayNumber={dayNumber} today={today}
                                                getExerciseCount={getExerciseCount} completions={completions} computedStats={computedStats}
                                                isCounterTransitioning={isCounterTransitioning} prevDayNumber={prevDayNumber}
                                                pauseCloudSync={pauseCloudSync} setShowCounter={setShowCounter}
                                                activeExerciseId={weightsSelected} onSelectExercise={handleSelectExercise}
                                                exercisesList={WEIGHT_EXERCISES} exercisesMap={WEIGHT_EXERCISES_MAP}
                                                isDay100={hackActive}
                                                getConfig={getConfig}
                                            />
                                        ) : (
                                            <ProPaywall
                                                title={t('common.weights')}
                                                onOpenStore={() => { setShowSettings(true); setOpenStoreDirectly(true); }}
                                            />
                                        )}
                                    </div>
                                );
                            }

                            if (catKey === CATEGORIES.CUSTOM) {
                                const catDef = customCategories.find(c => c.id === catKey);
                                const title = catDef?.name || t('common.custom');
                                const color = catDef?.color || CATEGORY_COLORS[CATEGORIES.CUSTOM];

                                return (
                                    <div key={catKey} style={{ flex: '0 0 100%', scrollSnapAlign: 'start', height: '100%' }}>
                                        {canAccessFeature(FEATURES.CUSTOM_EXERCISES, { isPro }) ? (
                                            <DashboardSlide
                                                title={title}
                                                categoryColor={color}
                                                isFuture={isFuture} effectiveStart={effectiveStart} dayNumber={dayNumber} today={today}
                                                getExerciseCount={getExerciseCount} completions={completions} computedStats={computedStats}
                                                isCounterTransitioning={isCounterTransitioning} prevDayNumber={prevDayNumber}
                                                pauseCloudSync={pauseCloudSync} setShowCounter={setShowCounter}
                                                activeExerciseId={customExercisesMap[customSelected] ? customSelected : (defaultCustomExercises[0]?.id || null)} onSelectExercise={handleSelectExercise}
                                                exercisesList={defaultCustomExercises} exercisesMap={customExercisesMap}
                                                onManageCustom={() => { setCustomExModalCatId(null); setShowCustomExercisesModal(true); pauseCloudSync?.(); }}
                                                onManageCategories={() => { setShowCategoryManager(true); }}
                                                isDay100={hackActive}
                                                getConfig={getConfig}
                                            />
                                        ) : (
                                            <ProPaywall
                                                title={title}
                                                onOpenStore={() => { setShowSettings(true); setOpenStoreDirectly(true); }}
                                            />
                                        )}
                                    </div>
                                );
                            }

                            // User-created custom categories
                            if (isUserCategory(catKey)) {
                                const catDef = customCategories.find(c => c.id === catKey);
                                if (!catDef) return null;
                                const catExercises = exercisesByUserCategory[catKey] || [];
                                const catExMap = exercisesMapByUserCategory[catKey] || {};
                                const selId = userCatSelected[catKey] || catExercises[0]?.id || null;
                                return (
                                    <div key={catKey} style={{ flex: '0 0 100%', scrollSnapAlign: 'start', height: '100%' }}>
                                        {canAccessFeature(FEATURES.CUSTOM_CATEGORIES, { isPro }) ? (
                                            <DashboardSlide
                                                title={catDef.name}
                                                categoryColor={catDef.color}
                                                isFuture={isFuture} effectiveStart={effectiveStart} dayNumber={dayNumber} today={today}
                                                getExerciseCount={getExerciseCount} completions={completions} computedStats={computedStats}
                                                isCounterTransitioning={isCounterTransitioning} prevDayNumber={prevDayNumber}
                                                pauseCloudSync={pauseCloudSync} setShowCounter={setShowCounter}
                                                activeExerciseId={selId} onSelectExercise={handleSelectExercise}
                                                exercisesList={catExercises} exercisesMap={catExMap}
                                                onManageCustom={() => { setCustomExModalCatId(catKey); setShowCustomExercisesModal(true); pauseCloudSync?.(); }}
                                                isDay100={hackActive}
                                                getConfig={getConfig}
                                            />
                                        ) : (
                                            <ProPaywall
                                                title={catDef.name}
                                                onOpenStore={() => { setShowSettings(true); setOpenStoreDirectly(true); }}
                                            />
                                        )}
                                    </div>
                                );
                            }

                            return null;
                        })}
                    </div>

                    {/* Navigation Sidebar */}
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
                                    const { weight } = getConfig(selectedExerciseId);
                                    updateExerciseCount(today, selectedExerciseId, newCount, dailyGoal, weight, currentDiff);
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
            </div>
        </>
    );
}
