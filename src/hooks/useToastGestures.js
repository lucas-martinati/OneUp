import { useCallback, useEffect, useRef, useState } from 'react';

const SWIPE_THRESHOLD = 80; // px before a release flings the toast away
const FADE_DISTANCE = 220;  // px of drag that fades the toast to ~0.4 opacity

/**
 * Shared lifecycle + swipe-to-dismiss behaviour for transient toasts
 * (achievement unlocks, pokes). Owns the auto-dismiss timer, horizontal
 * drag / fling, tap-to-act, and the exit transition — returning the transform
 * and handlers to spread on the toast card so each toast keeps its own markup.
 *
 * @param {object}   opts
 * @param {function} opts.onClose          fired once, after the exit transition
 * @param {function} [opts.onTap]          fired on tap (before the toast leaves)
 * @param {number}   [opts.duration=5000]  ms before auto-dismiss
 * @returns {{ exit: ('up'|'left'|'right'|null), cardProps: object }}
 *   `cardProps` bundles the pointer/transition handlers and the computed
 *   `style` (transform/opacity/transition) to spread onto the toast element.
 */
export function useToastGestures({ onClose, onTap, duration = 5000 }) {
    const [dragX, setDragX] = useState(0);
    const [exit, setExit] = useState(null); // null | 'up' | 'left' | 'right'
    const [animate, setAnimate] = useState(false);

    const startX = useRef(0);
    const dragXRef = useRef(0);
    const dragging = useRef(false);
    const moved = useRef(false);
    const done = useRef(false);
    const autoTimer = useRef(null);

    const clearAuto = useCallback(() => {
        if (autoTimer.current) { clearTimeout(autoTimer.current); autoTimer.current = null; }
    }, []);

    const leave = useCallback((dir = 'up') => {
        clearAuto();
        setAnimate(true);
        setExit(dir);
    }, [clearAuto]);

    useEffect(() => {
        autoTimer.current = setTimeout(() => leave('up'), duration);
        return clearAuto;
    }, [leave, clearAuto, duration]);

    const onPointerDown = (e) => {
        if (exit) return;
        clearAuto();
        dragging.current = true;
        moved.current = false;
        startX.current = e.clientX;
        setAnimate(false);
        e.currentTarget.setPointerCapture?.(e.pointerId);
        // A tap that hides the toast (e.g. onTap unmounts it) still queues a
        // delayed compatibility "click" at the same screen coordinates; by
        // then the toast is gone from the DOM and the click falls through to
        // whatever is now underneath. Suppressing it here (touch/pen only —
        // mice have no compatibility click to begin with) keeps taps local
        // to the toast.
        if (e.pointerType !== 'mouse' && e.cancelable) e.preventDefault();
    };

    const onPointerMove = (e) => {
        if (!dragging.current) return;
        const dx = e.clientX - startX.current;
        if (Math.abs(dx) > 4) moved.current = true;
        dragXRef.current = dx;
        setDragX(dx);
    };

    const onPointerUp = () => {
        if (!dragging.current) return;
        dragging.current = false;
        setAnimate(true);

        if (!moved.current) { onTap?.(); leave('up'); return; } // tap

        if (Math.abs(dragXRef.current) > SWIPE_THRESHOLD) {
            setExit(dragXRef.current < 0 ? 'left' : 'right'); // fling away
        } else {
            dragXRef.current = 0;
            setDragX(0); // spring back
        }
    };

    const onTransitionEnd = (e) => {
        if (exit && e.propertyName === 'transform' && !done.current) {
            done.current = true;
            onClose();
        }
    };

    let transform, opacity;
    if (exit === 'up') { transform = 'translateY(-16px) scale(0.96)'; opacity = 0; }
    else if (exit === 'left') { transform = 'translateX(-120%)'; opacity = 0; }
    else if (exit === 'right') { transform = 'translateX(120%)'; opacity = 0; }
    else {
        transform = `translateX(${dragX}px)`;
        opacity = 1 - Math.min(Math.abs(dragX) / FADE_DISTANCE, 0.6);
    }

    return {
        exit,
        /** Programmatically trigger the animated exit (e.g. a close button). */
        dismiss: () => leave('up'),
        cardProps: {
            onPointerDown,
            onPointerMove,
            onPointerUp,
            onPointerCancel: onPointerUp,
            onTransitionEnd,
            style: {
                transform,
                opacity,
                transition: animate ? 'transform 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.28s ease' : 'none',
                touchAction: 'pan-y',
            },
        },
    };
}
