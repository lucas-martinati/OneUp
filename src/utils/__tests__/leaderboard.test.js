import { getLevelForCount, getRecordedReps } from '@shared/exerciseLevels.js';
import { getCardioReps } from '@shared/cardioLevels.js';
import { describe, it, expect } from 'vitest';
import { getShieldFlags, getLeaderboardTotals, getLeaderboardReps } from '../leaderboard';

describe('getShieldFlags', () => {
  it('returns false for shields when shieldDate does not match todayStr', () => {
    const entry = {
      shieldDate: '2026-08-16',
      shieldGreen: true,
      shieldOrange: false
    };
    const flags = getShieldFlags(entry, '2026-08-17');
    expect(flags).toEqual({
      shieldFresh: false,
      showVerifiedShield: false,
      showSuspiciousShield: false,
    });
  });

  it('returns verified shield when shieldDate matches and shieldGreen is true', () => {
    const entry = {
      shieldDate: '2026-08-17',
      shieldGreen: true,
      shieldOrange: false
    };
    const flags = getShieldFlags(entry, '2026-08-17');
    expect(flags).toEqual({
      shieldFresh: true,
      showVerifiedShield: true,
      showSuspiciousShield: false,
    });
  });

  it('returns suspicious shield when shieldDate matches and shieldOrange is true', () => {
    const entry = {
      shieldDate: '2026-08-17',
      shieldGreen: false,
      shieldOrange: true
    };
    const flags = getShieldFlags(entry, '2026-08-17');
    expect(flags).toEqual({
      shieldFresh: true,
      showVerifiedShield: false,
      showSuspiciousShield: true,
    });
  });

  it('handles missing flags correctly', () => {
    const entry = {
      shieldDate: '2026-08-17'
    };
    const flags = getShieldFlags(entry, '2026-08-17');
    expect(flags).toEqual({
      shieldFresh: true,
      showVerifiedShield: false,
      showSuspiciousShield: false,
    });
  });
});

describe('leaderboard rep totals', () => {
  const entry = {
    totalReps: 44211, // Bodyweight includes cardio equivalents.
    weightsTotalReps: 3750,
    exerciseReps: { pushups: 30000, squats: 6463, biceps_curl: 3750, running: 7000, cycling: 748, custom_example: 500 },
  };

  it('matches the profile total to bodyweight (including cardio) + weights, excluding custom exercises', () => {
    expect(getLeaderboardTotals(entry)).toEqual({ bodyweightReps: 44211, weightsReps: 3750, totalReps: 47961 });
    expect(getLeaderboardReps(entry, 'global_combined')).toBe(47961);
    expect(getLeaderboardReps(entry, 'bodyweight')).toBe(44211);
    expect(getLeaderboardReps(entry, 'weights')).toBe(3750);
    expect(getLeaderboardReps(entry, 'pushups')).toBe(30000);
  });

  it('uses exercise volumes over stale stored category totals', () => {
    expect(getLeaderboardTotals({ ...entry, totalReps: 1, weightsTotalReps: 99999 })).toEqual(getLeaderboardTotals(entry));
  });

  it('handles cardio-only and single-category histories without adding reps to another category', () => {
    expect(getLeaderboardTotals({ totalReps: 7748, exerciseReps: { running: 7748 } }).totalReps).toBe(7748);
    expect(getLeaderboardTotals({ exerciseReps: { biceps_curl: 42 } })).toEqual({ bodyweightReps: 0, weightsReps: 42, totalReps: 42 });
    expect(getLeaderboardTotals({ exerciseReps: { pushups: 42 } })).toEqual({ bodyweightReps: 42, weightsReps: 0, totalReps: 42 });
  });

  it('keeps aggregate-only legacy entries readable and defaults missing data to zero', () => {
    expect(getLeaderboardTotals({ totalReps: 100, weightsTotalReps: 20, exerciseReps: {} }).totalReps).toBe(120);
    expect(getLeaderboardTotals()).toEqual({ bodyweightReps: 0, weightsReps: 0, totalReps: 0 });
  });
});


describe('leaderboard volume at partial levels', () => {
  it.each(Array.from({ length: 10 }, (_, i) => i + 1))('counts only the attained threshold at level %i for bodyweight, weights and cardio', level => {
    const count = level * 10 + (level < 10 ? 3 : 0);
    const daily = { count, goal: 100, level, isCompleted: true };
    expect(getLevelForCount(count, 100)).toBe(level);
    const exerciseReps = {
      pushups: getRecordedReps(daily, { multiplier: 1 }, 100),
      biceps_curl: getRecordedReps(daily, { multiplier: 0.5 }, 200),
      running: getCardioReps({ count: level * 1000 + (level < 10 ? 300 : 0), level, goal: 10000, isCompleted: true }, 'running', 1),
      cycling: getCardioReps({ count: level * 1000 + (level < 10 ? 300 : 0), level, goal: 10000, isCompleted: true }, 'cycling', 1),
    };
    expect(getLeaderboardTotals({ exerciseReps })).toEqual({
      bodyweightReps: level * 10 + level * (109 + 65), weightsReps: level * 10,
      totalReps: level * 20 + level * (109 + 65),
    });
  });

  it('awards no ranking reps below level 1', () => {
    const entry = { count: 7, goal: 100, level: 0, isCompleted: false };
    expect(getRecordedReps(entry, { multiplier: 1 }, 100)).toBe(0);
    expect(getLeaderboardTotals({ exerciseReps: { pushups: getRecordedReps(entry, { multiplier: 1 }, 100) } }).totalReps).toBe(0);
  });
});


describe('leaderboard threshold boundaries', () => {
  const pushups = { multiplier: 1 };
  it.each([[49, 4, 40], [50, 5, 50], [53, 5, 50], [59, 5, 50], [60, 6, 60], [100, 10, 100]])('scores %i reps at level %i as %i', (count, level, expected) => {
    expect(getRecordedReps({ count, goal: 100, level, isCompleted: true }, pushups, 100)).toBe(expected);
  });

  it('uses rounded thresholds and the goal saved for that day', () => {
    expect(getRecordedReps({ count: 54, goal: 101, level: 5 }, pushups, 200)).toBe(51);
    expect(getRecordedReps({ count: 1, goal: 3, level: 3 }, pushups, 200)).toBe(1);
  });

  it('does not alter stored intermediate progress', () => {
    const entry = { count: 53, goal: 100, level: 5, isCompleted: true };
    getRecordedReps(entry, pushups, 100);
    expect(entry.count).toBe(53);
  });

  it('preserves completed historical validations', () => {
    expect(getRecordedReps({ isCompleted: true, difficulty: 0.5 }, pushups, 100)).toBe(50);
    expect(getRecordedReps({ count: 53, goal: 53, level: 10, isCompleted: true }, pushups, 100)).toBe(53);
    expect(getCardioReps({ isCompleted: true }, 'running', 1)).toBe(49);
  });

  it('excludes cardio distances below the first level', () => {
    expect(getCardioReps({ count: 300, goal: 10000, level: 0 }, 'running', 1)).toBe(0);
  });
});
