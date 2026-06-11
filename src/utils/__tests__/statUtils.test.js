import { describe, it, expect } from 'vitest';
import { calculateRepsForDay, isPerfectDay, isGlobalPerfectDay } from '../statUtils';
import { EXERCISES } from '../../config/exercises';
import { WEIGHT_EXERCISES } from '../../config/weights';

const getConfig = () => ({ difficulty: 1, weight: null });

// ── isPerfectDay ────────────────────────────────────────────────────────

describe('isPerfectDay', () => {
  const exercises = [{ id: 'a' }, { id: 'b' }];

  it('is true when every exercise is completed', () => {
    const day = { a: { isCompleted: true }, b: { isCompleted: true } };
    expect(isPerfectDay(day, exercises)).toBe(true);
  });

  it('is false when one exercise is missing', () => {
    const day = { a: { isCompleted: true } };
    expect(isPerfectDay(day, exercises)).toBe(false);
  });

  it('is false when one exercise is not completed', () => {
    const day = { a: { isCompleted: true }, b: { isCompleted: false } };
    expect(isPerfectDay(day, exercises)).toBe(false);
  });

  it('is false for empty inputs', () => {
    expect(isPerfectDay(null, exercises)).toBe(false);
    expect(isPerfectDay({}, [])).toBe(false);
  });
});

// ── isGlobalPerfectDay ──────────────────────────────────────────────────

describe('isGlobalPerfectDay', () => {
  it('is true when ALL bodyweight exercises are completed', () => {
    const day = Object.fromEntries(EXERCISES.map(e => [e.id, { isCompleted: true }]));
    expect(isGlobalPerfectDay(day, EXERCISES)).toBe(true);
  });

  it('is false when a single bodyweight exercise is missing', () => {
    const day = Object.fromEntries(EXERCISES.slice(1).map(e => [e.id, { isCompleted: true }]));
    expect(isGlobalPerfectDay(day, EXERCISES)).toBe(false);
  });

  it('is true when ALL weight exercises are completed (weights-only perfect)', () => {
    const day = Object.fromEntries(WEIGHT_EXERCISES.map(e => [e.id, { isCompleted: true }]));
    expect(isGlobalPerfectDay(day, WEIGHT_EXERCISES)).toBe(true);
  });

  it('is false with no completions', () => {
    expect(isGlobalPerfectDay(null, EXERCISES)).toBe(false);
    expect(isGlobalPerfectDay({}, EXERCISES)).toBe(false);
  });
});

// ── calculateRepsForDay ─────────────────────────────────────────────────

describe('calculateRepsForDay', () => {
  const exercises = [
    { id: 'pushups', multiplier: 1 },
    { id: 'squats', multiplier: 0.5 },
  ];

  it('sums the daily goal of each completed exercise', () => {
    const day = {
      pushups: { isCompleted: true },
      squats: { isCompleted: true },
    };
    // day 100: pushups goal 100, squats goal ceil(100*0.5)=50
    expect(calculateRepsForDay(day, 100, exercises, getConfig, '2026-06-10')).toBe(150);
  });

  it('ignores exercises that are not completed', () => {
    const day = { pushups: { isCompleted: true }, squats: { isCompleted: false } };
    expect(calculateRepsForDay(day, 100, exercises, getConfig, '2026-06-10')).toBe(100);
  });

  it('applies the per-exercise difficulty from getConfig', () => {
    const halved = () => ({ difficulty: 0.5, weight: null });
    const day = { pushups: { isCompleted: true } };
    expect(calculateRepsForDay(day, 100, [exercises[0]], halved, '2026-06-10')).toBe(50);
  });

  it('returns 0 for empty inputs', () => {
    expect(calculateRepsForDay(null, 100, exercises, getConfig, '2026-06-10')).toBe(0);
    expect(calculateRepsForDay({}, 100, null, getConfig, '2026-06-10')).toBe(0);
    expect(calculateRepsForDay({}, 100, exercises, getConfig, '2026-06-10')).toBe(0);
  });
});
