import { useState, useEffect, useRef, useCallback } from 'react';
import { isAndroidPlatform } from '../utils/platform';

/**
 * Custom hook for camera-based push-up counting using a lightweight,
 * zero-dependency pixel-difference motion and proximity detection.
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
            setCalibrateCountdown(prev => {
                if (prev === 1) {
                    // Slight delay to draw the base frame
                    setTimeout(() => {
                        captureBaseFrame();
                    }, 100);
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearTimeout(timer);
    }, [calibrateCountdown, captureBaseFrame]);

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
                    const combinedScore = (avgCenterDiff * 0.5) + (avgGlobalDiff * 0.2) + (centerLumaDrop * 0.3);
 
                    // Map score to proximity % (target full range is 0.18)
                    const proxPct = Math.min(100, Math.max(0, Math.round((combinedScore / 0.18) * 100)));
                    setProximity(proxPct);
 
                    // State machine checks
                    const currentState = stateRef.current;
                    // Transition to DOWN: when combined score is high (body/chest close to camera)
                    if (currentState === 'up' && combinedScore > 0.12) {
                        setPushupState('down');
                        peakScoreRef.current = combinedScore;
                        playBeep(440, 0.08); // Short low pitch beep for bottom phase
                    } 
                    // Transition to UP: when combined score is low again (body pushed back up)
                    else if (currentState === 'down') {
                        if (combinedScore > peakScoreRef.current) {
                            peakScoreRef.current = combinedScore;
                        }
                        // Must drop below 0.07 OR below 40% of the peak score reached during this down phase
                        const returnThreshold = Math.max(0.07, peakScoreRef.current * 0.4);
                        if (combinedScore < returnThreshold) {
                            // Cooldown security: 400ms minimum between successive counted reps
                            const now = Date.now();
                            if (now - lastRepTimeRef.current > 400) {
                                lastRepTimeRef.current = now;
                                setPushupState('up');
                                playBeep(660, 0.12); // Clear confirmation beep
                                onRepCountedRef.current();
                            }
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
