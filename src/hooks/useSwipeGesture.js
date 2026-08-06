import { useRef, useCallback } from 'react';

/**
 * Custom hook to handle quick swipe/flick gestures on mobile.
 * Detects horizontal swipes while allowing for a small vertical deviation constraint
 * and a time limit to distinguish flicks from slow drags.
 *
 * @param {Object} options
 * @param {Function} options.onSwipeLeft - Callback when user swipes left
 * @param {Function} options.onSwipeRight - Callback when user swipes right
 * @param {number} [options.threshold=60] - Minimum horizontal swipe distance
 * @param {number} [options.durationLimit=300] - Maximum swipe duration in ms
 */
export function useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold = 60, durationLimit = 300 }) {
    const touchStartRef = useRef({ x: 0, y: 0, time: 0 });

    const handleTouchStart = useCallback((e) => {
        const touch = e.touches[0];
        touchStartRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now()
        };
    }, []);

    const handleTouchEnd = useCallback((e) => {
        const touch = e.changedTouches[0];
        const start = touchStartRef.current;
        const diffX = start.x - touch.clientX;
        const diffY = start.y - touch.clientY;
        const duration = Date.now() - start.time;

        if (Math.abs(diffX) > threshold && Math.abs(diffY) < Math.abs(diffX) * 0.6 && duration < durationLimit) {
            if (diffX > 0) {
                if (onSwipeLeft) onSwipeLeft();
            } else {
                if (onSwipeRight) onSwipeRight();
            }
        }
    }, [onSwipeLeft, onSwipeRight, threshold, durationLimit]);

    return { handleTouchStart, handleTouchEnd };
}
