import React, { useEffect, useState, useRef, useCallback, useMemo, Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { App as CapacitorApp } from '@capacitor/app';
import {
    Trophy, Calendar as CalendarIcon, PieChart, Flame, Settings as SettingsIcon,
    Dumbbell, ArrowDownUp, ArrowUp, Zap, ChevronsUp, Footprints, Users, Check, Award,
    Target, TrendingUp, Star, Activity, Play, Square, MoveDown, MoveDiagonal, Shield,
    Swords, Sparkles
} from 'lucide-react';
import { AchievementToast } from './AchievementToast';
import { CSSConfetti } from './CSSConfetti';
import { NotificationManager } from './NotificationManager';

const Calendar = lazy(() => import('./Calendar').then(m => ({ default: m.Calendar })));
const Stats = lazy(() => import('./Stats').then(m => ({ default: m.Stats })));
const Settings = lazy(() => import('./Settings').then(m => ({ default: m.Settings })));
const Counter = lazy(() => import('./Counter').then(m => ({ default: m.Counter })));
const Leaderboard = lazy(() => import('./Leaderboard').then(m => ({ default: m.Leaderboard })));
const Achievements = lazy(() => import('./Achievements').then(m => ({ default: m.Achievements })));
const Timer = lazy(() => import('./Timer').then(m => ({ default: m.Timer })));
const WorkoutSession = lazy(() => import('./WorkoutSession').then(m => ({ default: m.WorkoutSession })));
const Onboarding = lazy(() => import('./Onboarding').then(module => ({ default: module.Onboarding })));
const ClanModal = lazy(() => import('./ClanModal').then(m => ({ default: m.ClanModal })));
const ChallengeModal = lazy(() => import('./ChallengeModal').then(module => ({ default: module.ChallengeModal })));
const CustomExercisesModal = lazy(() => import('./CustomExercisesModal').then(m => ({ default: m.CustomExercisesModal })));

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
    isSupporter, isClub, isPro, purchaseHistory,
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
    const [showChallenge, setShowChallenge] = useState(false);
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

    // Dynamic global selection for Header badge styling
    const globalSelectedId = activeSlide === 0 ? classicSelected : activeSlide === 1 ? weightsSelected : customSelected;
    const selectedExercise = useMemo(() => {
        if (activeSlide === 0) return EXERCISES_MAP[globalSelectedId] || EXERCISES[0];
        if (activeSlide === 1) return WEIGHT_EXERCISES_MAP[globalSelectedId] || WEIGHT_EXERCISES[0];
        return customExercisesMap[globalSelectedId] || customExercises[0] || { id: 'custom_placeholder', color: '#8b5cf6', gradient: ['#8b5cf6', '#7c3aed'], icon: 'Star', name: 'Exercice Perso' };
    }, [activeSlide, globalSelectedId, customExercises, customExercisesMap]);

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
    const exerciseStreak = computedStats.exerciseDoneToday[globalSelectedId]
        ? computedStats.exerciseCurrentStreaks[globalSelectedId]
        : (computedStats.exerciseCurrentStreaks[globalSelectedId] > 0 ? computedStats.exerciseCurrentStreaks[globalSelectedId] : 0);

    // Duolingo-style streak from computedStats
    const displayStreak = computedStats.displayStreak;
    const streakActive = computedStats.streakActive;

    const handleSelectExercise = (id) => {
        if (activeSlide === 0) setClassicSelected(id);
        else if (activeSlide === 1) setWeightsSelected(id);
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

    // Handle Android hardware back button
    useEffect(() => {
        const handleBackButton = ({ canGoBack }) => {
            if (runBackHandler()) return;
            if (showCounter) {
                setShowCounter(false);
                resumeCloudSync?.();
            } else if (showSession) {
                setShowSession(false);
                resumeCloudSync?.();
            } else if (showChallenge) {
                setShowChallenge(false);
                resumeCloudSync?.();
            } else if (showClan) {
                setShowClan(false);
                resumeCloudSync?.();
            } else if (showAchievements) {
                setShowAchievements(false);
            } else if (showLeaderboard) {
                setShowLeaderboard(false);
            } else if (showSettings) {
                setShowSettings(false);
            } else if (showStats) {
                setShowStats(false);
            } else if (showCalendar) {
                setShowCalendar(false);
            } else {
                CapacitorApp.exitApp();
            }
        };

        let backButtonListener;
        CapacitorApp.addListener('backButton', handleBackButton).then(listener => {
            backButtonListener = listener;
        }).catch(err => {
            console.warn('Capacitor App plugin error:', err);
        });

        return () => {
            if (backButtonListener) {
                backButtonListener.remove();
            }
        };
    }, [showCounter, showCalendar, showStats, showSettings, showLeaderboard, showAchievements, showSession, showClan, showChallenge, resumeCloudSync]);

    // Progress circle for year (day X / 365)
    const circumference = 2 * Math.PI * 45;
    const progress = (dayNumber / 365) * 100;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

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
                <header className="glass" style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: 'clamp(10px, 1.5vh, 16px) clamp(12px, 3vw, 20px)', borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-md)', minWidth: 0,
                    containerType: 'inline-size', containerName: 'header'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flexShrink: 1, overflow: 'hidden' }}>
                        <img
                            src={`${import.meta.env.BASE_URL}pwa-192x192.webp`} alt="OneUp Logo"
                            className="bounce-on-hover hide-logo-mobile"
                            style={{ width: 'clamp(28px, 4vh, 40px)', height: 'clamp(28px, 4vh, 40px)', flexShrink: 0, borderRadius: '10px', objectFit: 'cover', cursor: 'pointer', transition: 'transform 0.3s ease' }}
                        />
                        <span className="hide-text-mobile" style={{ fontWeight: '600', fontSize: 'clamp(0.8rem, 1.8vh, 1.1rem)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>OneUp</span>
                    </div>

                    <div style={{ display: 'flex', gap: 'clamp(4px, 0.8vw, 8px)', alignItems: 'center', flexShrink: 1, minWidth: 0, justifyContent: 'flex-end' }}>
                        <button onClick={() => setShowSettings(true)} className="hover-lift" style={iconBtnStyle}>
                            <SettingsIcon size={19} />
                        </button>
                        <button onClick={() => setShowStats(true)} className="hover-lift" style={iconBtnStyle}>
                            <PieChart size={19} />
                        </button>
                        <button onClick={() => setShowLeaderboard(true)} className="hover-lift" style={iconBtnStyle}>
                            <Users size={19} />
                        </button>
                        <button
                            onClick={() => { setShowClan(true); pauseCloudSync?.(); }}
                            title="Clan"
                            className="hover-lift"
                            style={iconBtnStyle}
                        >
                            <Shield size={19} />
                        </button>
                        <button
                            onClick={() => { setShowChallenge(true); pauseCloudSync?.(); }}
                            title={t('challenge.title')}
                            className="hover-lift"
                            style={{
                                ...iconBtnStyle,
                                background: isClub ? 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(217,119,6,0.1))' : iconBtnStyle.background,
                                border: isClub ? '1px solid rgba(245,158,11,0.3)' : 'none'
                            }}
                        >
                            <Swords size={19} color={isClub ? '#f59e0b' : undefined} />
                        </button>

                        {/* Global streak badge — Duolingo style: gray if not done today */}
                        <div style={{
                            background: streakActive
                                ? 'linear-gradient(135deg, rgba(249,115,22,0.22), rgba(239,68,68,0.22))'
                                : 'linear-gradient(135deg, rgba(120,120,120,0.18), rgba(90,90,90,0.18))',
                            padding: 'clamp(4px, 0.7vh, 8px) clamp(8px, 1.2vw, 14px)', borderRadius: '16px', fontSize: 'clamp(0.75rem, 1.6vh, 0.95rem)',
                            display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '700',
                            border: streakActive ? '1px solid rgba(249,115,22,0.3)' : '1px solid rgba(120,120,120,0.25)',
                            boxShadow: streakActive ? '0 2px 8px rgba(249,115,22,0.15)' : 'none',
                            opacity: streakActive ? 1 : 0.7, flexShrink: 0
                        }}>
                            <Flame size={16} color={streakActive ? '#f97316' : '#888'} />
                            <span style={{ color: streakActive ? '#f97316' : '#888' }}>{displayStreak}</span>
                        </div>

                        {/* Total reps badge */}
                        <div className="shimmer" style={{
                            background: `linear-gradient(135deg, ${selectedExercise.color}33, ${selectedExercise.gradient[0]}33)`,
                            padding: 'clamp(4px, 0.7vh, 8px) clamp(8px, 1.2vw, 14px)', borderRadius: '16px', fontSize: 'clamp(0.75rem, 1.6vh, 0.95rem)',
                            display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600',
                            border: '1px solid var(--border-strong)',
                            boxShadow: `0 2px 8px ${selectedExercise.color}33`, flexShrink: 0
                        }}>
                            <Trophy size={16} color={selectedExercise.color} />
                            <span>{totalReps}</span>
                        </div>
                    </div>
                </header>

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
                            flex: 1, overflowY: 'auto', overflowX: 'hidden',
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

                        {isPro && (
                            <div style={{ flex: '0 0 100%', scrollSnapAlign: 'start', height: '100%' }}>
                                <DashboardSlide
                                    title="Musculation (Poids)"
                                    isFuture={isFuture} effectiveStart={effectiveStart} dayNumber={dayNumber} today={today} settings={settings}
                                    getExerciseCount={getExerciseCount} completions={completions} computedStats={computedStats}
                                    isCounterTransitioning={isCounterTransitioning} prevDayNumber={prevDayNumber} numberKey={numberKey}
                                    pauseCloudSync={pauseCloudSync} setShowCounter={setShowCounter}
                                    activeExerciseId={weightsSelected} onSelectExercise={handleSelectExercise}
                                    exercisesList={WEIGHT_EXERCISES} exercisesMap={WEIGHT_EXERCISES_MAP}
                                />
                            </div>
                        )}

                        {isPro && (
                            <div style={{ flex: '0 0 100%', scrollSnapAlign: 'start', height: '100%' }}>
                                <DashboardSlide
                                    title="Exercices Personnalisés"
                                    isFuture={isFuture} effectiveStart={effectiveStart} dayNumber={dayNumber} today={today} settings={settings}
                                    getExerciseCount={getExerciseCount} completions={completions} computedStats={computedStats}
                                    isCounterTransitioning={isCounterTransitioning} prevDayNumber={prevDayNumber} numberKey={numberKey}
                                    pauseCloudSync={pauseCloudSync} setShowCounter={setShowCounter}
                                    activeExerciseId={customExercisesMap[customSelected] ? customSelected : (customExercises[0]?.id || null)} onSelectExercise={handleSelectExercise}
                                    exercisesList={customExercises} exercisesMap={customExercisesMap}
                                    onManageCustom={() => { setShowCustomExercisesModal(true); pauseCloudSync?.(); }}
                                />
                            </div>
                        )}
                    </div>

                    {isPro && (
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
                    )}
                </main>

                {/* Bottom Actions Row */}
                <div style={{
                    display: 'flex', gap: '8px', width: '100%',
                    paddingBottom: '2px'
                }}>
                    {/* Calendar Button */}
                    <button
                        onClick={() => setShowCalendar(true)}
                        className="hover-lift gradient-button"
                        style={{
                            flex: 1, padding: 'clamp(12px, 1.8vh, 18px)', borderRadius: 'var(--radius-lg)',
                            color: 'var(--text-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: '8px', fontSize: 'clamp(0.75rem, 1.6vh, 0.95rem)', fontWeight: '600', border: 'none', cursor: 'pointer',
                            background: `linear-gradient(135deg, ${selectedExercise.color}28, ${selectedExercise.gradient[0]}28)`,
                            boxShadow: 'var(--shadow-md)'
                        }}
                    >
                        <CalendarIcon size={18} />
                        {t('dashboard.calendar')}
                    </button>

                    {/* Session Button */}
                    <button
                        onClick={() => { setShowSession(true); pauseCloudSync?.(); }}
                        className="hover-lift gradient-button"
                        style={{
                            flex: 1, padding: 'clamp(12px, 1.8vh, 18px)', borderRadius: 'var(--radius-lg)',
                            color: 'var(--text-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: '8px', fontSize: 'clamp(0.75rem, 1.6vh, 0.95rem)', fontWeight: '600', border: 'none', cursor: 'pointer',
                            background: 'linear-gradient(135deg, rgba(129,140,248,0.2), rgba(99,102,241,0.2))',
                            boxShadow: 'var(--shadow-md)'
                        }}
                    >
                        <Play size={18} />
                        {t('dashboard.session')}
                    </button>
                </div>

                {/* Modals */}
                <Suspense fallback={null}>
                    {showCalendar && (
                        <Calendar
                            startDate={startDate}
                            completions={completions}
                            exercises={activeSlide === 0 ? EXERCISES : activeSlide === 1 ? WEIGHT_EXERCISES : customExercises}
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
                            initialCategory={activeSlide === 0 ? 'standard' : activeSlide === 1 ? 'weights' : 'custom'}
                            isPro={isPro}
                            onClose={() => setShowStats(false)}
                            onOpenAchievements={() => { setShowAchievements(true); }}
                            highlightedBadgeId={newAchievement?.id}
                            settings={settings}
                            getDayNumber={getDayNumber}
                            computedStats={computedStats}
                        />
                    )}
                    {showSettings && (
                        <Settings
                            settings={settings}
                            onClose={() => setShowSettings(false)}
                            onSave={handleSaveSettings}
                            cloudAuth={cloudAuth}
                            cloudSync={cloudSync}
                            conflictData={conflictData}
                            onResolveConflict={onResolveConflict}
                            isSupporter={isSupporter}
                            isClub={isClub}
                            isPro={isPro}
                            purchaseHistory={purchaseHistory}
                            onPurchaseSupporter={onPurchaseSupporter}
                            onPurchaseClub={onPurchaseClub}
                            onPurchasePro={onPurchasePro}
                            onRestorePurchases={onRestorePurchases}
                        />
                    )}
                    {showCounter && selectedExerciseId !== 'planche' && selectedExercise?.type !== 'timer' && (
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
                    {showCounter && (selectedExerciseId === 'planche' || selectedExercise?.type === 'timer') && (
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
                            activeSlide={activeSlide}
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
                            activeSlide={activeSlide}
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
                    {showChallenge && (
                        <ChallengeModal
                            onClose={() => { setShowChallenge(false); resumeCloudSync?.(); }}
                            cloudAuth={cloudAuth}
                            isClub={isClub}
                        />
                    )}
                    {showCustomExercisesModal && (
                        <CustomExercisesModal
                            onClose={() => { setShowCustomExercisesModal(false); resumeCloudSync?.(); }}
                            customExercisesHook={customExercisesHook}
                        />
                    )}
                </Suspense>
            </div>
        </>
    );
}

// Memoized exercise button to avoid re-rendering all 10 exercises when one changes
const DashboardSlide = React.memo(({
    isFuture, effectiveStart, dayNumber, today, settings, getExerciseCount, completions, computedStats,
    isCounterTransitioning, prevDayNumber, numberKey, pauseCloudSync, setShowCounter,
    activeExerciseId, onSelectExercise, exercisesList, exercisesMap, title, onManageCustom
}) => {
    const { t } = useTranslation();
    const safeSelectedExercise = exercisesMap[activeExerciseId] || exercisesList[0];
    
    if (!safeSelectedExercise) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '20px', textAlign: 'center' }}>
                {title && <h2 style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>{title}</h2>}
                <div style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Vous n'avez pas encore configuré d'exercices ici.</div>
                {onManageCustom && (
                    <button onClick={onManageCustom} className="hover-lift" style={{
                        padding: '12px 24px', borderRadius: 'var(--radius-md)', background: '#8b5cf6', color: 'white', fontWeight: '700', border: 'none'
                    }}>
                        Configurer
                    </button>
                )}
            </div>
        );
    }

    const dailyGoal = getDailyGoal(safeSelectedExercise, dayNumber, settings?.difficultyMultiplier) || 1;
    const currentCount = getExerciseCount(today, safeSelectedExercise.id);
    const isExerciseDone = completions[today]?.[safeSelectedExercise.id]?.isCompleted || currentCount >= dailyGoal;
    const progress = Math.min((dayNumber / 365) * 100, 100);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'space-evenly', gap: 'clamp(4px, 0.8vh, 12px)',
            height: '100%', width: '100%', paddingTop: title ? '12px' : '0'
        }}>
            {title && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.8 }}>
                        {title}
                    </div>
                    {onManageCustom && (
                        <button onClick={onManageCustom} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', opacity: 0.6, padding: '4px' }}>
                            <SettingsIcon size={14} />
                        </button>
                    )}
                </div>
            )}
            {!isFuture ? (
                <>
                    {/* Day & Goal Hero Section */}
                    <div style={{ textAlign: 'center', position: 'relative' }}>
                        <div style={{
                            fontSize: 'clamp(0.75rem, 1.6vh, 1rem)', color: 'var(--text-secondary)',
                            textTransform: 'uppercase', letterSpacing: '4px',
                            marginBottom: '2px', fontWeight: '700'
                        }}>
                            {t('dashboard.day')}
                        </div>

                        {/* Big animated day number */}
                        <div style={{
                            position: 'relative', height: 'clamp(3.2rem, 9vh, 7rem)', overflow: 'hidden',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: 'clamp(2px, 0.5vh, 6px)'
                        }}>
                            {isCounterTransitioning && prevDayNumber && (
                                <div className="rainbow-gradient" style={{
                                    position: 'absolute', fontSize: 'clamp(3rem, 8.5vh, 6.5rem)', fontWeight: '800', lineHeight: 1,
                                    animation: 'rainbowFlow 6s ease infinite, counterSlideDown 1s ease-out forwards'
                                }}>
                                    {prevDayNumber}
                                </div>
                            )}
                            <div
                                key={isCounterTransitioning ? `new-${dayNumber}` : numberKey}
                                className="rainbow-gradient"
                                style={{
                                    fontSize: 'clamp(3rem, 8.5vh, 6.5rem)', fontWeight: '800', lineHeight: 1,
                                    animation: isCounterTransitioning
                                        ? 'rainbowFlow 6s ease infinite, counterSlideUp 1s ease-out'
                                        : 'rainbowFlow 6s ease infinite, numberRoll 0.5s ease-out'
                                }}
                            >
                                {dayNumber}
                            </div>
                        </div>
                    </div>

                    {/* ── Exercise Selector ── */}
                    <div className="exercise-grid" style={{
                        display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
                        gap: 'clamp(6px, 1.2vw, 10px)', width: '100%', maxWidth: '640px',
                        padding: '2px'
                    }}>
                        {exercisesList.map(ex => (
                            <ExerciseButton
                                key={ex.id}
                                ex={ex}
                                isActive={ex.id === activeExerciseId}
                                dayNumber={dayNumber}
                                today={today}
                                settings={settings}
                                getExerciseCount={getExerciseCount}
                                completions={completions}
                                computedStats={computedStats}
                                onSelect={onSelectExercise}
                            />
                        ))}
                    </div>

                    {/* ── Progress ring + Counter button + Completion status (grouped) ── */}
                    <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        gap: 'clamp(4px, 0.8vh, 10px)'
                    }}>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            {/* Year progress ring */}
                            <svg viewBox="0 0 100 100" style={{
                                position: 'absolute', top: '-8%', left: '-8%',
                                width: 'clamp(90px, 14vh, 130px)', height: 'clamp(90px, 14vh, 130px)'
                            }}>
                                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--progress-track)" strokeWidth="3.5" />
                                <circle
                                    className="progress-ring-circle"
                                    cx="50" cy="50" r="42" fill="none"
                                    stroke={`url(#dashGrad-${activeExerciseId})`}
                                    strokeWidth="3.5"
                                    strokeDasharray={2 * Math.PI * 42}
                                    strokeDashoffset={2 * Math.PI * 42 - (progress / 100) * 2 * Math.PI * 42}
                                    strokeLinecap="round"
                                    transform="rotate(-90 50 50)"
                                />
                                <defs>
                                    <linearGradient id={`dashGrad-${activeExerciseId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor={safeSelectedExercise.gradient[0]} />
                                        <stop offset="100%" stopColor={safeSelectedExercise.gradient[1]} />
                                    </linearGradient>
                                </defs>
                            </svg>

                            {/* Counter open button */}
                            <button
                                onClick={() => { pauseCloudSync?.(); setShowCounter(true); }}
                                className="ripple"
                                style={{
                                    width: 'clamp(72px, 12vh, 110px)', height: 'clamp(72px, 12vh, 110px)', borderRadius: '50%',
                                    background: isExerciseDone
                                        ? `linear-gradient(135deg, ${safeSelectedExercise.color} 0%, ${safeSelectedExercise.gradient[1]} 100%)`
                                        : 'transparent',
                                    border: isExerciseDone ? 'none' : `2.5px solid ${safeSelectedExercise.color}`,
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center', gap: '1px',
                                    transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                    willChange: 'transform',
                                    transform: isExerciseDone ? 'scale(1.1)' : 'scale(1)',
                                    boxShadow: isExerciseDone
                                        ? `0 0 50px ${safeSelectedExercise.color}aa, 0 8px 30px ${safeSelectedExercise.color}55, 0 0 0 4px ${safeSelectedExercise.color}33, inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.1)`
                                        : `0 0 16px ${safeSelectedExercise.color}33`,
                                    cursor: 'pointer',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                {isExerciseDone ? (
                                    <>
                                        <div style={{
                                            position: 'absolute',
                                            inset: 0,
                                            background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)',
                                            pointerEvents: 'none'
                                        }} />
                                        <div style={{
                                            position: 'absolute',
                                            top: '-50%',
                                            left: '-50%',
                                            width: '200%',
                                            height: '200%',
                                            background: `conic-gradient(from 0deg, transparent, ${safeSelectedExercise.color}44, transparent, ${safeSelectedExercise.color}44, transparent)`,
                                            animation: 'spin 2s linear infinite',
                                            pointerEvents: 'none'
                                        }} />
                                        <Check size={26} color="white" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))', position: 'relative', zIndex: 1 }} />
                                        <span style={{
                                            fontSize: 'clamp(0.5rem, 1.2vh, 0.7rem)',
                                            color: 'white',
                                            fontWeight: '800',
                                            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                                            position: 'relative',
                                            zIndex: 1
                                        }}>
                                            {activeExerciseId === 'planche' || safeSelectedExercise.type === 'timer'
                                                ? `${formatTime(dailyGoal)}/${formatTime(dailyGoal)}`
                                                : `${dailyGoal}/${dailyGoal}`
                                            }
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        {(() => { const I = ICON_MAP[safeSelectedExercise.icon] || Dumbbell; return <I size={22} color={safeSelectedExercise.color} />; })()}
                                        <span style={{ fontSize: 'clamp(0.45rem, 1.2vh, 0.65rem)', color: safeSelectedExercise.color, fontWeight: '700' }}>
                                            {activeExerciseId === 'planche' || safeSelectedExercise.type === 'timer'
                                                ? `${formatTime(currentCount)}/${formatTime(dailyGoal)}`
                                                : `${currentCount}/${dailyGoal}`}
                                        </span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Completion status (under button with spacing) */}
                        {isExerciseDone && (() => {
                            const exData = completions[today]?.[activeExerciseId];
                            const completedAt = exData?.timestamp ? new Date(exData.timestamp) : null;
                            const timeStr = completedAt
                                ? completedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                                : null;
                            return timeStr ? (
                                <div className="scale-in" style={{
                                    color: 'var(--text-secondary)', fontWeight: '500',
                                    marginTop: '8px', opacity: 0.75,
                                    fontSize: 'clamp(0.7rem, 2.8vw, 0.95rem)'
                                }}>
                                    {t('dashboard.doneAt', { time: timeStr })}
                                </div>
                            ) : null;
                        })()}
                    </div>
                </>
            ) : (
                <div className="glass-premium" style={{
                    textAlign: 'center', padding: 'var(--spacing-xl)',
                    borderRadius: 'var(--radius-xl)', maxWidth: '320px'
                }}>
                    <h2 style={{ marginBottom: '12px', fontSize: '1.5rem' }}>{t('dashboard.waiting')}</h2>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                        {t('dashboard.challengeStarts')} <br />
                        <strong style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>{effectiveStart}</strong>
                    </p>
                </div>
            )}
        </div>
    );
});

const ExerciseButton = React.memo(({
    ex, isActive, dayNumber, today, settings,
    getExerciseCount, completions, computedStats, onSelect
}) => {
    const { t } = useTranslation();
    // We import formatTime helper logic directly here or replicate it
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const ExIcon = ICON_MAP[ex.icon] || Dumbbell;
    const exStreak = computedStats.exerciseDoneToday[ex.id]
        ? (computedStats.exerciseCurrentStreaks[ex.id] || 0)
        : (computedStats.exerciseCurrentStreaks[ex.id] > 0 ? computedStats.exerciseCurrentStreaks[ex.id] : 0);
    const exCount = getExerciseCount(today, ex.id);
    const exGoal = getDailyGoal(ex, dayNumber, settings?.difficultyMultiplier);
    const exDone = completions[today]?.[ex.id]?.isCompleted || exCount >= exGoal;

    return (
        <button
            onClick={() => onSelect(ex.id)}
            className="hover-lift"
            style={{
                flex: '1 1 calc(33.333% - 10px)',
                minWidth: 'clamp(70px, 20vw, 100px)',
                maxWidth: '130px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 'clamp(3px, 0.5vh, 6px)',
                padding: 'clamp(8px, 1.2vh, 12px) clamp(6px, 1vw, 10px)',
                borderRadius: 'var(--radius-md)',
                minHeight: 'var(--touch-min)',
                background: exDone
                    ? `linear-gradient(135deg, ${ex.color}20, ${ex.gradient[1]}18)`
                    : isActive
                        ? `linear-gradient(135deg, ${ex.color}28, ${ex.gradient[0]}28)`
                        : 'var(--surface-subtle)',
                border: exDone
                    ? `1.5px solid ${ex.color}66`
                    : isActive
                        ? `1.5px solid ${ex.color}88`
                        : '1.5px solid var(--border-muted)',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                position: 'relative',
                '--done-color': `${ex.color}55`,
                '--done-color-dim': `${ex.color}12`,
                animation: exDone ? 'doneGlow 3s ease-in-out infinite' : 'none',
                boxShadow: exDone ? `0 0 8px ${ex.color}33` : 'none'
            }}
        >
            {/* Done checkmark */}
            {exDone && (
                <div style={{
                    position: 'absolute', top: '-4px', right: '-4px',
                    width: '16px', height: '16px', borderRadius: '50%',
                    background: `linear-gradient(135deg, ${ex.gradient[0]}, ${ex.gradient[1]})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 0 8px ${ex.color}66`,
                    animation: 'checkPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    zIndex: 1
                }}>
                    <span style={{ fontSize: '9px', color: 'white', fontWeight: '700', lineHeight: 1 }}>✓</span>
                </div>
            )}
            <ExIcon
                size={20}
                color={exDone ? ex.color : isActive ? ex.color : 'var(--text-secondary)'}
                style={{ transition: 'color 0.2s ease' }}
            />
            <span style={{
                fontSize: 'clamp(0.6rem, 1.4vh, 0.8rem)', fontWeight: '600',
                color: exDone ? ex.color : isActive ? ex.color : 'var(--text-secondary)',
                textAlign: 'center', lineHeight: '1.1',
                transition: 'color 0.2s ease'
            }}>
                {ex.id.startsWith('custom_') ? (ex.label || ex.name) : t('exercises.' + ex.id)}
            </span>
            <span style={{
                fontSize: 'clamp(0.65rem, 1.5vh, 0.85rem)', fontWeight: '700',
                color: exDone ? ex.color : isActive ? ex.color : 'var(--text-secondary)',
                opacity: exDone ? 1 : isActive ? 1 : 0.6,
                transition: 'color 0.2s ease',
                textDecorationLine: exDone ? 'line-through' : 'none',
                textDecorationColor: `${ex.color}88`
            }}>
                {ex.id === 'planche' || ex.type === 'timer'
                    ? (exDone ? formatTime(exGoal) : `${formatTime(exCount)}/${formatTime(exGoal)}`)
                    : (exDone ? exGoal : `${exCount}/${exGoal}`)
                }
            </span>
            {exStreak > 0 && (
                <span style={{
                    fontSize: 'clamp(0.5rem, 1.1vh, 0.65rem)',
                    color: exDone ? ex.color : isActive ? ex.color : 'var(--text-secondary)',
                    opacity: 0.8
                }}>
                    🔥{exStreak}
                </span>
            )}
        </button>
    );
});

// Shared icon button style — 44px min touch target
const iconBtnStyle = {
    background: 'var(--surface-hover)', width: 'var(--touch-min)', height: 'var(--touch-min)',
    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--text-primary)', border: 'none', cursor: 'pointer', flexShrink: 0
};
