import { afterEach, describe, expect, it, vi } from 'vitest';
import { computeAllStats } from '../useComputedStats';
import { EXERCISES, CARDIO_EXERCISES } from '@config/exercises';
import { WEIGHT_EXERCISES } from '@config/weights';
import { getRecordedReps, getSessionExerciseReps } from '@shared/exerciseLevels.js';
import { getCardioReps } from '@shared/cardioLevels.js';
import { calculateRepsForDay, sumExerciseReps } from '@utils/statUtils';
import { getLeaderboardTotals } from '@utils/leaderboard';
import { buildCardModel } from '@features/share/services/cardModel';
import { CATEGORIES } from '@config/categories';

afterEach(() => vi.useRealTimers());

describe('validated rep consistency across Firebase helpers and panels', () => {
  it('credits the same daily thresholds in stats, badges, calendar, profile and sharing, with cardio counted once', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-10T12:00:00'));
    const date = '2026-04-10';
    const daily = { count: 53, goal: 100, level: 5, isCompleted: true };
    const cardio = { count: 5300, goal: 10000, level: 5, isCompleted: true };
    const day = { pushups: daily, biceps_curl: daily, running: cardio, cycling: cardio };
    const completions = { [date]: day };
    const exercises = [EXERCISES[0], WEIGHT_EXERCISES[0], ...CARDIO_EXERCISES];
    const getConfig = () => ({ difficulty: 1 });
    const stats = computeAllStats(completions, {}, () => 100, exercises, false, {}, getConfig, '2026-01-01');
    // These are the exact shared functions used to publish Firebase exerciseReps.
    const exerciseReps = {
      pushups: getRecordedReps(daily, exercises[0], 100),
      biceps_curl: getRecordedReps(daily, exercises[1], 100),
      running: getCardioReps(cardio, 'running', 15),
      cycling: getCardioReps(cardio, 'cycling', 15),
    };
    expect(exerciseReps).toEqual({ pushups: 50, biceps_curl: 50, running: 545, cycling: 325 });
    expect(stats.exerciseReps).toEqual(exerciseReps);
    expect(stats.globalTotalReps).toBe(970);
    expect(stats.badgeStats.totalRepsAll).toBe(970);
    expect(stats.bestDayReps).toBe(970);
    expect(stats.dailyRepsData).toEqual([{ date, reps: 970 }]);
    expect(calculateRepsForDay(day, 100, exercises, getConfig, date, '2026-01-01')).toBe(970);
    expect(getLeaderboardTotals({ exerciseReps })).toEqual({ bodyweightReps: 920, weightsReps: 50, totalReps: 970 });
    const card = buildCardModel({ mode: 'global', stats, completions, getDayNumber: () => 100, getConfig,
      settings: { startDate: '2026-01-01' },
      options: { globalDate: date, showDailyExercises: true, statsCategories: [CATEGORIES.BODYWEIGHT, CATEGORIES.WEIGHTS, CATEGORIES.CARDIO] },
    });
    expect(card.totalReps).toBe(970);
    expect(day.pushups.count).toBe(53);
    expect(day.running.count).toBe(5300);
  });

  it('uses the same threshold for session recaps and shares while preserving old snapshots without goals', () => {
    const exercises = [{ id: 'pushups', reps: 53, goal: 100, level: 5 }];
    expect(getSessionExerciseReps(exercises[0])).toBe(50);
    expect(sumExerciseReps(exercises)).toBe(50);
    const card = buildCardModel({ mode: 'session', sessionData: { exercises }, options: {}, getConfig: () => ({}) });
    expect(card.totalReps).toBe(50);
    expect(getSessionExerciseReps({ reps: 53, level: 5 })).toBe(53);
  });
});
