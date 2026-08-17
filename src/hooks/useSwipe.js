import { useRef, useCallback } from 'react';

/**
 * A flexible hook for detecting horizontal swipe gestures.
 * Supports both onTouchMove-based tracking and direct onTouchStart/onTouchEnd flick gestures.
 *
 * @param {Object} options
 * @param {Function} [options.onSwipeLeft]
 * @param {Function} [options.onSwipeRight]
 * @param {number} [options.minDistance=50]
 * @param {number} [options.threshold] - Alias for minDistance
 * @param {number} [options.durationLimit=300] - Max duration in ms for flick gestures
 * @returns {Object} { onTouchStart, onTouchMove, onTouchEnd, handleTouchStart, handleTouchEnd }
 */
export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  minDistance = 50,
  threshold,
  durationLimit = 300,
}) {
  const effectiveMinDistance = threshold !== undefined ? threshold : minDistance;
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const touchEndRef = useRef(null);

  const onTouchStart = useCallback((e) => {
    const touch = e?.targetTouches?.[0] || e?.touches?.[0] || e;
    if (!touch) return;
    touchEndRef.current = null;
    touchStartRef.current = {
      x: touch.clientX ?? 0,
      y: touch.clientY ?? 0,
      time: Date.now(),
    };
  }, []);

  const onTouchMove = useCallback((e) => {
    const touch = e?.targetTouches?.[0] || e?.touches?.[0] || e;
    if (!touch) return;
    touchEndRef.current = {
      x: touch.clientX ?? 0,
      y: touch.clientY ?? 0,
    };
  }, []);

  const onTouchEnd = useCallback((e) => {
    const start = touchStartRef.current;
    if (!start) return;

    // Use touch from changedTouches if provided on touch end, otherwise touchEndRef
    const endTouch = e?.changedTouches?.[0];
    const endX = endTouch?.clientX ?? touchEndRef.current?.x;
    const endY = endTouch?.clientY ?? touchEndRef.current?.y;

    if (endX === undefined || endX === null) return;

    const diffX = start.x - endX;
    const diffY = endY !== undefined && endY !== null ? start.y - endY : 0;
    const duration = Date.now() - start.time;

    // If vertical movement is tracked and is dominant or duration exceeded on a fast flick
    const isAngleValid = endY === undefined || Math.abs(diffY) < Math.abs(diffX) * 0.8;
    const isDurationValid = duration <= durationLimit || !endTouch;

    if (Math.abs(diffX) > effectiveMinDistance && isAngleValid && isDurationValid) {
      if (diffX > 0) {
        onSwipeLeft?.();
      } else {
        onSwipeRight?.();
      }
    }
  }, [onSwipeLeft, onSwipeRight, effectiveMinDistance, durationLimit]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    handleTouchStart: onTouchStart,
    handleTouchEnd: onTouchEnd,
  };
}
