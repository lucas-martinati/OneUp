import { describe, it, expect } from 'vitest';
import { migrateLevelProgress, getRecordedReps } from '@shared/exerciseLevels.js';
import { computeAchievementStats } from '@shared/achievementStats.js';
import { sanitizeForCloud, mergeData } from '@utils/syncUtils';
import { validateProgressData } from '@hooks/useProgressStorage';

describe('historical level migration dates', () => {
  it('persists the original day through storage and cloud without inventing a workout hour', () => {
    const migrated = migrateLevelProgress({ startDate: '2026-01-01', completions: {
      '2026-04-10': { pushups: { count: 50, isCompleted: false }, squats: { count: 20, timestamp: 1775820000000 } },
    } });
    const entry = migrated.completions['2026-04-10'].pushups;
    expect(entry).toMatchObject({ timestamp: Date.parse('2026-04-10T12:00:00Z'), timestampEstimated: true, level: 5 });
    expect(migrated.completions['2026-04-10'].squats.timestamp).toBe(1775820000000);
    expect(migrated.completions['2026-04-10'].squats.timestampEstimated).toBeUndefined();
    expect(validateProgressData(sanitizeForCloud(migrated)).completions['2026-04-10'].pushups).toEqual(entry);
    const stats = computeAchievementStats({ '2026-04-10': { pushups: entry } }, 50);
    expect(stats).toMatchObject({ morningWorkouts: 0, afternoonWorkouts: 0, eveningWorkouts: 0 });
    expect(getRecordedReps(entry, { multiplier: 1 }, 100)).toBe(50);
    expect(migrateLevelProgress(migrated)).toBe(migrated);
  });

  it('drops the estimate marker when a real newer cloud timestamp replaces it', () => {
    const local = { startDate: '2026-01-01', completions: { '2026-04-10': { pushups: { count: 50, timestamp: 1000, timestampEstimated: true } } } };
    const cloud = { startDate: local.startDate, completions: { '2026-04-10': { pushups: { count: 60, timestamp: 2000 } } } };
    expect(mergeData(local, cloud).completions['2026-04-10'].pushups.timestampEstimated).toBeUndefined();
  });
});
