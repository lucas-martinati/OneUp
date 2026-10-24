import { describe, it, expect } from 'vitest';
import { computeExerciseDerived } from '@shared/publicLevelStats.js';
import { migrateLevelProgress } from '@shared/exerciseLevels.js';

const entry = level => ({ level, count: level * 10, goal: 100, isCompleted: level > 0 });

describe('levels published for other accounts', () => {
  it('publishes the global and per-exercise streaks with their complete level history', () => {
    const derived = computeExerciseDerived({
      '2026-04-08': { pushups: entry(10) },
      '2026-04-09': { squats: entry(10) },
      '2026-04-10': { squats: entry(5) },
    }, '2026-04-10', {}, '2026-01-01');
    expect(derived.globalLevels).toMatchObject({ streak: 3, level: 5 });
    expect(derived.globalLevels.levels).toHaveLength(10);
    expect(derived.globalLevels.levels[9]).toMatchObject({ max: 2, current: 0 });
    expect(derived.exerciseLevels.squats).toMatchObject({ streak: 2, level: 5 });
    expect(derived.exerciseLevels.pushups).toMatchObject({ streak: 0, level: 0 });
  });

  it('projects levels from a legacy account without changing its private history', () => {
    const progress = { startDate: '2026-01-01', completions: {
      '2026-04-09': { pushups: { isCompleted: true } },
      '2026-04-10': { pushups: { isCompleted: false, count: 50 } },
    } };
    const migrated = migrateLevelProgress(progress);
    const derived = computeExerciseDerived(migrated.completions, '2026-04-10', {}, progress.startDate);
    expect(derived.globalLevels).toMatchObject({ streak: 2, level: 5 });
    expect(derived.exerciseLevels.pushups).toMatchObject({ streak: 2, level: 5 });
    expect(derived.exerciseLevels.pushups.levels[9].max).toBe(1);
    expect(progress.completions['2026-04-10'].pushups).toEqual({ isCompleted: false, count: 50 });
  });
});
