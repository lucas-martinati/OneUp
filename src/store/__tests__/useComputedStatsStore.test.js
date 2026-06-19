import { describe, it, expect, vi } from 'vitest';
import { useComputedStatsStore } from '../useComputedStatsStore';
import * as useComputedStatsModule from '../../hooks/useComputedStats';

describe('useComputedStatsStore', () => {
    it('has EMPTY_STATS as initial state', () => {
        const state = useComputedStatsStore.getState();
        expect(state.stats).toBeDefined();
        expect(state.stats.totalDays).toBe(0);
        expect(state.stats.pieData).toBeDefined();
    });

    it('calls computeAllStats and updates the store on recompute', () => {
        const mockComputedResult = { totalDays: 10, perfectDays: 5 };
        const computeSpy = vi.spyOn(useComputedStatsModule, 'computeAllStats').mockReturnValue(mockComputedResult);

        useComputedStatsStore.getState().recompute(
            {}, // completions
            {}, // settings
            () => 1, // getDayNumber
            [], // customExercises
            false, // hasShared
            {}, // achievements
            () => ({ difficulty: 1, weight: null }), // getConfig
            [], // cardioData
            '2026-01-01' // userStartDate
        );

        expect(computeSpy).toHaveBeenCalledTimes(1);
        expect(useComputedStatsStore.getState().stats).toEqual(mockComputedResult);

        computeSpy.mockRestore();
    });
});
