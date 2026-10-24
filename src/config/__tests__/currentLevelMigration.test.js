import { afterEach, describe, expect, it, vi } from 'vitest';
import { migrateLevelProgress, PROGRESS_VERSION } from '@shared/exerciseLevels.js';
import { useProgressStore } from '@store/useProgressStore';

const today = '2026-10-24';
afterEach(() => vi.useRealTimers());
describe('current workout legacy difficulty repair', () => {
    it.each([true, false])('repairs the 80-rep cap on day 297 (already migrated: %s)', migrated => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-10-24T12:00:00'));
        const oldDay = { count: 80, goal: 80, level: 10, isCompleted: true, difficulty: 0.3, timestamp: 123 };
        const input = { startDate: '2026-01-01', progressVersion: 4, completions: {
            '2026-10-23': { pushups: oldDay },
            [today]: { pushups: migrated ? oldDay : { count: 80, isCompleted: true, difficulty: 0.3, timestamp: 123 } },
        } };
        const result = migrateLevelProgress(input);
        expect(result.progressVersion).toBe(PROGRESS_VERSION);
        expect(result.completions[today].pushups).toMatchObject({ count: 80, goal: 297, level: 2, timestamp: 123 });
        expect(result.completions['2026-10-23'].pushups).toEqual(oldDay);
        expect(migrateLevelProgress(result)).toBe(result);
        useProgressStore.setState(result);
        useProgressStore.getState().updateExerciseCount(today, 'pushups', 90, 297);
        expect(useProgressStore.getState().completions[today].pushups).toMatchObject({ count: 90, goal: 297, level: 3 });
    });
    it('reconstructs only missing legacy volume and ignores difficulty for new partial effort', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-04-10T12:00:00'));
        const result = migrateLevelProgress({ startDate: '2026-01-01', completions: {
            '2026-04-10': { pushups: { isCompleted: true, difficulty: 0.6 }, squats: { count: 30, difficulty: 0.6 } },
        } });
        expect(result.completions['2026-04-10'].pushups).toMatchObject({ count: 60, goal: 100, level: 6 });
        expect(result.completions['2026-04-10'].squats).toMatchObject({ count: 30, goal: 100, level: 3 });
    });
});
