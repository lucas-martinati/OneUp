import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp, Camera, CameraOff, RefreshCw } from 'lucide-react';
import { CSSConfetti } from '../feedback/CSSConfetti';
import { sounds } from '@utils/soundManager';
import { haptics } from '@utils/hapticsManager';
import { formatTime } from '@utils/formatters';
import { getExerciseLabel } from '@utils/exerciseLabel';
import { WEIGHT_EXERCISES_MAP } from '@config/weights';
import { useExerciseConfig } from '@hooks/useExerciseConfig';
import { useWakeLock } from '@hooks/useWakeLock';
import { Z_INDEX } from '@utils/zIndex';
import { useSettingsStore } from '@store/useSettingsStore';
import { useCloudSyncStore } from '@store/useCloudSyncStore';
import { useCameraPushUpCounter } from '@hooks/useCameraPushUpCounter';
import { EventHud } from '@features/events';
import { Button, FitToView, ModalContainer, ModalHeader } from '@components/ui';
import { Check, CheckCheck, ChevronRight, DynamicIcon, Minus, Pause, Play, Plus, RotateCcw } from '@utils/icons';
import styles from './ExercisePanel.module.css';

/* ── Private sub-components (single-use, kept local to this panel) ───── */

function PanelHeader({ activeColor, exerciseConfig, exerciseLabel, onClose, onNext, hideNextButton, t }) {
    const showNextButton = onNext && !hideNextButton;

    return (
        <ModalHeader
            title={exerciseLabel}
            icon={(props) => <DynamicIcon icon={exerciseConfig?.icon} {...props} color={activeColor} />}
            onClose={onClose}
            style={{ '--accent': activeColor, '--accent-glow': activeColor }}
            extraElements={showNextButton && (
                <Button
                    variant="ghost"
                    onClick={onNext}
                    style={{
                        padding: '8px 14px',
                        borderRadius: 'var(--radius-full)',
                        background: `${activeColor}1f`,
                        border: `1px solid ${activeColor}44`,
                        color: activeColor,
                        fontSize: '0.82rem',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        cursor: 'pointer',
                        minHeight: 'var(--touch-min)',
                        whiteSpace: 'nowrap',
                        transition: 'background 0.45s ease, border-color 0.45s ease, color 0.45s ease'
                    }}
                >
                    <span>{t('common.next')}</span>
                    <ChevronRight size={16} />
                </Button>
            )}
        />
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
            gap: '10px',
            marginBottom: 'var(--space-2)'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 8px 8px 18px',
                borderRadius: 'var(--radius-full)',
                background: `linear-gradient(135deg, ${activeColor}16, ${activeColor}08)`,
                border: `1px solid ${activeColor}33`
            }}>
                <span style={{
                    fontSize: '0.62rem', fontWeight: '700', letterSpacing: '0.14em',
                    textTransform: 'uppercase', color: 'var(--text-secondary)', opacity: 0.8
                }}>
                    {t('weight.kg')}
                </span>
                <input
                    type="number"
                    inputMode="decimal"
                    value={localWeightStr}
                    onChange={(e) => setLocalWeightStr(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleValidateWeight()}
                    onBlur={handleValidateWeight}
                    style={{
                        width: Math.max(38, localWeightStr.length * 15 + 8) + 'px',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        fontSize: '1.5rem',
                        fontWeight: '800',
                        color: activeColor,
                        textAlign: 'center'
                    }}
                />
                <Button
                    onClick={handleValidateWeight}
                    disabled={isUnchanged}
                    iconOnly
                    aria-label={t('weight.kg')}
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: isUnchanged ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg, ${activeColor}, ${activeColor}cc)`,
                        border: isUnchanged ? '1px solid rgba(255,255,255,0.08)' : 'none',
                        cursor: isUnchanged ? 'default' : 'pointer',
                        color: isUnchanged ? 'var(--text-secondary)' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: isUnchanged ? 'none' : `0 4px 14px ${activeColor}55`,
                        transition: 'all 0.2s',
                        opacity: isUnchanged ? 0.5 : 1
                    }}
                >
                    <Check size={20} />
                </Button>
            </div>
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

    timeFontSize,
    countFontSize = 'clamp(4rem, 12vw, 6rem)',
    // Camera props
    isCameraActive = false,
    videoRef = null,
    cameraError = null,
    isCalibrated = false,
    calibrateCountdown = 0,
    pushupState = 'up',
    t
}) {
    const label = isTimer ? t('cardio.duration') : t('common.reps');

    let filterVal = `drop-shadow(0 0 5px ${activeColor}55)`;
    if (isCompleted) {
        filterVal = `drop-shadow(0 0 12px ${activeColor}aa)`;
    } else if (isTimer && isRunning) {
        filterVal = 'none';
    }

    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                margin: 'auto',
                maxHeight: '100%',
                maxWidth: '100%',
                aspectRatio: '1 / 1',
                // Expose the accent colour to the halo / container-query units.
                containerType: 'inline-size',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                '--ex': activeColor,
                '--exercise-color': activeColor,
                '--exercise-color-dim': activeColor + '15'
            }}
        >
            {/* Hero halo — soft pool of colour behind the ring, brighter when done */}
            {!isCameraActive && (
                <div
                    className={styles.ringHalo}
                    style={{
                        background: `radial-gradient(circle, ${activeColor}${isCompleted ? '2e' : '16'} 0%, transparent 62%)`,
                        opacity: isCompleted ? 0.9 : 0.7,
                        transform: isCompleted ? 'scale(1.04)' : 'scale(1)'
                    }}
                />
            )}

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
                <circle cx="110" cy="110" r={ringRadius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
                <circle
                    cx="110"
                    cy="110"
                    r={ringRadius}
                    fill="none"
                    stroke={isCompleted ? activeColor : `url(#${gradientId})`}
                    strokeWidth="9"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringCircumference * (1 - progress / 100)}
                    strokeLinecap="round"
                    transform="rotate(-90 110 110)"
                    style={{
                        transition: `${isTimer && isRunning ? 'stroke-dashoffset 1s linear' : 'stroke-dashoffset 0.45s ease'}, stroke 0.45s ease, filter 0.45s ease`,
                        // Glow is a paint-time filter. While a timer is actively
                        // running the ring repaints every frame, so we drop the
                        // filter then to avoid per-frame repaints (battery/heat).
                        filter: filterVal
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
                <div
                    className={`camera-video-wrapper${isCalibrated && pushupState === 'down' ? ' is-down' : ''}`}
                    style={{ width: `calc(100% - 24px)`, height: `calc(100% - 24px)`, '--exercise-color': activeColor }}
                >
                    <video
                        ref={videoRef}
                        className="camera-video-feed"
                        playsInline
                        muted
                        autoPlay
                    />

                    {/* Accent rim that reacts to the rep state (cheap: toggles on state, not per-frame) */}
                    <div className="camera-video-rim" />

                    {/* Scanning sweep only while calibrating — keeps the active phase cool */}
                    {!cameraError && !isCalibrated && (
                        <div className="camera-scanning-line" />
                    )}

                    {cameraError === 'permission_denied' && (
                        <div className="camera-calibration-overlay">
                            <span className="camera-overlay-error">
                                {t('counter.cameraNoPermission')}
                            </span>
                        </div>
                    )}

                    {!cameraError && !isCalibrated && calibrateCountdown > 0 && (
                        <div className="camera-calibration-overlay">
                            <div className="camera-countdown-num">{calibrateCountdown}</div>
                            <span className="camera-overlay-hint">{t('counter.cameraHoldStill')}</span>
                        </div>
                    )}

                    {!cameraError && !isCalibrated && calibrateCountdown === 0 && (
                        <div className="camera-calibration-overlay">
                            <span className="camera-spinner" />
                            <span className="camera-overlay-hint">{t('counter.cameraLoading')}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Reps / Timer readout — absolutely centred so it stays dead-centre
                regardless of the SVG and font metrics. */}
            {!isCameraActive && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none'
                }}>
                    <span style={{
                        fontSize: 'clamp(0.6rem, 1.6vh, 0.72rem)',
                        fontWeight: '700',
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: 'var(--text-secondary)',
                        opacity: 0.7,
                        marginBottom: '2px'
                    }}>
                        {label}
                    </span>
                    <div
                        className={!isTimer && isAnimating ? 'scale-in' : ''}
                        style={{
                            fontSize: isTimer ? timeFontSize : countFontSize,
                            fontWeight: '800',
                            color: isCompleted ? activeColor : 'var(--text-primary)',
                            lineHeight: 1,
                            transition: 'color 0.45s ease, font-size 0.45s ease',
                            fontVariantNumeric: 'tabular-nums',
                            maxWidth: '90%',
                            textAlign: 'center',
                            whiteSpace: 'nowrap',
                            textShadow: isCompleted ? `0 0 22px ${activeColor}55` : 'none'
                        }}
                    >
                        {isTimer ? displayTime : displayCount}
                    </div>
                    <div style={{
                        fontSize: 'clamp(0.95rem, 2.8vw, 1.25rem)',
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        marginTop: '6px',
                        maxWidth: '90%',
                        textAlign: 'center',
                        whiteSpace: 'nowrap'
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: 'var(--text-secondary)',
                fontSize: 'clamp(0.85rem, 2.4vw, 1rem)',
                fontWeight: '500',
                minHeight: '48px',
                boxSizing: 'border-box'
            }}>
                <span style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    background: activeColor, flexShrink: 0,
                    boxShadow: `0 0 8px ${activeColor}`
                }} />
                {isTimer ? t('timer.remaining', { time: formatTime(remaining) }) : t('common.remaining', { count: remaining })}
            </div>
        );
    }

    return (
        <div className="scale-in" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '10px 24px',
            borderRadius: 'var(--radius-full)',
            background: `linear-gradient(135deg, ${activeColor}22, ${gradEnd}1a)`,
            border: `1px solid ${activeColor}55`,
            boxShadow: `0 0 22px ${activeColor}33`,
            minHeight: '48px',
            boxSizing: 'border-box'
        }}>
            <Check size={22} color={activeColor} strokeWidth={3} />
            <span style={{
                fontWeight: '700',
                fontSize: 'clamp(0.95rem, 2.6vw, 1.1rem)',
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(12px, 2vh, 20px)', width: '100%', maxWidth: '360px' }}>
            {!isCompleted && (
                <Button
                    variant="ghost"
                    onClick={() => setIsRunning(!isRunning)}
                    className="ripple"
                    aria-label={isRunning ? t('timer.reset') : t('common.next')}
                    style={{
                        width: 'clamp(76px, 13vh, 96px)',
                        height: 'clamp(76px, 13vh, 96px)',
                        borderRadius: '50%',
                        background: isRunning
                            ? `linear-gradient(135deg, ${activeColor}, ${gradEnd})`
                            : `radial-gradient(circle at 50% 35%, ${activeColor}cc, ${gradEnd})`,
                        border: 'none',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 10px 30px ${activeColor}66, 0 0 0 6px ${activeColor}1f, inset 0 2px 0 rgba(255,255,255,0.3)`,
                        transition: 'background 0.35s ease, box-shadow 0.35s ease, transform 0.2s ease'
                    }}
                >
                    {isRunning ? <Pause size={34} fill="white" /> : <Play size={34} fill="white" style={{ marginLeft: '5px' }} />}
                </Button>
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
        </div>
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(8px, 1.4vh, 12px)', width: '100%', maxWidth: '360px' }}>
            {/* Primary interaction: increment quad */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'clamp(6px, 1vh, 8px)', width: '100%' }}>
                {[1, 2, 5, 10].map(amount => (
                    <Button
                        variant="ghost"
                        key={`plus-${amount}`}
                        onClick={() => handleIncrement(amount)}
                        className="ripple"
                        disabled={isCompleted}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '1px',
                            padding: 'clamp(12px, 2.2vh, 18px) 4px',
                            borderRadius: 'var(--radius-md)',
                            background: `linear-gradient(160deg, ${activeColor}33, ${gradEnd}1a)`,
                            border: `1px solid ${activeColor}55`,
                            color: isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)',
                            fontSize: 'clamp(1.1rem, 3.2vw, 1.45rem)',
                            fontWeight: '800',
                            fontVariantNumeric: 'tabular-nums',
                            minHeight: 'var(--touch-min)',
                            cursor: isCompleted ? 'not-allowed' : 'pointer',
                            opacity: isCompleted ? 0.35 : 1,
                            boxShadow: isCompleted ? 'none' : `0 3px 12px ${activeColor}26`,
                            transition: 'background 0.45s ease, border-color 0.45s ease, opacity 0.2s ease, transform 0.12s ease'
                        }}
                    >
                        <Plus size={14} style={{ opacity: 0.7 }} />
                        {amount}
                    </Button>
                ))}
            </div>

            {/* Utility row: decrements + reset */}
            <div style={{ display: 'flex', gap: 'clamp(6px, 1vh, 8px)', width: '100%' }}>
                {[1, 5].map(amount => {
                    const canDecrement = displayCount > 0;
                    return (
                        <Button
                            variant="ghost"
                            key={`minus-${amount}`}
                            onClick={() => handleDecrement(amount)}
                            className="ripple"
                            disabled={!canDecrement}
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                padding: 'clamp(9px, 1.6vh, 13px) 4px',
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid rgba(255, 255, 255, 0.09)',
                                color: !canDecrement ? 'var(--text-secondary)' : 'var(--text-primary)',
                                fontSize: 'clamp(0.85rem, 2.4vw, 1rem)',
                                fontWeight: '600',
                                fontVariantNumeric: 'tabular-nums',
                                minHeight: 'var(--touch-min)',
                                cursor: !canDecrement ? 'not-allowed' : 'pointer',
                                opacity: !canDecrement ? 0.4 : 1
                            }}
                        >
                            <Minus size={14} style={{ opacity: 0.7 }} />
                            {amount}
                        </Button>
                    );
                })}
                <ResetButton onReset={handleReset} disabled={displayCount === 0} label={t('counter.reset')} />
            </div>

            {/* Primary CTA */}
            <CompleteButton
                activeColor={activeColor}
                gradEnd={gradEnd}
                completeFlash={completeFlash}
                isCompleted={isCompleted}
                onComplete={handleCompleteAll}
                label={t('counter.completeAll')}
            />
        </div>
    );
}

/** Subtle, danger-tinted reset (utility). */
function ResetButton({ onReset, disabled, label }) {
    return (
        <Button
            variant="ghost"
            onClick={onReset}

            disabled={disabled}
            style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: 'clamp(9px, 1.6vh, 13px) 4px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.22)',
                color: disabled ? 'var(--text-secondary)' : 'var(--error)',
                fontSize: 'clamp(0.85rem, 2.4vw, 1rem)',
                fontWeight: '600',
                minHeight: 'var(--touch-min)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.4 : 1
            }}
        >
            <RotateCcw size={16} />
            {label}
        </Button>
    );
}

/** Filled primary call-to-action: complete the exercise. */
function CompleteButton({ activeColor, gradEnd, completeFlash, isCompleted, onComplete, label }) {
    return (
        <Button
            variant="ghost"
            onClick={onComplete}
            className={`ripple${completeFlash ? ' complete-flash success-glow' : ''}`}
            disabled={isCompleted}
            style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: 'clamp(13px, 2vh, 17px)',
                borderRadius: 'var(--radius-lg)',
                background: isCompleted
                    ? `linear-gradient(135deg, ${activeColor}26, ${gradEnd}1a)`
                    : `linear-gradient(135deg, ${activeColor}, ${gradEnd})`,
                border: isCompleted ? `1px solid ${activeColor}55` : 'none',
                color: isCompleted ? activeColor : 'white',
                fontSize: 'clamp(0.95rem, 2.6vw, 1.1rem)',
                fontWeight: '800',
                cursor: isCompleted ? 'not-allowed' : 'pointer',
                opacity: isCompleted ? 0.65 : 1,
                boxShadow: isCompleted ? 'none' : `0 8px 24px ${activeColor}55, inset 0 2px 0 rgba(255,255,255,0.25)`,
                transition: 'background 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease',
                minHeight: 'var(--touch-min)'
            }}
        >
            <CheckCheck size={20} />
            {label}
        </Button>
    );
}

/** Reset + Complete pair, used by the timer (skip = complete). */
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
        <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch', width: '100%' }}>
            <ResetButton onReset={onReset} disabled={displayCount === 0} label={resetLabel} />
            <div style={{ flex: 1.6, display: 'flex' }}>
                <CompleteButton
                    activeColor={activeColor}
                    gradEnd={gradEnd}
                    completeFlash={completeFlash}
                    isCompleted={isCompleted}
                    onComplete={onComplete}
                    label={completeLabel}
                />
            </div>
        </div>
    );
}

/** Toggle buttons for the camera push-up counter, plus its description hint. */
function CameraModeBar({
    activeColor, isCameraActive, isCalibrated,
    startCamera, stopCamera, recalibrate, t
}) {
    return (
        <>
            <div className="camera-mode-bar">
                <Button
                    variant="ghost"
                    onClick={isCameraActive ? stopCamera : startCamera}
                    className={`camera-mode-toggle glass${isCameraActive ? ' is-active' : ''}`}
                    style={{ '--exercise-color': activeColor }}
                >
                    <span className="camera-mode-toggle-icon">
                        {isCameraActive ? <CameraOff size={16} /> : <Camera size={16} />}
                    </span>
                    {t('counter.cameraMode')}
                </Button>

                {isCameraActive && isCalibrated && (
                    <Button
                        variant="ghost"
                        onClick={recalibrate}
                        className="camera-recal-btn glass"
                        aria-label={t('counter.cameraCalibrate')}
                    >
                        <RefreshCw size={14} />
                        {t('counter.cameraCalibrate')}
                    </Button>
                )}
            </div>

            {!isCameraActive && (
                <p className="camera-mode-hint">
                    {t('counter.cameraModeDesc')}
                </p>
            )}
        </>
    );
}

/** Live reps counter + depth gauge shown below the ring while the camera is active. */
function CameraLiveStats({
    activeColor, displayCount, dailyGoal,
    proximity, isCalibrated, calibrateCountdown, pushupState, t
}) {
    const isDown = pushupState === 'down';
    const depth = Math.max(0, Math.min(100, proximity)) / 100;

    return (
        <div className="camera-live-card glass" style={{ '--exercise-color': activeColor }}>
            {isCalibrated ? (
                <>
                    <div className="camera-live-top">
                        <span className={`camera-state-pill${isDown ? ' is-down' : ''}`}>
                            {isDown ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                            {isDown ? t('counter.cameraStateDown') : t('counter.cameraStateUp')}
                        </span>

                        <span className="camera-live-reps">
                            <span className="camera-live-reps-num">{displayCount}</span>
                            <span className="camera-live-reps-goal">/ {dailyGoal}</span>
                        </span>
                    </div>

                    <div className="camera-depth">
                        <span className="camera-depth-label">{t('counter.cameraDepth')}</span>
                        <div className="camera-depth-track">
                            <div
                                className="camera-depth-fill"
                                style={{ transform: `scaleX(${depth})` }}
                            />
                        </div>
                    </div>
                </>
            ) : (
                <div className="camera-live-status">
                    <span className="camera-spinner" />
                    <span>
                        {calibrateCountdown > 0
                            ? t('counter.cameraCalibrating', { count: calibrateCountdown })
                            : t('counter.cameraLoading')}
                    </span>
                </div>
            )}
        </div>
    );
}

/* ── Main panel ─────────────────────────────────────────────────────── */

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

    const pauseCloudSync = useCloudSyncStore(s => s.pauseCloudSync);
    const resumeCloudSync = useCloudSyncStore(s => s.resumeCloudSync);

    const { t } = useTranslation();
    const { getConfig, updateConfig } = useExerciseConfig();
    const isTimer = exerciseConfig?.type === 'timer';
    const [isAnimating, setIsAnimating] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [completeFlash, setCompleteFlash] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [wasCompleted, setWasCompleted] = useState(isCompleted);
    const [hasCelebrated, setHasCelebrated] = useState(false);
    const autoAdvanceTimer = useRef(null);

    const isWeightExercise = !isTimer && !!WEIGHT_EXERCISES_MAP[exerciseConfig?.id];
    const currentWeight = isWeightExercise ? getConfig(exerciseConfig?.id).weight : null;
    const [localWeightStr, setLocalWeightStr] = useState('');

    // Pause background animations to save battery when screen is kept on
    // And pause cloud sync to prevent reps from resetting when ExercisePanel is open
    useEffect(() => {
        document.body.classList.add('exercise-panel-active');
        pauseCloudSync();
        return () => {
            document.body.classList.remove('exercise-panel-active');
            resumeCloudSync();
        };
    }, [pauseCloudSync, resumeCloudSync]);

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
        // Cancel a pending auto-advance: advancing manually (Enter / next
        // button) during the celebration window must not skip a 2nd exercise.
        return () => clearTimeout(autoAdvanceTimer.current);
    }, [exerciseConfig?.id, isCompleted]);

    // Desktop: Enter skips to the next exercise of the session. Text fields
    // keep their own Enter handling (e.g. the weight input validates on Enter).
    useEffect(() => {
        if (!isSession || !onNext || hideNextButton) return undefined;
        const handleKeyDown = (e) => {
            if (e.key !== 'Enter' || e.repeat) return;
            const target = e.target;
            if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return;
            e.preventDefault();
            onNext();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSession, onNext, hideNextButton]);

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

            if (onNext) {
                clearTimeout(autoAdvanceTimer.current);
                autoAdvanceTimer.current = setTimeout(() => onNext(), 1500);
            }
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
    let countFontSize = 'clamp(3rem, 45cqw, 6rem)';
    if (goalDigits >= 4) {
        countFontSize = 'clamp(2rem, 28cqw, 3.6rem)';
    } else if (goalDigits === 3) {
        countFontSize = 'clamp(2.5rem, 35cqw, 4.6rem)';
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
        const newCount = Math.min(currentCount + amount, dailyGoal);
        if (newCount > 0 && (newCount % 10 === 0 || newCount === dailyGoal)) {
            haptics.success();
        }
        onUpdateCount(newCount);
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
            className={`modal-content ${styles.content} ${isSession && fadeIn ? 'fade-in' : ''} ${isTimer && isRunning ? styles.oledSaverMode : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label={exerciseLabel}
            style={{ '--ex': activeColor, '--ex2': gradEnd, minHeight: 0 }}
        >
            {/* Atmospheric backdrop — a pool of the exercise colour that gives
                the flat overlay depth and intensifies on completion. */}
            <div className={`${styles.atmosphere} ${isCompleted ? styles.atmosphereDone : ''}`} />
            <div className={styles.vignette} />

            <FitToView style={{ flex: 1, minHeight: 0, height: '100%' }} contentStyle={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', gap: 'clamp(6px, 1.2vh, 16px)', height: '100%' }}>
                <div className={`${styles.rise} ${styles.rise1}`} style={{ width: '100%' }}>
                    <PanelHeader
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
                    minHeight: 0,
                    width: '100%',
                    gap: 'clamp(6px, 1.2vh, 16px)'
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

                    <div style={{ width: '100%', flex: '0 1 240px', minHeight: 0, position: 'relative' }}>
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
                    </div>

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
                    {!isCameraActive && (
                        <div style={{
                            marginTop: '8px',
                            marginBottom: '4px',
                            padding: '8px 16px',
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
                            {t('common.tips', { returnObjects: true })[(dayNumber || 0) % 5]}
                        </div>
                    )}
                </div>
            </FitToView>
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
                <ModalContainer 
                    open={true} 
                    onClose={onClose} 
                    unstyled 
                    closeOnBackdrop={false}
                    style={{ zIndex: Z_INDEX.TOAST }}
                    className={fadeIn ? '' : 'no-fade-in'}
                >
                    {content}
                </ModalContainer>
            )}
        </>
    );
}