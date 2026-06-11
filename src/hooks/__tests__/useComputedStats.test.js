import { describe, it, expect } from 'vitest';
import { computeAllStats } from '../useComputedStats';
import { getLocalDateStr } from '../../utils/dateUtils';

// Two simple exercises with a 1x multiplier and a fixed day number of 10,
// so each completed exercise contributes exactly 10 reps.
const allExercises = [
  { id: 'pushups', multiplier: 1, label: 'Pompes' },
  { id: 'squats', multiplier: 1, label: 'Squats' },
];
const getDayNumber = () => 10;
const getConfig = () => ({ difficulty: 1, weight: null });
const settings = {};

const dateStr = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return getLocalDateStr(d);
};

const fullDay = (day, hour = 9) => ({
  pushups: { isCompleted: true, count: 10, timestamp: `${day}T${String(hour).padStart(2, '0')}:00:00` },
  squats: { isCompleted: true, count: 10, timestamp: `${day}T${String(hour).padStart(2, '0')}:05:00` },
});

describe('computeAllStats — empty state', () => {
  const stats = computeAllStats({}, settings, getDayNumber, allExercises, false, {}, getConfig);

  it('reports zero activity', () => {
    expect(stats.totalDays).toBe(0);
    expect(stats.globalTotalReps).toBe(0);
    expect(stats.totalExerciseCompletions).toBe(0);
    expect(stats.perfectDays).toBe(0);
  });

  it('has no streak and today not done', () => {
    expect(stats.todayDone).toBe(false);
    expect(stats.streakActive).toBe(false);
    expect(stats.displayStreak).toBe(0);
    expect(stats.maxStreak).toBe(0);
  });

  it('still returns per-exercise structures', () => {
    expect(stats.exerciseReps).toEqual({ pushups: 0, squats: 0 });
    expect(stats.exerciseStats).toHaveLength(2);
    expect(typeof stats.badgeCount).toBe('number');
  });
});

describe('computeAllStats — two perfect consecutive days (today + yesterday)', () => {
  const today = dateStr(0);
  const yesterday = dateStr(1);
  const completions = {
    [yesterday]: fullDay(yesterday),
    [today]: fullDay(today),
  };
  const stats = computeAllStats(completions, settings, getDayNumber, allExercises, false, {}, getConfig);

  it('counts days and completions', () => {
    expect(stats.totalDays).toBe(2);
    expect(stats.totalExerciseCompletions).toBe(4);
  });

  it('computes reps from the daily goal (2 exercises × 2 days × 10)', () => {
    expect(stats.globalTotalReps).toBe(40);
    expect(stats.exerciseReps.pushups).toBe(20);
    expect(stats.exerciseReps.squats).toBe(20);
    expect(stats.exerciseDays.pushups).toBe(2);
  });

  it('detects perfect days for the active exercise set', () => {
    expect(stats.perfectDays).toBe(2);
    expect(stats.isPerfectToday).toBe(true);
  });

  it('computes an active 2-day streak', () => {
    expect(stats.todayDone).toBe(true);
    expect(stats.streakActive).toBe(true);
    expect(stats.displayStreak).toBe(2);
    expect(stats.maxStreak).toBeGreaterThanOrEqual(2);
  });

  it('tracks the best day', () => {
    expect([today, yesterday]).toContain(stats.bestDayDate);
    expect(stats.bestDayReps).toBe(20);
    expect(stats.bestDayExReps).toEqual({ pushups: 10, squats: 10 });
  });

  it('elects a champion with the right totals', () => {
    expect(stats.champion).not.toBe(null);
    expect(stats.champion.totalReps).toBe(20);
  });

  it('classifies morning workouts from timestamps', () => {
    expect(stats.morningWorkouts).toBe(2);
    expect(stats.pieData.find(p => p.id === 'morning').value).toBe(2);
    expect(stats.trackedCount).toBe(2);
  });
});

describe('computeAllStats — broken streak', () => {
  const threeDaysAgo = dateStr(3);
  const completions = { [threeDaysAgo]: fullDay(threeDaysAgo) };
  const stats = computeAllStats(completions, settings, getDayNumber, allExercises, false, {}, getConfig);

  it('counts the day but no active streak', () => {
    expect(stats.totalDays).toBe(1);
    expect(stats.todayDone).toBe(false);
    expect(stats.streakActive).toBe(false);
    expect(stats.displayStreak).toBe(0);
  });

  it('remembers the best streak ever', () => {
    expect(stats.maxStreak).toBeGreaterThanOrEqual(1);
  });
});

describe('computeAllStats — partial day', () => {
  const today = dateStr(0);
  const completions = {
    [today]: { pushups: { isCompleted: true, count: 5, timestamp: `${today}T20:00:00` } },
  };
  const stats = computeAllStats(completions, settings, getDayNumber, allExercises, false, {}, getConfig);

  it('counts the day but not as perfect', () => {
    expect(stats.totalDays).toBe(1);
    expect(stats.perfectDays).toBe(0);
    expect(stats.isPerfectToday).toBe(false);
  });

  it('only credits the completed exercise', () => {
    expect(stats.exerciseReps.pushups).toBe(10);
    expect(stats.exerciseReps.squats).toBe(0);
    expect(stats.globalTotalReps).toBe(10);
  });

  it('classifies the evening workout', () => {
    expect(stats.eveningWorkouts).toBe(1);
  });

  it('per-exercise streaks reflect today only', () => {
    expect(stats.exerciseDoneToday.pushups).toBe(true);
    expect(stats.exerciseDoneToday.squats).toBeFalsy();
  });
});

describe('computeAllStats — difficulty multiplier', () => {
  const today = dateStr(0);
  const halfConfig = () => ({ difficulty: 0.5, weight: null });
  const completions = { [today]: fullDay(today) };
  const stats = computeAllStats(completions, settings, getDayNumber, allExercises, false, {}, halfConfig);

  it('halves the credited reps', () => {
    expect(stats.exerciseReps.pushups).toBe(5);
    expect(stats.globalTotalReps).toBe(10);
  });
});

describe('computeAllStats — ignores exercises outside the active set', () => {
  const today = dateStr(0);
  const completions = {
    [today]: { unknown_exercise: { isCompleted: true, count: 99 } },
  };
  const stats = computeAllStats(completions, settings, getDayNumber, allExercises, false, {}, getConfig);

  it('does not count days made only of foreign exercises', () => {
    expect(stats.totalDays).toBe(0);
    expect(stats.globalTotalReps).toBe(0);
  });
});
