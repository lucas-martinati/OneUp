import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CSSConfetti } from '../feedback/CSSConfetti';
import { sounds } from '@utils/soundManager';
import { haptics } from '@utils/hapticsManager';
import { formatTime } from '@utils/dateUtils';
import { getExerciseLabel } from '@utils/exerciseLabel';
import { WEIGHT_EXERCISES_MAP } from '@config/weights';
import { useExerciseConfig } from '@hooks/useExerciseConfig';
import { useWakeLock } from '@hooks/useWakeLock';
import { Z_INDEX } from '@utils/zIndex';
import { useSettingsStore } from '@store/useSettingsStore';
import { useCameraPushUpCounter } from '@hooks/useCameraPushUpCounter';
import { ExercisePanelHeader } from './panel/ExercisePanelHeader';
import { WeightSelector } from './panel/WeightSelector';
import { ProgressRing } from './panel/ProgressRing';
import { StatusLine } from './panel/StatusLine';
import { TimerControls, CounterControls } from './panel/Controls';
import { CameraModeBar, CameraLiveStats } from './panel/CameraControls';
import { EventHud } from '@features/events';
import styles from './panel/ExercisePanel.module.css';

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
                haptics.success();
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
    let timeFontSize = 'clamp(2.2rem, 30cqw, 4.2rem)';
    if (displayTime.length >= 6) {
        timeFontSize = 'clamp(1.6rem, 19cqw, 2.8rem)';
    } else if (displayTime.length >= 5) {
        timeFontSize = 'clamp(1.9rem, 24cqw, 3.4rem)';
    }

    // Rep count font scales down with digit count (based on the goal, so the
    // size stays stable while counting up) to keep large values inside the ring.
    const goalDigits = String(dailyGoal || 0).length;
    let countFontSize = 'clamp(4rem, 12vw, 6rem)';
    if (goalDigits >= 4) {
        countFontSize = 'clamp(2.5rem, 7.5vw, 3.6rem)';
    } else if (goalDigits === 3) {
        countFontSize = 'clamp(3.1rem, 9.5vw, 4.6rem)';
    }

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
        haptics.light();
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
            className={`modal-content ${styles.content} ${isSession && fadeIn ? 'fade-in' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label={exerciseLabel}
            style={{ '--ex': activeColor, '--ex2': gradEnd }}
        >
            {/* Atmospheric backdrop — a pool of the exercise colour that gives
                the flat overlay depth and intensifies on completion. */}
            <div className={`${styles.atmosphere} ${isCompleted ? styles.atmosphereDone : ''}`} />
            <div className={styles.vignette} />

            <div className={`${styles.rise} ${styles.rise1}`}>
            <ExercisePanelHeader
                activeColor={activeColor}
                exerciseConfig={exerciseConfig}
                exerciseLabel={exerciseLabel}
                onClose={onClose}
                onNext={onNext}
                hideNextButton={hideNextButton}
                t={t}
            />
            </div>

            {/* HUD d'événement spécial (thermomètre / constellation) intégré au panneau */}
            <EventHud placement="panel" />

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

            <div className={`${styles.rise} ${styles.rise2}`} style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'clamp(10px, 2vh, 18px)'
            }}>
                {isPushups && (
                    <CameraModeBar
                        activeColor={activeColor}
                        isCameraActive={isCameraActive}
                        isCalibrated={isCalibrated}
                        startCamera={startCamera}
                        stopCamera={stopCamera}
                        recalibrate={recalibrate}
                        t={t}
                    />
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
                    countFontSize={countFontSize}
                    isCameraActive={isCameraActive}
                    videoRef={videoRef}
                    cameraError={cameraError}
                    isCalibrated={isCalibrated}
                    calibrateCountdown={calibrateCountdown}
                    pushupState={pushupState}
                    t={t}
                />

                {isCameraActive ? (
                    <CameraLiveStats
                        activeColor={activeColor}
                        displayCount={displayCount}
                        dailyGoal={dailyGoal}
                        proximity={proximity}
                        isCalibrated={isCalibrated}
                        calibrateCountdown={calibrateCountdown}
                        pushupState={pushupState}
                        t={t}
                    />
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
                    />
                )}
            </div>

            {!isCameraActive && (
                <div className={`${styles.rise} ${styles.rise3}`} style={{
                    marginTop: 'auto',
                    marginBottom: '8px',
                    padding: '10px 18px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255,255,255,0.035)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    lineHeight: 1.45,
                    textAlign: 'center',
                    alignSelf: 'center',
                    width: '90%',
                    maxWidth: '320px',
                    border: '1px solid rgba(255,255,255,0.06)'
                }}>
                    <span style={{ marginRight: '4px' }}>{'\u{1F4A1}'}</span>
                    {t(isTimer ? 'timer.tips' : 'counter.tips', { returnObjects: true })[(dayNumber || 0) % 5]}
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
