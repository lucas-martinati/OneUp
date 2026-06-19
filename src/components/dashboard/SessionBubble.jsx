import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Play, DynamicIcon } from '@utils/icons';
import { EXERCISES } from '@config/exercises';
import { WEIGHT_EXERCISES } from '@config/weights';
import { useExercises } from '@contexts/ExercisesContext';
import { Z_INDEX } from '@utils/zIndex';
import { loadWorkoutSession } from '@utils/workoutSessionStorage';
import styles from './SessionBubble.module.css';

const MAX_TRAIL_SPHERES = 6;
const LONG_PRESS_DURATION = 500;
const BUBBLE_SIZE = 56;
const EDGE_MARGIN = 10;
const SNAP_SIDE_KEY = 'session_bubble_side';
const SNAP_Y_KEY = 'session_bubble_y';

const TRAIL_LERP_BASE = 0.22;
const TRAIL_LERP_DECAY = 0.025;
const TRAIL_GAP = 8;
const SPRING_FACTOR = 0.14;

/** Compute trail sphere sizes from a count */
const computeTrailSizes = (count) => {
    const sizes = [];
    for (let i = 0; i < count; i++) {
        sizes.push(Math.max(22, 36 - i * 3));
    }
    return sizes;
};

/**
 * Floating session bubble — Android Chat Head inspired.
 * - Drag follows cursor 1:1
 * - Snap-back to edge uses spring physics
 * - Trail spheres follow as a chained trail via rAF lerp
 * - Long-press fills a red SVG ring progressively
 *
 * Note: This component is only mounted when `!anyModalOpen` (see Dashboard.jsx).
 * Since session data only changes when WorkoutSession modal is open (which causes
 * this component to unmount), reading localStorage on mount always yields fresh data.
 */
