import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStreakFreeze } from '../useStreakFreeze';

const mockReconcile = vi.fn();
const mockClear = vi.fn();

vi.mock('@store/useProgressStore', () => ({
    useProgressStore: (selector) => selector({
        isSetup: true,
        isStoreInitialized: true,
        reconcileStreakFreezes: mockReconcile,
        clearStreakFreezes: mockClear
    })
}));

vi.mock('@store/useCloudSyncStore', () => ({
    useCloudSyncStore: (selector) => selector({
        isInitialSyncDone: true
    })
}));

vi.mock('@contexts/SubscriptionContext', () => ({
    useSubscription: () => ({ isPro: false, isSubscriptionLoading: false })
}));

let mockIsSignedIn = true;
vi.mock('@contexts/AuthContext', () => ({
    useAuth: () => ({ isSignedIn: mockIsSignedIn })
}));

vi.mock('@components/feedback/toastRoot', () => ({
    getToastRoot: () => document.body
}));

describe('useStreakFreeze', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        mockIsSignedIn = true;
        mockReconcile.mockReturnValue([]);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('clears streak freezes if store is initialized but not signed in', () => {
        mockIsSignedIn = false;
        renderHook(() => useStreakFreeze());
        expect(mockClear).toHaveBeenCalled();
    });

    it('runs reconciliation when ready', () => {
        mockReconcile.mockReturnValue([]);
        renderHook(() => useStreakFreeze());
        
        act(() => {
            vi.runOnlyPendingTimers();
        });
        
        expect(mockReconcile).toHaveBeenCalled();
    });

    it('sets toast state when freezes occurred', () => {
        mockReconcile.mockReturnValue(['2024-01-01']);
        const { result } = renderHook(() => useStreakFreeze());
        
        act(() => {
            vi.runOnlyPendingTimers();
        });
        
        expect(mockReconcile).toHaveBeenCalled();
        // The hook returns { StreakFreezeToast } which is a component
        const ToastComponent = result.current.StreakFreezeToast;
        expect(ToastComponent).toBeTruthy();
        
        // We could render the ToastComponent, but rendering hook state should suffice for branch coverage
        const toastEl = ToastComponent();
        expect(toastEl).not.toBeNull();
    });

    it('runs reconciliation on interval if date changes', () => {
        mockReconcile.mockReturnValue([]);
        renderHook(() => useStreakFreeze());
        
        act(() => {
            vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 35000); // Wait 24h to trigger date change
        });
        
        // Initial + Interval call = 2
        expect(mockReconcile).toHaveBeenCalledTimes(2);
    });
});
