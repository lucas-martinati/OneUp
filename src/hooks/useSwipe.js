import { useState, useCallback } from 'react';

/**
 * A simple hook for detecting swipe gestures.
 * @param {Object} options 
 * @param {Function} options.onSwipeLeft 
 * @param {Function} options.onSwipeRight 
 * @param {number} options.minDistance - Minimum distance in pixels to trigger a swipe
 * @returns {Object} { onTouchStart, onTouchMove, onTouchEnd }
 */
export function useSwipe({ onSwipeLeft, onSwipeRight, minDistance = 50 }) {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minDistance;
    const isRightSwipe = distance < -minDistance;

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft();
    } else if (isRightSwipe && onSwipeRight) {
      onSwipeRight();
    }
  }, [touchStart, touchEnd, onSwipeLeft, onSwipeRight, minDistance]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  };
}
