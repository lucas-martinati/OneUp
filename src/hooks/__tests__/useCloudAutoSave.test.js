import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCloudAutoSave } from '../useCloudAutoSave';

describe('useCloudAutoSave', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('calls saveFn after delay if isSignedIn is true', () => {
        const saveFn = vi.fn();
        const data = { foo: 'bar' };

        renderHook(() => useCloudAutoSave(true, data, saveFn, { delay: 1000 }));

        expect(saveFn).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1000);

        expect(saveFn).toHaveBeenCalledWith(data);
        expect(saveFn).toHaveBeenCalledTimes(1);
    });

    it('does not call saveFn if isSignedIn is false', () => {
        const saveFn = vi.fn();
        const data = { foo: 'bar' };

        renderHook(() => useCloudAutoSave(false, data, saveFn, { delay: 1000 }));

        vi.advanceTimersByTime(2000);

        expect(saveFn).not.toHaveBeenCalled();
    });

    it('clears previous timer when data changes', () => {
        const saveFn = vi.fn();
        
        const { rerender } = renderHook(
            ({ data }) => useCloudAutoSave(true, data, saveFn, { delay: 1000 }),
            { initialProps: { data: { val: 1 } } }
        );

        // Advance a bit, but not fully
        vi.advanceTimersByTime(500);

        // Rerender with new data
        rerender({ data: { val: 2 } });

        // Advance 500ms more (total 1000ms since start, but only 500ms for new timer)
        vi.advanceTimersByTime(500);
        
        // Should not have been called yet because timer reset
        expect(saveFn).not.toHaveBeenCalled();

        // Advance remaining 500ms
        vi.advanceTimersByTime(500);

        // Now it should be called with the new data ONLY ONCE
        expect(saveFn).toHaveBeenCalledWith({ val: 2 });
        expect(saveFn).toHaveBeenCalledTimes(1);
    });
    
    it('uses default delay of 1000ms if not provided', () => {
        const saveFn = vi.fn();
        const data = { foo: 'bar' };

        // No delay options passed
        renderHook(() => useCloudAutoSave(true, data, saveFn));

        vi.advanceTimersByTime(999);
        expect(saveFn).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(saveFn).toHaveBeenCalledTimes(1);
    });
});
