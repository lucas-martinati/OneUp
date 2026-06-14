import { describe, it, expect } from 'vitest';
import { BADGE_DEFINITIONS, isBadgeUnlocked, getBadgeIconFromDef } from '../badgeDefinitions';

// A stats snapshot with every tracked metric at zero. Individual tests bump
// only the field they care about, mirroring how computeAllStats feeds the
// badge engine.
const zeroStats = () => ({
  totalDays: 0,
  maxStreak: 0,
  totalRepsAll: 0,
  perfectDays: 0,
  perfectStreak: 0,
  hasCompletedAllExercisesOnce: false,
  weekdayWorkouts: 0,
  weekendWorkouts: 0,
  morningWorkouts: 0,
  afternoonWorkouts: 0,
  eveningWorkouts: 0,
  ghostWorkout: false,
});

const test = (id, stats) => isBadgeUnlocked(id, stats);

describe('isBadgeUnlocked — manual overrides win over computed state', () => {
  it('returns true when the achievement is manually set true', () => {
    // first_blood would also be false (totalDays 0), the override forces it on
    expect(isBadgeUnlocked('first_blood', zeroStats(), { first_blood: true })).toBe(true);
  });

  it('accepts the string "true" as a truthy override', () => {
    expect(isBadgeUnlocked('first_blood', zeroStats(), { first_blood: 'true' })).toBe(true);
  });

  it('returns false when manually set false even if the test would pass', () => {
    const stats = { ...zeroStats(), totalDays: 999 };
    expect(isBadgeUnlocked('first_blood', stats, { first_blood: false })).toBe(false);
  });

  it('accepts the string "false" as a falsy override', () => {
    const stats = { ...zeroStats(), totalDays: 999 };
    expect(isBadgeUnlocked('first_blood', stats, { first_blood: 'false' })).toBe(false);
  });

  it('falls back to the test function when no override is present', () => {
    expect(isBadgeUnlocked('first_blood', { ...zeroStats(), totalDays: 1 })).toBe(true);
    expect(isBadgeUnlocked('first_blood', zeroStats())).toBe(false);
  });

  it('returns false for an unknown badge id with no override', () => {
    expect(isBadgeUnlocked('does_not_exist', zeroStats())).toBe(false);
  });

  it('still honours an override for an unknown badge id', () => {
    expect(isBadgeUnlocked('does_not_exist', zeroStats(), { does_not_exist: true })).toBe(true);
  });
});

describe('isBadgeUnlocked — streak thresholds', () => {
  it.each([
    ['consistent', 3],
    ['week_warrior', 7],
    ['two_weeks', 14],
    ['month_warrior', 30],
    ['two_months', 60],
    ['quarter_year', 90],
    ['half_year', 180],
    ['year_beast', 365],
  ])('%s unlocks exactly at maxStreak %i', (id, threshold) => {
    expect(test(id, { ...zeroStats(), maxStreak: threshold - 1 })).toBe(false);
    expect(test(id, { ...zeroStats(), maxStreak: threshold })).toBe(true);
  });
});

describe('isBadgeUnlocked — quantity (totalDays) thresholds', () => {
  it.each([
    ['first_blood', 1],
    ['ten_sessions', 10],
    ['fifty_sessions', 50],
    ['hundred_sessions', 100],
    ['two_hundred_sessions', 200],
    ['five_hundred_sessions', 500],
  ])('%s unlocks exactly at totalDays %i', (id, threshold) => {
    expect(test(id, { ...zeroStats(), totalDays: threshold - 1 })).toBe(false);
    expect(test(id, { ...zeroStats(), totalDays: threshold })).toBe(true);
  });

  it('all_exercises tracks the hasCompletedAllExercisesOnce flag', () => {
    expect(test('all_exercises', zeroStats())).toBe(false);
    expect(test('all_exercises', { ...zeroStats(), hasCompletedAllExercisesOnce: true })).toBe(true);
  });
});

describe('isBadgeUnlocked — volume (totalRepsAll) thresholds', () => {
  it.each([
    ['rep_500', 500],
    ['rep_1000', 1000],
    ['rep_5000', 5000],
    ['rep_10000', 10000],
    ['rep_50000', 50000],
  ])('%s unlocks exactly at totalRepsAll %i', (id, threshold) => {
    expect(test(id, { ...zeroStats(), totalRepsAll: threshold - 1 })).toBe(false);
    expect(test(id, { ...zeroStats(), totalRepsAll: threshold })).toBe(true);
  });
});

describe('isBadgeUnlocked — perfection thresholds', () => {
  it.each([
    ['perfect_one', 1],
    ['perfect_five', 5],
    ['perfect_fifty', 50],
    ['perfect_hundred', 100],
  ])('%s unlocks exactly at perfectDays %i', (id, threshold) => {
    expect(test(id, { ...zeroStats(), perfectDays: threshold - 1 })).toBe(false);
    expect(test(id, { ...zeroStats(), perfectDays: threshold })).toBe(true);
  });
});

