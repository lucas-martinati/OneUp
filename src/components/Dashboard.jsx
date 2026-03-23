import React, { useEffect, useState, useRef, useCallback, useMemo, Suspense, lazy } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import {
    Trophy, Calendar as CalendarIcon, PieChart, Flame, Settings as SettingsIcon,
    Dumbbell, ArrowDownUp, ArrowUp, Zap, ChevronsUp, Footprints, Users, Check, Award,
    Target, TrendingUp, Star, Activity, Play, Square, MoveDown, MoveDiagonal, Shield
} from 'lucide-react';
// Static imports for core/immediate components
import { AchievementToast } from './AchievementToast';
import { CSSConfetti } from './CSSConfetti';
import { NotificationManager } from './NotificationManager';

// Lazy imports for heavy modal-based components
const Calendar = lazy(() => import('./Calendar').then(m => ({ default: m.Calendar })));
const Stats = lazy(() => import('./Stats').then(m => ({ default: m.Stats })));
const Settings = lazy(() => import('./Settings').then(m => ({ default: m.Settings })));
const Counter = lazy(() => import('./Counter').then(m => ({ default: m.Counter })));
const Leaderboard = lazy(() => import('./Leaderboard').then(m => ({ default: m.Leaderboard })));
const Achievements = lazy(() => import('./Achievements').then(m => ({ default: m.Achievements })));
const Timer = lazy(() => import('./Timer').then(m => ({ default: m.Timer })));
const WorkoutSession = lazy(() => import('./WorkoutSession').then(m => ({ default: m.WorkoutSession })));
const ClanModal = lazy(() => import('./ClanModal').then(m => ({ default: m.ClanModal })));