export const SessionBubble = React.memo(({ onResume, onDiscard }) => {
    const { customExercises } = useExercises();

    const allExercises = useMemo(
        () => [...EXERCISES, ...WEIGHT_EXERCISES, ...customExercises],
        [customExercises]
    );

    // ── Session data (fresh on every mount — see component docstring) ──
    const [{ queue: sessionQueue, currentIdx }] = useState(() => loadWorkoutSession());

    const queueExercises = useMemo(() => {
        return sessionQueue
            .map(id => allExercises.find(ex => ex.id === id))
            .filter(Boolean);
    }, [sessionQueue, allExercises]);

    const progress = useMemo(() => {
        if (queueExercises.length === 0) return 0;
        return currentIdx / queueExercises.length;
    }, [currentIdx, queueExercises.length]);

    // ── Persisted snap state (sessionStorage — per-tab, ephemeral) ──
    const [side, setSide] = useState(() =>
        sessionStorage.getItem(SNAP_SIDE_KEY) || 'right'
    );
    const [posY, setPosY] = useState(() => {
        const saved = sessionStorage.getItem(SNAP_Y_KEY);
        return saved ? parseFloat(saved) : 0.3;
    });

    // ── Refs ──
    const containerRef = useRef(null);
    const bubbleRef = useRef(null);
    const trailSpheresRef = useRef([]);

    const bubblePos = useRef({ x: 0, y: 0 });
    const trailPositions = useRef([]);

    const rafId = useRef(null);
    const isDraggingRef = useRef(false);

    // ── Minimal React state ──
    const [isDragging, setIsDragging] = useState(false);
    const [showTrail, setShowTrail] = useState(false);
    const [isRetracting, setIsRetracting] = useState(false);

    // ── Long press ──
    const [longPressProgress, setLongPressProgress] = useState(0);
    const longPressStartTime = useRef(null);
    const longPressRaf = useRef(null);
    const didLongPress = useRef(false);
    const didDrag = useRef(false);
    const startPointer = useRef(null);
    const trailTimer = useRef(null);

    // ── Derived data ──
    const visibleExercises = useMemo(
        () => queueExercises.slice(0, MAX_TRAIL_SPHERES),
        [queueExercises]
    );
    const overflowCount = queueExercises.length - MAX_TRAIL_SPHERES;

    const trailSizes = useMemo(
        () => computeTrailSizes(visibleExercises.length),
        [visibleExercises.length]
    );

    // Keep trailSizes accessible to rAF loops without adding it as a dependency
    const trailSizesRef = useRef(trailSizes);
    useEffect(() => { trailSizesRef.current = trailSizes; }, [trailSizes]);

    // Persist position to sessionStorage
    useEffect(() => {
        sessionStorage.setItem(SNAP_SIDE_KEY, side);
        sessionStorage.setItem(SNAP_Y_KEY, posY.toString());
    }, [side, posY]);

    // ── Helpers (stable — no deps that change) ──
    const getSafeY = useCallback((y) => {
        const vh = window.innerHeight;
        return Math.max(70, Math.min(vh - 90, y));
    }, []);

    const applyBubblePos = useCallback((pos) => {
        if (containerRef.current) {
            containerRef.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
        }
    }, []);

    const applyTrailPos = useCallback((i, pos) => {
        const el = trailSpheresRef.current[i];
        if (el) {
            el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
        }
    }, []);

    // ── Shared trail update logic (used by both drag loop and snap-back) ──
    const updateTrailPositions = useCallback((bp) => {
        const sizes = trailSizesRef.current;
        const trailBelow = bp.y < window.innerHeight * 0.6;

        trailPositions.current.forEach((pos, i) => {
            const size = sizes[i] || 24;
            const leader = i === 0 ? bp : trailPositions.current[i - 1];
            const leaderSize = i === 0 ? BUBBLE_SIZE : (sizes[i - 1] || 24);

            const targetX = leader.x + (leaderSize - size) / 2;
            const targetY = trailBelow
                ? leader.y + leaderSize + TRAIL_GAP - 2
                : leader.y - TRAIL_GAP - size + 2;

            const factor = Math.max(0.06, TRAIL_LERP_BASE - i * TRAIL_LERP_DECAY);
            pos.x += (targetX - pos.x) * factor;
            pos.y += (targetY - pos.y) * factor;
            applyTrailPos(i, pos);
        });
    }, [applyTrailPos]);

    // ── Initialize positions on mount ──
    useEffect(() => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const s = sessionStorage.getItem(SNAP_SIDE_KEY) || 'right';
        const yFrac = parseFloat(sessionStorage.getItem(SNAP_Y_KEY) || '0.3');
        const x = s === 'right' ? vw - BUBBLE_SIZE - EDGE_MARGIN : EDGE_MARGIN;
        const y = Math.max(70, Math.min(vh - 90, yFrac * vh - BUBBLE_SIZE / 2));
        const rest = { x, y };

        bubblePos.current = { ...rest };
        applyBubblePos(rest);
        trailPositions.current = visibleExercises.map(() => ({ ...rest }));
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Snap-back animation (only triggers on side/posY change) ──
    useEffect(() => {
        if (isDraggingRef.current) return;

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const targetX = side === 'right' ? vw - BUBBLE_SIZE - EDGE_MARGIN : EDGE_MARGIN;
        const targetY = getSafeY(posY * vh - BUBBLE_SIZE / 2);

        const animateSnap = () => {
            const bp = bubblePos.current;
            const dx = targetX - bp.x;
            const dy = targetY - bp.y;

            if (Math.abs(dx) < 0.3 && Math.abs(dy) < 0.3) {
                bp.x = targetX;
                bp.y = targetY;
                applyBubblePos(bp);

                // Snap trail to final resting positions
                const sizes = trailSizesRef.current;
                const trailBelow = bp.y < vh * 0.6;
                let accY = bp.y + (trailBelow ? BUBBLE_SIZE + TRAIL_GAP : 0);
                trailPositions.current.forEach((pos, i) => {
                    const size = sizes[i] || 24;
                    pos.x = bp.x + (BUBBLE_SIZE - size) / 2;
                    if (trailBelow) {
                        pos.y = accY;
                        accY += size + TRAIL_GAP - 2;
                    } else {
                        pos.y = bp.y - TRAIL_GAP - size - i * (size + TRAIL_GAP - 2);
                    }
                    applyTrailPos(i, pos);
                });
                return;
            }

            bp.x += dx * SPRING_FACTOR;
            bp.y += dy * SPRING_FACTOR;
            applyBubblePos(bp);
            updateTrailPositions(bp);

            rafId.current = requestAnimationFrame(animateSnap);
        };

        cancelAnimationFrame(rafId.current);
        rafId.current = requestAnimationFrame(animateSnap);
    }, [side, posY, getSafeY, applyBubblePos, applyTrailPos, updateTrailPositions]);

    // ── rAF loop during drag ──
    const startDragLoop = useCallback(() => {
        const animate = () => {
            if (!isDraggingRef.current) return;
            updateTrailPositions(bubblePos.current);
            rafId.current = requestAnimationFrame(animate);
        };
        cancelAnimationFrame(rafId.current);
        rafId.current = requestAnimationFrame(animate);
    }, [updateTrailPositions]);

    // ── Long press animation ──
    const startLongPressAnimation = useCallback(() => {
        longPressStartTime.current = performance.now();
        didLongPress.current = false;

        const tick = (now) => {
            if (!longPressStartTime.current) return;
            const prog = Math.min(1, (now - longPressStartTime.current) / LONG_PRESS_DURATION);
            setLongPressProgress(prog);

            if (prog >= 1) {
                didLongPress.current = true;
                longPressStartTime.current = null;
                setLongPressProgress(0);
                if (navigator.vibrate) navigator.vibrate(30);
                onDiscard();
                return;
            }
            longPressRaf.current = requestAnimationFrame(tick);
        };
        longPressRaf.current = requestAnimationFrame(tick);
    }, [onDiscard]);

    const cancelLongPress = useCallback(() => {
        longPressStartTime.current = null;
        cancelAnimationFrame(longPressRaf.current);
        setLongPressProgress(0);
    }, []);

    // ── Pointer handlers ──
    const handlePointerDown = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (bubbleRef.current) bubbleRef.current.setPointerCapture(e.pointerId);

        startPointer.current = { x: e.clientX, y: e.clientY };
        didLongPress.current = false;
        didDrag.current = false;
        startLongPressAnimation();
    }, [startLongPressAnimation]);

    const handlePointerMove = useCallback((e) => {
        if (!startPointer.current) return;

        const dx = e.clientX - startPointer.current.x;
        const dy = e.clientY - startPointer.current.y;
        if (Math.sqrt(dx * dx + dy * dy) <= 8) return;

        cancelLongPress();
        didDrag.current = true;

        if (!isDraggingRef.current) {
            isDraggingRef.current = true;
            setIsDragging(true);
            cancelAnimationFrame(rafId.current);
            // Init trail positions at bubble before starting loop
            const bp = bubblePos.current;
            trailPositions.current = visibleExercises.map(() => ({ x: bp.x, y: bp.y }));
            startDragLoop();
            trailTimer.current = setTimeout(() => setShowTrail(true), 100);
        }

        // Bubble follows cursor 1:1
        const newX = Math.max(EDGE_MARGIN, Math.min(window.innerWidth - BUBBLE_SIZE - EDGE_MARGIN, e.clientX - BUBBLE_SIZE / 2));
        const newY = getSafeY(e.clientY - BUBBLE_SIZE / 2);
        bubblePos.current.x = newX;
        bubblePos.current.y = newY;
        applyBubblePos(bubblePos.current);
    }, [getSafeY, cancelLongPress, startDragLoop, applyBubblePos, visibleExercises]);

    const handlePointerUp = useCallback(() => {
        cancelLongPress();
        clearTimeout(trailTimer.current);

        if (isDraggingRef.current) {
            isDraggingRef.current = false;
            cancelAnimationFrame(rafId.current);

            const centerX = bubblePos.current.x + BUBBLE_SIZE / 2;
            const newSide = centerX < window.innerWidth / 2 ? 'left' : 'right';
            const vh = window.innerHeight;
            const newYFrac = Math.max(0.1, Math.min(0.9, (bubblePos.current.y + BUBBLE_SIZE / 2) / vh));

            setSide(newSide);
            setPosY(newYFrac);

            setIsRetracting(true);
            setTimeout(() => {
                setShowTrail(false);
                setIsRetracting(false);
            }, 280);
            setIsDragging(false);
        }

        startPointer.current = null;

        if (!didDrag.current && !didLongPress.current) {
            onResume();
        }
        didDrag.current = false;
    }, [onResume, cancelLongPress]);

    // Apply trail positions when spheres mount
    useEffect(() => {
        if (showTrail) {
            requestAnimationFrame(() => {
                trailPositions.current.forEach((pos, i) => applyTrailPos(i, pos));
            });
        }
    }, [showTrail, applyTrailPos]);

    // Cleanup
    useEffect(() => {
        return () => {
            cancelAnimationFrame(rafId.current);
            cancelAnimationFrame(longPressRaf.current);
            clearTimeout(trailTimer.current);
        };
    }, []);

    // ── SVG ring calculations ──
    const ringRadius = 26;
    const ringCircumference = 2 * Math.PI * ringRadius;
    const ringOffset = ringCircumference * (1 - progress);

    const lpRingRadius = 26;
    const lpRingCircumference = 2 * Math.PI * lpRingRadius;
    const lpRingOffset = lpRingCircumference * (1 - longPressProgress);

    const portal = (
        <>
            {/* ── Main bubble container (translated via rAF) ── */}
            <div
                ref={containerRef}
                className={styles.bubbleContainer}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: `${BUBBLE_SIZE}px`,
                    height: `${BUBBLE_SIZE}px`,
                    zIndex: Z_INDEX.FLOATING_BUBBLE,
                    willChange: 'transform',
                }}
            >
                {/* Pulse glow (idle only) */}
                {!isDragging && longPressProgress === 0 && <div className={styles.pulseGlow} />}

                {/* Long press progressive ring */}
                {longPressProgress > 0 && (
                    <svg className={styles.longPressRingSvg} viewBox="0 0 56 56">
                        <circle
                            className={styles.longPressRingTrack}
                            cx="28" cy="28" r={lpRingRadius}
                        />
                        <circle
                            className={styles.longPressRingFill}
                            cx="28" cy="28" r={lpRingRadius}
                            strokeDasharray={lpRingCircumference}
                            strokeDashoffset={lpRingOffset}
                        />
                    </svg>
                )}

                {/* Main bubble */}
                <div
                    ref={bubbleRef}
                    className={`${styles.bubble} ${isDragging ? styles.bubbleDragging : ''}`}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                >
                    {/* Session progress ring */}
                    <svg className={styles.progressRing} viewBox="0 0 56 56">
                        <circle className={styles.progressTrack} cx="28" cy="28" r={ringRadius} />
                        <circle
                            className={styles.progressFill}
                            cx="28" cy="28" r={ringRadius}
                            strokeDasharray={ringCircumference}
                            strokeDashoffset={ringOffset}
                        />
                    </svg>

                    <div className={styles.liveIndicator} />

                    <div className={styles.bubbleIcon}>
                        <Play size={18} fill="#a78bfa" color="#a78bfa" style={{ marginLeft: '2px' }} />
                    </div>
                </div>
            </div>

            {/* ── Trail spheres ── */}
            {visibleExercises.map((ex, i) => {
                const isCurrent = i === currentIdx;
                const size = trailSizes[i];
                const baseOpacity = Math.max(0.5, 1 - i * 0.1);
                const visible = showTrail && !isRetracting;
                const retracting = isRetracting;

                let delayVal = '0ms';
                if (visible) {
                    delayVal = `${i * 50}ms`;
                } else if (retracting) {
                    delayVal = `${(visibleExercises.length - 1 - i) * 30}ms`;
                }

                return (
                    <div
                        key={ex.id}
                        ref={el => { trailSpheresRef.current[i] = el; }}
                        className={`${styles.trailSphereFixed} ${isCurrent ? styles.trailSphereCurrent : ''} ${visible ? styles.trailSphereVisible : ''}`}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: `${size}px`,
                            height: `${size}px`,
                            zIndex: Z_INDEX.FLOATING_BUBBLE - 1,
                            willChange: 'transform',
                            pointerEvents: 'none',
                            background: `linear-gradient(135deg, ${ex.color}25, ${ex.color}12)`,
                            borderColor: isCurrent ? `${ex.color}80` : `${ex.color}35`,
                            '--sphere-glow': `${ex.color}50`,
                            opacity: visible ? baseOpacity : 0,
                            transitionDelay: delayVal,
                        }}
                    >
                        <DynamicIcon
                            icon={ex.icon}
                            size={Math.max(10, size - 14)}
                            color={ex.color}
                        />
                    </div>
                );
            })}

            {overflowCount > 0 && (
                <div
                    className={`${styles.overflowBadgeFixed} ${(showTrail && !isRetracting) ? styles.trailSphereVisible : ''}`}
                    style={{
                        position: 'fixed',
                        zIndex: Z_INDEX.FLOATING_BUBBLE - 1,
                        pointerEvents: 'none',
                        opacity: (showTrail && !isRetracting) ? 1 : 0,
                        transitionDelay: (showTrail && !isRetracting)
                            ? `${visibleExercises.length * 50}ms`
                            : '0ms',
                    }}
                >
                    +{overflowCount}
                </div>
            )}
        </>
    );

    return createPortal(portal, document.body);
});

SessionBubble.displayName = 'SessionBubble';
