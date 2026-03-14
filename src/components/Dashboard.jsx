import { useEffect, useState, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { App as CapacitorApp } from '@capacitor/app';
import {
    Trophy, Calendar as CalendarIcon, PieChart, Flame, Settings as SettingsIcon,
    Dumbbell, ArrowDownUp, ArrowUp, Zap, ChevronsUp, Footprints, Users, Check, Award,
    Target, TrendingUp, Star, Activity
} from 'lucide-react';
import { Calendar } from './Calendar';
import { Stats } from './Stats';
import { Settings } from './Settings';
import { Counter } from './Counter';
import { Leaderboard } from './Leaderboard';
import { Achievements } from './Achievements';
import { Timer } from './Timer';
import { AchievementToast } from './AchievementToast';

import { sounds, setSoundSettingsGetter } from '../utils/soundManager';
import { getLocalDateStr, calculateStreak, calculateExerciseStreak, isDayDoneFromCompletions } from '../utils/dateUtils';
import { EXERCISES, EXERCISES_MAP } from '../config/exercises';

// Map icon name → lucide component
const ICON_MAP = { Dumbbell, ArrowDownUp, ArrowUp, Zap, ChevronsUp, Footprints };

// Utility to clean up confetti canvas (fixes Android Pixel bug)
const resetConfetti = () => {
    try { confetti.reset(); } catch (e) { console.warn('Confetti reset error:', e); }
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
        try {
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (canvas.style.position === 'fixed' || canvas.style.position === 'absolute') {
                canvas.remove();
            }
        } catch (e) { console.error('Canvas cleanup error:', e); }
    });
};

