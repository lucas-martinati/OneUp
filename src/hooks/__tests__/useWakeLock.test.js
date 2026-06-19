import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useWakeLock } from '../useWakeLock';

describe('useWakeLock', () => {
    let originalNavigator;
    let mockRequest;
    let mockRelease;
    let mockAddEventListener;

    beforeEach(() => {
        originalNavigator = globalThis.navigator;
        
        mockRelease = vi.fn().mockResolvedValue();
        mockAddEventListener = vi.fn();
        
        mockRequest = vi.fn().mockResolvedValue({
            release: mockRelease,
            addEventListener: mockAddEventListener
        });

        globalThis.navigator = {
            wakeLock: {
                request: mockRequest
            }
        };

        // Mock document.visibilityState
        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            get: () => 'visible'
        });
    });

    afterEach(() => {
        globalThis.navigator = originalNavigator;
        vi.clearAllMocks();
        cleanup();
    });

    it('requests wake lock when enabled is true', async () => {
        renderHook(() => useWakeLock(true));

        // Need to wait for next tick because requestWakeLock is async inside useEffect
        await vi.waitFor(() => {
            expect(mockRequest).toHaveBeenCalledWith('screen');
        });
    });

    it('does not request wake lock when enabled is false', async () => {
        renderHook(() => useWakeLock(false));

        // Wait a bit to ensure it wasn't called
        await new Promise(resolve => setTimeout(resolve, 10));
        
        expect(mockRequest).not.toHaveBeenCalled();
    });

    it('releases wake lock on unmount', async () => {
        const { unmount } = renderHook(() => useWakeLock(true));

        await vi.waitFor(() => {
            expect(mockRequest).toHaveBeenCalledWith('screen');
        });

        unmount();

        await vi.waitFor(() => {
            expect(mockRelease).toHaveBeenCalled();
        });
    });

    it('handles visibility change event', async () => {
        renderHook(() => useWakeLock(true));

        await vi.waitFor(() => {
            expect(mockRequest).toHaveBeenCalledTimes(1);
        });

        // Dispatch visibilitychange
        act(() => {
            document.dispatchEvent(new Event('visibilitychange'));
        });

        await vi.waitFor(() => {
            // Should request again
            expect(mockRequest).toHaveBeenCalledTimes(2);
        });
    });

    it('does not crash if navigator.wakeLock is unsupported', () => {
        globalThis.navigator = {};
        
        // Should just return silently
        expect(() => renderHook(() => useWakeLock(true))).not.toThrow();
    });
});
