import { useEffect, useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { App as CapacitorApp } from '@capacitor/app';
import {
    Trophy, Calendar as CalendarIcon, PieChart, Flame, Settings as SettingsIcon,
    Dumbbell, ArrowDownUp, ArrowUp, Zap, ChevronsUp, Footprints, Users
} from 'lucide-react';
import { Calendar } from './Calendar';
import { Stats } from './Stats';
import { Settings } from './Settings';
import { Counter } from './Counter';
import { Leaderboard } from './Leaderboard';

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
    const [selectedExerciseId, setSelectedExerciseId] = useState('pushups');
    const [numberKey, setNumberKey] = useState(0);
    const [isCounterTransitioning, setIsCounterTransitioning] = useState(false);
    const [prevDayNumber, setPrevDayNumber] = useState(null);

    useEffect(() => {
        setSoundSettingsGetter(() => settings);
    }, [settings]);

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
    }, [showCounter, showCalendar, showStats, showSettings, showLeaderboard, resumeCloudSync]);

    const handleSaveSettings = (newSettings) => {
        updateSettings(newSettings);
        if (scheduleNotification) scheduleNotification(newSettings);
    };

    // Progress circle for year (day X / 365)
    const circumference = 2 * Math.PI * 45;
    const progress = (dayNumber / 365) * 100;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
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
                        <div style={{ textAlign: 'center' }}>
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

                            {/* Prominent daily goal badge */}
                            <div className="glass-premium" style={{
                                display: 'inline-flex', alignItems: 'center', gap: 'clamp(6px, 1.5vw, 12px)',
                                padding: 'clamp(6px, 1vh, 12px) clamp(14px, 3vw, 24px)', borderRadius: 'var(--radius-lg)',
                                background: `linear-gradient(135deg, ${selectedExercise.color}18, ${selectedExercise.gradient[0]}18)`,
                                border: `1px solid ${selectedExercise.color}33`,
                                boxShadow: `0 2px 12px ${selectedExercise.color}22`
                            }}>
                                {(() => { const I = ICON_MAP[selectedExercise.icon] || Dumbbell; return <I size={20} color={selectedExercise.color} />; })()}
                                <span style={{
                                    fontSize: 'clamp(1.1rem, 4.5vw, 1.6rem)', fontWeight: '800',
                                    color: selectedExercise.color
                                }}>
                                    {dailyGoal}
                                </span>
                                <span style={{
                                    fontSize: 'clamp(0.8rem, 3.2vw, 1.05rem)', color: 'var(--text-secondary)', fontWeight: '500'
                                }}>
                                    {selectedExercise.label.toLowerCase()} aujourd'hui
                                </span>
                            </div>
                        </div>

                        {/* ── Exercise Selector ── */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: 'clamp(6px, 1.2vw, 12px)', width: '100%', maxWidth: '400px'
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
                                            display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', gap: 'clamp(2px, 0.5vh, 6px)',
                                            padding: 'clamp(8px, 1.2vh, 14px) clamp(6px, 1vw, 10px)', borderRadius: 'var(--radius-md)',
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
                                            {exGoal}
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
                                            ? `linear-gradient(135deg, ${selectedExercise.gradient[0]}, ${selectedExercise.gradient[1]})`
                                            : 'transparent',
                                        border: isExerciseDone ? 'none' : `2.5px solid ${selectedExercise.color}`,
                                        display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', justifyContent: 'center', gap: '1px',
                                        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                        transform: isExerciseDone ? 'scale(1.05)' : 'scale(1)',
                                        boxShadow: isExerciseDone
                                            ? `0 0 30px ${selectedExercise.color}66, 0 4px 16px ${selectedExercise.color}33`
                                            : `0 0 16px ${selectedExercise.color}33`,
                                        cursor: 'pointer',
                                        position: 'relative'
                                    }}
                                >
                                    {isExerciseDone ? (
                                        <>
                                            {(() => { const I = ICON_MAP[selectedExercise.icon] || Dumbbell; return <I size={22} color="white" />; })()}
                                            <span style={{ fontSize: 'clamp(0.5rem, 1.2vh, 0.7rem)', color: 'white', fontWeight: '700' }}>{dailyGoal}/{dailyGoal}</span>
                                        </>
                                    ) : (
                                        <>
                                            {(() => { const I = ICON_MAP[selectedExercise.icon] || Dumbbell; return <I size={22} color={selectedExercise.color} />; })()}
                                            <span style={{ fontSize: 'clamp(0.5rem, 1.2vh, 0.7rem)', color: selectedExercise.color, fontWeight: '700' }}>{currentCount}/{dailyGoal}</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Completion status (directly under button, no gap) */}
                            {isExerciseDone && (() => {
                                const exData = completions[today]?.[selectedExerciseId];
                                const completedAt = exData?.timestamp ? new Date(exData.timestamp) : null;
                                const timeStr = completedAt
                                    ? completedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                                    : null;
                                return (
                                <div className="scale-in" style={{
                                    color: selectedExercise.color, fontWeight: '700',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px'
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

                        {/* Streak for selected exercise */}
                        {exerciseStreak > 0 && (
                            <div className="glass-premium slide-up" style={{
                                padding: 'clamp(6px, 1vh, 14px) clamp(14px, 2.5vw, 24px)', borderRadius: 'var(--radius-lg)',
                                display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.2vw, 14px)',
                                background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(249,115,22,0.15))',
                                boxShadow: '0 2px 12px rgba(239,68,68,0.2)',
                                border: '1px solid rgba(249,115,22,0.25)'
                            }}>
                                <Flame size={24} color="#f97316" className="pulse-glow" />
                                <div>
                                    <div style={{ fontSize: 'clamp(0.65rem, 1.4vh, 0.85rem)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '600' }}>
                                        Série — {selectedExercise.label}
                                    </div>
                                    <div style={{ fontSize: 'clamp(1.1rem, 2.5vh, 1.8rem)', fontWeight: '800', color: '#f97316' }}>
                                        {exerciseStreak} {exerciseStreak === 1 ? 'jour' : 'jours'}
                                    </div>
                                </div>
                            </div>
                        )}
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
            {showCounter && (
                <Counter
                    exerciseConfig={selectedExercise}
                    onClose={() => { setShowCounter(false); resumeCloudSync?.(); }}
                    dailyGoal={dailyGoal}
                    currentCount={currentCount}
                    onUpdateCount={(newCount) => updateExerciseCount(today, selectedExerciseId, newCount, dailyGoal)}
                    isCompleted={isExerciseDone}
                />
            )}
            {showLeaderboard && (
                <Leaderboard
                    onClose={() => setShowLeaderboard(false)}
                    cloudSync={cloudSync}
                />
            )}
        </div>
    );
}

// Shared icon button style
const iconBtnStyle = {
    background: 'var(--surface-hover)', width: '38px', height: '38px',
    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--text-primary)', border: 'none', cursor: 'pointer'
};
