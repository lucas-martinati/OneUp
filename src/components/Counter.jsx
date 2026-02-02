import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { X, Check, RotateCcw, Plus, Minus } from 'lucide-react';
import { sounds } from '../utils/soundManager';

export function Counter({ onClose, dailyGoal, currentCount, onUpdateCount, isCompleted }) {
    const [displayCount, setDisplayCount] = useState(currentCount);
    const [isAnimating, setIsAnimating] = useState(false);

    // Use ref to track previous completion state properly (survives re-renders)
    const prevCompletedRef = useRef(isCompleted);
    const hasCelebratedRef = useRef(false);

    // Sync display with actual count
    useEffect(() => {
        setDisplayCount(currentCount);
    }, [currentCount]);

    // Track threshold crossing for celebration
    useEffect(() => {
        const wasCompleted = prevCompletedRef.current;

        // Only celebrate if we just crossed from NOT completed to completed
        if (isCompleted && !wasCompleted && !hasCelebratedRef.current) {
            hasCelebratedRef.current = true;
            confetti({
                particleCount: 150,
                spread: 120,
                origin: { y: 0.6 },
                colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#ffffff'],
                ticks: 200,
                gravity: 0.8,
                scalar: 1.2
            });
            sounds.success();
        }

        // Reset celebration flag if we go back below the goal
        if (!isCompleted && wasCompleted) {
            hasCelebratedRef.current = false;
        }

        // Update the ref for next comparison
        prevCompletedRef.current = isCompleted;
    }, [isCompleted]);

    const handleIncrement = (amount) => {
        setIsAnimating(true);
        const newCount = currentCount + amount;
        onUpdateCount(newCount);
        setTimeout(() => setIsAnimating(false), 200);
    };

    const handleDecrement = (amount) => {
        setIsAnimating(true);
        const newCount = Math.max(0, currentCount - amount);
        onUpdateCount(newCount);
        setTimeout(() => setIsAnimating(false), 200);
    };

    const handleReset = () => {
        setIsAnimating(true);
        onUpdateCount(0);
        setTimeout(() => setIsAnimating(false), 200);
    };

    const progress = Math.min((currentCount / dailyGoal) * 100, 100);
    const remaining = Math.max(0, dailyGoal - currentCount);

    return (
        <div className="fade-in" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
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
                <h2 className="title-gradient" style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                    Compteur de Pompes
                </h2>
                <button
                    onClick={onClose}
                    className="glass hover-lift"
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        cursor: 'pointer'
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
                    {/* Background circle */}
                    <svg width="200" height="200" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                        <circle
                            cx="100"
                            cy="100"
                            r="90"
                            fill="none"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="8"
                        />
                        <circle
                            cx="100"
                            cy="100"
                            r="90"
                            fill="none"
                            stroke={isCompleted ? '#10b981' : 'url(#counterGradient)'}
                            strokeWidth="8"
                            strokeDasharray={2 * Math.PI * 90}
                            strokeDashoffset={2 * Math.PI * 90 * (1 - progress / 100)}
                            strokeLinecap="round"
                            transform="rotate(-90 100 100)"
                            style={{ transition: 'stroke-dashoffset 0.3s ease, stroke 0.3s ease' }}
                        />
                        <defs>
                            <linearGradient id="counterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#667eea" />
                                <stop offset="50%" stopColor="#764ba2" />
                                <stop offset="100%" stopColor="#f093fb" />
                            </linearGradient>
                        </defs>
                    </svg>

                    {/* Count Display */}
                    <div style={{
                        width: '200px',
                        height: '200px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <div
                            className={isAnimating ? 'scale-in' : ''}
                            style={{
                                fontSize: '4rem',
                                fontWeight: '800',
                                color: isCompleted ? '#10b981' : 'var(--text-primary)',
                                lineHeight: 1,
                                transition: 'color 0.3s ease'
                            }}
                        >
                            {currentCount}
                        </div>
                        <div style={{
                            fontSize: '1rem',
                            color: 'var(--text-secondary)',
                            marginTop: '8px'
                        }}>
                            / {dailyGoal}
                        </div>
                    </div>
                </div>

                {/* Validation Status */}
                {isCompleted ? (
                    <div className="scale-in glass-premium" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 24px',
                        borderRadius: 'var(--radius-lg)',
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(52, 211, 153, 0.2))',
                        boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)'
                    }}>
                        <Check size={24} color="#10b981" strokeWidth={3} />
                        <span style={{ color: '#10b981', fontWeight: '600', fontSize: '1.1rem' }}>
                            Journée Validée !
                        </span>
                    </div>
                ) : (
                    <div style={{
                        color: 'var(--text-secondary)',
                        fontSize: '1rem'
                    }}>
                        Encore <span style={{ color: 'var(--accent)', fontWeight: '600' }}>{remaining}</span> pompes
                    </div>
                )}

                {/* Increment Buttons */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '12px',
                    width: '100%',
                    maxWidth: '350px'
                }}>
                    {[1, 2, 5, 10].map(amount => (
                        <button
                            key={`plus-${amount}`}
                            onClick={() => handleIncrement(amount)}
                            className="glass hover-lift ripple"
                            style={{
                                padding: '16px 8px',
                                borderRadius: 'var(--radius-md)',
                                background: 'linear-gradient(135deg, rgba(109, 40, 217, 0.3), rgba(139, 92, 246, 0.3))',
                                border: '1px solid rgba(139, 92, 246, 0.3)',
                                color: 'var(--text-primary)',
                                fontSize: '1.2rem',
                                fontWeight: '700',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            <Plus size={16} />
                            {amount}
                        </button>
                    ))}
                </div>

                {/* Decrement Buttons */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px',
                    width: '100%',
                    maxWidth: '200px'
                }}>
                    {[1, 5].map(amount => (
                        <button
                            key={`minus-${amount}`}
                            onClick={() => handleDecrement(amount)}
                            className="glass hover-lift ripple"
                            disabled={currentCount === 0}
                            style={{
                                padding: '14px 8px',
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: currentCount === 0 ? 'var(--text-secondary)' : 'var(--text-primary)',
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                cursor: currentCount === 0 ? 'not-allowed' : 'pointer',
                                opacity: currentCount === 0 ? 0.5 : 1
                            }}
                        >
                            <Minus size={16} />
                            {amount}
                        </button>
                    ))}
                </div>

                {/* Reset Button */}
                <button
                    onClick={handleReset}
                    className="glass hover-lift"
                    disabled={currentCount === 0}
                    style={{
                        padding: '12px 24px',
                        borderRadius: 'var(--radius-lg)',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: currentCount === 0 ? 'var(--text-secondary)' : '#ef4444',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: currentCount === 0 ? 'not-allowed' : 'pointer',
                        opacity: currentCount === 0 ? 0.5 : 1,
                        marginTop: 'var(--spacing-sm)'
                    }}
                >
                    <RotateCcw size={18} />
                    Réinitialiser
                </button>
            </div>
        </div>
    );
}
