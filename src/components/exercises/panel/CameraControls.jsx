import { Camera, CameraOff, RefreshCw } from 'lucide-react';

/** Toggle buttons for the camera push-up counter, plus its description hint. */
export function CameraModeBar({
    activeColor, isCameraActive, isCalibrated,
    startCamera, stopCamera, recalibrate, t
}) {
    return (
        <>
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

            {!isCameraActive && (
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
        </>
    );
}

/** Live reps counter + proximity bar shown below the ring while the camera is active. */
export function CameraLiveStats({
    activeColor, exerciseConfig, displayCount, dailyGoal,
    proximity, isCalibrated, calibrateCountdown, pushupState, t
}) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '280px', minHeight: '52px', gap: '16px' }}>
            {/* Reps counter left side */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flexShrink: 0 }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>
                    {t('common.reps')}
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                    <span style={{ fontSize: '2.2rem', fontWeight: '800', color: activeColor, lineHeight: 0.9 }}>
                        {displayCount}
                    </span>
                    <span style={{ fontSize: '1.05rem', color: 'var(--text-secondary)' }}>
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
    );
}
