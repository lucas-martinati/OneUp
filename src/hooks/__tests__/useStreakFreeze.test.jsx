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

    beforeEach(() => {
        mockClearStreakFreezes = vi.fn();
        useProgressStore.mockImplementation((selector) => {
            const state = {
                isSetup: true,
                isStoreInitialized: true,
                clearStreakFreezes: mockClearStreakFreezes,
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

    it('triggers a toast when frozenDays increases', () => {
        vi.useFakeTimers();
        let currentFrozenDays = { '2025-01-01': true };

        useProgressStore.mockImplementation((selector) => {
            const state = {
                isSetup: true,
                isStoreInitialized: true,
                clearStreakFreezes: mockClearStreakFreezes,
                frozenDays: currentFrozenDays
            };
            return selector(state);
        });

        const { result, rerender } = renderHook(() => useStreakFreeze());

        // Initial render: no toast
        let Toast = result.current.StreakFreezeToast();
        expect(Toast).toBeNull();

        // Update frozenDays
        act(() => {
            currentFrozenDays = { '2025-01-01': true, '2025-01-02': true };
            rerender();
        });

        act(() => {
            vi.runAllTimers();
        });

        Toast = result.current.StreakFreezeToast();
        expect(Toast).not.toBeNull();
        expect(Toast.props.count).toBe(1);
        vi.useRealTimers();
    });
});
