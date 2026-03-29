import React, { useEffect, useState, useRef, useCallback, useMemo, Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { App as CapacitorApp } from '@capacitor/app';
import {
    Trophy, Calendar as CalendarIcon, PieChart, Flame, Settings as SettingsIcon,
    Dumbbell, ArrowDownUp, ArrowUp, Zap, ChevronsUp, Footprints, Users, Check, Award,
    Target, TrendingUp, Star, Activity, Play, Square, MoveDown, MoveDiagonal, Shield,
    Swords, Sparkles, Lock, ShoppingBag
} from 'lucide-react';
import { AchievementToast } from './feedback/AchievementToast';
import { CSSConfetti } from './feedback/CSSConfetti';
import { NotificationManager } from './social/NotificationManager';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { DashboardSlide } from './dashboard/DashboardSlide';
import { DashboardActions } from './dashboard/DashboardActions';
import { ProPaywall } from './dashboard/ProPaywall';
import { useHardwareBack } from '../hooks/useHardwareBack';

const Calendar = lazy(() => import('./stats/Calendar').then(m => ({ default: m.Calendar })));
const Stats = lazy(() => import('./stats/Stats').then(m => ({ default: m.Stats })));
const Settings = lazy(() => import('./settings/Settings').then(m => ({ default: m.Settings })));
const Counter = lazy(() => import('./exercises/Counter').then(m => ({ default: m.Counter })));
const Leaderboard = lazy(() => import('./social/Leaderboard').then(m => ({ default: m.Leaderboard })));
const Achievements = lazy(() => import('./feedback/Achievements').then(m => ({ default: m.Achievements })));
const Timer = lazy(() => import('./exercises/Timer').then(m => ({ default: m.Timer })));
const WorkoutSession = lazy(() => import('./exercises/WorkoutSession').then(m => ({ default: m.WorkoutSession })));
const Onboarding = lazy(() => import('./settings/Onboarding').then(module => ({ default: module.Onboarding })));
const ClanModal = lazy(() => import('./social/ClanModal').then(m => ({ default: m.ClanModal })));
const CustomExercisesModal = lazy(() => import('./exercises/CustomExercisesModal').then(m => ({ default: m.CustomExercisesModal })));

import { sounds, setSoundSettingsGetter } from '../utils/soundManager';
import { getLocalDateStr, isDayDoneFromCompletions } from '../utils/dateUtils';
import { EXERCISES, EXERCISES_MAP, getDailyGoal } from '../config/exercises';
import { WEIGHT_EXERCISES, WEIGHT_EXERCISES_MAP } from '../config/weights';
import { runBackHandler } from '../utils/backHandler';

// Map icon name → lucide component
const ICON_MAP = { Dumbbell, ArrowDownUp, ArrowUp, Zap, ChevronsUp, Footprints, Flame, Square, MoveDown, MoveDiagonal };

// Helper for time formatting - moved outside to avoid re-creation
const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

export function Dashboard({
    getDayNumber, toggleCompletion, completions, startDate, userStartDate,
    scheduleNotification, cloudAuth, cloudSync, settings, updateSettings,
    conflictData, onResolveConflict, getExerciseCount, updateExerciseCount, getTotalReps,
    getExerciseDone, pauseCloudSync, resumeCloudSync, computedStats,
    routines, saveRoutine, deleteRoutine, updateRoutine, maxRoutines,
    isSupporter, isClub, isPro,
    onPurchaseSupporter, onPurchaseClub, onPurchasePro, onRestorePurchases,
    customExercisesHook
}) {
    const { t } = useTranslation();
    const [today, setToday] = useState(getLocalDateStr(new Date()));
    const [showCalendar, setShowCalendar] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showCounter, setShowCounter] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [showAchievements, setShowAchievements] = useState(false);
    const [showSession, setShowSession] = useState(false);
    const [showClan, setShowClan] = useState(false);
    const [showCustomExercisesModal, setShowCustomExercisesModal] = useState(false);
    const [newAchievement, setNewAchievement] = useState(null);
    const [activeSlide, setActiveSlide] = useState(0); // 0: Classic, 1: Weights, 2: Custom
    
    // Custom exercises integration
    const customExercises = customExercisesHook?.customExercises || [];
    const customExercisesMap = useMemo(() => {
        const map = {};
        customExercises.forEach(ex => { map[ex.id] = ex; });
        return map;
    }, [customExercises]);

    const [classicSelected, setClassicSelected] = useState('pushups');
    const [weightsSelected, setWeightsSelected] = useState('biceps_curl');
    const [customSelected, setCustomSelected] = useState(customExercises[0]?.id || 'custom_placeholder');
    const [numberKey, setNumberKey] = useState(0);
    const [isCounterTransitioning, setIsCounterTransitioning] = useState(false);
    const [prevDayNumber, setPrevDayNumber] = useState(null);
    const [showDayConfetti, setShowDayConfetti] = useState(false);
    const [openStoreDirectly, setOpenStoreDirectly] = useState(false);

    // Dynamic global selection for Header badge styling
    const effectiveSlide = isPro ? activeSlide : 0;
    const globalSelectedId = effectiveSlide === 0 ? classicSelected : effectiveSlide === 1 ? weightsSelected : customSelected;
    const selectedExercise = useMemo(() => {
        if (effectiveSlide === 0) return EXERCISES_MAP[globalSelectedId] || EXERCISES[0];
        if (effectiveSlide === 1) return WEIGHT_EXERCISES_MAP[globalSelectedId] || WEIGHT_EXERCISES[0];
        return customExercisesMap[globalSelectedId] || customExercises[0] || { id: 'custom_placeholder', color: '#8b5cf6', gradient: ['#8b5cf6', '#7c3aed'], icon: 'Star', name: 'Exercice Perso' };
    }, [effectiveSlide, globalSelectedId, customExercises, customExercisesMap]);

    useEffect(() => {
        setSoundSettingsGetter(() => settings);
    }, [settings]);

    // Achievement detection — compare badge count changes
    const prevBadgeCountRef = useRef(computedStats.badgeCount);
    useEffect(() => {
        const prevCount = prevBadgeCountRef.current;
        const newCount = computedStats.badgeCount;

        if (newCount > prevCount) {
            // A new badge was unlocked — show a generic achievement toast
            setNewAchievement({ id: 'new_badge', title: t('dashboard.newAchievement'), color: '#fbbf24', icon: Award });
        }

        prevBadgeCountRef.current = newCount;
    }, [computedStats.badgeCount]);

    const dayNumber = useMemo(() => getDayNumber(today), [getDayNumber, today]);

    const selectedExerciseId = globalSelectedId;
    const isExerciseDone = completions[today]?.[selectedExerciseId]?.isCompleted || false;
    const currentCount = getExerciseCount(today, selectedExerciseId);
    const dailyGoal = getDailyGoal(selectedExercise, dayNumber, settings?.difficultyMultiplier) || 1;

    const totalReps = computedStats.exerciseReps[globalSelectedId] || 0;

    const effectiveStart = userStartDate || startDate;
    const isFuture = today < effectiveStart;

    // Pre-computed streaks from computedStats
    const statsSelectedEx = computedStats.exerciseStats?.find(e => e.id === globalSelectedId);
    const exerciseStreak = statsSelectedEx ? statsSelectedEx.streak : 0;

    // Duolingo-style streak from computedStats
    const displayStreak = computedStats.displayStreak;
    const streakActive = computedStats.streakActive;

    const handleSelectExercise = (id) => {
        if (effectiveSlide === 0) setClassicSelected(id);
        else if (effectiveSlide === 1) setWeightsSelected(id);
        else setCustomSelected(id);
    };

    // Day change detection
    useEffect(() => {
        const handleDayChange = () => {
            const now = new Date();
            const currentDateStr = getLocalDateStr(now);
            if (currentDateStr !== today) {
                const previousDayNumber = getDayNumber(today);
                const newDayNumber = getDayNumber(currentDateStr);

                if (newDayNumber > previousDayNumber) {
                    setPrevDayNumber(previousDayNumber);
                    setIsCounterTransitioning(true);
                    setShowDayConfetti(true);

                    setTimeout(() => {
                        setIsCounterTransitioning(false);
                        setPrevDayNumber(null);
                    }, 800);
                }

                setToday(currentDateStr);
                if (scheduleNotification) scheduleNotification(settings);
            }
        };

        handleDayChange();
        const interval = setInterval(handleDayChange, 10000);
        return () => clearInterval(interval);
    }, [today, getDayNumber, settings, scheduleNotification]);

    // Android Hardware Back handling
    const activeModals = useMemo(() => [
        { isOpen: showCounter, close: () => setShowCounter(false), shouldResumeSync: true },
        { isOpen: showSession, close: () => setShowSession(false), shouldResumeSync: true },
        { isOpen: showClan, close: () => setShowClan(false), shouldResumeSync: true },
        { isOpen: showAchievements, close: () => setShowAchievements(false) },
        { isOpen: showLeaderboard, close: () => setShowLeaderboard(false) },
        { isOpen: showSettings, close: () => setShowSettings(false) },
        { isOpen: showStats, close: () => setShowStats(false) },
        { isOpen: showCalendar, close: () => setShowCalendar(false) }
    ], [showCounter, showSession, showClan, showAchievements, showLeaderboard, showSettings, showStats, showCalendar]);

    useHardwareBack(activeModals, resumeCloudSync);



    const handleSaveSettings = useCallback((newSettings) => {
        updateSettings(newSettings);
        if (scheduleNotification) scheduleNotification(newSettings);
    }, [updateSettings, scheduleNotification]);

    const handleViewAchievement = useCallback(() => {
        setShowCounter(false);
        setShowStats(true);
        setTimeout(() => {
            setShowAchievements(true);
        }, 100);
    }, []);

    // React to any modal being open to prevent background scrolling (iOS Safari fix)
    const anyModalOpen = showCalendar || showStats || showSettings || showCounter || showLeaderboard || showAchievements || showSession || showClan || showCustomExercisesModal;

    // Lock body scroll when any modal is open (critical for iOS Safari)
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
            <NotificationManager />
            <CSSConfetti
                active={showDayConfetti}
                colors={['#6d28d9', '#8b5cf6', '#0ea5e9', '#f093fb', '#fbbf24', '#10b981']}
                onDone={() => setShowDayConfetti(false)}
                reducedParticles={settings?.performanceMode === 'low'}
            />
            {newAchievement && (
                <AchievementToast
                    achievement={newAchievement}
                    onClose={() => setNewAchievement(null)}
                    onView={handleViewAchievement}
                />
            )}
            <div className="fade-in" style={{
                display: 'flex', flexDirection: 'column', height: '100%',
                gap: 'clamp(4px, 1vh, 10px)', paddingBottom: 'clamp(2px, 0.5vh, 8px)'
            }}>
                {/* ── Header ── */}
                <DashboardHeader
                    setShowSettings={setShowSettings}
                    setShowStats={setShowStats}
                    setShowLeaderboard={setShowLeaderboard}
                    setShowClan={setShowClan}
                    pauseCloudSync={pauseCloudSync}
                    streakActive={streakActive}
                    displayStreak={displayStreak}
                    selectedExercise={selectedExercise}
                    totalReps={totalReps}
                />

                {/* ── Main ── */}
                <main style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    minHeight: 0, position: 'relative'
                }}>
                    <div 
                        onScroll={(e) => {
                            const slideHeight = e.target.clientHeight;
                            if (slideHeight === 0) return;
                            const newSlide = Math.round(e.target.scrollTop / slideHeight);
                            if (newSlide >= 0 && newSlide <= 2) {
                                document.getElementById('active-slide-updater').click();
                                window.__latestSlide = newSlide;
                            }
                        }}
                        style={{
                            flex: 1, overflowY: anyModalOpen ? 'hidden' : 'auto', overflowX: 'hidden',
                            scrollSnapType: 'y mandatory', scrollBehavior: 'smooth',
                            display: 'flex', flexDirection: 'column', width: '100%',
                            scrollbarWidth: 'none', msOverflowStyle: 'none'
                        }}
                    >
                        <button id="active-slide-updater" style={{display:'none'}} onClick={() => {
                            if (window.__latestSlide !== undefined && window.__latestSlide !== activeSlide) {
                                setActiveSlide(window.__latestSlide);
                            }
                        }}></button>

                        <div style={{ flex: '0 0 100%', scrollSnapAlign: 'start', height: '100%' }}>
                            <DashboardSlide
                                isFuture={isFuture} effectiveStart={effectiveStart} dayNumber={dayNumber} today={today} settings={settings}
                                getExerciseCount={getExerciseCount} completions={completions} computedStats={computedStats}
                                isCounterTransitioning={isCounterTransitioning} prevDayNumber={prevDayNumber} numberKey={numberKey}
                                pauseCloudSync={pauseCloudSync} setShowCounter={setShowCounter}
                                activeExerciseId={classicSelected} onSelectExercise={handleSelectExercise}
                                exercisesList={EXERCISES} exercisesMap={EXERCISES_MAP}
                            />
                        </div>

                        <div style={{ flex: '0 0 100%', scrollSnapAlign: 'start', height: '100%' }}>
                            {isPro ? (
                                <DashboardSlide
                                    title={t('common.global_weights')}
                                    isFuture={isFuture} effectiveStart={effectiveStart} dayNumber={dayNumber} today={today} settings={settings}
                                    getExerciseCount={getExerciseCount} completions={completions} computedStats={computedStats}
                                    isCounterTransitioning={isCounterTransitioning} prevDayNumber={prevDayNumber} numberKey={numberKey}
                                    pauseCloudSync={pauseCloudSync} setShowCounter={setShowCounter}
                                    activeExerciseId={weightsSelected} onSelectExercise={handleSelectExercise}
                                    exercisesList={WEIGHT_EXERCISES} exercisesMap={WEIGHT_EXERCISES_MAP}
                                />
                            ) : (
                                <ProPaywall
                                    title={t('common.global_weights')}
                                    onOpenStore={() => { setShowSettings(true); setOpenStoreDirectly(true); }}
                                />
                            )}
                        </div>

                        <div style={{ flex: '0 0 100%', scrollSnapAlign: 'start', height: '100%' }}>
                            {isPro ? (
                                <DashboardSlide
                                    title={t('common.global_custom')}
                                    isFuture={isFuture} effectiveStart={effectiveStart} dayNumber={dayNumber} today={today} settings={settings}
                                    getExerciseCount={getExerciseCount} completions={completions} computedStats={computedStats}
                                    isCounterTransitioning={isCounterTransitioning} prevDayNumber={prevDayNumber} numberKey={numberKey}
                                    pauseCloudSync={pauseCloudSync} setShowCounter={setShowCounter}
                                    activeExerciseId={customExercisesMap[customSelected] ? customSelected : (customExercises[0]?.id || null)} onSelectExercise={handleSelectExercise}
                                    exercisesList={customExercises} exercisesMap={customExercisesMap}
                                    onManageCustom={() => { setShowCustomExercisesModal(true); pauseCloudSync?.(); }}
                                />
                            ) : (
                                <ProPaywall
                                    title={t('common.global_custom')}
                                    onOpenStore={() => { setShowSettings(true); setOpenStoreDirectly(true); }}
                                />
                            )}
                        </div>
                    </div>

                    <div style={{
                        position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)',
                        display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 10,
                        pointerEvents: 'none'
                    }}>
                        {[0, 1, 2].map(i => (
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

                {/* Bottom Actions Row */}
                <DashboardActions 
                    setShowCalendar={setShowCalendar} 
                    setShowSession={setShowSession} 
                    pauseCloudSync={pauseCloudSync} 
                    selectedExercise={selectedExercise} 
                />

                {/* Modals */}
                <Suspense fallback={null}>
                    {showCalendar && (
                        <Calendar
                            startDate={startDate}
                            completions={completions}
                            exercises={effectiveSlide === 0 ? EXERCISES : effectiveSlide === 1 ? WEIGHT_EXERCISES : customExercises}
                            getDayNumber={getDayNumber}
                            onClose={() => setShowCalendar(false)}
                            settings={settings}
                        />
                    )}
                    {showStats && (
                        <Stats
                            completions={completions}
                            exercisesList={{
                                standard: EXERCISES,
                                weights: WEIGHT_EXERCISES,
                                custom: customExercises
                            }}
                            initialCategory={effectiveSlide === 0 ? 'standard' : effectiveSlide === 1 ? 'weights' : 'custom'}
                            isPro={isPro}
                            onClose={() => setShowStats(false)}
                            onOpenAchievements={() => { setShowAchievements(true); }}
                            highlightedBadgeId={newAchievement?.id}
                            settings={settings}
                            getDayNumber={getDayNumber}
                            computedStats={computedStats}
                            onOpenStore={() => {
                                setShowSettings(true);
                                setOpenStoreDirectly(true);
                            }}
                        />
                    )}
                    {showSettings && (
                        <Settings
                            defaultShowStore={openStoreDirectly}
                            settings={settings}
                            onClose={() => {
                                setShowSettings(false);
                                setOpenStoreDirectly(false);
                            }}
                            onSave={handleSaveSettings}
                            cloudAuth={cloudAuth}
                            cloudSync={cloudSync}
                            conflictData={conflictData}
                            onResolveConflict={onResolveConflict}
                            isSupporter={isSupporter}
                            isClub={isClub}
                            isPro={isPro}
                            onPurchaseSupporter={onPurchaseSupporter}
                            onPurchaseClub={onPurchaseClub}
                            onPurchasePro={onPurchasePro}
                            onRestorePurchases={onRestorePurchases}
                        />
                    )}
                    {showCounter && selectedExercise?.type !== 'timer' && (
                        <Counter
                            exerciseConfig={selectedExercise}
                            onClose={() => { setShowCounter(false); resumeCloudSync?.(); }}
                            dailyGoal={dailyGoal}
                            currentCount={currentCount}
                            onUpdateCount={(newCount) => updateExerciseCount(today, selectedExerciseId, newCount, dailyGoal)}
                            isCompleted={isExerciseDone}
                            dayNumber={dayNumber}
                        />
                    )}
                    {showCounter && selectedExercise?.type === 'timer' && (
                        <Timer
                            exerciseConfig={selectedExercise}
                            onClose={() => { setShowCounter(false); resumeCloudSync?.(); }}
                            dailyGoal={dailyGoal}
                            currentCount={currentCount}
                            onUpdateCount={(newCount) => updateExerciseCount(today, selectedExerciseId, newCount, dailyGoal)}
                            isCompleted={isExerciseDone}
                            dayNumber={dayNumber}
                        />
                    )}
                    {showLeaderboard && (
                        <Leaderboard
                            onClose={() => setShowLeaderboard(false)}
                            cloudSync={cloudSync}
                            cloudAuth={cloudAuth}
                            activeSlide={effectiveSlide}
                        />
                    )}
                    {showAchievements && (
                        <Achievements
                            completions={completions}
                            exercises={EXERCISES}
                            onClose={() => { setShowAchievements(false); setNewAchievement(null); }}
                            settings={settings}
                            getDayNumber={getDayNumber}
                            highlightedBadgeId={newAchievement?.id}
                            computedStats={computedStats}
                        />
                    )}
                    {showSession && (
                        <WorkoutSession
                            onClose={() => { setShowSession(false); resumeCloudSync?.(); }}
                            today={today}
                            dayNumber={dayNumber}
                            getExerciseCount={getExerciseCount}
                            updateExerciseCount={updateExerciseCount}
                            completions={completions}
                            settings={settings}
                            routines={routines}
                            saveRoutine={saveRoutine}
                            deleteRoutine={deleteRoutine}
                            updateRoutine={updateRoutine}
                            maxRoutines={maxRoutines}
                            isPro={isPro}
                            activeSlide={effectiveSlide}
                            customExercises={customExercises}
                        />
                    )}
                    {showClan && (
                        <ClanModal
                            onClose={() => { setShowClan(false); resumeCloudSync?.(); }}
                            cloudAuth={cloudAuth}
                            settings={settings}
                            updateSettings={updateSettings}
                                                    />
                    )}
                    {showCustomExercisesModal && (
                        <CustomExercisesModal
                            onClose={() => { setShowCustomExercisesModal(false); resumeCloudSync?.(); }}
                            customExercisesHook={customExercisesHook}
                            computedStats={computedStats}
                        />
                    )}
                </Suspense>
            </div>
        </>
    );
}


