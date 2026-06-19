import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSwipe } from '../useSwipe';

describe('useSwipe', () => {
    it('calls onSwipeLeft when swiping left more than minDistance', () => {
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

    it('calls onSwipeRight when swiping right more than minDistance', () => {
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

    it('does not call callbacks if distance is less than minDistance', () => {
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
            // Move to x=70 (distance = 30, < 50)
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
            // Only end, no start
            result.current.onTouchEnd();
        });

        expect(onSwipeLeft).not.toHaveBeenCalled();
        expect(onSwipeRight).not.toHaveBeenCalled();
        
        act(() => {
            // Only start, no end/move
            result.current.onTouchStart({ targetTouches: [{ clientX: 100 }] });
            result.current.onTouchEnd(); // No move means touchEnd is null
        });

        expect(onSwipeLeft).not.toHaveBeenCalled();
        expect(onSwipeRight).not.toHaveBeenCalled();
    });
});
