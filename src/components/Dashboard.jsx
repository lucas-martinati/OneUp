import React, { useEffect, useState, useMemo, useRef, Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { CSSConfetti } from './feedback/CSSConfetti';
import { NotificationManager } from './social/NotificationManager';
import { ConflictOverlay } from './ui/ConflictOverlay';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { DashboardSlide } from './dashboard/DashboardSlide';
import { DashboardActions } from './dashboard/DashboardActions';
import { Day100Overlay, Day100HackModal, Day100UnhackAnimation, useDay100Logic } from '../features/events/Day100Event';
import { useAchievementToast } from '../hooks/useAchievementToast';
import { ProPaywall } from './dashboard/ProPaywall';
import { CATEGORIES, CATEGORY_COLORS, CATEGORY_ORDER } from '../config/categories';
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
const Counter = lazy(() => import('./exercises/Counter').then(m => ({ default: m.Counter })));
const Leaderboard = lazy(() => import('./social/Leaderboard').then(m => ({ default: m.Leaderboard })));
const Achievements = lazy(() => import('./feedback/Achievements').then(m => ({ default: m.Achievements })));
const Timer = lazy(() => import('./exercises/Timer').then(m => ({ default: m.Timer })));
const WorkoutSession = lazy(() => import('./exercises/WorkoutSession').then(m => ({ default: m.WorkoutSession })));
const CustomExercisesModal = lazy(() => import('./exercises/CustomExercisesModal').then(m => ({ default: m.CustomExercisesModal })));
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
        customExercisesHook
    } = useExercises();

    const [today, setToday] = useState(getLocalDateStr(new Date()));
    const { showAnnouncement, announcement, dismissAnnouncement } = useAnnouncement();

    const { modals, openModal, closeModal, anyModalOpen, handleBack } = useModalManager(
        { calendar: false, stats: false, settings: false, counter: false, leaderboard: false, achievements: false, session: false, customExercises: false },
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
    const showCalendar = modals.calendar;
    const showStats = modals.stats;
    const showSettings = modals.settings;
    const showCounter = modals.counter;
    const showLeaderboard = modals.leaderboard;
    const showAchievements = modals.achievements;
    const showSession = modals.session;
    const showCustomExercisesModal = modals.customExercises;
    const [activeSlide, setActiveSlide] = useState(1);

    const [classicSelected, setClassicSelected] = useState('pushups');
    const [weightsSelected, setWeightsSelected] = useState('biceps_curl');
    const [customSelected, setCustomSelected] = useState(customExercises[0]?.id || 'custom_placeholder');
    const [isCounterTransitioning, setIsCounterTransitioning] = useState(false);
    const [prevDayNumber, setPrevDayNumber] = useState(null);
    const [showDayConfetti, setShowDayConfetti] = useState(false);
    const [openStoreDirectly, setOpenStoreDirectly] = useState(false);
    const scrollContainerRef = useRef(null);

    // Scroll to default slide (bodyweight = slide 1) on mount
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (el) {
            requestAnimationFrame(() => {
                el.scrollTo({ top: el.clientHeight, behavior: 'instant' });
            });
        }
    }, []);

    const effectiveSlide = isPro ? activeSlide : 0;
    const currentCatKey = CATEGORY_ORDER[effectiveSlide];
    
    const globalSelectedId = currentCatKey === CATEGORIES.CARDIO ? 'cardio' 
        : currentCatKey === CATEGORIES.BODYWEIGHT ? classicSelected 
        : currentCatKey === CATEGORIES.WEIGHTS ? weightsSelected 
        : customSelected;
        
    const selectedExercise = useMemo(() => {
        if (currentCatKey === CATEGORIES.CARDIO) return { id: 'cardio', color: '#ef4444', gradient: ['#ef4444', '#dc2626'], icon: 'Heart', name: t('cardio.title') };
        if (currentCatKey === CATEGORIES.BODYWEIGHT) return EXERCISES_MAP[globalSelectedId] || EXERCISES[0];
        if (currentCatKey === CATEGORIES.WEIGHTS) return WEIGHT_EXERCISES_MAP[globalSelectedId] || WEIGHT_EXERCISES[0];
        return customExercisesMap[globalSelectedId] || customExercises[0] || { id: 'custom_placeholder', color: '#8b5cf6', gradient: ['#8b5cf6', '#7c3aed'], icon: 'Star', name: 'Exercice Perso' };
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
    
    // For Cardio slide, use the cardioTotalReps from settings, else use computedStats
    const totalReps = currentCatKey === CATEGORIES.CARDIO 
        ? (settings.cardioTotalReps || 0) 
        : (computedStats.exerciseReps[globalSelectedId] || 0);

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
            <div className={`fade-in ${hackActive ? 'day100-global day100-flicker' : ''} ${day100Unhacked ? 'day100-unhacking' : ''}`} style={{
                display: 'flex', flexDirection: 'column', height: '100%',
                gap: 'clamp(4px, 1vh, 10px)', paddingBottom: 'clamp(2px, 0.5vh, 8px)'
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

                <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, position: 'relative' }}>
                    <div
                        ref={scrollContainerRef}
                        onScroll={(e) => {
                            const slideHeight = e.target.clientHeight;
                            if (slideHeight === 0) return;
                            const newSlide = Math.round(e.target.scrollTop / slideHeight);
                            if (newSlide >= 0 && newSlide <= 3) {
                                window.__latestSlide = newSlide;
                                document.getElementById('active-slide-updater').click();
                            }
                        }}
                        style={{
                            flex: 1, overflowY: anyModalOpen ? 'hidden' : 'auto', overflowX: 'hidden',
                            scrollSnapType: 'y mandatory',
                            display: 'flex', flexDirection: 'column', width: '100%',
                            scrollbarWidth: 'none', msOverflowStyle: 'none'
                        }}
                    >

                        <button id="active-slide-updater" style={{display:'none'}} onClick={() => {
                            if (window.__latestSlide !== undefined && window.__latestSlide !== activeSlide) {
                                setActiveSlide(window.__latestSlide);
                            }
                        }}></button>

                        {CATEGORY_ORDER.map(catKey => {
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
                                return (
                                    <div key={catKey} style={{ flex: '0 0 100%', scrollSnapAlign: 'start', height: '100%' }}>
                                        {canAccessFeature(FEATURES.CUSTOM_EXERCISES, { isPro }) ? (
                                            <DashboardSlide
                                                title={t('common.custom')}
                                                categoryColor={CATEGORY_COLORS[CATEGORIES.CUSTOM]}
                                                isFuture={isFuture} effectiveStart={effectiveStart} dayNumber={dayNumber} today={today}
                                                getExerciseCount={getExerciseCount} completions={completions} computedStats={computedStats}
                                                isCounterTransitioning={isCounterTransitioning} prevDayNumber={prevDayNumber}
                                                pauseCloudSync={pauseCloudSync} setShowCounter={setShowCounter}
                                                activeExerciseId={customExercisesMap[customSelected] ? customSelected : (customExercises[0]?.id || null)} onSelectExercise={handleSelectExercise}
                                                exercisesList={customExercises} exercisesMap={customExercisesMap}
                                                onManageCustom={() => { setShowCustomExercisesModal(true); pauseCloudSync?.(); }}
                                                isDay100={hackActive}
                                                getConfig={getConfig}
                                            />
                                        ) : (
                                            <ProPaywall
                                                title={t('common.custom')}
                                                onOpenStore={() => { setShowSettings(true); setOpenStoreDirectly(true); }}
                                            />
                                        )}
                                    </div>
                                );
                            }

                            return null;
                        })}
                    </div>

                    <div style={{
                        position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)',
                        display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 10,
                        pointerEvents: 'none'
                    }}>
                        {CATEGORY_ORDER.map((_, i) => (
                            <div key={i} style={{
                                width: '4px', height: activeSlide === i ? '24px' : '6px',
                                borderRadius: '4px',
                                background: activeSlide === i ? 'var(--text-primary)' : 'var(--text-secondary)',
                                opacity: activeSlide === i ? 1 : 0.4,
                                transition: 'all 0.3s ease'
                            }} />
                        ))}
                    </div>
                </main>

                <DashboardActions
                    setShowCalendar={setShowCalendar}
                    setShowSession={setShowSession}
                    pauseCloudSync={pauseCloudSync}
                    selectedExercise={selectedExercise}
                    activeCategoryColor={CATEGORY_COLORS[CATEGORY_ORDER[effectiveSlide]]}
                    isDay100={hackActive}
                />

                <>
                    {showCalendar && (
                        <Suspense fallback={null}>
                            <Calendar
                                startDate={startDate}
                                completions={completions}
                                exercises={{
                                    [CATEGORIES.BODYWEIGHT]: EXERCISES,
                                    [CATEGORIES.WEIGHTS]: WEIGHT_EXERCISES,
                                    [CATEGORIES.CARDIO]: CARDIO_EXERCISES,
                                    [CATEGORIES.CUSTOM]: customExercises
                                }[CATEGORY_ORDER[effectiveSlide]]}
                                isCustom={CATEGORY_ORDER[effectiveSlide] === CATEGORIES.CUSTOM}
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
                                initialCategory={{
                                    [CATEGORIES.BODYWEIGHT]: 'standard',
                                    [CATEGORIES.WEIGHTS]: 'weights',
                                    [CATEGORIES.CARDIO]: 'cardio',
                                    [CATEGORIES.CUSTOM]: 'custom'
                                }[CATEGORY_ORDER[effectiveSlide]]}
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
                    {showCounter && selectedExercise?.type !== 'timer' && (
                        <Suspense fallback={null}>
                            <Counter
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
                    {showCounter && selectedExercise?.type === 'timer' && (
                        <Suspense fallback={null}>
                            <Timer
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
                    {showCustomExercisesModal && (
                        <Suspense fallback={null}>
                            <CustomExercisesModal
                                onClose={() => { setShowCustomExercisesModal(false); resumeCloudSync?.(); }}
                                customExercisesHook={customExercisesHook}
                                computedStats={computedStats}
                            />
                        </Suspense>
                    )}
                </>
            </div>
        </>
    );
}
