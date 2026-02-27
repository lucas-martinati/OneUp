import { useEffect, useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
    Trophy, Calendar as CalendarIcon, PieChart, Flame, Settings as SettingsIcon,
    Dumbbell, ArrowDownUp, ArrowUp, Zap
} from 'lucide-react';
import { Calendar } from './Calendar';
import { Stats } from './Stats';
import { Settings } from './Settings';
import { Counter } from './Counter';

import { sounds, setSoundSettingsGetter } from '../utils/soundManager';
import { getLocalDateStr, calculateStreak, calculateExerciseStreak, isDayDoneFromCompletions } from '../utils/dateUtils';
import { EXERCISES, EXERCISES_MAP } from '../config/exercises';

// Map icon name → lucide component
const ICON_MAP = { Dumbbell, ArrowDownUp, ArrowUp, Zap };

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
    getExerciseDone
}) {
    const [today, setToday] = useState(getLocalDateStr(new Date()));
    const [showCalendar, setShowCalendar] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showCounter, setShowCounter] = useState(false);
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
            gap: 'var(--spacing-md)', paddingBottom: 'var(--spacing-lg)'
        }}>
            {/* ── Header ── */}
            <header className="glass" style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-md)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                        src="/pwa-512x512.png" alt="OneUp Logo"
                        className="bounce-on-hover"
                        style={{ width: '40px', height: '40px', borderRadius: '12px', objectFit: 'cover', cursor: 'pointer', transition: 'transform 0.3s ease' }}
                    />
                    <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>OneUp</span>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button onClick={() => setShowSettings(true)} className="hover-lift" style={iconBtnStyle}>
                        <SettingsIcon size={18} />
                    </button>
                    <button onClick={() => setShowStats(true)} className="hover-lift" style={iconBtnStyle}>
                        <PieChart size={18} />
                    </button>

                    {/* Global streak badge */}
                    {globalStreak > 0 && (
                        <div className="glass-premium" style={{
                            background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(239,68,68,0.15))',
                            padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem',
                            display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '700',
                            boxShadow: '0 4px 12px rgba(249,115,22,0.25)',
                            border: '1px solid rgba(249,115,22,0.3)'
                        }}>
                            <Flame size={16} color="#f97316" />
                            <span style={{ color: '#f97316' }}>{globalStreak}</span>
                        </div>
                    )}

                    {/* Total reps badge — colours match selected exercise */}
                    <div className="glass-premium shimmer" style={{
                        background: `linear-gradient(135deg, ${selectedExercise.color}22, ${selectedExercise.gradient[0]}22)`,
                        padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem',
                        display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600',
                        boxShadow: `0 4px 12px ${selectedExercise.color}33`
                    }}>
                        <Trophy size={16} color={selectedExercise.color} />
                        <span>{totalReps}</span>
                    </div>
                </div>
            </header>

            {/* ── Main ── */}
            <main style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-md)'
            }}>
                {!isFuture ? (
                    <>
                        {/* Day & Goal Hero Section */}
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                fontSize: '0.85rem', color: 'var(--text-secondary)',
                                textTransform: 'uppercase', letterSpacing: '3px',
                                marginBottom: '4px', fontWeight: '600'
                            }}>
                                Jour
                            </div>

                            {/* Big animated day number */}
                            <div style={{
                                position: 'relative', height: '5.5rem', overflow: 'hidden',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '6px'
                            }}>
                                {isCounterTransitioning && prevDayNumber && (
                                    <div className="rainbow-gradient" style={{
                                        position: 'absolute', fontSize: '5rem', fontWeight: '800', lineHeight: 1,
                                        animation: 'rainbowFlow 6s ease infinite, counterSlideDown 1s ease-out forwards'
                                    }}>
                                        {prevDayNumber}
                                    </div>
                                )}
                                <div
                                    key={isCounterTransitioning ? `new-${dayNumber}` : numberKey}
                                    className="rainbow-gradient"
                                    style={{
                                        fontSize: '5rem', fontWeight: '800', lineHeight: 1,
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
                                display: 'inline-flex', alignItems: 'center', gap: '8px',
                                padding: '8px 20px', borderRadius: 'var(--radius-lg)',
                                background: `linear-gradient(135deg, ${selectedExercise.color}18, ${selectedExercise.gradient[0]}18)`,
                                border: `1px solid ${selectedExercise.color}33`,
                                boxShadow: `0 2px 12px ${selectedExercise.color}22`
                            }}>
                                {(() => { const I = ICON_MAP[selectedExercise.icon] || Dumbbell; return <I size={18} color={selectedExercise.color} />; })()}
                                <span style={{
                                    fontSize: '1.3rem', fontWeight: '700',
                                    color: selectedExercise.color
                                }}>
                                    {dailyGoal}
                                </span>
                                <span style={{
                                    fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500'
                                }}>
                                    {selectedExercise.label.toLowerCase()} aujourd'hui
                                </span>
                            </div>
                        </div>

                        {/* ── Exercise Selector ── */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '8px', width: '100%', maxWidth: '360px'
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
                                            alignItems: 'center', gap: '4px',
                                            padding: '10px 6px', borderRadius: 'var(--radius-md)',
                                            background: isActive
                                                ? `linear-gradient(135deg, ${ex.color}28, ${ex.gradient[0]}28)`
                                                : 'rgba(255,255,255,0.04)',
                                            border: isActive
                                                ? `1.5px solid ${ex.color}88`
                                                : '1.5px solid rgba(255,255,255,0.06)',
                                            cursor: 'pointer',
                                            transition: 'all 0.25s ease',
                                            position: 'relative'
                                        }}
                                    >
                                        {/* Done indicator */}
                                        {exDone && (
                                            <div style={{
                                                position: 'absolute', top: '4px', right: '4px',
                                                width: '8px', height: '8px', borderRadius: '50%',
                                                background: ex.color,
                                                boxShadow: `0 0 6px ${ex.color}`
                                            }} />
                                        )}
                                        <ExIcon
                                            size={20}
                                            color={isActive ? ex.color : 'var(--text-secondary)'}
                                            style={{ transition: 'color 0.2s ease' }}
                                        />
                                        <span style={{
                                            fontSize: '0.65rem', fontWeight: '600',
                                            color: isActive ? ex.color : 'var(--text-secondary)',
                                            textAlign: 'center', lineHeight: '1.2',
                                            transition: 'color 0.2s ease'
                                        }}>
                                            {ex.label}
                                        </span>
                                        <span style={{
                                            fontSize: '0.7rem', fontWeight: '700',
                                            color: isActive ? ex.color : 'var(--text-secondary)',
                                            opacity: isActive ? 1 : 0.6,
                                            transition: 'color 0.2s ease'
                                        }}>
                                            {exGoal}
                                        </span>
                                        {exStreak > 0 && (
                                            <span style={{
                                                fontSize: '0.6rem',
                                                color: isActive ? ex.color : 'var(--text-secondary)',
                                                opacity: 0.8
                                            }}>
                                                🔥{exStreak}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* ── Progress ring + Counter open button ── */}
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            {/* Year progress ring */}
                            <svg width="120" height="120" style={{ position: 'absolute', top: '-10px', left: '-10px' }}>
                                <circle cx="60" cy="60" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                                <circle
                                    className="progress-ring-circle"
                                    cx="60" cy="60" r="45" fill="none"
                                    stroke={`url(#dashGrad-${selectedExerciseId})`}
                                    strokeWidth="4"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                    transform="rotate(-90 60 60)"
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
                                onClick={() => setShowCounter(true)}
                                className="ripple"
                                style={{
                                    width: '100px', height: '100px', borderRadius: '50%',
                                    background: isExerciseDone
                                        ? `linear-gradient(135deg, ${selectedExercise.gradient[0]}, ${selectedExercise.gradient[1]})`
                                        : 'transparent',
                                    border: isExerciseDone ? 'none' : `3px solid ${selectedExercise.color}`,
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center', gap: '2px',
                                    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                    transform: isExerciseDone ? 'scale(1.1)' : 'scale(1)',
                                    boxShadow: isExerciseDone
                                        ? `0 0 40px ${selectedExercise.color}66, 0 4px 20px ${selectedExercise.color}33`
                                        : `0 0 20px ${selectedExercise.color}33`,
                                    cursor: 'pointer',
                                    position: 'relative'
                                }}
                            >
                                {isExerciseDone ? (
                                    <>
                                        {(() => { const I = ICON_MAP[selectedExercise.icon] || Dumbbell; return <I size={28} color="white" />; })()}
                                        <span style={{ fontSize: '0.65rem', color: 'white', fontWeight: '700' }}>{dailyGoal}/{dailyGoal}</span>
                                    </>
                                ) : (
                                    <>
                                        {(() => { const I = ICON_MAP[selectedExercise.icon] || Dumbbell; return <I size={28} color={selectedExercise.color} />; })()}
                                        <span style={{ fontSize: '0.65rem', color: selectedExercise.color, fontWeight: '700' }}>{currentCount}/{dailyGoal}</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Completion status */}
                        {isExerciseDone && (
                            <div className="scale-in" style={{
                                color: selectedExercise.color, fontWeight: '600',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
                            }}>
                                <span style={{ fontSize: '1rem' }}>
                                    ✨ {selectedExercise.label} complété{isDayComplete ? ' — Journée validée !' : ''}
                                </span>
                            </div>
                        )}

                        {/* Streak for selected exercise */}
                        {exerciseStreak > 0 && (
                            <div className="glass-premium slide-up" style={{
                                padding: '10px 20px', borderRadius: 'var(--radius-lg)',
                                display: 'flex', alignItems: 'center', gap: '10px',
                                background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(249,115,22,0.15))',
                                boxShadow: '0 4px 16px rgba(239,68,68,0.2)'
                            }}>
                                <Flame size={24} color="#f97316" className="pulse-glow" />
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        Série — {selectedExercise.label}
                                    </div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f97316' }}>
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
                    width: '100%', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-lg)',
                    color: 'var(--text-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '10px', fontSize: '1rem', fontWeight: '600', border: 'none', cursor: 'pointer',
                    background: `linear-gradient(135deg, ${selectedExercise.color}28, ${selectedExercise.gradient[0]}28)`,
                    boxShadow: 'var(--shadow-md)'
                }}
            >
                <CalendarIcon size={20} />
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
                    onClose={() => setShowCounter(false)}
                    dailyGoal={dailyGoal}
                    currentCount={currentCount}
                    onUpdateCount={(newCount) => updateExerciseCount(today, selectedExerciseId, newCount, dailyGoal)}
                    isCompleted={isExerciseDone}
                />
            )}
        </div>
    );
}

// Shared icon button style
const iconBtnStyle = {
    background: 'rgba(255,255,255,0.1)', width: '36px', height: '36px',
    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--text-primary)', border: 'none', cursor: 'pointer'
};
