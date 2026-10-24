import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { computeAllStats } from '../useComputedStats';
import { EXERCISES } from '@config/exercises';

const pushups = EXERCISES.find(ex => ex.id === 'pushups');
const entry = (count, level) => ({ count, goal: 100, level, isCompleted: level > 0 });
const statsFor = completions => computeAllStats(completions, {}, () => 100, [pushups]);

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 3, 10, 12)); });
afterEach(() => vi.useRealTimers());

describe('level stats integration', () => {
    it('includes reps below the first threshold without validating a day or exercise', () => {
        const stats = statsFor({ '2026-04-10': { pushups: entry(7, 0) } });
        expect(stats.globalTotalReps).toBe(7);
        expect(stats.totalDays).toBe(0);
        expect(stats.totalExerciseCompletions).toBe(0);
        expect(stats.displayStreak).toBe(0);
        expect(stats.dailyRepsData).toEqual([{ date: '2026-04-10', reps: 7 }]);
    });

    it('preserves yesterday’s streak while today is still below level 1', () => {
        const stats = statsFor({ '2026-04-09': { pushups: entry(100, 10) }, '2026-04-10': { pushups: entry(7, 0) } });
        expect(stats.displayStreak).toBe(1);
        expect(stats.streakLevel).toBe(10);
        expect(stats.streakActive).toBe(false);
        expect(stats.exerciseStats[0]).toMatchObject({ streak: 1, streakLevel: 10, totalReps: 107 });
    });

    it('downgrades the label but keeps high-level records and exact volume', () => {
        const stats = statsFor({ '2026-04-08': { pushups: entry(100, 10) }, '2026-04-09': { pushups: entry(100, 10) }, '2026-04-10': { pushups: entry(53, 5) } });
        expect(stats.displayStreak).toBe(3);
        expect(stats.streakLevel).toBe(5);
        expect(stats.levelStreaks[9]).toEqual({ level: 10, current: 0, max: 2 });
        expect(stats.globalTotalReps).toBe(253);
        expect(stats.exerciseStats[0]).toMatchObject({ streak: 3, streakLevel: 5 });
    });
});
