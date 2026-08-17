import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSwipe } from '../useSwipe';

describe('useSwipe', () => {
  it('calls onSwipeLeft when swiping left more than minDistance via onTouchMove', () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();

    const { result } = renderHook(() => useSwipe({
      onSwipeLeft,
      onSwipeRight,
      minDistance: 50
    }));

    act(() => {
      // Start at x=100
      result.current.onTouchStart({ targetTouches: [{ clientX: 100 }] });
      // Move to x=40 (distance = 100 - 40 = 60, > 50)
      result.current.onTouchMove({ targetTouches: [{ clientX: 40 }] });
      result.current.onTouchEnd();
    });

    expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it('calls onSwipeRight when swiping right more than minDistance via onTouchMove', () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();

    const { result } = renderHook(() => useSwipe({
      onSwipeLeft,
      onSwipeRight,
      minDistance: 50
    }));

    act(() => {
      // Start at x=100
      result.current.onTouchStart({ targetTouches: [{ clientX: 100 }] });
      // Move to x=160 (distance = 100 - 160 = -60, < -50)
      result.current.onTouchMove({ targetTouches: [{ clientX: 160 }] });
      result.current.onTouchEnd();
    });

    expect(onSwipeRight).toHaveBeenCalledTimes(1);
    expect(onSwipeLeft).not.toHaveBeenCalled();
  });

  it('supports handleTouchStart and handleTouchEnd with changedTouches (flick gestures)', () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();

    const { result } = renderHook(() => useSwipe({
      onSwipeLeft,
      onSwipeRight,
      threshold: 60,
      durationLimit: 300
    }));

    act(() => {
      result.current.handleTouchStart({ touches: [{ clientX: 200, clientY: 100 }] });
      result.current.handleTouchEnd({ changedTouches: [{ clientX: 100, clientY: 110 }] });
    });

    expect(onSwipeLeft).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.handleTouchStart({ touches: [{ clientX: 100, clientY: 100 }] });
      result.current.handleTouchEnd({ changedTouches: [{ clientX: 200, clientY: 110 }] });
    });

    expect(onSwipeRight).toHaveBeenCalledTimes(1);
  });

  it('ignores swipes when vertical movement exceeds horizontal threshold', () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();

    const { result } = renderHook(() => useSwipe({
      onSwipeLeft,
      onSwipeRight,
      threshold: 50
    }));

    act(() => {
      result.current.handleTouchStart({ touches: [{ clientX: 100, clientY: 100 }] });
      // diffX = 60, diffY = 80 -> vertical movement is too large
      result.current.handleTouchEnd({ changedTouches: [{ clientX: 40, clientY: 180 }] });
    });

    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it('does not call callbacks if distance is less than minDistance', () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();

    const { result } = renderHook(() => useSwipe({
      onSwipeLeft,
      onSwipeRight,
      minDistance: 50
    }));

    act(() => {
      result.current.onTouchStart({ targetTouches: [{ clientX: 100 }] });
      result.current.onTouchMove({ targetTouches: [{ clientX: 70 }] });
      result.current.onTouchEnd();
    });

    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it('does nothing if touchStart or touchEnd are missing', () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();

    const { result } = renderHook(() => useSwipe({
      onSwipeLeft,
      onSwipeRight,
      minDistance: 50
    }));

    act(() => {
      result.current.onTouchEnd();
    });

    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();

    act(() => {
      result.current.onTouchStart({ targetTouches: [{ clientX: 100 }] });
      result.current.onTouchEnd();
    });

    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });
});
