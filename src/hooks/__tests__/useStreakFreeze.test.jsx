import { renderHook, act } from '@testing-library/react';
import { useStreakFreeze } from '../useStreakFreeze';
import { useProgressStore } from '@store/useProgressStore';
import { useCloudSyncStore } from '@store/useCloudSyncStore';
import { useSubscription } from '@contexts/SubscriptionContext';
import { useAuth } from '@contexts/AuthContext';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@store/useProgressStore');
vi.mock('@store/useCloudSyncStore');
vi.mock('@contexts/SubscriptionContext');
vi.mock('@contexts/AuthContext');
vi.mock('@utils/icons', () => ({ Snowflake: () => null, ChevronRight: () => null }));
vi.mock('../useToastGestures', () => ({ useToastGestures: () => ({ exit: false, cardProps: { style: {} } }) }));

describe('useStreakFreeze', () => {
    let mockClearStreakFreezes;
    let mockReconcileStreakFreezes;

    beforeEach(() => {
        mockClearStreakFreezes = vi.fn();
        mockReconcileStreakFreezes = vi.fn();
        useProgressStore.mockImplementation((selector) => {
            const state = {
                isSetup: true,
                isStoreInitialized: true,
                clearStreakFreezes: mockClearStreakFreezes,
                reconcileStreakFreezes: mockReconcileStreakFreezes,
                frozenDays: {}
            };
            return selector(state);
        });
        useCloudSyncStore.mockImplementation((selector) => {
            const state = { isInitialSyncDone: true };
            return selector(state);
        });
        useSubscription.mockReturnValue({ isPro: false, isSubscriptionLoading: false });
        useAuth.mockReturnValue({ isSignedIn: true });
    });

    it('clears streak freezes if store is initialized but not signed in', () => {
        useAuth.mockReturnValue({ isSignedIn: false });
        renderHook(() => useStreakFreeze());
        expect(mockClearStreakFreezes).toHaveBeenCalled();
    });

    it('calls reconcileStreakFreezes when ready', () => {
        renderHook(() => useStreakFreeze());
        expect(mockReconcileStreakFreezes).toHaveBeenCalledWith(false);
    });

    it('does not toast the first run even if reconciliation froze days', () => {
        // A fresh mount (or fresh sign-in) captures the baseline only: days
        // frozen by the very first reconcile must not surface a toast.
        mockReconcileStreakFreezes.mockReturnValue(['2025-01-01']);

        const { result } = renderHook(() => useStreakFreeze());
        expect(mockReconcileStreakFreezes).toHaveBeenCalledWith(false);
        expect(result.current.StreakFreezeToast()).toBeNull();
    });

    it('triggers a toast when reconciliation freezes new days', () => {
        vi.useFakeTimers();

        const { result, rerender } = renderHook(() => useStreakFreeze());

        // Initial render: baseline only, no toast
        expect(result.current.StreakFreezeToast()).toBeNull();

        // Next run: reconciliation actually freezes one day → toast
        mockReconcileStreakFreezes.mockReturnValue(['2025-01-02']);
        act(() => {
            rerender();
        });

        act(() => {
            vi.runAllTimers();
        });

        const Toast = result.current.StreakFreezeToast();
        expect(Toast).not.toBeNull();
        expect(Toast.props.count).toBe(1);
        vi.useRealTimers();
    });

    it('does not toast when reconciliation froze nothing', () => {
        vi.useFakeTimers();

        const { result, rerender } = renderHook(() => useStreakFreeze());
        mockReconcileStreakFreezes.mockReturnValue([]);

        act(() => {
            rerender();
        });
        act(() => {
            vi.runAllTimers();
        });

        expect(result.current.StreakFreezeToast()).toBeNull();
        vi.useRealTimers();
    });

    it('resets the baseline on sign-out so the next user gets no spurious toast', () => {
        vi.useFakeTimers();

        // Signed-in run: baseline captured with one frozen day.
        const { result, rerender } = renderHook(() => useStreakFreeze());

        // Sign out → store initialized + not signed in → baseline reset.
        useAuth.mockReturnValue({ isSignedIn: false });
        act(() => {
            rerender();
        });
        expect(mockClearStreakFreezes).toHaveBeenCalled();

        // Different user signs in and the reconciliation freezes a day; the
        // baseline was reset on sign-out, so the first run of this user is a
        // baseline-only run — no toast.
        mockReconcileStreakFreezes.mockReturnValue(['2025-02-01']);
        useAuth.mockReturnValue({ isSignedIn: true });
        act(() => {
            rerender();
        });
        act(() => {
            vi.runAllTimers();
        });

        expect(result.current.StreakFreezeToast()).toBeNull();
        vi.useRealTimers();
    });
});
