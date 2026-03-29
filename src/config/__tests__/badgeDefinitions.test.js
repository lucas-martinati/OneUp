import { describe, it, expect } from 'vitest';
import { BADGE_DEFINITIONS } from '../badgeDefinitions';

// Stats snapshot with all zeroes
const EMPTY_STATS = {
  totalDays: 0, maxStreak: 0, totalRepsAll: 0, perfectDays: 0,
  hasCompletedAllExercisesOnce: false, weekdayWorkouts: 0, weekendWorkouts: 0,
  morningWorkouts: 0, afternoonWorkouts: 0, eveningWorkouts: 0,
  ghostWorkout: false, perfectStreak: 0,
};

// Stats snapshot with everything maxed — all badges should unlock
const MAXED_STATS = {
  totalDays: 999999, maxStreak: 999999, totalRepsAll: 999999, perfectDays: 999999,
  hasCompletedAllExercisesOnce: true, weekdayWorkouts: 999999, weekendWorkouts: 999999,
  morningWorkouts: 999999, afternoonWorkouts: 999999, eveningWorkouts: 999999,
  ghostWorkout: true, perfectStreak: 999999,
};

// ── Structure ──────────────────────────────────────────────────────────

describe('BADGE_DEFINITIONS', () => {
  it('has 40 badges', () => {
    expect(BADGE_DEFINITIONS.length).toBe(40);
  });

  it('every badge has id, icon, color, category, test', () => {
    for (const def of BADGE_DEFINITIONS) {
      expect(def.id, `badge missing id`).toBeTruthy();
      expect(def.icon, `badge "${def.id}" missing icon`).toBeTruthy();
      expect(def.color, `badge "${def.id}" missing color`).toBeTruthy();
      expect(def.category, `badge "${def.id}" missing category`).toBeTruthy();
      expect(typeof def.test, `badge "${def.id}" missing test`).toBe('function');
    }
  });

  it('every badge has a unique id', () => {
    const ids = BADGE_DEFINITIONS.map(d => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('no badge has a key field (redundant with id)', () => {
    for (const def of BADGE_DEFINITIONS) {
      expect(def.key, `badge "${def.id}" should not have a key field`).toBeUndefined();
    }
  });

  // ── Zero stats ──────────────────────────────────────────────────────

  it('no badge unlocks with empty stats', () => {
    const unlocked = BADGE_DEFINITIONS.filter(b => b.test(EMPTY_STATS));
    expect(unlocked).toHaveLength(0);
  });

  // ── Maxed stats ─────────────────────────────────────────────────────

  it('all badges unlock with maxed stats', () => {
    const unlocked = BADGE_DEFINITIONS.filter(b => b.test(MAXED_STATS));
    expect(unlocked).toHaveLength(BADGE_DEFINITIONS.length);
  });

  // ── Threshold tests (boundary values) ───────────────────────────────

  describe('streak badges', () => {
    it.each([
      ['first_blood',   'totalDays',  0, false],
      ['first_blood',   'totalDays',  1, true],
      ['consistent',    'maxStreak',  2, false],
      ['consistent',    'maxStreak',  3, true],
      ['week_warrior',  'maxStreak',  6, false],
      ['week_warrior',  'maxStreak',  7, true],
      ['two_weeks',     'maxStreak', 13, false],
      ['two_weeks',     'maxStreak', 14, true],
      ['month_warrior', 'maxStreak', 29, false],
      ['month_warrior', 'maxStreak', 30, true],
      ['two_months',    'maxStreak', 59, false],
      ['two_months',    'maxStreak', 60, true],
      ['quarter_year',  'maxStreak', 89, false],
      ['quarter_year',  'maxStreak', 90, true],
      ['half_year',     'maxStreak', 179, false],
      ['half_year',     'maxStreak', 180, true],
      ['year_beast',    'maxStreak', 364, false],
      ['year_beast',    'maxStreak', 365, true],
    ])('%s unlocks at %s=%j → %j', (badgeId, field, value, expected) => {
      const def = BADGE_DEFINITIONS.find(b => b.id === badgeId);
      expect(def.test({ ...EMPTY_STATS, [field]: value })).toBe(expected);
    });
  });

  describe('quantity badges', () => {
    it.each([
      ['ten_sessions',          'totalDays',   9, false],
      ['ten_sessions',          'totalDays',  10, true],
      ['fifty_sessions',        'totalDays',  49, false],
      ['fifty_sessions',        'totalDays',  50, true],
      ['hundred_sessions',      'totalDays',  99, false],
      ['hundred_sessions',      'totalDays', 100, true],
      ['two_hundred_sessions',  'totalDays', 199, false],
      ['two_hundred_sessions',  'totalDays', 200, true],
      ['five_hundred_sessions', 'totalDays', 499, false],
      ['five_hundred_sessions', 'totalDays', 500, true],
    ])('%s unlocks at %s=%j → %j', (badgeId, field, value, expected) => {
      const def = BADGE_DEFINITIONS.find(b => b.id === badgeId);
      expect(def.test({ ...EMPTY_STATS, [field]: value })).toBe(expected);
    });

    it('all_exercises unlocks only when flag is true', () => {
      const def = BADGE_DEFINITIONS.find(b => b.id === 'all_exercises');
      expect(def.test({ ...EMPTY_STATS, hasCompletedAllExercisesOnce: false })).toBe(false);
      expect(def.test({ ...EMPTY_STATS, hasCompletedAllExercisesOnce: true })).toBe(true);
    });
  });

  describe('volume badges', () => {
    it.each([
      ['rep_500',   'totalRepsAll',    499, false],
      ['rep_500',   'totalRepsAll',    500, true],
      ['rep_1000',  'totalRepsAll',    999, false],
      ['rep_1000',  'totalRepsAll',   1000, true],
      ['rep_5000',  'totalRepsAll',   4999, false],
      ['rep_5000',  'totalRepsAll',   5000, true],
      ['rep_10000', 'totalRepsAll',   9999, false],
      ['rep_10000', 'totalRepsAll',  10000, true],
      ['rep_50000', 'totalRepsAll',  49999, false],
      ['rep_50000', 'totalRepsAll',  50000, true],
      ['beast',     'totalRepsAll',  99999, false],
      ['beast',     'totalRepsAll', 100000, true],
    ])('%s unlocks at %s=%j → %j', (badgeId, field, value, expected) => {
      const def = BADGE_DEFINITIONS.find(b => b.id === badgeId);
      expect(def.test({ ...EMPTY_STATS, [field]: value })).toBe(expected);
    });
  });

  describe('perfection badges', () => {
    it.each([
      ['perfect_one',          'perfectDays',   0, false],
      ['perfect_one',          'perfectDays',   1, true],
      ['perfect_five',         'perfectDays',   4, false],
      ['perfect_five',         'perfectDays',   5, true],
      ['perfect_fifty',        'perfectDays',  49, false],
      ['perfect_fifty',        'perfectDays',  50, true],
      ['perfect_hundred',      'perfectDays',  99, false],
      ['perfect_hundred',      'perfectDays', 100, true],
      ['perfect_two_hundred',  'perfectDays', 199, false],
      ['perfect_two_hundred',  'perfectDays', 200, true],
    ])('%s unlocks at %s=%j → %j', (badgeId, field, value, expected) => {
      const def = BADGE_DEFINITIONS.find(b => b.id === badgeId);
      expect(def.test({ ...EMPTY_STATS, [field]: value })).toBe(expected);
    });
  });

  describe('schedule badges', () => {
    it.each([
      ['weekday_warrior', { weekdayWorkouts: 24 }, false],
      ['weekday_warrior', { weekdayWorkouts: 25 }, true],
      ['weekend_warrior', { weekendWorkouts: 24 }, false],
      ['weekend_warrior', { weekendWorkouts: 25 }, true],
      ['balanced',        { weekdayWorkouts: 10, weekendWorkouts: 9 }, false],
      ['balanced',        { weekdayWorkouts: 10, weekendWorkouts: 10 }, true],
      ['morning_5',       { morningWorkouts: 4 }, false],
      ['morning_5',       { morningWorkouts: 5 }, true],
      ['morning_10',      { morningWorkouts: 9 }, false],
      ['morning_10',      { morningWorkouts: 10 }, true],
      ['morning_25',      { morningWorkouts: 24 }, false],
      ['morning_25',      { morningWorkouts: 25 }, true],
      ['afternoon_5',     { afternoonWorkouts: 4 }, false],
      ['afternoon_5',     { afternoonWorkouts: 5 }, true],
      ['afternoon_10',    { afternoonWorkouts: 9 }, false],
      ['afternoon_10',    { afternoonWorkouts: 10 }, true],
      ['afternoon_25',    { afternoonWorkouts: 24 }, false],
      ['afternoon_25',    { afternoonWorkouts: 25 }, true],
      ['evening_5',       { eveningWorkouts: 4 }, false],
      ['evening_5',       { eveningWorkouts: 5 }, true],
      ['evening_10',      { eveningWorkouts: 9 }, false],
      ['evening_10',      { eveningWorkouts: 10 }, true],
      ['evening_25',      { eveningWorkouts: 24 }, false],
      ['evening_25',      { eveningWorkouts: 25 }, true],
    ])('%s with %j → %j', (badgeId, overrides, expected) => {
      const def = BADGE_DEFINITIONS.find(b => b.id === badgeId);
      expect(def.test({ ...EMPTY_STATS, ...overrides })).toBe(expected);
    });
  });

  describe('secret badges', () => {
    it('ghost unlocks only when ghostWorkout is true', () => {
      const def = BADGE_DEFINITIONS.find(b => b.id === 'ghost');
      expect(def.test(EMPTY_STATS)).toBe(false);
      expect(def.test({ ...EMPTY_STATS, ghostWorkout: true })).toBe(true);
    });

    it('perfectionist unlocks at perfectStreak >= 30', () => {
      const def = BADGE_DEFINITIONS.find(b => b.id === 'perfectionist');
      expect(def.test({ ...EMPTY_STATS, perfectStreak: 29 })).toBe(false);
      expect(def.test({ ...EMPTY_STATS, perfectStreak: 30 })).toBe(true);
    });
  });
});
