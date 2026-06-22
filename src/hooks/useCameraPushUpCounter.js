import { useState, useEffect, useRef, useCallback } from 'react';
import { isAndroidPlatform } from '@utils/platform';

// ── Detection tuning ──────────────────────────────────────────────────────
// Per-frame score smoothing (EMA factor): damps sensor noise so a single
// noisy frame can't trigger a false rep. Higher = more responsive, less smooth.
const SCORE_SMOOTHING = 0.5;
// Resting-baseline adaptation rate: slowly tracks ambient light / camera
// auto-exposure drift while the user is in the 'up' position, so that drift
// never accumulates into phantom motion. Only adapts at rest, never mid-rep.
const BASELINE_ADAPT = 0.02;
// Movement above the resting baseline needed to register the descent ('down').
const DOWN_ENTER = 0.07;
// Floor for the return ('up') threshold; the effective threshold is the max of
// this and a fraction (40%) of the depth actually reached during the descent.
const UP_EXIT = 0.04;
// A counted rep must descend at least this deep — rejects small wobbles.
const MIN_REP_DEPTH = 0.08;
// Minimum time spent in the 'down' phase for a rep to count (ms) — rejects
// fast flickers that aren't real push-ups.
const MIN_DOWN_MS = 150;
// Range mapping the effective score to the 0–100 proximity gauge.
const PROXIMITY_RANGE = 0.18;
// Minimum delay between two counted reps (ms).
const REP_COOLDOWN_MS = 400;

/**
 * Custom hook for camera-based push-up counting using a lightweight,
 * zero-dependency pixel-difference motion and proximity detection.
 *
 * Reliability relies on three things on top of the raw pixel diff:
 *  - EMA smoothing of the per-frame score (rejects single-frame noise spikes),
 *  - an adaptive resting baseline that cancels gradual lighting / auto-exposure
 *    drift so the absolute thresholds stay meaningful over a long set, and
 *  - minimum descent depth + dwell time so jitter is never counted as a rep.
 *
 * @param {Function} onRepCounted Callback triggered when a push-up is validated.
 */