export function Dashboard({
    getDayNumber, toggleCompletion, completions, startDate, userStartDate,
    scheduleNotification, cloudAuth, cloudSync, settings, updateSettings,
    conflictData, onResolveConflict, getExerciseCount, updateExerciseCount, getTotalReps,
    getExerciseDone, pauseCloudSync, resumeCloudSync
}) {
    const [today, setToday] = useState(getLocalDateStr(new Date()));
    const [showCalendar, setShowCalendar] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showCounter, setShowCounter] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [showAchievements, setShowAchievements] = useState(false);
    const [newAchievement, setNewAchievement] = useState(null);
    const [selectedExerciseId, setSelectedExerciseId] = useState('pushups');
    const [numberKey, setNumberKey] = useState(0);
    const [isCounterTransitioning, setIsCounterTransitioning] = useState(false);
    const [prevDayNumber, setPrevDayNumber] = useState(null);

    useEffect(() => {
        setSoundSettingsGetter(() => settings);
    }, [settings]);

    // Achievement detection
    const prevCompletionsRef = useRef(completions);
    useEffect(() => {
        const prev = prevCompletionsRef.current;
        const totalDays = Object.keys(completions).filter(d => isDayDoneFromCompletions(completions, d)).length;
        const prevDays = Object.keys(prev).filter(d => isDayDoneFromCompletions(prev, d)).length;

        let maxStreak = 0, temp = 0;
        for (let i = 0; i < 365; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            if (isDayDoneFromCompletions(completions, getLocalDateStr(d))) { temp++; if (temp > maxStreak) maxStreak = temp; }
            else temp = 0;
        }

        let prevStreak = 0, temp2 = 0;
        for (let i = 0; i < 365; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            if (isDayDoneFromCompletions(prev, getLocalDateStr(d))) { temp2++; if (temp2 > prevStreak) prevStreak = temp2; }
            else temp2 = 0;
        }

        let totalReps = 0;
        for (const date in completions) {
            for (const exId in completions[date]) {
                if (completions[date][exId]?.isCompleted) {
                    const ex = EXERCISES.find(e => e.id === exId);
                    if (ex) {
                        const d = new Date(date);
                        const dayNum = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 1)) / (1000 * 60 * 60 * 24)) + 1;
                        totalReps += Math.max(1, Math.ceil(dayNum * ex.multiplier));
                    }
                }
            }
        }

        let prevReps = 0;
        for (const date in prev) {
            for (const exId in prev[date]) {
                if (prev[date][exId]?.isCompleted) {
                    const ex = EXERCISES.find(e => e.id === exId);
                    if (ex) {
                        const d = new Date(date);
                        const dayNum = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 1)) / (1000 * 60 * 60 * 24)) + 1;
                        prevReps += Math.max(1, Math.ceil(dayNum * ex.multiplier));
                    }
                }
            }
        }

        let perfectDays = 0;
        for (const date in completions) {
            const allDone = EXERCISES.every(ex => completions[date]?.[ex.id]?.isCompleted);
            if (allDone) perfectDays++;
        }
        let prevPerfect = 0;
        for (const date in prev) {
            const allDone = EXERCISES.every(ex => prev[date]?.[ex.id]?.isCompleted);
            if (allDone) prevPerfect++;
        }

        const newBadges = [];
        if (totalDays >= 1 && prevDays < 1) newBadges.push({ id: 'first_blood', title: 'Premier Pas', color: '#3b82f6', icon: Target });
        if (maxStreak >= 3 && prevStreak < 3) newBadges.push({ id: 'consistent', title: 'Régularité', color: '#f97316', icon: Flame });
        if (maxStreak >= 7 && prevStreak < 7) newBadges.push({ id: 'week_warrior', title: 'Guerrier de la Semaine', color: '#8b5cf6', icon: CalendarIcon });
        if (maxStreak >= 14 && prevStreak < 14) newBadges.push({ id: 'two_weeks', title: 'Ténacité', color: '#06b6d4', icon: TrendingUp });
        if (maxStreak >= 30 && prevStreak < 30) newBadges.push({ id: 'month_warrior', title: 'Soldat du Mois', color: '#eab308', icon: Zap });
        if (totalDays >= 10 && prevDays < 10) newBadges.push({ id: 'ten_sessions', title: 'Dix de der', color: '#22c55e', icon: Star });
        if (totalDays >= 50 && prevDays < 50) newBadges.push({ id: 'fifty_sessions', title: 'Cinquante', color: '#14b8a6', icon: Award });
        if (totalDays >= 100 && prevDays < 100) newBadges.push({ id: 'hundred_sessions', title: 'Centurion', color: '#f472b6', icon: Trophy });
        if (totalReps >= 500 && prevReps < 500) newBadges.push({ id: 'rep_500', title: '500 Répétitions', color: '#ef4444', icon: Activity });
        if (totalReps >= 1000 && prevReps < 1000) newBadges.push({ id: 'rep_1000', title: 'Millier', color: '#facc15', icon: Zap });
        if (perfectDays >= 1 && prevPerfect < 1) newBadges.push({ id: 'perfect_one', title: 'Premier Jour Parfait', color: '#22d3d1', icon: Star });

        if (newBadges.length > 0) {
            setTimeout(() => {
                setNewAchievement(newBadges[newBadges.length - 1]);
            }, 100);
        }

        prevCompletionsRef.current = completions;
    }, [completions]);

    // Helper for time formatting
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const dayNumber = getDayNumber(today);
    const selectedExercise = EXERCISES_MAP[selectedExerciseId];

    // Goal = ceil(dayNumber * multiplier), minimum 1
    const dailyGoal = Math.max(1, Math.ceil(dayNumber * selectedExercise.multiplier));

    const currentCount = getExerciseCount(today, selectedExerciseId);
    const isExerciseDone = completions[today]?.[selectedExerciseId]?.isCompleted || currentCount >= dailyGoal;
    const isDayComplete = isDayDoneFromCompletions(completions, today);

    const totalReps = useMemo(() => getTotalReps(selectedExerciseId), [completions, selectedExerciseId]);

    const effectiveStart = userStartDate || startDate;
    const isFuture = today < effectiveStart;

    // Per-exercise streaks
    const exerciseStreak = useMemo(
        () => calculateExerciseStreak(completions, today, selectedExerciseId),
        [completions, today, selectedExerciseId]
    );

    // Global streak (all exercises — consecutive days where ANY exercise is done)
    const globalStreak = useMemo(
        () => calculateStreak(completions, today),
        [completions, today]
    );

    // Duolingo-style streak: if today not done, show yesterday's streak in gray
    const todayDone = isDayDoneFromCompletions(completions, today);
    const yesterdayStreak = useMemo(() => {
        const d = new Date(today);
        d.setDate(d.getDate() - 1);
        return calculateStreak(completions, getLocalDateStr(d));
    }, [completions, today]);
    const displayStreak = todayDone ? globalStreak : yesterdayStreak;
    const streakActive = todayDone;

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

                    const duration = 3000;
                    const animationEnd = Date.now() + duration;
                    const colors = ['#6d28d9', '#8b5cf6', '#0ea5e9', '#f093fb', '#fbbf24', '#10b981'];
                    const frame = () => {
                        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
                        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
                        if (Date.now() < animationEnd) requestAnimationFrame(frame);
                    };
                    frame();

                    setTimeout(() => {
                        setIsCounterTransitioning(false);
                        setPrevDayNumber(null);
                        resetConfetti();
                    }, 4000);
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
            if (showCounter) {
                setShowCounter(false);
                resumeCloudSync?.();
            } else if (showCalendar) {
                setShowCalendar(false);
            } else if (showStats) {
                setShowStats(false);
            } else if (showSettings) {
                setShowSettings(false);
            } else if (showLeaderboard) {
                setShowLeaderboard(false);
            } else if (showAchievements) {
                setShowAchievements(false);
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
    }, [showCounter, showCalendar, showStats, showSettings, showLeaderboard, showAchievements, resumeCloudSync]);

    const handleSaveSettings = (newSettings) => {
        updateSettings(newSettings);
        if (scheduleNotification) scheduleNotification(newSettings);
    };

    // Progress circle for year (day X / 365)
    const circumference = 2 * Math.PI * 45;
    const progress = (dayNumber / 365) * 100;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const handleViewAchievement = () => {
        setShowCounter(false);
        setShowStats(true);
        setTimeout(() => {
            setShowAchievements(true);
        }, 100);
    };

    return (
        <>
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
                    padding: 'clamp(10px, 1.5vh, 16px) clamp(10px, 2vw, 16px)', borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-md)', minWidth: 0
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flexShrink: 1, overflow: 'hidden' }}>
                        <img
                            src={`${import.meta.env.BASE_URL}pwa-192x192.png`} alt="OneUp Logo"
                            className="bounce-on-hover"
                            style={{ width: 'clamp(28px, 4vh, 40px)', height: 'clamp(28px, 4vh, 40px)', flexShrink: 0, borderRadius: '10px', objectFit: 'cover', cursor: 'pointer', transition: 'transform 0.3s ease' }}
                        />
                        <span style={{ fontWeight: '600', fontSize: 'clamp(0.8rem, 1.8vh, 1.1rem)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>OneUp</span>
                    </div>

                    <div style={{ display: 'flex', gap: 'clamp(4px, 0.8vw, 8px)', alignItems: 'center', flexShrink: 1, minWidth: 0 }}>
                        <button onClick={() => setShowSettings(true)} className="hover-lift" style={iconBtnStyle}>
                            <SettingsIcon size={19} />
                        </button>
                        <button onClick={() => setShowStats(true)} className="hover-lift" style={iconBtnStyle}>
                            <PieChart size={19} />
                        </button>
                        <button onClick={() => setShowLeaderboard(true)} className="hover-lift" style={iconBtnStyle}>
                            <Users size={19} />
                        </button>

                        {/* Global streak badge — Duolingo style: gray if not done today */}
                        <div className="glass-premium" style={{
                            background: streakActive
                                ? 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(239,68,68,0.15))'
                                : 'linear-gradient(135deg, rgba(120,120,120,0.12), rgba(90,90,90,0.12))',
                            padding: 'clamp(4px, 0.7vh, 8px) clamp(8px, 1.2vw, 14px)', borderRadius: '16px', fontSize: 'clamp(0.75rem, 1.6vh, 0.95rem)',
                            display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '700',
                            border: streakActive ? '1px solid rgba(249,115,22,0.3)' : '1px solid rgba(120,120,120,0.25)',
                            boxShadow: streakActive ? '0 2px 8px rgba(249,115,22,0.15)' : 'none',
                            opacity: streakActive ? 1 : 0.7
                        }}>
                            <Flame size={16} color={streakActive ? '#f97316' : '#888'} />
                            <span style={{ color: streakActive ? '#f97316' : '#888' }}>{displayStreak}</span>
                        </div>

                        {/* Total reps badge */}
                        <div className="glass-premium shimmer" style={{
                            background: `linear-gradient(135deg, ${selectedExercise.color}22, ${selectedExercise.gradient[0]}22)`,
                            padding: 'clamp(4px, 0.7vh, 8px) clamp(8px, 1.2vw, 14px)', borderRadius: '16px', fontSize: 'clamp(0.75rem, 1.6vh, 0.95rem)',
                            display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600',
                            boxShadow: `0 2px 8px ${selectedExercise.color}33`
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
                            <div style={{
                                display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
                                gap: 'clamp(6px, 1.2vw, 10px)', width: '100%', maxWidth: '600px',
                                padding: '2px'
                            }}>
                                {EXERCISES.map(ex => {
                                    const ExIcon = ICON_MAP[ex.icon] || Dumbbell;
                                    const isActive = ex.id === selectedExerciseId;
                                    const exStreak = calculateExerciseStreak(completions, today, ex.id);
                                    const exCount = getExerciseCount(today, ex.id);
                                    const exGoal = Math.max(1, Math.ceil(dayNumber * ex.multiplier));
                                    const exDone = completions[today]?.[ex.id]?.isCompleted || exCount >= exGoal;
                                    return (
                                        <button
                                            key={ex.id}
                                            onClick={() => setSelectedExerciseId(ex.id)}
                                            className="hover-lift"
                                            style={{
                                                flex: '1 1 calc(33.333% - 10px)',
                                                minWidth: 'clamp(70px, 20vw, 100px)',
                                                maxWidth: '120px',
                                                display: 'flex', flexDirection: 'column',
                                                alignItems: 'center', gap: 'clamp(2px, 0.4vh, 4px)',
                                                padding: 'clamp(6px, 1vh, 10px) clamp(4px, 0.8vw, 8px)', borderRadius: 'var(--radius-md)',
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
                                                textDecoration: exDone ? 'line-through' : 'none',
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
                                })}
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
                                            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
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
                                    return (
                                        <div className="scale-in" style={{
                                            color: selectedExercise.color, fontWeight: '700',
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                                            marginTop: '8px'
                                        }}>
                                            <span style={{ fontSize: 'clamp(0.95rem, 3.8vw, 1.35rem)', textAlign: 'center', lineHeight: 1.3 }}>
                                                {selectedExercise.label} complété{isDayComplete ? ' — Journée validée !' : ''}
                                            </span>
                                            {timeStr && (
                                                <span style={{
                                                    fontSize: 'clamp(0.7rem, 2.8vw, 0.95rem)', color: 'var(--text-secondary)',
                                                    fontWeight: '500', opacity: 0.75
                                                }}>
                                                    Fait à {timeStr}
                                                </span>
                                            )}
                                        </div>
                                    );
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

                {/* Calendar Button */}
                <button
                    onClick={() => setShowCalendar(true)}
                    className="glass hover-lift gradient-button"
                    style={{
                        width: '100%', padding: 'clamp(12px, 1.8vh, 18px)', borderRadius: 'var(--radius-lg)',
                        color: 'var(--text-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '8px', fontSize: 'clamp(0.85rem, 1.8vh, 1.05rem)', fontWeight: '600', border: 'none', cursor: 'pointer',
                        background: `linear-gradient(135deg, ${selectedExercise.color}28, ${selectedExercise.gradient[0]}28)`,
                        boxShadow: 'var(--shadow-md)'
                    }}
                >
                    <CalendarIcon size={18} />
                    Ouvrir le Calendrier
                </button>

                {/* Modals */}
                {showCalendar && (
                    <Calendar
                        startDate={startDate}
                        completions={completions}
                        exercises={EXERCISES}
                        getDayNumber={getDayNumber}
                        onClose={() => setShowCalendar(false)}
                    />
                )}
                {showStats && (
                    <Stats
                        completions={completions}
                        exercises={EXERCISES}
                        onClose={() => setShowStats(false)}
                        onOpenAchievements={() => { setShowAchievements(true); }}
                        highlightedBadgeId={newAchievement?.id}
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
                        highlightedBadgeId={newAchievement?.id}
                    />
                )}
            </div>
        </>
    );
}

// Shared icon button style
const iconBtnStyle = {
    background: 'var(--surface-hover)', width: '38px', height: '38px',
    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--text-primary)', border: 'none', cursor: 'pointer'
};
