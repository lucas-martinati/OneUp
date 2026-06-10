import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CSSConfetti } from '../feedback/CSSConfetti';
import {
    X, Check, CheckCheck, RotateCcw, Plus, Minus, ChevronRight,
    Play, Pause, DynamicIcon
} from '../../utils/icons';
import { sounds } from '../../utils/soundManager';
import { formatTime } from '../../utils/dateUtils';
import { getExerciseLabel } from '../../utils/exerciseLabel';
import { WEIGHT_EXERCISES_MAP } from '../../config/weights';
import { useExerciseConfig } from '../../hooks/useExerciseConfig';
import { useWakeLock } from '../../hooks/useWakeLock';
import { Z_INDEX } from '../../utils/zIndex';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useCameraPushUpCounter } from '../../hooks/useCameraPushUpCounter';
import { Camera, CameraOff, RefreshCw } from 'lucide-react';

export function ExercisePanel({
    onClose,
    dailyGoal,
    currentCount,
    onUpdateCount,
    isCompleted,
    exerciseConfig,
    dayNumber,
    onNext,
    hideNextButton = false,
    isSession = false,
    fadeIn = true
}) {
    const settings = useSettingsStore(s => s.settings);
    const keepScreenOn = settings?.keepScreenOn ?? true;
    useWakeLock(keepScreenOn);
    
    const { t } = useTranslation();
    const { getConfig, updateConfig } = useExerciseConfig();
    const isTimer = exerciseConfig?.type === 'timer';
    const [isAnimating, setIsAnimating] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [completeFlash, setCompleteFlash] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [wasCompleted, setWasCompleted] = useState(isCompleted);
    const [hasCelebrated, setHasCelebrated] = useState(false);

    const isWeightExercise = !isTimer && !!WEIGHT_EXERCISES_MAP[exerciseConfig?.id];
    const currentWeight = isWeightExercise ? getConfig(exerciseConfig?.id).weight : null;
    const [localWeightStr, setLocalWeightStr] = useState('');

    // Pause background animations to save battery when screen is kept on
    useEffect(() => {
        document.body.classList.add('exercise-panel-active');
        return () => document.body.classList.remove('exercise-panel-active');
    }, []);

    useEffect(() => {
        if (currentWeight !== null) {
            queueMicrotask(() => setLocalWeightStr(currentWeight.toString()));
        }
    }, [exerciseConfig?.id, currentWeight]);

    useEffect(() => {
        queueMicrotask(() => {
            setIsAnimating(false);
            setIsRunning(false);
            setCompleteFlash(false);
            setShowConfetti(false);
            setHasCelebrated(false);
            setWasCompleted(isCompleted);
        });
    }, [exerciseConfig?.id, isCompleted]);

    useEffect(() => {
        if (!isTimer || !isRunning || isCompleted) return undefined;

        let lastCount = currentCount;
        const interval = setInterval(() => {
            lastCount += 1;
            onUpdateCount(lastCount);
            if (lastCount >= dailyGoal) setIsRunning(false);
        }, 1000);

        return () => clearInterval(interval);
    }, [isTimer, isRunning, isCompleted, currentCount, dailyGoal, onUpdateCount]);

    useEffect(() => {
        if (isCompleted && !wasCompleted && !hasCelebrated) {
            queueMicrotask(() => {
                setHasCelebrated(true);
                setShowConfetti(true);
                sounds.success();
            });

            if (onNext) setTimeout(() => onNext(), 1500);
        }

        if (!isCompleted && wasCompleted) {
            queueMicrotask(() => setHasCelebrated(false));
        }

        if (isCompleted !== wasCompleted) {
            queueMicrotask(() => setWasCompleted(isCompleted));
        }
    }, [isCompleted, wasCompleted, hasCelebrated, onNext]);

    const displayCount = isCompleted && currentCount === 0 ? dailyGoal : currentCount;
    const safeGoal = dailyGoal || 1;
    const progress = Math.min((displayCount / safeGoal) * 100, 100);
    const remaining = Math.max(0, dailyGoal - displayCount);
    const activeColor = exerciseConfig?.color || (isTimer ? '#8b5cf6' : '#818cf8');
    const [gradStart, gradEnd] = exerciseConfig?.gradient || (isTimer ? ['#7c3aed', '#8b5cf6'] : ['#667eea', '#818cf8']);
    const exerciseLabel = getExerciseLabel(exerciseConfig);
    const gradientId = 'exercisePanelGrad';
    const ringSize = 'clamp(150px, 26vh, 200px)';
    const ringRadius = 100;
    const ringCircumference = 2 * Math.PI * ringRadius;
    const displayTime = formatTime(displayCount);
    const goalTime = formatTime(dailyGoal);
    const timeFontSize = displayTime.length >= 6
        ? 'clamp(2.7rem, 8vw, 4rem)'
        : displayTime.length >= 5
            ? 'clamp(3.2rem, 9vw, 4.8rem)'
            : 'clamp(3.6rem, 10vw, 5.4rem)';

    const handleValidateWeight = () => {
        const val = parseFloat(localWeightStr.replace(',', '.'));
        if (!isNaN(val) && val >= 0) {
            updateConfig(exerciseConfig.id, { weight: val });
        } else {
            setLocalWeightStr(currentWeight?.toString() || '');
        }
    };

    const handleIncrement = (amount) => {
        setIsAnimating(true);
        onUpdateCount(Math.min(currentCount + amount, dailyGoal));
        setTimeout(() => setIsAnimating(false), 200);
    };

    const handleDecrement = (amount) => {
        setIsAnimating(true);
        const base = (isCompleted && currentCount === 0) ? dailyGoal : currentCount;
        onUpdateCount(Math.max(0, base - amount));
        setTimeout(() => setIsAnimating(false), 200);
    };

    const handleReset = () => {
        setIsRunning(false);
        setIsAnimating(true);
        onUpdateCount(0);
        setTimeout(() => setIsAnimating(false), 200);
    };

    const handleCompleteAll = () => {
        if (isCompleted) return;
        setIsRunning(false);
        setIsAnimating(true);
        setCompleteFlash(true);
        onUpdateCount(dailyGoal);
        setTimeout(() => {
            setIsAnimating(false);
            setCompleteFlash(false);
        }, 600);
    };

    const isPushups = exerciseConfig?.id === 'pushups';
    const {
        isActive: isCameraActive,
        videoRef,
        error: cameraError,
        proximity,
        isCalibrated,
        calibrateCountdown,
        pushupState,
        startCamera,
        stopCamera,
        recalibrate
    } = useCameraPushUpCounter(() => {
        if (!isCompleted) {
            handleIncrement(1);
        }
    });

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    useEffect(() => {
        if (!isPushups && isCameraActive) {
            stopCamera();
        }
    }, [exerciseConfig?.id, isPushups, isCameraActive, stopCamera]);

    const content = (
        <div
            className={`modal-content ${isSession && fadeIn ? 'fade-in' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label={exerciseLabel}
        >
            <Header
                activeColor={activeColor}
                exerciseConfig={exerciseConfig}
                exerciseLabel={exerciseLabel}
                onClose={onClose}
                onNext={onNext}
                hideNextButton={hideNextButton}
                t={t}
            />

            {isWeightExercise && currentWeight !== null && (
                <WeightSelector
                    activeColor={activeColor}
                    currentWeight={currentWeight}
                    handleValidateWeight={handleValidateWeight}
                    localWeightStr={localWeightStr}
                    setLocalWeightStr={setLocalWeightStr}
                    t={t}
                />
            )}

            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'clamp(8px, 1.8vh, 16px)'
            }}>
                {isPushups && (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button
                            onClick={isCameraActive ? stopCamera : startCamera}
                            className="hover-lift glass"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 16px',
                                borderRadius: '20px',
                                background: isCameraActive ? `${activeColor}20` : 'rgba(255, 255, 255, 0.05)',
                                border: `1px solid ${isCameraActive ? activeColor + '60' : 'rgba(255, 255, 255, 0.1)'}`,
                                color: isCameraActive ? activeColor : 'var(--text-primary)',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: '700',
                                transition: 'all 0.2s ease',
                                minHeight: 'var(--touch-min)'
                            }}
                        >
                            {isCameraActive ? <CameraOff size={16} /> : <Camera size={16} />}
                            {t('counter.cameraMode')}
                        </button>
                        {isCameraActive && isCalibrated && (
                            <button
                                onClick={recalibrate}
                                className="hover-lift glass"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 14px',
                                    borderRadius: '20px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontWeight: '700',
                                    transition: 'all 0.2s ease',
                                    minHeight: 'var(--touch-min)'
                                }}
                            >
                                <RefreshCw size={12} />
                                {t('counter.cameraCalibrate')}
                            </button>
                        )}
                    </div>
                )}

                {isPushups && !isCameraActive && (
                    <p style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        margin: '-4px 0 4px 0',
                        textAlign: 'center',
                        maxWidth: '280px',
                        lineHeight: '1.4',
                        opacity: 0.75
                    }}>
                        {t('counter.cameraModeDesc')}
                    </p>
                )}

                <ProgressRing
                    activeColor={activeColor}
                    displayCount={displayCount}
                    displayTime={displayTime}
                    goalTime={goalTime}
                    gradEnd={gradEnd}
                    gradStart={gradStart}
                    gradientId={gradientId}
                    isAnimating={isAnimating}
                    isCompleted={isCompleted}
                    isRunning={isRunning}
                    isTimer={isTimer}
                    progress={progress}
                    ringCircumference={ringCircumference}
                    ringRadius={ringRadius}
                    ringSize={ringSize}
                    dailyGoal={dailyGoal}
                    timeFontSize={timeFontSize}
                    isCameraActive={isCameraActive}
                    videoRef={videoRef}
                    cameraError={cameraError}
                    isCalibrated={isCalibrated}
                    calibrateCountdown={calibrateCountdown}
                    t={t}
                />

                {isCameraActive ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '280px', minHeight: '52px', gap: '16px' }}>
                        {/* Reps counter left side */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flexShrink: 0 }}>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>
                                {t('common.reps')}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                                <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1 }}>
                                    {displayCount}
                                </span>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    / {dailyGoal}
                                </span>
                            </div>
                        </div>

                        {/* Proximity bar & status right side */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flex: 1, maxWidth: '160px' }}>
                            {isCalibrated ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', width: '100%' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                        <span className="camera-active-ring-pulse" style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: activeColor }} />
                                        <span style={{ fontSize: '0.72rem', color: pushupState === 'down' ? activeColor : 'var(--text-primary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            {pushupState === 'down' ? '↓ BAS' : '↑ HAUT'}
                                        </span>
                                    </div>
                                    <div className="camera-proximity-container" style={{ margin: 0, width: '100%' }}>
                                        <div 
                                            className="camera-proximity-fill" 
                                            style={{ 
                                                width: `${proximity}%`,
                                                '--exercise-color': activeColor,
                                                '--exercise-color-dim': exerciseConfig?.colorDim || 'rgba(129,140,248,0.15)'
                                            }} 
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'right' }}>
                                        {calibrateCountdown > 0 ? t('counter.cameraCalibrating', { count: calibrateCountdown }) : t('counter.cameraLoading')}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <StatusLine
                        activeColor={activeColor}
                        exerciseLabel={exerciseLabel}
                        gradEnd={gradEnd}
                        gradStart={gradStart}
                        isCompleted={isCompleted}
                        isTimer={isTimer}
                        remaining={remaining}
                        t={t}
                    />
                )}

                {isTimer ? (
                    <TimerControls
                        activeColor={activeColor}
                        completeFlash={completeFlash}
                        displayCount={displayCount}
                        gradEnd={gradEnd}
                        handleCompleteAll={handleCompleteAll}
                        handleReset={handleReset}
                        isCompleted={isCompleted}
                        isRunning={isRunning}
                        setIsRunning={setIsRunning}
                        t={t}
                    />
                ) : (
                    <CounterControls
                        activeColor={activeColor}
                        completeFlash={completeFlash}
                        displayCount={displayCount}
                        gradEnd={gradEnd}
                        handleCompleteAll={handleCompleteAll}
                        handleDecrement={handleDecrement}
                        handleIncrement={handleIncrement}
                        handleReset={handleReset}
                        isCompleted={isCompleted}
                        t={t}
                        isCameraActive={isCameraActive}
                    />
                )}
            </div>

            {!isCameraActive && (
                <div style={{
                    marginTop: 'auto',
                    marginBottom: '8px',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.03)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    textAlign: 'center',
                    alignSelf: 'center',
                    width: '90%',
                    maxWidth: '300px',
                    border: '1px solid rgba(255,255,255,0.05)'
                }}>
                    {'\u{1F4A1}'} {t(isTimer ? 'timer.tips' : 'counter.tips', { returnObjects: true })[(dayNumber || 0) % 5]}
                </div>
            )}
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

function Header({ activeColor, exerciseConfig, exerciseLabel, onClose, onNext, hideNextButton, t }) {
    const showNextButton = onNext && !hideNextButton;

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'clamp(8px, 1.5vh, 16px)', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                <div style={{
                    width: 'var(--touch-min)',
                    height: 'var(--touch-min)',
                    borderRadius: '50%',
                    background: `${activeColor}22`,
                    border: `1.5px solid ${activeColor}55`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'background 0.45s ease, border-color 0.45s ease'
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
                    textAlign: 'left',
                    transition: 'color 0.45s ease'
                }}>
                    {exerciseLabel}
                </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {showNextButton && (
                    <button
                        onClick={onNext}
                        className="hover-lift"
                        style={{
                            padding: '8px 12px',
                            borderRadius: '20px',
                            background: `${activeColor}20`,
                            border: `1px solid ${activeColor}40`,
                            color: activeColor,
                            fontSize: '0.8rem',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            minHeight: 'var(--touch-min)',
                            whiteSpace: 'nowrap',
                            transition: 'background 0.45s ease, border-color 0.45s ease, color 0.45s ease'
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
                        width: 'var(--touch-min)',
                        height: 'var(--touch-min)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(255,255,255,0.08)',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        flexShrink: 0
                    }}
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );
}

function WeightSelector({ activeColor, currentWeight, handleValidateWeight, localWeightStr, setLocalWeightStr, t }) {
    const parsedWeight = parseFloat(localWeightStr.replace(',', '.'));
    const isUnchanged = parsedWeight === currentWeight;

    return (
        <div className="scale-in" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            marginBottom: 'var(--spacing-sm)'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-lg)',
                background: `linear-gradient(135deg, ${activeColor}12, ${activeColor}08)`,
                border: `1px solid ${activeColor}30`
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
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        fontSize: '1.4rem',
                        fontWeight: '800',
                        color: activeColor,
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
                disabled={isUnchanged}
                style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: isUnchanged ? 'rgba(255,255,255,0.06)' : `${activeColor}20`,
                    border: `1px solid ${activeColor}40`,
                    cursor: isUnchanged ? 'default' : 'pointer',
                    color: activeColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    opacity: isUnchanged ? 0.4 : 1
                }}
            >
                <Check size={20} />
            </button>
        </div>
    );
}

function ProgressRing({
    activeColor,
    dailyGoal,
    displayCount,
    displayTime,
    goalTime,
    gradEnd,
    gradStart,
    gradientId,
    isAnimating,
    isCompleted,
    isRunning,
    isTimer,
    progress,
    ringCircumference,
    ringRadius,
    ringSize,
    timeFontSize,
    // Camera props
    isCameraActive = false,
    videoRef = null,
    cameraError = null,
    isCalibrated = false,
    calibrateCountdown = 0,
    t = null
}) {
    return (
        <div style={{ 
            position: 'relative', 
            width: ringSize,
            height: ringSize,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            '--exercise-color': activeColor,
            '--exercise-color-dim': activeColor + '15'
        }}>
            <svg
                viewBox="0 0 220 220"
                overflow="visible"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none'
                }}
            >
                <circle cx="110" cy="110" r={ringRadius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                <circle
                    cx="110"
                    cy="110"
                    r={ringRadius}
                    fill="none"
                    stroke={isCompleted ? activeColor : `url(#${gradientId})`}
                    strokeWidth="8"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringCircumference * (1 - progress / 100)}
                    strokeLinecap="round"
                    transform="rotate(-90 110 110)"
                    className={isCameraActive ? 'camera-active-ring-pulse' : ''}
                    style={{
                        transition: `${isTimer && isRunning ? 'stroke-dashoffset 1s linear' : 'stroke-dashoffset 0.45s ease'}, stroke 0.45s ease, filter 0.45s ease`,
                        filter: isCompleted ? `drop-shadow(0 0 8px ${activeColor}88)` : 'none'
                    }}
                />
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={gradStart} style={{ transition: 'stop-color 0.45s ease' }} />
                        <stop offset="100%" stopColor={gradEnd} style={{ transition: 'stop-color 0.45s ease' }} />
                    </linearGradient>
                </defs>
            </svg>

            {isCameraActive && (
                <div className="camera-video-wrapper" style={{ width: `calc(${ringSize} - 24px)`, height: `calc(${ringSize} - 24px)` }}>
                    <video 
                        ref={videoRef} 
                        className="camera-video-feed" 
                        playsInline 
                        muted 
                        autoPlay
                    />
                    <div className="camera-scanning-line" style={{ '--exercise-color': activeColor }} />
                    
                    {cameraError === 'permission_denied' && (
                        <div className="camera-calibration-overlay">
                            <span style={{ fontSize: '0.8rem', color: '#f87171', fontWeight: '700' }}>
                                {t ? t('counter.cameraNoPermission') : 'Accès caméra refusé'}
                            </span>
                        </div>
                    )}
                    
                    {!cameraError && !isCalibrated && calibrateCountdown > 0 && (
                        <div className="camera-calibration-overlay">
                            <div className="camera-countdown-num" style={{ '--exercise-color': activeColor, fontSize: '4.5rem' }}>{calibrateCountdown}</div>
                        </div>
                    )}

                    {!cameraError && !isCalibrated && calibrateCountdown === 0 && (
                        <div className="camera-calibration-overlay">
                            <span style={{ fontSize: '0.75rem', color: 'white', opacity: 0.8 }}>
                                {t ? t('counter.cameraLoading') : 'Chargement...'}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Reps / Timer Numbers */}
            {!isCameraActive && (
                <div style={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none'
                }}>
                    <div
                        className={!isTimer && isAnimating ? 'scale-in' : ''}
                        style={{
                            fontSize: isTimer ? timeFontSize : 'clamp(4rem, 12vw, 6rem)',
                            fontWeight: '800',
                            color: isCompleted ? activeColor : 'var(--text-primary)',
                            lineHeight: 1,
                            transition: 'color 0.45s ease, font-size 0.45s ease',
                            fontVariantNumeric: 'tabular-nums',
                            maxWidth: isTimer ? '88%' : undefined,
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {isTimer ? displayTime : displayCount}
                    </div>
                    <div style={{ 
                        fontSize: 'clamp(1rem, 3vw, 1.3rem)', 
                        color: 'var(--text-secondary)', 
                        marginTop: '8px'
                    }}>
                        / {isTimer ? goalTime : dailyGoal}
                    </div>
                </div>
            )}
        </div>
    );
}

function StatusLine({ activeColor, exerciseLabel, gradEnd, gradStart, isCompleted, isTimer, remaining, t }) {
    if (!isCompleted) {
        return (
            <div style={{
                color: 'var(--text-secondary)',
                fontSize: '1rem',
                minHeight: '52px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {isTimer ? t('timer.remaining', { time: formatTime(remaining) }) : t('common.remaining', { count: remaining })}
            </div>
        );
    }

    return (
        <div className="scale-in" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 28px',
            borderRadius: 'var(--radius-lg)',
            background: `linear-gradient(135deg, ${activeColor}18, ${gradEnd}18)`,
            border: `1px solid ${activeColor}44`,
            boxShadow: `0 0 16px ${activeColor}22`,
            minHeight: '52px',
            boxSizing: 'border-box'
        }}>
            <Check size={24} color={activeColor} strokeWidth={3} />
            <span style={{
                color: activeColor,
                fontWeight: '600',
                fontSize: '1.1rem',
                background: `linear-gradient(135deg, ${gradStart}, ${gradEnd})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
            }}>
                {isTimer ? t('timer.validated') : t('counter.validated', { exercise: exerciseLabel })}
            </span>
        </div>
    );
}

function TimerControls({
    activeColor,
    completeFlash,
    displayCount,
    gradEnd,
    handleCompleteAll,
    handleReset,
    isCompleted,
    isRunning,
    setIsRunning,
    t
}) {
    return (
        <>
            {!isCompleted && (
                <button
                    onClick={() => setIsRunning(!isRunning)}
                    className="glass hover-lift ripple"
                    style={{
                        width: 'clamp(72px, 12vh, 90px)',
                        height: 'clamp(72px, 12vh, 90px)',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${activeColor}44, ${gradEnd}44)`,
                        border: `2px solid ${activeColor}`,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: '10px',
                        boxShadow: `0 0 20px ${activeColor}66`,
                        transition: 'background 0.45s ease, border-color 0.45s ease, box-shadow 0.45s ease'
                    }}
                >
                    {isRunning ? <Pause size={36} fill="white" /> : <Play size={36} fill="white" style={{ marginLeft: '4px' }} />}
                </button>
            )}
            <ActionButtons
                activeColor={activeColor}
                completeFlash={completeFlash}
                completeLabel={t('timer.skip')}
                displayCount={displayCount}
                gradEnd={gradEnd}
                isCompleted={isCompleted}
                onComplete={handleCompleteAll}
                onReset={handleReset}
                resetLabel={t('timer.reset')}
            />
        </>
    );
}

function CounterControls({
    activeColor,
    completeFlash,
    displayCount,
    gradEnd,
    handleCompleteAll,
    handleDecrement,
    handleIncrement,
    handleReset,
    isCompleted,
    t
}) {
    return (
        <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'clamp(6px, 1vh, 8px)', width: '100%', maxWidth: '360px' }}>
                {[1, 2, 5, 10].map(amount => (
                    <button
                        key={`plus-${amount}`}
                        onClick={() => handleIncrement(amount)}
                        className="glass hover-lift ripple"
                        disabled={isCompleted}
                        style={{
                            padding: 'clamp(12px, 2.2vh, 20px) 8px',
                            borderRadius: 'var(--radius-md)',
                            background: `linear-gradient(135deg, ${activeColor}2a, ${gradEnd}2a)`,
                            border: `1px solid ${activeColor}44`,
                            color: isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)',
                            fontSize: 'clamp(1rem, 2.8vw, 1.3rem)',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            minHeight: 'var(--touch-min)',
                            cursor: isCompleted ? 'not-allowed' : 'pointer',
                            opacity: isCompleted ? 0.4 : 1,
                            transition: 'background 0.45s ease, border-color 0.45s ease, opacity 0.2s ease'
                        }}
                    >
                        <Plus size={16} />
                        {amount}
                    </button>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'clamp(6px, 1vh, 8px)', width: '100%', maxWidth: '200px' }}>
                {[1, 5].map(amount => {
                    const canDecrement = displayCount > 0;
                    return (
                        <button
                            key={`minus-${amount}`}
                            onClick={() => handleDecrement(amount)}
                            className="glass hover-lift ripple"
                            disabled={!canDecrement}
                            style={{
                                padding: 'clamp(10px, 1.8vh, 16px) 8px',
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: !canDecrement ? 'var(--text-secondary)' : 'var(--text-primary)',
                                fontSize: 'clamp(0.95rem, 2.5vw, 1.15rem)',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                minHeight: 'var(--touch-min)',
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

            <ActionButtons
                activeColor={activeColor}
                completeFlash={completeFlash}
                completeLabel={t('counter.completeAll')}
                displayCount={displayCount}
                gradEnd={gradEnd}
                isCompleted={isCompleted}
                onComplete={handleCompleteAll}
                onReset={handleReset}
                resetLabel={t('counter.reset')}
            />
        </>
    );
}

function ActionButtons({
    activeColor,
    completeFlash,
    completeLabel,
    displayCount,
    gradEnd,
    isCompleted,
    onComplete,
    onReset,
    resetLabel
}) {
    return (
        <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginTop: 'var(--spacing-sm)'
        }}>
            <button
                onClick={onReset}
                className="glass hover-lift"
                disabled={displayCount === 0}
                style={{
                    padding: 'clamp(10px, 1.5vh, 13px) clamp(16px, 3vw, 24px)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: displayCount === 0 ? 'var(--text-secondary)' : 'var(--error)',
                    fontSize: 'clamp(0.85rem, 2.2vw, 1rem)',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: displayCount === 0 ? 'not-allowed' : 'pointer',
                    opacity: displayCount === 0 ? 0.5 : 1,
                    minHeight: 'var(--touch-min)'
                }}
            >
                <RotateCcw size={18} />
                {resetLabel}
            </button>

            <button
                onClick={onComplete}
                className={`glass hover-lift${completeFlash ? ' complete-flash success-glow' : ''}`}
                disabled={isCompleted}
                style={{
                    padding: 'clamp(10px, 1.5vh, 13px) clamp(16px, 3vw, 24px)',
                    borderRadius: 'var(--radius-lg)',
                    background: isCompleted
                        ? `linear-gradient(135deg, ${activeColor}33, ${gradEnd}33)`
                        : `linear-gradient(135deg, ${activeColor}22, ${gradEnd}22)`,
                    border: `1px solid ${isCompleted ? activeColor + '66' : activeColor + '44'}`,
                    color: isCompleted ? activeColor : 'var(--text-primary)',
                    fontSize: 'clamp(0.85rem, 2.2vw, 1rem)',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: isCompleted ? 'not-allowed' : 'pointer',
                    opacity: isCompleted ? 0.6 : 1,
                    transition: 'all 0.3s ease',
                    minHeight: 'var(--touch-min)'
                }}
            >
                <CheckCheck size={18} />
                {completeLabel}
            </button>
        </div>
    );
}
