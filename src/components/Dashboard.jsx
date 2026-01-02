import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Check, Trophy, Calendar as CalendarIcon, PieChart, Flame, Settings as SettingsIcon } from 'lucide-react';
import { Calendar } from './Calendar';
import { Stats } from './Stats';
import { Settings } from './Settings';

import { sounds, setSoundSettingsGetter } from '../utils/soundManager';

export function Dashboard({ getDayNumber, getTotalPushups, toggleCompletion, completions, startDate, userStartDate, scheduleNotification, cloudAuth, cloudSync, settings, updateSettings, conflictData, onResolveConflict }) {
    const getLocalDateStr = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [today, setToday] = useState(getLocalDateStr(new Date()));
    const [showCalendar, setShowCalendar] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [numberKey, setNumberKey] = useState(0);



    // Inject settings getter for sound manager
    useEffect(() => {
        setSoundSettingsGetter(() => settings);
    }, [settings]);

    const dayNumber = getDayNumber(today);
    const isCompleted = completions[today];
    const totalPushups = getTotalPushups();

    const effectiveStart = userStartDate || startDate;
    const isFuture = today < effectiveStart;

    // Calculate streak
    const calculateStreak = () => {
        let streak = 0;
        const todayDate = new Date(today);
        for (let i = 0; i < 365; i++) {
            const checkDate = new Date(todayDate);
            checkDate.setDate(checkDate.getDate() - i);
            const dateStr = getLocalDateStr(checkDate);
            if (completions[dateStr]) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    };

    const currentStreak = calculateStreak();

    // With single button, we just toggle. The HOOK handles the time detection.
    const handleComplete = () => {
        // If currently false, we are completing -> Confetti + Sound
        if (!isCompleted) {
            confetti({
                particleCount: 150,
                spread: 120,
                origin: { y: 0.6 },
                colors: ['#6d28d9', '#8b5cf6', '#0ea5e9', '#ffffff', '#f093fb'],
                ticks: 200,
                gravity: 0.8,
                scalar: 1.2
            });
            // Play success sound
            sounds.success();
            // Trigger number animation
            setNumberKey(prev => prev + 1);
        }
        toggleCompletion(today);
    };

    // Handle settings save
    const handleSaveSettings = (newSettings) => {
        updateSettings(newSettings);
        // Update notification scheduling
        if (scheduleNotification) {
            scheduleNotification(newSettings);
        }
    };

    // Progress circle calculation
    const circumference = 2 * Math.PI * 45;
    const progress = (dayNumber / 365) * 100;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="fade-in" style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            gap: 'var(--spacing-md)',
            paddingBottom: 'var(--spacing-lg)'
        }}>
            {/* Header */}
            <header className="glass" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--spacing-sm)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-md)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                        src="/pwa-512x512.png"
                        alt="OneUp Logo"
                        className="bounce-on-hover"
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            objectFit: 'cover',
                            cursor: 'pointer',
                            transition: 'transform 0.3s ease'
                        }}
                    />
                    <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>OneUp</span>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                        onClick={() => setShowSettings(true)}
                        className="hover-lift"
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-primary)',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <SettingsIcon size={18} />
                    </button>
                    <button
                        onClick={() => setShowStats(true)}
                        className="hover-lift"
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-primary)',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <PieChart size={18} />
                    </button>
                    <div className="glass-premium shimmer" style={{
                        background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,165,0,0.15))',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: '600',
                        boxShadow: '0 4px 12px rgba(251, 191, 36, 0.2)'
                    }}>
                        <Trophy size={16} color="#fbbf24" />
                        <span>{totalPushups}</span>
                    </div>
                </div>
            </header>

            {/* Main Counter */}
            <main style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--spacing-lg)'
            }}>
                {!isFuture ? (
                    <>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                fontSize: '0.9rem',
                                color: 'var(--text-secondary)',
                                textTransform: 'uppercase',
                                letterSpacing: '3px',
                                marginBottom: 'var(--spacing-sm)',
                                fontWeight: '500'
                            }}>
                                Day {dayNumber}
                            </div>
                            <div key={numberKey} className="rainbow-gradient" style={{
                                fontSize: '7rem',
                                fontWeight: '800',
                                lineHeight: 1,
                                marginBottom: 'var(--spacing-xs)',
                                animation: 'rainbowFlow 6s ease infinite, numberRoll 0.5s ease-out'
                            }}>
                                {dayNumber}
                            </div>
                            <div style={{
                                fontSize: '1.3rem',
                                color: 'var(--text-secondary)',
                                fontWeight: '500'
                            }}>
                                Pushups Today
                            </div>
                        </div>

                        {/* Circular Progress + Complete Button */}
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            {/* Progress Ring */}
                            <svg width="120" height="120" style={{ position: 'absolute', top: '-10px', left: '-10px' }}>
                                <circle
                                    cx="60"
                                    cy="60"
                                    r="45"
                                    fill="none"
                                    stroke="rgba(255,255,255,0.1)"
                                    strokeWidth="4"
                                />
                                <circle
                                    className="progress-ring-circle"
                                    cx="60"
                                    cy="60"
                                    r="45"
                                    fill="none"
                                    stroke="url(#gradient)"
                                    strokeWidth="4"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                    transform="rotate(-90 60 60)"
                                />
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#667eea" />
                                        <stop offset="50%" stopColor="#764ba2" />
                                        <stop offset="100%" stopColor="#f093fb" />
                                    </linearGradient>
                                </defs>
                            </svg>

                            {/* Complete Button */}
                            <button
                                onClick={handleComplete}
                                className="ripple"
                                style={{
                                    width: '100px',
                                    height: '100px',
                                    borderRadius: '50%',
                                    background: isCompleted
                                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                        : 'transparent',
                                    border: isCompleted ? 'none' : '3px solid var(--accent)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                    transform: isCompleted ? 'scale(1.1)' : 'scale(1)',
                                    boxShadow: isCompleted
                                        ? '0 0 40px rgba(16, 185, 129, 0.6), 0 4px 20px rgba(16, 185, 129, 0.3)'
                                        : '0 0 20px rgba(109, 40, 217, 0.3)',
                                    cursor: 'pointer',
                                    position: 'relative'
                                }}
                            >
                                <Check
                                    size={50}
                                    color={isCompleted ? 'white' : 'var(--accent)'}
                                    strokeWidth={3}
                                    style={{
                                        transition: 'all 0.3s ease',
                                        filter: isCompleted ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : 'none'
                                    }}
                                />
                            </button>
                        </div>

                        {/* Completion Status */}
                        {isCompleted && (
                            <div className="scale-in" style={{
                                color: 'var(--success)',
                                fontWeight: '600',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                {isCompleted.timeOfDay ? (
                                    <span style={{ fontSize: '1rem' }}>
                                        ✨ Verified {isCompleted.timeOfDay.charAt(0).toUpperCase() + isCompleted.timeOfDay.slice(1)}
                                    </span>
                                ) : (
                                    <span style={{ fontSize: '1rem' }}>🎉 Day Complete!</span>
                                )}
                            </div>
                        )}

                        {/* Streak Indicator */}
                        {currentStreak > 0 && (
                            <div className="glass-premium slide-up" style={{
                                padding: '10px 20px',
                                borderRadius: 'var(--radius-lg)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(249, 115, 22, 0.15))',
                                boxShadow: '0 4px 16px rgba(239, 68, 68, 0.2)'
                            }}>
                                <Flame size={24} color="#f97316" className="pulse-glow" />
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        Current Streak
                                    </div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f97316' }}>
                                        {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="glass-premium" style={{
                        textAlign: 'center',
                        padding: 'var(--spacing-xl)',
                        borderRadius: 'var(--radius-xl)',
                        maxWidth: '320px'
                    }}>
                        <h2 style={{ marginBottom: '12px', fontSize: '1.5rem' }}>⏳ Waiting to Start</h2>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                            Your challenge begins on <br />
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
                    width: '100%',
                    padding: 'var(--spacing-md)',
                    borderRadius: 'var(--radius-lg)',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, rgba(109, 40, 217, 0.3), rgba(139, 92, 246, 0.3))',
                    boxShadow: 'var(--shadow-md)'
                }}
            >
                <CalendarIcon size={20} />
                Open Calendar
            </button>

            {/* Calendar Modal */}
            {showCalendar && (
                <Calendar
                    startDate={startDate}
                    completions={completions}
                    onClose={() => setShowCalendar(false)}
                />
            )}

            {/* Stats Modal */}
            {showStats && (
                <Stats
                    completions={completions}
                    onClose={() => setShowStats(false)}
                />
            )}

            {/* Settings Modal */}
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
        </div>
    );
}
