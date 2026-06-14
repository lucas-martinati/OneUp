import { describe, it, expect } from 'vitest';
import { EXERCISES, EXERCISES_MAP, CARDIO_EXERCISES, getDailyGoal, getWeeklyGoalKm } from '../exercises';
import { WEIGHT_EXERCISES, WEIGHT_EXERCISES_MAP } from '../weights';

// ── getWeeklyGoalKm (cardio) ────────────────────────────────────────────

describe('getWeeklyGoalKm', () => {
  it('scales running by +0.45 km per week', () => {
    expect(getWeeklyGoalKm('running', 1)).toBeCloseTo(0.45, 5);
    expect(getWeeklyGoalKm('running', 2)).toBeCloseTo(0.9, 5);
    expect(getWeeklyGoalKm('running', 10)).toBeCloseTo(4.5, 5);
  });

  it('scales cycling by +0.75 km per week', () => {
    expect(getWeeklyGoalKm('cycling', 1)).toBeCloseTo(0.75, 5);
    expect(getWeeklyGoalKm('cycling', 4)).toBeCloseTo(3.0, 5);
  });

  it('returns 0 for an unknown mode', () => {
    expect(getWeeklyGoalKm('swimming', 5)).toBe(0);
    expect(getWeeklyGoalKm(undefined, 5)).toBe(0);
  });
});

// ── getDailyGoal ────────────────────────────────────────────────────────

describe('getDailyGoal', () => {
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

  it('weekly mode (cardio) ignores multipliers: ceil(week * 7)', () => {
    expect(getDailyGoal(ex, 3, 0.5, true)).toBe(21);
    expect(getDailyGoal(ex, 1, 1, true)).toBe(7);
  });

  it('defaults multiplier to 1 when not defined', () => {
    expect(getDailyGoal({ id: 'x' }, 42)).toBe(42);
  });
});

// ── Catalog integrity ───────────────────────────────────────────────────

describe('EXERCISES catalog integrity', () => {
  it('has exercises and unique ids', () => {
    expect(EXERCISES.length).toBeGreaterThan(0);
    const ids = EXERCISES.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every exercise has the fields the dashboard relies on', () => {
    for (const ex of EXERCISES) {
      expect(ex.id, ex.id).toBeTruthy();
      expect(ex.icon, ex.id).toBeTruthy();
      expect(ex.color, ex.id).toMatch(/^#/);
      expect(Array.isArray(ex.gradient) && ex.gradient.length >= 2, `${ex.id} gradient`).toBe(true);
    }
  });

  it('EXERCISES_MAP mirrors the list', () => {
    for (const ex of EXERCISES) {
      expect(EXERCISES_MAP[ex.id]).toBe(ex);
    }
    expect(Object.keys(EXERCISES_MAP).length).toBe(EXERCISES.length);
  });
});

describe('WEIGHT_EXERCISES catalog integrity', () => {
  it('has unique ids, disjoint from bodyweight ids', () => {
    const ids = WEIGHT_EXERCISES.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    const bwIds = new Set(EXERCISES.map(e => e.id));
    expect(ids.some(id => bwIds.has(id))).toBe(false);
  });

  it('WEIGHT_EXERCISES_MAP mirrors the list', () => {
    for (const ex of WEIGHT_EXERCISES) {
      expect(WEIGHT_EXERCISES_MAP[ex.id]).toBe(ex);
    }
  });

  it('every weight exercise has color and gradient', () => {
    for (const ex of WEIGHT_EXERCISES) {
      expect(ex.color, ex.id).toMatch(/^#/);
      expect(Array.isArray(ex.gradient) && ex.gradient.length >= 2, `${ex.id} gradient`).toBe(true);
    }
  });
});

describe('CARDIO_EXERCISES catalog integrity', () => {
  it('contains running and cycling', () => {
    const ids = CARDIO_EXERCISES.map(e => e.id);
    expect(ids).toContain('running');
    expect(ids).toContain('cycling');
  });
});