export function useCameraPushUpCounter(onRepCounted) {
    const [isActive, setIsActive] = useState(false);
    const [error, setError] = useState(null);
    const [proximity, setProximity] = useState(0); // 0 to 100
    const [isCalibrated, setIsCalibrated] = useState(false);
    const [calibrateCountdown, setCalibrateCountdown] = useState(0);
    const [pushupState, setPushupState] = useState('up'); // 'up' or 'down'
    const [stream, setStream] = useState(null);

    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const baseFrameRef = useRef(null);
    const activeRef = useRef(isActive);
    const stateRef = useRef(pushupState);
    const audioCtxRef = useRef(null);
    const peakScoreRef = useRef(0);
    const lastRepTimeRef = useRef(0);
    const smoothScoreRef = useRef(0); // EMA-smoothed combined score
    const restBaselineRef = useRef(0); // slow baseline tracking ambient/exposure drift
    const downStartRef = useRef(0); // timestamp the current descent began

    // Stable callback reference to avoid stale closures in frame loops
    const onRepCountedRef = useRef(onRepCounted);
    useEffect(() => {
        onRepCountedRef.current = onRepCounted;
    }, [onRepCounted]);

    // Keep refs in sync for the animation loop
    useEffect(() => { activeRef.current = isActive; }, [isActive]);
    useEffect(() => { stateRef.current = pushupState; }, [pushupState]);

    const playBeep = (freq = 600, duration = 0.15) => {
        try {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            const audioCtx = audioCtxRef.current;
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch (e) {
            console.debug('Failed to play synthesized audio beep:', e);
        }
    };

    const startCalibrationSequence = useCallback(() => {
        setIsCalibrated(false);
        baseFrameRef.current = null;
        setCalibrateCountdown(3);
        peakScoreRef.current = 0;
        lastRepTimeRef.current = 0;
        smoothScoreRef.current = 0;
        restBaselineRef.current = 0;
        downStartRef.current = 0;
    }, []);

    const startCamera = useCallback(async () => {
        setError(null);
        setIsCalibrated(false);
        setProximity(0);
        setPushupState('up');
        setIsActive(true);
        
        try {
            // Check & request camera permission on Android natively first
            if (isAndroidPlatform()) {
                const { registerPlugin } = await import('@capacitor/core');
                const WidgetBridge = registerPlugin('WidgetBridge');
                const permCheck = await WidgetBridge.checkCameraPermission();
                if (permCheck.status !== 'GRANTED') {
                    const permReq = await WidgetBridge.requestCameraPermission();
                    if (permReq.status !== 'GRANTED') {
                        throw new Error('permission_denied');
                    }
                }
            }

            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'user', 
                    width: { ideal: 320 }, 
                    height: { ideal: 240 } 
                }
            });
            streamRef.current = mediaStream;
            setStream(mediaStream);
            
            // Trigger 3s calibration countdown
            startCalibrationSequence();
        } catch (err) {
            console.error('Camera access error:', err);
            setError('permission_denied');
        }
    }, [startCalibrationSequence]);

    const stopCamera = useCallback(() => {
        setIsActive(false);
        setIsCalibrated(false);
        setProximity(0);
        setCalibrateCountdown(0);
        setPushupState('up');
        
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setStream(null);
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        baseFrameRef.current = null;
        peakScoreRef.current = 0;
        lastRepTimeRef.current = 0;
        smoothScoreRef.current = 0;
        restBaselineRef.current = 0;
        downStartRef.current = 0;
    }, []);

    // Polling mount check to reliably bind the media stream as soon as React renders the video tag
    useEffect(() => {
        let interval;
        if (isActive && stream) {
            interval = setInterval(() => {
                if (videoRef.current && !videoRef.current.srcObject) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play()
                        .then(() => clearInterval(interval))
                        .catch(e => console.debug('Video play failed on mount:', e));
                }
            }, 50);
        } else if (!isActive || !stream) {
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, stream]);

    const captureBaseFrame = useCallback(() => {
        const video = videoRef.current;
        if (!video || !streamRef.current) return;

        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 24;
        const ctx = canvas.getContext('2d');
        
        try {
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                baseFrameRef.current = new Uint8ClampedArray(imgData.data);
                // Fresh reference frame → restart the smoothing/baseline state so
                // detection starts from a clean rest point.
                smoothScoreRef.current = 0;
                restBaselineRef.current = 0;
                peakScoreRef.current = 0;
                downStartRef.current = 0;
                setIsCalibrated(true);
                playBeep(880, 0.2); // Success high pitch beep
            }
        } catch (e) {
            console.error('Failed to capture base frame:', e);
        }
    }, []);

    // Calibration countdown
    useEffect(() => {
        if (calibrateCountdown <= 0) return;
        const timer = setTimeout(() => {
            setCalibrateCountdown(prev => prev - 1);
        }, 1000);
        return () => clearTimeout(timer);
    }, [calibrateCountdown]);

    // Capture base frame when countdown finishes
    useEffect(() => {
        if (isActive && !isCalibrated && calibrateCountdown === 0) {
            const timer = setTimeout(captureBaseFrame, 100);
            return () => clearTimeout(timer);
        }
    }, [isActive, isCalibrated, calibrateCountdown, captureBaseFrame]);

    // Frame processing loop
    useEffect(() => {
        if (!isActive || !isCalibrated || !stream) return;
 
        const video = videoRef.current;
        if (!video) return;
 
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 24;
        const ctx = canvas.getContext('2d');
 
        let animationFrameId;
        
        const processFrame = () => {
            if (!activeRef.current || !video || video.paused || video.ended || !baseFrameRef.current) return;
 
            if (ctx) {
                try {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const currentData = imgData.data;
                    const baseData = baseFrameRef.current;
 
                    let centerDiffSum = 0;
                    let centerLumaSum = 0;
                    let centerBaseLumaSum = 0;
                    let centerCount = 0;
 
                    let globalDiffSum = 0;
                    let globalCount = 0;
 
                    for (let y = 0; y < 24; y++) {
                        for (let x = 0; x < 32; x++) {
                            const i = (y * 32 + x) * 4;
                            const rDiff = Math.abs(currentData[i] - baseData[i]);
                            const gDiff = Math.abs(currentData[i+1] - baseData[i+1]);
                            const bDiff = Math.abs(currentData[i+2] - baseData[i+2]);
                            const pixelDiff = (rDiff + gDiff + bDiff) / 3;
 
                            globalDiffSum += pixelDiff;
                            globalCount++;
 
                            // Center region: columns 8 to 24 (middle 50%) and rows 6 to 18 (middle 50%)
                            const isCenterX = (x >= 8 && x < 24);
                            const isCenterY = (y >= 6 && y < 18);
                            if (isCenterX && isCenterY) {
                                centerDiffSum += pixelDiff;
                                
                                const currentLuma = 0.299 * currentData[i] + 0.587 * currentData[i+1] + 0.114 * currentData[i+2];
                                const baseLuma = 0.299 * baseData[i] + 0.587 * baseData[i+1] + 0.114 * baseData[i+2];
                                centerLumaSum += currentLuma;
                                centerBaseLumaSum += baseLuma;
                                centerCount++;
                            }
                        }
                    }
 
                    const avgGlobalDiff = (globalDiffSum / globalCount) / 255;
                    const avgCenterDiff = (centerDiffSum / centerCount) / 255;
 
                    const avgCenterLuma = centerLumaSum / centerCount;
                    const avgCenterBaseLuma = centerBaseLumaSum / centerCount;
 
                    // Relative light drop in center (0.0 to 1.0)
                    const centerLumaDrop = avgCenterBaseLuma > 10 
                        ? Math.max(0, (avgCenterBaseLuma - avgCenterLuma) / avgCenterBaseLuma)
                        : 0;
 
                    // Combined score: center changes weighted higher, plus light blocking (shadow)
                    const rawScore = (avgCenterDiff * 0.5) + (avgGlobalDiff * 0.2) + (centerLumaDrop * 0.3);

                    // 1. Smooth out per-frame sensor noise (EMA).
                    const smoothScore = smoothScoreRef.current + SCORE_SMOOTHING * (rawScore - smoothScoreRef.current);
                    smoothScoreRef.current = smoothScore;

                    // 2. Adapt the resting baseline only while at rest ('up'), so gradual
                    //    lighting / auto-exposure drift is cancelled instead of accumulating.
                    //    It is frozen during a descent so it can't eat the rep signal.
                    const currentState = stateRef.current;
                    if (currentState === 'up') {
                        restBaselineRef.current += BASELINE_ADAPT * (smoothScore - restBaselineRef.current);
                    }

                    // 3. Effective movement = how far above the resting baseline we are.
                    const effScore = Math.max(0, smoothScore - restBaselineRef.current);

                    // Map effective score to proximity % (full range is PROXIMITY_RANGE)
                    const proxPct = Math.min(100, Math.max(0, Math.round((effScore / PROXIMITY_RANGE) * 100)));
                    setProximity(proxPct);

                    const now = Date.now();

                    // State machine
                    // Transition to DOWN: effective movement is high (body/chest near camera)
                    if (currentState === 'up' && effScore > DOWN_ENTER) {
                        setPushupState('down');
                        peakScoreRef.current = effScore;
                        downStartRef.current = now;
                        playBeep(440, 0.08); // Short low pitch beep for bottom phase
                    }
                    // Transition to UP: effective movement is low again (body pushed back up)
                    else if (currentState === 'down') {
                        if (effScore > peakScoreRef.current) {
                            peakScoreRef.current = effScore;
                        }
                        // Must drop below the floor OR below 40% of the depth reached this descent
                        const returnThreshold = Math.max(UP_EXIT, peakScoreRef.current * 0.4);
                        if (effScore < returnThreshold) {
                            // Count a rep only when the descent was deep enough and lasted long
                            // enough, with a cooldown — this rejects jitter and double counts.
                            const deepEnough = peakScoreRef.current >= MIN_REP_DEPTH;
                            const longEnough = now - downStartRef.current >= MIN_DOWN_MS;
                            const cooledDown = now - lastRepTimeRef.current > REP_COOLDOWN_MS;
                            if (deepEnough && longEnough && cooledDown) {
                                lastRepTimeRef.current = now;
                                playBeep(660, 0.12); // Clear confirmation beep
                                onRepCountedRef.current();
                            }
                            // Always return to 'up' so a shallow/short wobble resets cleanly.
                            setPushupState('up');
                        }
                    }
                } catch (e) {
                    console.debug('Error in image processing loop:', e);
                }
            }
 
            if (activeRef.current) {
                animationFrameId = requestAnimationFrame(processFrame);
            }
        };
 
        if (video.readyState >= 2) {
            processFrame();
        } else {
            video.onloadeddata = processFrame;
        }
 
        return () => {
            cancelAnimationFrame(animationFrameId);
            if (video) video.onloadeddata = null;
        };
    }, [isActive, isCalibrated, stream]);

    // Clean up streams and context on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (audioCtxRef.current) {
                audioCtxRef.current.close().catch(() => {});
                audioCtxRef.current = null;
            }
        };
    }, []);

    return {
        isActive,
        videoRef,
        error,
        proximity,
        isCalibrated,
        calibrateCountdown,
        pushupState,
        startCamera,
        stopCamera,
        recalibrate: startCalibrationSequence
    };
}
