import styles from './ExercisePanel.module.css';

export function ProgressRing({
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
                position: 'relative',
                width: ringSize,
                height: ringSize,
                // Keep the ring at full size whatever the controls' height, and
                // expose the accent colour to the halo / container-query units.
                flexShrink: 0,
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
                    style={{ width: `calc(${ringSize} - 24px)`, height: `calc(${ringSize} - 24px)`, '--exercise-color': activeColor }}
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
