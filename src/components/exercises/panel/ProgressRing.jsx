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
    t = null
}) {
    const label = isTimer ? (t ? t('common.duration', 'Temps') : 'Temps') : (t ? t('common.reps') : 'reps');

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
                        background: `radial-gradient(circle, ${activeColor}${isCompleted ? '40' : '24'} 0%, transparent 70%)`,
                        opacity: isCompleted ? 1 : 0.85,
                        transform: isCompleted ? 'scale(1.08)' : 'scale(1)'
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
                    className={isCameraActive ? 'camera-active-ring-pulse' : ''}
                    style={{
                        transition: `${isTimer && isRunning ? 'stroke-dashoffset 1s linear' : 'stroke-dashoffset 0.45s ease'}, stroke 0.45s ease, filter 0.45s ease`,
                        // Glow is a paint-time filter. While a timer is actively
                        // running the ring repaints every frame, so we drop the
                        // filter then to avoid per-frame repaints (battery/heat).
                        filter: isCompleted
                            ? `drop-shadow(0 0 12px ${activeColor}aa)`
                            : (isTimer && isRunning ? 'none' : `drop-shadow(0 0 5px ${activeColor}55)`)
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
