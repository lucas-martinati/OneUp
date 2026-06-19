import { describe, it, expect } from 'vitest';

import { isBadgeUnlocked, BADGE_RULES, BADGE_RULES_BY_ID } from '../../../functions/shared/badgeRules.js';

describe('badgeRules — isBadgeUnlocked', () => {
  it('exposes a rule for every listed badge id', () => {
    expect(BADGE_RULES.length).toBeGreaterThan(0);
    expect(Object.keys(BADGE_RULES_BY_ID).length).toBe(BADGE_RULES.length);
  });

  it('honors a manual boolean true override regardless of stats', () => {
    expect(isBadgeUnlocked('first_blood', { totalDays: 0 }, { first_blood: true })).toBe(true);
  });

  it('honors a manual string "true" override', () => {
    expect(isBadgeUnlocked('first_blood', { totalDays: 0 }, { first_blood: 'true' })).toBe(true);
  });

  it('honors a manual boolean false override even when the rule would pass', () => {
    expect(isBadgeUnlocked('first_blood', { totalDays: 999 }, { first_blood: false })).toBe(false);
  });

  it('honors a manual string "false" override', () => {
    expect(isBadgeUnlocked('first_blood', { totalDays: 999 }, { first_blood: 'false' })).toBe(false);
  });

  it('falls back to the computed test when there is no override', () => {
    expect(isBadgeUnlocked('first_blood', { totalDays: 1 })).toBe(true);
    expect(isBadgeUnlocked('first_blood', { totalDays: 0 })).toBe(false);
  });

  it('returns false for an unknown badge id', () => {
    expect(isBadgeUnlocked('does_not_exist', { totalDays: 999 })).toBe(false);
  });

  it('evaluates both sides of the AND in the "balanced" rule', () => {
    expect(isBadgeUnlocked('balanced', { weekdayWorkouts: 10, weekendWorkouts: 10 })).toBe(true);
    expect(isBadgeUnlocked('balanced', { weekdayWorkouts: 10, weekendWorkouts: 9 })).toBe(false);
    expect(isBadgeUnlocked('balanced', { weekdayWorkouts: 0, weekendWorkouts: 10 })).toBe(false);
  });

  it('keeps purely-manual social badges locked by their computed test', () => {
    expect(isBadgeUnlocked('first_share', { totalDays: 999 })).toBe(false);
    expect(isBadgeUnlocked('first_share', { totalDays: 999 }, { first_share: true })).toBe(true);
  });

  it('evaluates a representative rule from each family', () => {
    expect(isBadgeUnlocked('year_beast', { maxStreak: 365 })).toBe(true);
    expect(isBadgeUnlocked('beast', { totalRepsAll: 100000 })).toBe(true);
    expect(isBadgeUnlocked('ghost', { ghostWorkout: true })).toBe(true);
    expect(isBadgeUnlocked('perfectionist', { perfectStreak: 30 })).toBe(true);
    expect(isBadgeUnlocked('all_exercises', { hasCompletedAllExercisesOnce: true })).toBe(true);
    expect(isBadgeUnlocked('evening_25', { eveningWorkouts: 25 })).toBe(true);
  });
});