import { sounds, setSoundSettingsGetter } from '../utils/soundManager';
import { getLocalDateStr, isDayDoneFromCompletions } from '../utils/dateUtils';
import { EXERCISES, EXERCISES_MAP, getDailyGoal } from '../config/exercises';
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
    getExerciseDone, pauseCloudSync, resumeCloudSync, computedStats
}) {
    const [today, setToday] = useState(getLocalDateStr(new Date()));
    const [showCalendar, setShowCalendar] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showCounter, setShowCounter] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [showAchievements, setShowAchievements] = useState(false);
    const [showSession, setShowSession] = useState(false);
    const [showClan, setShowClan] = useState(false);
    const [newAchievement, setNewAchievement] = useState(null);
    const [selectedExerciseId, setSelectedExerciseId] = useState('pushups');
    const [numberKey, setNumberKey] = useState(0);
    const [isCounterTransitioning, setIsCounterTransitioning] = useState(false);
    const [prevDayNumber, setPrevDayNumber] = useState(null);
    const [showDayConfetti, setShowDayConfetti] = useState(false);

    const handleSelectExercise = useCallback((exerciseId) => {
        setSelectedExerciseId(exerciseId);
    }, []);

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
            setNewAchievement({ id: 'new_badge', title: 'Nouveau Succès !', color: '#fbbf24', icon: Award });
        }

        prevBadgeCountRef.current = newCount;
    }, [computedStats.badgeCount]);

    const dayNumber = useMemo(() => getDayNumber(today), [getDayNumber, today]);
    const selectedExercise = useMemo(() => EXERCISES_MAP[selectedExerciseId], [selectedExerciseId]);

    // Goal = ceil(dayNumber * multiplier * difficultyMultiplier), minimum 1
    const dailyGoal = useMemo(() =>
        getDailyGoal(selectedExercise, dayNumber, settings?.difficultyMultiplier),
        [selectedExercise, dayNumber, settings?.difficultyMultiplier]
    );

    const currentCount = getExerciseCount(today, selectedExerciseId);
    const isExerciseDone = useMemo(() =>
        completions[today]?.[selectedExerciseId]?.isCompleted || currentCount >= dailyGoal,
        [completions, today, selectedExerciseId, currentCount, dailyGoal]
    );
    const isDayComplete = useMemo(() =>
        isDayDoneFromCompletions(completions, today),
        [completions, today]
    );

    const totalReps = computedStats.exerciseReps[selectedExerciseId] || 0;

    const effectiveStart = userStartDate || startDate;
    const isFuture = today < effectiveStart;

    // Pre-computed streaks from computedStats
    const exerciseStreak = computedStats.exerciseDoneToday[selectedExerciseId]
        ? computedStats.exerciseCurrentStreaks[selectedExerciseId]
        : (computedStats.exerciseCurrentStreaks[selectedExerciseId] > 0 ? computedStats.exerciseCurrentStreaks[selectedExerciseId] : 0);

    // Duolingo-style streak from computedStats
    const displayStreak = computedStats.displayStreak;
    const streakActive = computedStats.streakActive;

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
    }, [showCounter, showCalendar, showStats, showSettings, showLeaderboard, showAchievements, showSession, showClan, resumeCloudSync]);

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
                    alignItems: 'center', justifyContent: 'space-evenly', gap: 'clamp(4px, 0.8vh, 12px)',
                    minHeight: 0
                }}>
                    {!isFuture ? (
                        <>
                            {/* Day & Goal Hero Section */}
                            <div style={{ textAlign: 'center', position: 'relative' }}>
                                <div style={{
                                    fontSize: 'clamp(0.75rem, 1.6vh, 1rem)', color: 'var(--text-secondary)',
                                    textTransform: 'uppercase', letterSpacing: '4px',
                                    marginBottom: '2px', fontWeight: '700'
                                }}>
                                    Jour
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
                                {EXERCISES.map(ex => (
                                    <ExerciseButton
                                        key={ex.id}
                                        ex={ex}
                                        isActive={ex.id === selectedExerciseId}
                                        dayNumber={dayNumber}
                                        today={today}
                                        settings={settings}
                                        getExerciseCount={getExerciseCount}
                                        completions={completions}
                                        computedStats={computedStats}
                                        onSelect={handleSelectExercise}
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
                                            stroke={`url(#dashGrad-${selectedExerciseId})`}
                                            strokeWidth="3.5"
                                            strokeDasharray={2 * Math.PI * 42}
                                            strokeDashoffset={2 * Math.PI * 42 - (progress / 100) * 2 * Math.PI * 42}
                                            strokeLinecap="round"
                                            transform="rotate(-90 50 50)"
                                        />
                                        <defs>
                                            <linearGradient id={`dashGrad-${selectedExerciseId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor={selectedExercise.gradient[0]} />
                                                <stop offset="100%" stopColor={selectedExercise.gradient[1]} />
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
                                                ? `linear-gradient(135deg, ${selectedExercise.color} 0%, ${selectedExercise.gradient[1]} 100%)`
                                                : 'transparent',
                                            border: isExerciseDone ? 'none' : `2.5px solid ${selectedExercise.color}`,
                                            display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', justifyContent: 'center', gap: '1px',
                                            transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                            willChange: 'transform',
                                            transform: isExerciseDone ? 'scale(1.1)' : 'scale(1)',
                                            boxShadow: isExerciseDone
                                                ? `0 0 50px ${selectedExercise.color}aa, 0 8px 30px ${selectedExercise.color}55, 0 0 0 4px ${selectedExercise.color}33, inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.1)`
                                                : `0 0 16px ${selectedExercise.color}33`,
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
                                                    background: `conic-gradient(from 0deg, transparent, ${selectedExercise.color}44, transparent, ${selectedExercise.color}44, transparent)`,
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
                                                    {selectedExerciseId === 'planche'
                                                        ? `${formatTime(dailyGoal)}/${formatTime(dailyGoal)}`
                                                        : `${dailyGoal}/${dailyGoal}`
                                                    }
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                {(() => { const I = ICON_MAP[selectedExercise.icon] || Dumbbell; return <I size={22} color={selectedExercise.color} />; })()}
                                                <span style={{ fontSize: 'clamp(0.45rem, 1.2vh, 0.65rem)', color: selectedExercise.color, fontWeight: '700' }}>
                                                    {selectedExerciseId === 'planche'
                                                        ? `${formatTime(currentCount)}/${formatTime(dailyGoal)}`
                                                        : `${currentCount}/${dailyGoal}`}
                                                </span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Completion status (under button with spacing) */}
                                {isExerciseDone && (() => {
                                    const exData = completions[today]?.[selectedExerciseId];
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
                                            Fait à {timeStr}
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
                            <h2 style={{ marginBottom: '12px', fontSize: '1.5rem' }}>⏳ En attente</h2>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                                Ton défi commence le <br />
                                <strong style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>{effectiveStart}</strong>
                            </p>
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
                        Calendrier
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
                        Séance
                    </button>
                </div>

                {/* Modals */}
                <Suspense fallback={null}>
                    {showCalendar && (
                        <Calendar
                            startDate={startDate}
                            completions={completions}
                            exercises={EXERCISES}
                            getDayNumber={getDayNumber}
                            onClose={() => setShowCalendar(false)}
                            settings={settings}
                        />
                    )}
                    {showStats && (
                        <Stats
                            completions={completions}
                            exercises={EXERCISES}
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
                        />
                    )}
                    {showCounter && selectedExerciseId !== 'planche' && (
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
                    {showCounter && selectedExerciseId === 'planche' && (
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
                </Suspense>
            </div>
        </>
    );
}

// Memoized exercise button to avoid re-rendering all 10 exercises when one changes
const ExerciseButton = React.memo(({
    ex, isActive, dayNumber, today, settings,
    getExerciseCount, completions, computedStats, onSelect
}) => {
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
                {ex.label}
            </span>
            <span style={{
                fontSize: 'clamp(0.65rem, 1.5vh, 0.85rem)', fontWeight: '700',
                color: exDone ? ex.color : isActive ? ex.color : 'var(--text-secondary)',
                opacity: exDone ? 1 : isActive ? 1 : 0.6,
                transition: 'color 0.2s ease',
                textDecorationLine: exDone ? 'line-through' : 'none',
                textDecorationColor: `${ex.color}88`
            }}>
                {ex.id === 'planche'
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
