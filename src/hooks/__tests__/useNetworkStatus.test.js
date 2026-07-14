import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNetworkStatus } from '../useNetworkStatus';

describe('useNetworkStatus', () => {
    let originalNavigatorOnline;

    beforeEach(() => {
        originalNavigatorOnline = navigator.onLine;
        vi.stubGlobal('navigator', { ...navigator, onLine: true });
    });

    afterEach(() => {
        vi.stubGlobal('navigator', { ...navigator, onLine: originalNavigatorOnline });
        vi.restoreAllMocks();
    });

    it('returns navigator.onLine initially', () => {
        const { result } = renderHook(() => useNetworkStatus());
        expect(result.current).toBe(true);
    });

    it('updates to false when offline event fires', () => {
        const { result } = renderHook(() => useNetworkStatus());
        act(() => {
            window.dispatchEvent(new Event('offline'));
        });
        expect(result.current).toBe(false);
    });

    it('updates to true when online event fires', () => {
        vi.stubGlobal('navigator', { ...navigator, onLine: false });
        const { result } = renderHook(() => useNetworkStatus());
        
        act(() => {
            window.dispatchEvent(new Event('online'));
        });
        expect(result.current).toBe(true);
    });

    it('handles oneup-debug-network event', () => {
        const { result } = renderHook(() => useNetworkStatus());
        
        act(() => {
            window.dispatchEvent(new CustomEvent('oneup-debug-network', { detail: { online: false } }));
        });
        expect(result.current).toBe(false);

        act(() => {
            window.dispatchEvent(new CustomEvent('oneup-debug-network', { detail: { online: true } }));
        });
        expect(result.current).toBe(true);
    });

    it('cleans up event listeners on unmount', () => {
        const { unmount } = renderHook(() => useNetworkStatus());
        unmount();
    });
});
