import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const storeState = {
  completions: {},
  settings: { exerciseDifficulties: {} },
  updateSettings: vi.fn(),
};
vi.mock('@store/useProgressStore', () => ({
  useProgressStore: (s) => s({ completions: storeState.completions }),
}));
vi.mock('@store/useSettingsStore', () => ({
  useSettingsStore: (s) => s({ settings: storeState.settings, updateSettings: storeState.updateSettings }),
}));

const exercisesCtx = { getWeight: vi.fn(() => 50), setWeight: vi.fn() };
vi.mock('@contexts/ExercisesContext', () => ({ useExercises: () => exercisesCtx }));

import { useExerciseConfig } from '../useExerciseConfig';

beforeEach(() => {
  vi.clearAllMocks();
  storeState.completions = {};
  storeState.settings = { exerciseDifficulties: {} };
});

describe('useExerciseConfig', () => {
  it('returns defaults for an unknown exercise', () => {
    const { result } = renderHook(() => useExerciseConfig());
    expect(result.current.getConfig(null)).toEqual({ difficulty: 1.0, weight: null });
  });

  it('reads live difficulty from settings and weight from context', () => {
    storeState.settings = { exerciseDifficulties: { bench: 1.5 } };
    const { result } = renderHook(() => useExerciseConfig());
    expect(result.current.getConfig('bench')).toEqual({ difficulty: 1.5, weight: 50 });
  });

  it('prioritizes saved historical config for a completed past day', () => {
    storeState.completions = {
      '2026-01-01': { bench: { isCompleted: true, difficulty: 2.0, weight: 80 } },
    };
    const { result } = renderHook(() => useExerciseConfig());
    expect(result.current.getConfig('bench', '2026-01-01')).toEqual({ weight: 80, difficulty: 2.0 });
  });

  it('falls back to globals when historical day lacks saved values', () => {
    storeState.completions = { '2026-01-01': { bench: { isCompleted: true } } };
    const { result } = renderHook(() => useExerciseConfig());
    expect(result.current.getConfig('bench', '2026-01-01')).toEqual({ weight: 50, difficulty: 1.0 });
  });

  it('updateConfig writes weight and difficulty', () => {
    const { result } = renderHook(() => useExerciseConfig());
    act(() => result.current.updateConfig('bench', { weight: 70, difficulty: 1.2 }));
    expect(exercisesCtx.setWeight).toHaveBeenCalledWith('bench', 70);
    expect(storeState.updateSettings).toHaveBeenCalled();
  });

  it('updateConfig with no params is a no-op', () => {
    const { result } = renderHook(() => useExerciseConfig());
    act(() => result.current.updateConfig('bench'));
    expect(exercisesCtx.setWeight).not.toHaveBeenCalled();
  });
});
