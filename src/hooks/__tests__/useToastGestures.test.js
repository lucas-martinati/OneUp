import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToastGestures } from '../useToastGestures';

describe('useToastGestures', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('auto-dismisses after duration', () => {
        const onClose = vi.fn();
        const { result } = renderHook(() => useToastGestures({ onClose, duration: 3000 }));

        expect(result.current.exit).toBeNull();

        act(() => {
            vi.advanceTimersByTime(3000);
        });

        expect(result.current.exit).toBe('up');
    });

    it('dismiss() triggers exit immediately', () => {
        const onClose = vi.fn();
        const { result } = renderHook(() => useToastGestures({ onClose }));

        act(() => {
            result.current.dismiss();
        });

        expect(result.current.exit).toBe('up');
    });

    it('tap calls onTap and leaves up', () => {
        const onClose = vi.fn();
        const onTap = vi.fn();
        const { result } = renderHook(() => useToastGestures({ onClose, onTap }));

        act(() => {
            const eDown = { clientX: 100, currentTarget: {} };
            result.current.cardProps.onPointerDown(eDown);
            
            const eUp = {};
            result.current.cardProps.onPointerUp(eUp);
        });

        expect(onTap).toHaveBeenCalledTimes(1);
        expect(result.current.exit).toBe('up');
    });

    it('fling left triggers exit left', () => {
        const onClose = vi.fn();
        const { result } = renderHook(() => useToastGestures({ onClose }));

        act(() => {
            result.current.cardProps.onPointerDown({ clientX: 100, currentTarget: {} });
            result.current.cardProps.onPointerMove({ clientX: 10 }); // -90px, < -80 threshold
            result.current.cardProps.onPointerUp();
        });

        expect(result.current.exit).toBe('left');
    });

    it('fling right triggers exit right', () => {
        const onClose = vi.fn();
        const { result } = renderHook(() => useToastGestures({ onClose }));

        act(() => {
            result.current.cardProps.onPointerDown({ clientX: 100, currentTarget: {} });
            result.current.cardProps.onPointerMove({ clientX: 190 }); // +90px, > 80 threshold
            result.current.cardProps.onPointerUp();
        });

        expect(result.current.exit).toBe('right');
    });

    it('springs back if drag is less than threshold', () => {
        const onClose = vi.fn();
        const { result } = renderHook(() => useToastGestures({ onClose }));

        act(() => {
            result.current.cardProps.onPointerDown({ clientX: 100, currentTarget: {} });
            result.current.cardProps.onPointerMove({ clientX: 140 }); // +40px, < 80 threshold
            result.current.cardProps.onPointerUp();
        });

        // Shouldn't exit, and transform should be back to 0
        expect(result.current.exit).toBeNull();
        expect(result.current.cardProps.style.transform).toBe('translateX(0px)');
    });

    it('calls onClose when transition ends and exit is set', () => {
        const onClose = vi.fn();
        const { result } = renderHook(() => useToastGestures({ onClose }));

        act(() => {
            result.current.dismiss();
        });
        
        expect(result.current.exit).toBe('up');

        act(() => {
            // Simulate transition end
            result.current.cardProps.onTransitionEnd({ propertyName: 'transform' });
        });

        expect(onClose).toHaveBeenCalledTimes(1);
        
        // Idempotent: second transition end shouldn't trigger onClose again
        act(() => {
            result.current.cardProps.onTransitionEnd({ propertyName: 'transform' });
        });
        
        expect(onClose).toHaveBeenCalledTimes(1);
    });
    
    it('does not process pointer events if already exiting', () => {
        const onClose = vi.fn();
        const { result } = renderHook(() => useToastGestures({ onClose }));

        act(() => {
            result.current.dismiss(); // sets exit = 'up'
        });

        act(() => {
            // This should be ignored
            result.current.cardProps.onPointerDown({ clientX: 100, currentTarget: {} });
        });
        
        // It's still 'up', not changed to dragging state
        expect(result.current.exit).toBe('up');
    });
});
