import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@store/useComputedStatsStore', () => ({
  useComputedStatsStore: (selector) => selector({ stats: { totalReps: 42 } }),
}));

import { useComputedStatsFromStore } from '../useComputedStatsFromStore';

describe('useComputedStatsFromStore', () => {
  it('returns the stats slice from the store', () => {
    const { result } = renderHook(() => useComputedStatsFromStore());
    expect(result.current).toEqual({ totalReps: 42 });
  });
});
