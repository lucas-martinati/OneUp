import { describe, it, expect } from 'vitest';
import { sumExerciseReps } from '../stats';

describe('sumExerciseReps', () => {
  it('returns 0 for a non-array input', () => {
    expect(sumExerciseReps(null)).toBe(0);
    expect(sumExerciseReps(undefined)).toBe(0);
    expect(sumExerciseReps({})).toBe(0);
  });

  it('returns 0 for an empty array', () => {
    expect(sumExerciseReps([])).toBe(0);
  });

  it('sums the reps field of each exercise', () => {
    expect(sumExerciseReps([{ reps: 10 }, { reps: 25 }, { reps: 5 }])).toBe(40);
  });

  it('treats missing reps as 0', () => {
    expect(sumExerciseReps([{ reps: 10 }, {}, { reps: 5 }])).toBe(15);
  });
});
