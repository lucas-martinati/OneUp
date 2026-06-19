import { useComputedStatsStore } from '@store/useComputedStatsStore';

/**
 * Hook that returns centralized computed stats from the Zustand store.
 * 
 * Stats are computed once by ComputedStatsSynchronizer (mounted in App.jsx)
 * and shared across all consumers via the store — no duplicate computation.
 *
 * Usage:
 *   const computedStats = useComputedStatsStore(s => s.stats);
 */
export function useComputedStatsFromStore() {
    return useComputedStatsStore(s => s.stats);
}
