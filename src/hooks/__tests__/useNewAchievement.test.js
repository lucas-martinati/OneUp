import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNewAchievement } from '../useNewAchievement';
import * as badgeDefinitions from '@config/badgeDefinitions';

describe('useNewAchievement', () => {
    const tMock = vi.fn((key, defaultVal) => defaultVal || key);
    
    beforeEach(() => {
        vi.useFakeTimers();
        tMock.mockClear();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('does not detect badges during initial hydration phase (<2500ms)', () => {
        const stats = { badgeStats: { totalDays: 0 } };
        // We mock isBadgeUnlocked to always return true for 'first_blood' just for test
        vi.spyOn(badgeDefinitions, 'isBadgeUnlocked').mockImplementation((id) => id === 'first_blood');

        const { result, rerender } = renderHook(
            ({ computedStats }) => useNewAchievement(computedStats, tMock),
            { initialProps: { computedStats: stats } }
        );

        expect(result.current.achievement).toBeNull();

        // Fast forward 1000ms, still not ready
        act(() => {
            vi.advanceTimersByTime(1000);
        });

        rerender({ computedStats: { badgeStats: { totalDays: 1 } } });

        expect(result.current.achievement).toBeNull();
    });

    it('detects a new badge once ready and state changes', () => {
        // Initial state
        let mockedUnlocked = new Set();
        vi.spyOn(badgeDefinitions, 'isBadgeUnlocked').mockImplementation((id) => mockedUnlocked.has(id));

        const stats = { badgeStats: { totalDays: 0 } };
        const { result, rerender } = renderHook(
            ({ computedStats }) => useNewAchievement(computedStats, tMock),
            { initialProps: { computedStats: stats } }
        );

        // Fast forward beyond hydration
        act(() => {
            vi.advanceTimersByTime(2600);
        });

        // Still nothing unlocked
        rerender({ computedStats: stats });
        expect(result.current.achievement).toBeNull();

        // Now unlock a badge and rerender (new badgeStats reference re-runs the effect)
        mockedUnlocked.add('first_blood');

        act(() => {
            rerender({ computedStats: { badgeStats: { totalDays: 1 } } });
        });

        // Since setNewAchievement uses queueMicrotask, we need to wait a tick
        // But renderHook with act handles it in Vitest with fake timers often
        expect(result.current.achievement).not.toBeNull();
        expect(result.current.achievement.id).toBe('first_blood');
    });

    it('clearAchievement resets the achievement to null', () => {
        let mockedUnlocked = new Set();
        vi.spyOn(badgeDefinitions, 'isBadgeUnlocked').mockImplementation((id) => mockedUnlocked.has(id));

        const stats = { badgeStats: { totalDays: 0 } };
        const { result, rerender } = renderHook(
            ({ computedStats }) => useNewAchievement(computedStats, tMock),
            { initialProps: { computedStats: stats } }
        );

        act(() => {
            vi.advanceTimersByTime(2600);
        });

        mockedUnlocked.add('hundred_sessions');

        act(() => {
            rerender({ computedStats: { badgeStats: { totalDays: 100 } } });
        });

        expect(result.current.achievement).not.toBeNull();

        act(() => {
            result.current.clearAchievement();
        });

        expect(result.current.achievement).toBeNull();
    });
});
