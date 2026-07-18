import { Camera, CameraOff, RefreshCw, ArrowDown, ArrowUp } from 'lucide-react';

/** Toggle buttons for the camera push-up counter, plus its description hint. */
export function CameraModeBar({
    activeColor, isCameraActive, isCalibrated,
    startCamera, stopCamera, recalibrate, t
}) {
    return (
        <>
            <div className="camera-mode-bar">
                <button
                    onClick={isCameraActive ? stopCamera : startCamera}
                    className={`camera-mode-toggle hover-lift glass${isCameraActive ? ' is-active' : ''}`}
                    style={{ '--exercise-color': activeColor }}
                >
                    <span className="camera-mode-toggle-icon">
                        {isCameraActive ? <CameraOff size={16} /> : <Camera size={16} />}
                    </span>
                    {t('counter.cameraMode')}
                </button>

                {isCameraActive && isCalibrated && (
                    <button
                        onClick={recalibrate}
                        className="camera-recal-btn hover-lift glass"
                        aria-label={t('counter.cameraCalibrate')}
                    >
                        <RefreshCw size={14} />
                        {t('counter.cameraCalibrate')}
                    </button>
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
export function CameraLiveStats({
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
