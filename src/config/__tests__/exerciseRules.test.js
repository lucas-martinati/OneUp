import { describe, it, expect } from 'vitest';

import {
  EXERCISES,
  WEIGHT_EXERCISES,
  CARDIO_EXERCISES,
  ALL_STANDARD_IDS,
  ALL_WEIGHT_IDS,
  ALL_EXERCISE_IDS,
  getDailyGoal,
} from '../../../functions/shared/exerciseRules.js';

describe('exerciseRules — shared config integrity', () => {
  it('exposes lists of exercises', () => {
    expect(EXERCISES.length).toBeGreaterThan(0);
    expect(WEIGHT_EXERCISES.length).toBeGreaterThan(0);
    expect(CARDIO_EXERCISES.length).toBeGreaterThan(0);
  });

  it('exposes correct sets of IDs', () => {
    expect(ALL_STANDARD_IDS.size).toBe(EXERCISES.length);
    expect(ALL_WEIGHT_IDS.size).toBe(WEIGHT_EXERCISES.length);
    expect(ALL_EXERCISE_IDS.size).toBe(
      EXERCISES.length + WEIGHT_EXERCISES.length + CARDIO_EXERCISES.length
    );
  });

  it('does not overlap standard and weight IDs', () => {
    const standardIds = EXERCISES.map(e => e.id);
    const weightIds = WEIGHT_EXERCISES.map(e => e.id);
    expect(standardIds.some(id => weightIds.includes(id))).toBe(false);
  });
});

describe('exerciseRules — getDailyGoal', () => {
  const ex = { id: 'test', multiplier: 1 };

  it('returns 1 when exercise is missing', () => {
    expect(getDailyGoal(null, 50)).toBe(1);
    expect(getDailyGoal(undefined, 50)).toBe(1);
  });

  it('equals the day number for a 1x multiplier', () => {
    expect(getDailyGoal(ex, 100)).toBe(100);
    expect(getDailyGoal(ex, 1)).toBe(1);
  });

  it('applies the exercise multiplier (rounded up)', () => {
    expect(getDailyGoal({ id: 'x', multiplier: 0.4 }, 10)).toBe(4);
    expect(getDailyGoal({ id: 'x', multiplier: 1.5 }, 7)).toBe(11); // ceil(10.5)
  });

  it('applies the user difficulty multiplier', () => {
    expect(getDailyGoal(ex, 100, 0.5)).toBe(50);
    expect(getDailyGoal(ex, 100, 0.1)).toBe(10);
  });

  it('combines exercise and user multipliers', () => {
    expect(getDailyGoal({ id: 'x', multiplier: 0.5 }, 100, 0.5)).toBe(25);
  });

  it('never returns less than 1', () => {
    expect(getDailyGoal(ex, 0)).toBe(1);
    expect(getDailyGoal({ id: 'x', multiplier: 0.1 }, 1, 0.1)).toBe(1);
  });

  it('weekly mode ignores multipliers: ceil(week * 7)', () => {
    expect(getDailyGoal(ex, 3, 0.5, true)).toBe(21);
    expect(getDailyGoal(ex, 1, 1, true)).toBe(7);
  });
});
