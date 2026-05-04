import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWakeLock } from '../../hooks/useWakeLock';
import { CSSConfetti } from '../feedback/CSSConfetti';
import { X, Check, CheckCheck, RotateCcw, Plus, Minus, ChevronRight } from '../../utils/icons';
import { sounds } from '../../utils/soundManager';
import { Z_INDEX } from '../../utils/zIndex';
import { DynamicIcon } from '../../utils/icons';
import { getExerciseLabel } from '../../utils/exerciseLabel';
import { WEIGHT_EXERCISES_MAP } from '../../config/weights';
import { useExerciseConfig } from '../../hooks/useExerciseConfig';



export function Counter({ onClose, dailyGoal, currentCount, onUpdateCount, isCompleted, exerciseConfig, dayNumber, onNext, isSession = false, fadeIn = true }) {
    useWakeLock();
    const { t } = useTranslation();
    const { getConfig, updateConfig } = useExerciseConfig();
    const [isAnimating, setIsAnimating] = useState(false);
    const [completeFlash, setCompleteFlash] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    // Use state to track previous completion state to avoid react-compiler ref mutation errors
    const [wasCompleted, setWasCompleted] = useState(isCompleted);
    const [hasCelebrated, setHasCelebrated] = useState(false);

    // Weight exercise support
    const isWeightExercise = !!WEIGHT_EXERCISES_MAP[exerciseConfig?.id];
    const currentWeight = isWeightExercise ? getConfig(exerciseConfig?.id).weight : null;

    const [localWeightStr, setLocalWeightStr] = useState('');
    // Reset localWeightStr carefully
    useEffect(() => {
        if (currentWeight !== null) {
            queueMicrotask(() => setLocalWeightStr(currentWeight.toString()));
        }
    }, [exerciseConfig?.id, currentWeight]);

    useEffect(() => {
        queueMicrotask(() => {
            setIsAnimating(false);
            setCompleteFlash(false);
            setShowConfetti(false);
            setHasCelebrated(false);
            setWasCompleted(isCompleted);
        });
    }, [exerciseConfig?.id, isCompleted]);

    const handleValidateWeight = () => {
        const val = parseFloat(localWeightStr.replace(',', '.'));
        if (!isNaN(val) && val >= 0) {
            updateConfig(exerciseConfig.id, { weight: val });
        } else {
            setLocalWeightStr(currentWeight?.toString() || '');
        }
    };


    // Track threshold crossing for celebration
    useEffect(() => {
        if (isCompleted && !wasCompleted && !hasCelebrated) {
            // Use queueMicrotask to avoid synchronous setState cascades
            queueMicrotask(() => {
                setHasCelebrated(true);
                setShowConfetti(true);
                sounds.success();
            });

            // Auto-advance to next exercise in session mode
            if (onNext) {
                setTimeout(() => onNext(), 1500);
            }
        }

        if (!isCompleted && wasCompleted) {
            queueMicrotask(() => setHasCelebrated(false));
        }

        if (isCompleted !== wasCompleted) {
            queueMicrotask(() => setWasCompleted(isCompleted));
        }
    }, [isCompleted, wasCompleted, hasCelebrated, onNext]);

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
        const exerciseLabel = getExerciseLabel(exerciseConfig);

    // Unique SVG gradient id per exercise to avoid conflicts
    const gradientId = `counterGrad-${exerciseConfig?.id || 'default'}`;

    const content = (
        <div
            className={`modal-content ${isSession && fadeIn ? 'fade-in' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label={exerciseLabel}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--spacing-lg)',
                gap: '8px'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    flex: 1,
                    minWidth: 0
                }}>
                    <div style={{
                        width: 'var(--touch-min)', height: 'var(--touch-min)', borderRadius: '50%',
                        background: `${activeColor}22`,
                        border: `1.5px solid ${activeColor}55`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <DynamicIcon icon={exerciseConfig?.icon} size={20} color={activeColor} />
                    </div>
                    <h2 className="panel-title" style={{
                        color: activeColor,
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: 'clamp(1rem, 4.5vw, 1.4rem)',
                        flex: 1,
                        textAlign: 'left'
                    }}>
                        {exerciseLabel}
                    </h2>
                </div>

                {/* Top-right buttons */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    flexShrink: 0
                }}>
                    {/* Session: Next button */}
                    {onNext && (
                        <button
                            onClick={onNext}
                            className="hover-lift"
                            style={{
                                padding: '8px 12px', borderRadius: '20px',
                                background: `${activeColor}20`,
                                border: `1px solid ${activeColor}40`,
                                color: activeColor,
                                fontSize: '0.8rem', fontWeight: '700',
                                display: 'flex', alignItems: 'center', gap: '4px',
                                cursor: 'pointer',
                                minHeight: 'var(--touch-min)',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <span style={{ display: 'inline-block' }}>{t('common.next')}</span>
                            <ChevronRight size={14} />
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="glass hover-lift"
                        style={{
                            width: 'var(--touch-min)', height: 'var(--touch-min)', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(255,255,255,0.08)', border: 'none',
                            color: 'var(--text-secondary)', cursor: 'pointer',
                            flexShrink: 0
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Weight selector (only for weight exercises) */}
            {isWeightExercise && currentWeight !== null && (
                <div className="scale-in" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '16px', marginBottom: 'var(--spacing-sm)'
                }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '6px 14px', borderRadius: 'var(--radius-lg)',
                        background: `linear-gradient(135deg, ${activeColor}12, ${activeColor}08)`,
                        border: `1px solid ${activeColor}30`,
                    }}>
                        <input
                            type="number"
                            inputMode="decimal"
                            value={localWeightStr}
                            onChange={(e) => setLocalWeightStr(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleValidateWeight()}
                            onBlur={handleValidateWeight}
                            style={{
                                width: Math.max(40, localWeightStr.length * 14 + 10) + 'px',
                                background: 'transparent', border: 'none', outline: 'none',
                                fontSize: '1.4rem', fontWeight: '800', color: activeColor,
                                textAlign: 'center'
                            }}
                        />
                        <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                            {t('weight.kg')}
                        </span>
                    </div>
                    <button
                        onClick={handleValidateWeight}
                        className="hover-lift"
                        disabled={parseFloat(localWeightStr.replace(',', '.')) === currentWeight}
                        style={{
                            width: '42px', height: '42px', borderRadius: '50%',
                            background: parseFloat(localWeightStr.replace(',', '.')) === currentWeight ? 'rgba(255,255,255,0.06)' : `${activeColor}20`,
                            border: `1px solid ${activeColor}40`,
                            cursor: parseFloat(localWeightStr.replace(',', '.')) === currentWeight ? 'default' : 'pointer',
                            color: activeColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s', opacity: parseFloat(localWeightStr.replace(',', '.')) === currentWeight ? 0.4 : 1
                        }}
                    >
                        <Check size={20} />
                    </button>
                </div>
            )}

            {/* Main Content */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'clamp(16px, 2.5vh, 28px)'
            }}>
                {/* Progress Circle & Count Display */}
                <div style={{ position: 'relative', textAlign: 'center' }}>
                    <svg
                        viewBox="0 0 200 200"
                        overflow="visible"
                        style={{
                            position: 'absolute', top: '50%', left: '50%',
                            width: 'clamp(160px, 30vh, 220px)',
                            height: 'clamp(160px, 30vh, 220px)',
                            transform: 'translate(-50%, -50%)'
                        }}
                    >
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
                        width: 'clamp(160px, 30vh, 220px)',
                        height: 'clamp(160px, 30vh, 220px)',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center'
                    }}>
                        <div
                            className={isAnimating ? 'scale-in' : ''}
                            style={{
                                fontSize: 'clamp(4rem, 12vw, 6rem)', fontWeight: '800',
                                color: isCompleted ? activeColor : 'var(--text-primary)',
                                lineHeight: 1,
                                transition: 'color 0.3s ease',
                                fontVariantNumeric: 'tabular-nums'
                            }}
                        >
                            {displayCount}
                        </div>
                        <div style={{ fontSize: 'clamp(1rem, 3vw, 1.3rem)', color: 'var(--text-secondary)', marginTop: '8px' }}>
                            / {dailyGoal}
                        </div>
                    </div>
                </div>

                {/* Validation Status */}
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
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                            {t('counter.validated', { exercise: exerciseLabel })}
                        </span>
                    </div>
                ) : (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                        {t('common.remaining', { count: remaining })}
                    </div>
                )}

                {/* Increment Buttons */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '10px', width: '100%', maxWidth: '360px'
                }}>
                    {[1, 2, 5, 10].map(amount => (
                        <button
                            key={`plus-${amount}`}
                            onClick={() => handleIncrement(amount)}
                            className="glass hover-lift ripple"
                            disabled={isCompleted}
                            style={{
                                padding: 'clamp(14px, 2vh, 20px) 8px',
                                borderRadius: 'var(--radius-md)',
                                background: `linear-gradient(135deg, ${activeColor}2a, ${gradEnd}2a)`,
                                border: `1px solid ${activeColor}44`,
                                color: isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)',
                                fontSize: 'clamp(1rem, 2.8vw, 1.3rem)', fontWeight: '700',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                gap: '4px', minHeight: 'var(--touch-min)',
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
                    gap: '10px', width: '100%', maxWidth: '220px'
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
                                padding: 'clamp(12px, 1.8vh, 18px) 8px',
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: !canDecrement ? 'var(--text-secondary)' : 'var(--text-primary)',
                                fontSize: 'clamp(0.95rem, 2.5vw, 1.15rem)', fontWeight: '600',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                gap: '4px', minHeight: 'var(--touch-min)',
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
                    display: 'flex', gap: '10px', alignItems: 'center',
                    flexWrap: 'wrap', justifyContent: 'center',
                    marginTop: 'var(--spacing-sm)'
                }}>
                    {/* Reset Button */}
                    <button
                        onClick={handleReset}
                        className="glass hover-lift"
                        disabled={displayCount === 0}
                        style={{
                            padding: 'clamp(10px, 1.5vh, 14px) clamp(16px, 3vw, 24px)',
                            borderRadius: 'var(--radius-lg)',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: displayCount === 0 ? 'var(--text-secondary)' : 'var(--error)',
                            fontSize: 'clamp(0.85rem, 2.2vw, 1rem)', fontWeight: '600',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            cursor: displayCount === 0 ? 'not-allowed' : 'pointer',
                            opacity: displayCount === 0 ? 0.5 : 1,
                            minHeight: 'var(--touch-min)'
                        }}
                    >
                        <RotateCcw size={18} />
                        {t('counter.reset')}
                    </button>

                    {/* Complete All Button */}
                    <button
                        onClick={handleCompleteAll}
                        className={`glass hover-lift${completeFlash ? ' complete-flash success-glow' : ''}`}
                        disabled={isCompleted}
                        style={{
                            padding: 'clamp(10px, 1.5vh, 14px) clamp(16px, 3vw, 24px)',
                            borderRadius: 'var(--radius-lg)',
                            background: isCompleted
                                ? `linear-gradient(135deg, ${activeColor}33, ${gradEnd}33)`
                                : `linear-gradient(135deg, ${activeColor}22, ${gradEnd}22)`,
                            border: `1px solid ${isCompleted ? activeColor + '66' : activeColor + '44'}`,
                            color: isCompleted ? activeColor : 'var(--text-primary)',
                            fontSize: 'clamp(0.85rem, 2.2vw, 1rem)', fontWeight: '600',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            cursor: isCompleted ? 'not-allowed' : 'pointer',
                            opacity: isCompleted ? 0.6 : 1,
                            transition: 'all 0.3s ease',
                            minHeight: 'var(--touch-min)'
                        }}
                    >
                        <CheckCheck size={18} />
                        {t('counter.completeAll')}
                    </button>
                </div>
            </div>

            {/* Daily Tip Footer */}
            <div style={{
                marginTop: 'auto', marginBottom: '8px',
                padding: '8px 16px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)',
                fontSize: '0.8rem', textAlign: 'center', alignSelf: 'center', width: '90%', maxWidth: '300px',
                border: '1px solid rgba(255,255,255,0.05)'
            }}>
                💡 {t('counter.tips', { returnObjects: true })[(dayNumber || 0) % 5]}
            </div>
        </div>
    );

    return (
        <>
            <CSSConfetti
                active={showConfetti}
                colors={exerciseConfig?.confettiColors || ['#10b981', '#34d399', '#6ee7b7', '#ffffff']}
                onDone={() => setShowConfetti(false)}
            />
            {isSession ? content : (
                <div className={`modal-overlay ${fadeIn ? 'fade-in' : ''}`} style={{ zIndex: Z_INDEX.TOAST }}>
                    {content}
                </div>
            )}
        </>
    );
}
