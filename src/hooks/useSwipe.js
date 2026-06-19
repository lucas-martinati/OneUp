import { useRef, useCallback } from 'react';

/**
 * A simple hook for detecting swipe gestures.
 * @param {Object} options 
 * @param {Function} options.onSwipeLeft 
 * @param {Function} options.onSwipeRight 
 * @param {number} options.minDistance - Minimum distance in pixels to trigger a swipe
 * @returns {Object} { onTouchStart, onTouchMove, onTouchEnd }
 */
export function useSwipe({ onSwipeLeft, onSwipeRight, minDistance = 50 }) {
  const touchStart = useRef(null);
  const touchEnd = useRef(null);

  const onTouchStart = useCallback((e) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchMove = useCallback((e) => {
    touchEnd.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(() => {
    if (touchStart.current === null || touchEnd.current === null) return;
    const distance = touchStart.current - touchEnd.current;
    const isLeftSwipe = distance > minDistance;
    const isRightSwipe = distance < -minDistance;

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft();
    } else if (isRightSwipe && onSwipeRight) {
      onSwipeRight();
    }
  }, [onSwipeLeft, onSwipeRight, minDistance]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  };
}