describe('isBadgeUnlocked — schedule & time-of-day thresholds', () => {
  it('weekday_warrior needs 25 weekday workouts', () => {
    expect(test('weekday_warrior', { ...zeroStats(), weekdayWorkouts: 24 })).toBe(false);
    expect(test('weekday_warrior', { ...zeroStats(), weekdayWorkouts: 25 })).toBe(true);
  });

  it('weekend_warrior needs 25 weekend workouts', () => {
    expect(test('weekend_warrior', { ...zeroStats(), weekendWorkouts: 25 })).toBe(true);
  });

  it('balanced needs BOTH 10 weekday and 10 weekend workouts', () => {
    expect(test('balanced', { ...zeroStats(), weekdayWorkouts: 10, weekendWorkouts: 9 })).toBe(false);
    expect(test('balanced', { ...zeroStats(), weekdayWorkouts: 9, weekendWorkouts: 10 })).toBe(false);
    expect(test('balanced', { ...zeroStats(), weekdayWorkouts: 10, weekendWorkouts: 10 })).toBe(true);
  });

  it.each([
    ['morning_5', 'morningWorkouts', 5],
    ['morning_10', 'morningWorkouts', 10],
    ['morning_25', 'morningWorkouts', 25],
    ['afternoon_5', 'afternoonWorkouts', 5],
    ['afternoon_10', 'afternoonWorkouts', 10],
    ['afternoon_25', 'afternoonWorkouts', 25],
    ['evening_5', 'eveningWorkouts', 5],
    ['evening_10', 'eveningWorkouts', 10],
    ['evening_25', 'eveningWorkouts', 25],
  ])('%s unlocks at %s >= %i', (id, field, threshold) => {
    expect(test(id, { ...zeroStats(), [field]: threshold - 1 })).toBe(false);
    expect(test(id, { ...zeroStats(), [field]: threshold })).toBe(true);
  });
});

describe('isBadgeUnlocked — social badges are override-only', () => {
  it('first_share never unlocks from stats alone', () => {
    expect(test('first_share', { ...zeroStats(), totalDays: 99999, totalRepsAll: 99999 })).toBe(false);
  });

  it('white_hat never unlocks from stats alone', () => {
    expect(test('white_hat', { ...zeroStats(), totalDays: 99999 })).toBe(false);
  });

  it('both unlock only via a manual override', () => {
    expect(isBadgeUnlocked('first_share', zeroStats(), { first_share: true })).toBe(true);
    expect(isBadgeUnlocked('white_hat', zeroStats(), { white_hat: true })).toBe(true);
  });
});

describe('isBadgeUnlocked — secret badges', () => {
  it('ghost unlocks from the ghostWorkout flag', () => {
    expect(test('ghost', zeroStats())).toBe(false);
    expect(test('ghost', { ...zeroStats(), ghostWorkout: true })).toBe(true);
  });

  it('perfectionist needs a 30-day perfect streak', () => {
    expect(test('perfectionist', { ...zeroStats(), perfectStreak: 29 })).toBe(false);
    expect(test('perfectionist', { ...zeroStats(), perfectStreak: 30 })).toBe(true);
  });

  it('beast needs 100000 total reps', () => {
    expect(test('beast', { ...zeroStats(), totalRepsAll: 99999 })).toBe(false);
    expect(test('beast', { ...zeroStats(), totalRepsAll: 100000 })).toBe(true);
  });
});

describe('BADGE_DEFINITIONS — catalog integrity', () => {
  it('exposes a non-trivial set of badges with unique ids', () => {
    expect(BADGE_DEFINITIONS.length).toBeGreaterThanOrEqual(40);
    const ids = BADGE_DEFINITIONS.map(b => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every badge has id, icon, color, category and a test function', () => {
    for (const b of BADGE_DEFINITIONS) {
      expect(typeof b.id).toBe('string');
      expect(typeof b.icon).toBe('string');
      expect(b.color).toMatch(/^#/);
      expect(typeof b.category).toBe('string');
      expect(typeof b.test).toBe('function');
    }
  });

  it('only secret badges carry the secret flag', () => {
    const secrets = BADGE_DEFINITIONS.filter(b => b.secret).map(b => b.id);
    expect(secrets.sort()).toEqual(['beast', 'ghost', 'perfectionist'].sort());
  });

  it('getBadgeIconFromDef returns a component for every badge, with a fallback', () => {
    for (const b of BADGE_DEFINITIONS) {
      expect(getBadgeIconFromDef(b)).toBeTruthy();
    }
    expect(getBadgeIconFromDef({ icon: 'NopeNotReal' })).toBeTruthy();
  });

  it('no badge unlocks from a fully-zero stats snapshot (except none)', () => {
    const unlocked = BADGE_DEFINITIONS.filter(b => isBadgeUnlocked(b.id, zeroStats()));
    expect(unlocked).toEqual([]);
  });
});
