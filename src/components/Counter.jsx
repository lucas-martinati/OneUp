import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
    X, Check, CheckCheck, RotateCcw, Plus, Minus,
    Dumbbell, ArrowDownUp, ArrowUp, Zap, ChevronsUp, Footprints
} from 'lucide-react';
import { sounds } from '../utils/soundManager';

// Map icon name strings to lucide components
const ICON_MAP = { Dumbbell, ArrowDownUp, ArrowUp, Zap, ChevronsUp, Footprints };

/** Trigger haptic feedback if available (Capacitor native) */
const triggerHaptic = async () => {
    try {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch {
        // Fallback: Vibration API (most mobile browsers)
        if (navigator.vibrate) navigator.vibrate([50, 30, 80]);
    }
};

export function Counter({ onClose, dailyGoal, currentCount, onUpdateCount, isCompleted, exerciseConfig }) {
    const [isAnimating, setIsAnimating] = useState(false);
    const [completeFlash, setCompleteFlash] = useState(false);

    // Use ref to track previous completion state (survives re-renders)
    const prevCompletedRef = useRef(isCompleted);
    const hasCelebratedRef = useRef(false);

    // Track threshold crossing for celebration
    useEffect(() => {
        const wasCompleted = prevCompletedRef.current;

        if (isCompleted && !wasCompleted && !hasCelebratedRef.current) {
            hasCelebratedRef.current = true;
            confetti({
                particleCount: 150,
                spread: 120,
                origin: { y: 0.6 },
                colors: exerciseConfig?.confettiColors || ['#10b981', '#34d399', '#6ee7b7', '#ffffff'],
                ticks: 200,
                gravity: 0.8,
                scalar: 1.2
            });
            sounds.success();
        }

        if (!isCompleted && wasCompleted) {
            hasCelebratedRef.current = false;
        }

        prevCompletedRef.current = isCompleted;
    }, [isCompleted, exerciseConfig]);

    const handleIncrement = (amount) => {
        setIsAnimating(true);
        // Cap at dailyGoal (useProgress also caps, but UX feels better capping here too)
        onUpdateCount(Math.min(currentCount + amount, dailyGoal));
        setTimeout(() => setIsAnimating(false), 200);
    };

    const handleDecrement = (amount) => {
        setIsAnimating(true);
        // If completed but count is 0 (cloud sync), decrement from dailyGoal
        const base = (isCompleted && currentCount === 0) ? dailyGoal : currentCount;
        onUpdateCount(Math.max(0, base - amount));
        setTimeout(() => setIsAnimating(false), 200);
    };

    const handleReset = () => {
        setIsAnimating(true);
        onUpdateCount(0);
        setTimeout(() => setIsAnimating(false), 200);
    };

    const handleCompleteAll = () => {
        if (isCompleted) return;
        setIsAnimating(true);
        setCompleteFlash(true);
        onUpdateCount(dailyGoal);
        triggerHaptic();
        setTimeout(() => {
            setIsAnimating(false);
            setCompleteFlash(false);
        }, 600);
    };

    // When isCompleted is true but count is 0 (cloud sync strips count), display dailyGoal
    const displayCount = isCompleted && currentCount === 0 ? dailyGoal : currentCount;
    const progress = Math.min((displayCount / dailyGoal) * 100, 100);
    const remaining = Math.max(0, dailyGoal - displayCount);

    // Exercise-specific styling
    const activeColor = exerciseConfig?.color || '#818cf8';
    const [gradStart, gradEnd] = exerciseConfig?.gradient || ['#667eea', '#818cf8'];
    const ExIcon = ICON_MAP[exerciseConfig?.icon] || Dumbbell;
    const exerciseLabel = exerciseConfig?.label || 'Exercice';

    // Unique SVG gradient id per exercise to avoid conflicts
    const gradientId = `counterGrad-${exerciseConfig?.id || 'default'}`;

    return (
        <div className="fade-in" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(12px)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            padding: 'var(--spacing-sm)',
            paddingTop: 'calc(var(--spacing-sm) + env(safe-area-inset-top))',
            paddingBottom: 'calc(var(--spacing-sm) + env(safe-area-inset-bottom))'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-lg)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: `${activeColor}22`,
                        border: `1.5px solid ${activeColor}55`,
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
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--spacing-lg)'
            }}>
                {/* Progress Circle & Count Display */}
                <div style={{ position: 'relative', textAlign: 'center' }}>
                    <svg width="200" height="200" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                        {/* Track */}
                        <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                        {/* Progress arc */}
                        <circle
                            cx="100" cy="100" r="90"
                            fill="none"
                            stroke={isCompleted ? activeColor : `url(#${gradientId})`}
                            strokeWidth="8"
                            strokeDasharray={2 * Math.PI * 90}
                            strokeDashoffset={2 * Math.PI * 90 * (1 - progress / 100)}
                            strokeLinecap="round"
                            transform="rotate(-90 100 100)"
                            style={{
                                transition: 'stroke-dashoffset 0.3s ease, stroke 0.3s ease',
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

                    {/* Count Display */}
                    <div style={{
                        width: '200px', height: '200px',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center'
                    }}>
                        <div
                            className={isAnimating ? 'scale-in' : ''}
                            style={{
                                fontSize: '4rem', fontWeight: '800',
                                color: isCompleted ? activeColor : 'var(--text-primary)',
                                lineHeight: 1,
                                transition: 'color 0.3s ease'
                            }}
                        >
                            {displayCount}
                        </div>
                        <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                            / {dailyGoal}
                        </div>
                    </div>
                </div>

                {/* Validation Status */}
                {isCompleted ? (
                    <div className="scale-in pulse-glow-exercise" style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '14px 28px', borderRadius: 'var(--radius-lg)',
                        background: `linear-gradient(135deg, ${activeColor}18, ${gradEnd}18)`,
                        border: `1px solid ${activeColor}44`,
                        boxShadow: `0 0 24px ${activeColor}33, inset 0 1px 0 ${activeColor}22`,
                        animation: `pulseGlowExercise 2.5s ease-in-out infinite`,
                        ['--exercise-glow-color']: `${activeColor}44`
                    }}>
                        <Check size={24} color={activeColor} strokeWidth={3} />
                        <span style={{
                            color: activeColor, fontWeight: '600', fontSize: '1.1rem',
                            background: `linear-gradient(135deg, ${gradStart}, ${gradEnd})`,
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                            {exerciseLabel} Valid&eacute; !
                        </span>
                    </div>
                ) : (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                        Encore <span style={{ color: activeColor, fontWeight: '600' }}>{remaining}</span> {exerciseLabel.toLowerCase()}
                    </div>
                )}

                {/* Increment Buttons */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '12px', width: '100%', maxWidth: '350px'
                }}>
                    {[1, 2, 5, 10].map(amount => (
                        <button
                            key={`plus-${amount}`}
                            onClick={() => handleIncrement(amount)}
                            className="glass hover-lift ripple"
                            disabled={isCompleted}
                            style={{
                                padding: '16px 8px',
                                borderRadius: 'var(--radius-md)',
                                background: `linear-gradient(135deg, ${activeColor}2a, ${gradEnd}2a)`,
                                border: `1px solid ${activeColor}44`,
                                color: isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)',
                                fontSize: '1.2rem', fontWeight: '700',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                gap: '4px',
                                cursor: isCompleted ? 'not-allowed' : 'pointer',
                                opacity: isCompleted ? 0.4 : 1
                            }}
                        >
                            <Plus size={16} />
                            {amount}
                        </button>
                    ))}
                </div>

                {/* Decrement Buttons */}
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px', width: '100%', maxWidth: '200px'
                }}>
                    {[1, 5].map(amount => {
                        const canDecrement = displayCount > 0;
                        return (
                        <button
                            key={`minus-${amount}`}
                            onClick={() => handleDecrement(amount)}
                            className="glass hover-lift ripple"
                            disabled={!canDecrement}
                            style={{
                                padding: '14px 8px', borderRadius: 'var(--radius-md)',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: !canDecrement ? 'var(--text-secondary)' : 'var(--text-primary)',
                                fontSize: '1.1rem', fontWeight: '600',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                gap: '4px',
                                cursor: !canDecrement ? 'not-allowed' : 'pointer',
                                opacity: !canDecrement ? 0.5 : 1
                            }}
                        >
                            <Minus size={16} />
                            {amount}
                        </button>
                        );
                    })}
                </div>

                {/* Action Buttons Row: Reset + Complete All */}
                <div style={{
                    display: 'flex', gap: '12px', alignItems: 'center',
                    marginTop: 'var(--spacing-sm)'
                }}>
                    {/* Reset Button */}
                    <button
                        onClick={handleReset}
                        className="glass hover-lift"
                        disabled={displayCount === 0}
                        style={{
                            padding: '12px 24px', borderRadius: 'var(--radius-lg)',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: displayCount === 0 ? 'var(--text-secondary)' : '#ef4444',
                            fontSize: '0.95rem', fontWeight: '600',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            cursor: displayCount === 0 ? 'not-allowed' : 'pointer',
                            opacity: displayCount === 0 ? 0.5 : 1
                        }}
                    >
                        <RotateCcw size={18} />
                        R&eacute;initialiser
                    </button>

                    {/* Complete All Button */}
                    <button
                        onClick={handleCompleteAll}
                        className={`glass hover-lift${completeFlash ? ' complete-flash success-glow' : ''}`}
                        disabled={isCompleted}
                        style={{
                            padding: '12px 24px', borderRadius: 'var(--radius-lg)',
                            background: isCompleted
                                ? `linear-gradient(135deg, ${activeColor}33, ${gradEnd}33)`
                                : `linear-gradient(135deg, ${activeColor}22, ${gradEnd}22)`,
                            border: `1px solid ${isCompleted ? activeColor + '66' : activeColor + '44'}`,
                            color: isCompleted ? activeColor : 'var(--text-primary)',
                            fontSize: '0.95rem', fontWeight: '600',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            cursor: isCompleted ? 'not-allowed' : 'pointer',
                            opacity: isCompleted ? 0.6 : 1,
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <CheckCheck size={18} />
                        Tout compl&eacute;ter
                    </button>
                </div>
            </div>
        </div>
    );
}
