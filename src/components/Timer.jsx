import { useState, useEffect, useRef } from 'react';
import { CSSConfetti } from './CSSConfetti';
import {
    X, Check, CheckCheck, RotateCcw, Play, Pause,
    Square
} from 'lucide-react';
import { sounds } from '../utils/soundManager';

export function Timer({ onClose, dailyGoal, currentCount, onUpdateCount, isCompleted, exerciseConfig, dayNumber }) {
    const [isRunning, setIsRunning] = useState(false);
    const [completeFlash, setCompleteFlash] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    const prevCompletedRef = useRef(isCompleted);
    const hasCelebratedRef = useRef(false);

    // Format seconds to MM:SS
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Timer logic - using refs to track values
    const countRef = useRef(currentCount);
    const completedRef = useRef(isCompleted);
    countRef.current = currentCount;
    completedRef.current = isCompleted;
    
    useEffect(() => {
        if (!isRunning || isCompleted) return;
        
        const interval = setInterval(() => {
            if (completedRef.current) return;
            const newCount = countRef.current + 1;
            onUpdateCount(newCount);
            if (newCount >= dailyGoal) {
                setIsRunning(false);
            }
        }, 1000);
        
        return () => clearInterval(interval);
    }, [isRunning, isCompleted, dailyGoal]);

    // Celebration
    useEffect(() => {
        const wasCompleted = prevCompletedRef.current;
        if (isCompleted && !wasCompleted && !hasCelebratedRef.current) {
            hasCelebratedRef.current = true;
            setShowConfetti(true);
            sounds.success();
        }
        if (!isCompleted && wasCompleted) {
            hasCelebratedRef.current = false;
        }
        prevCompletedRef.current = isCompleted;
    }, [isCompleted]);

    const handleReset = () => {
        setIsRunning(false);
        onUpdateCount(0);
    };

    const handleCompleteAll = () => {
        if (isCompleted) return;
        setIsRunning(false);
        setCompleteFlash(true);
        onUpdateCount(dailyGoal);
        setTimeout(() => {
            setCompleteFlash(false);
        }, 600);
    };

    const displayCount = isCompleted && currentCount === 0 ? dailyGoal : currentCount;
    const progress = Math.min((displayCount / dailyGoal) * 100, 100);
    const remaining = Math.max(0, dailyGoal - displayCount);

    const activeColor = exerciseConfig?.color || '#8b5cf6';
    const [gradStart, gradEnd] = exerciseConfig?.gradient || ['#7c3aed', '#8b5cf6'];
    const ExIcon = Square;
    const exerciseLabel = exerciseConfig?.label || 'Gainage';
    const gradientId = `timerGrad-${exerciseConfig?.id || 'timer'}`;

    return (
        <>
        <CSSConfetti
            active={showConfetti}
            colors={exerciseConfig?.confettiColors || ['#8b5cf6', '#a78bfa', '#ffffff']}
            onDone={() => setShowConfetti(false)}
        />
        <div className="fade-in" style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0, 0, 0, 0.92)',
            zIndex: 1000, display: 'flex', flexDirection: 'column',
            padding: 'var(--spacing-sm)',
            paddingTop: 'calc(var(--spacing-sm) + env(safe-area-inset-top))',
            paddingBottom: 'calc(var(--spacing-sm) + env(safe-area-inset-bottom))'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: `${activeColor}22`, border: `1.5px solid ${activeColor}55`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <ExIcon size={18} color={activeColor} />
                    </div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: activeColor, margin: 0 }}>
                        {exerciseLabel}
                    </h2>
                </div>
                <button
                    onClick={onClose}
                    className="glass hover-lift"
                    style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer'
                    }}
                >
                    <X size={20} color="var(--text-primary)" />
                </button>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-lg)' }}>
                {/* Progress Circle & Time Display */}
                <div style={{ position: 'relative', textAlign: 'center' }}>
                    <svg width="240" height="240" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                        <circle cx="120" cy="120" r="110" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                        <circle
                            cx="120" cy="120" r="110" fill="none"
                            stroke={isCompleted ? activeColor : `url(#${gradientId})`}
                            strokeWidth="8"
                            strokeDasharray={2 * Math.PI * 110}
                            strokeDashoffset={2 * Math.PI * 110 * (1 - progress / 100)}
                            strokeLinecap="round"
                            transform="rotate(-90 120 120)"
                            style={{
                                transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease',
                                filter: isCompleted ? `drop-shadow(0 0 8px ${activeColor}88)` : 'none'
                            }}
                        />
                        <defs>
                            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor={gradStart} />
                                <stop offset="100%" stopColor={gradEnd} />
                            </linearGradient>
                        </defs>
                    </svg>

                    <div style={{
                        width: '240px', height: '240px',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center'
                    }}>
                        <div style={{
                            fontSize: '4.5rem', fontWeight: '800',
                            color: isCompleted ? activeColor : 'var(--text-primary)',
                            lineHeight: 1, transition: 'color 0.3s ease',
                            fontVariantNumeric: 'tabular-nums'
                        }}>
                            {formatTime(displayCount)}
                        </div>
                        <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                            / {formatTime(dailyGoal)}
                        </div>
                    </div>
                </div>

                {isCompleted ? (
                    <div className="scale-in" style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '14px 28px', borderRadius: 'var(--radius-lg)',
                        background: `linear-gradient(135deg, ${activeColor}18, ${gradEnd}18)`,
                        border: `1px solid ${activeColor}44`,
                        boxShadow: `0 0 16px ${activeColor}22`
                    }}>
                        <Check size={24} color={activeColor} strokeWidth={3} />
                        <span style={{
                            color: activeColor, fontWeight: '600', fontSize: '1.1rem',
                            background: `linear-gradient(135deg, ${gradStart}, ${gradEnd})`,
                            backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>
                            Chrono Valid&eacute; !
                        </span>
                    </div>
                ) : (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                        Encore <span style={{ color: activeColor, fontWeight: '600' }}>{formatTime(remaining)}</span> à tenir
                    </div>
                )}

                {/* Play / Pause button */}
                {!isCompleted && (
                    <button
                        onClick={() => setIsRunning(!isRunning)}
                        className="glass hover-lift ripple"
                        style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: `linear-gradient(135deg, ${activeColor}44, ${gradEnd}44)`,
                            border: `2px solid ${activeColor}`,
                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginTop: '10px', boxShadow: `0 0 20px ${activeColor}66`
                        }}
                    >
                        {isRunning ? <Pause size={36} fill="white" /> : <Play size={36} fill="white" style={{ marginLeft: '4px' }} />}
                    </button>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: 'var(--spacing-md)' }}>
                    <button
                        onClick={handleReset} className="glass hover-lift" disabled={displayCount === 0}
                        style={{
                            padding: '12px 24px', borderRadius: 'var(--radius-lg)',
                            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: displayCount === 0 ? 'var(--text-secondary)' : '#ef4444',
                            fontSize: '0.95rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px',
                            cursor: displayCount === 0 ? 'not-allowed' : 'pointer', opacity: displayCount === 0 ? 0.5 : 1
                        }}
                    >
                        <RotateCcw size={18} /> RAZ
                    </button>

                    <button
                        onClick={handleCompleteAll} className={`glass hover-lift${completeFlash ? ' complete-flash success-glow' : ''}`} disabled={isCompleted}
                        style={{
                            padding: '12px 24px', borderRadius: 'var(--radius-lg)',
                            background: isCompleted ? `linear-gradient(135deg, ${activeColor}33, ${gradEnd}33)` : `linear-gradient(135deg, ${activeColor}22, ${gradEnd}22)`,
                            border: `1px solid ${isCompleted ? activeColor + '66' : activeColor + '44'}`,
                            color: isCompleted ? activeColor : 'var(--text-primary)',
                            fontSize: '0.95rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px',
                            cursor: isCompleted ? 'not-allowed' : 'pointer', opacity: isCompleted ? 0.6 : 1, transition: 'all 0.3s ease'
                        }}
                    >
                        <CheckCheck size={18} /> Skip
                    </button>
                </div>
            </div>

            {/* Daily Tip in Timer */}
            <div style={{
                marginTop: 'auto', marginBottom: '8px', padding: '8px 16px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)',
                fontSize: '0.8rem', textAlign: 'center', alignSelf: 'center', width: '90%', maxWidth: '300px',
                border: '1px solid rgba(255,255,255,0.05)'
            }}>
                💡 {["Boire de l'eau booste les performances.", "Garde le dos droit !", "La constance bat l'intensité.", "Respire bien pendant l'effort.", "1% meilleur chaque jour."][(dayNumber || 0) % 5]}
            </div>
        </div>
        </>
    );
}
