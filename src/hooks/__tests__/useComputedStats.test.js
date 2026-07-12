import { describe, it, expect } from 'vitest';
import { computeAllStats } from '../useComputedStats';
import { getLocalDateStr } from '@shared/dateUtils';

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

describe('computeAllStats — time-of-day classification', () => {
  const today = dateStr(0);

  it('classifies an afternoon workout (12:00–17:59)', () => {
    const completions = { [today]: fullDay(today, 14) };
    const stats = computeAllStats(completions, settings, getDayNumber, allExercises, false, {}, getConfig);
    expect(stats.afternoonWorkouts).toBe(1);
    expect(stats.morningWorkouts).toBe(0);
    expect(stats.eveningWorkouts).toBe(0);
  });

  it('classifies an evening workout (>=18:00)', () => {
    const completions = { [today]: fullDay(today, 21) };
    const stats = computeAllStats(completions, settings, getDayNumber, allExercises, false, {}, getConfig);
    expect(stats.eveningWorkouts).toBe(1);
  });

  it('flags the ghost workout for the 3am–4am window', () => {
    const completions = { [today]: fullDay(today, 3) };
    const stats = computeAllStats(completions, settings, getDayNumber, allExercises, false, {}, getConfig);
    expect(stats.ghostWorkout).toBe(true);
  });
});

describe('computeAllStats — displayStreak when today is not yet done', () => {
  const yesterday = dateStr(1);
  const twoDaysAgo = dateStr(2);

  it('shows yesterday\'s streak so the flame stays alive before today is done', () => {
    const completions = { [twoDaysAgo]: fullDay(twoDaysAgo), [yesterday]: fullDay(yesterday) };
    const stats = computeAllStats(completions, settings, getDayNumber, allExercises, false, {}, getConfig);
    expect(stats.todayDone).toBe(false);
    expect(stats.yesterdayStreak).toBe(2);
    expect(stats.displayStreak).toBe(2);
    expect(stats.streakActive).toBe(false);
  });
});

describe('computeAllStats — badge count reacts to thresholds', () => {
  it('awards first_blood + a streak/volume badge once enough activity exists', () => {
    // Build a 3-day active streak ending today → maxStreak >= 3 (consistent badge)
    const completions = {
      [dateStr(0)]: fullDay(dateStr(0)),
      [dateStr(1)]: fullDay(dateStr(1)),
      [dateStr(2)]: fullDay(dateStr(2)),
    };
    const stats = computeAllStats(completions, settings, getDayNumber, allExercises, false, {}, getConfig);
    expect(stats.badgeCount).toBeGreaterThanOrEqual(2); // first_blood + consistent
  });

  it('respects a manual achievement override in the badge count', () => {
    const withOverride = computeAllStats({}, settings, getDayNumber, allExercises, false, { first_blood: true }, getConfig);
    const without = computeAllStats({}, settings, getDayNumber, allExercises, false, {}, getConfig);
    expect(withOverride.badgeCount).toBe(without.badgeCount + 1);
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

describe('computeAllStats — cardio-only dashboard (weekly streaks)', () => {
  const cardioExercises = [{ id: 'running', label: 'Course' }];
  const userStart = getLocalDateStr(new Date()); // week 1 → running goal 0.45 km
  const cardioSettings = { exerciseDifficulties: { running: 1.0 } };

  const run = (km) => ({ type: 'running', startTime: Date.now(), distance: km * 1000 });

  it('counts a current weekly streak and computes reps from the validated week, capped at the goal', () => {
    // The 0.5km actually logged in `run(0.5)` must NOT inflate reps — only the
    // validated completions day counts, capped at that week's goal.
    const completions = { [userStart]: { running: { isCompleted: true } } };
    const cardioReps = { allSessions: [run(0.5)] };
    const stats = computeAllStats(completions, cardioSettings, getDayNumber, cardioExercises, false, {}, getConfig, cardioReps, userStart);

    expect(stats.exerciseCurrentStreaks.running).toBeGreaterThanOrEqual(1);
    expect(stats.exerciseMaxStreaks.running).toBeGreaterThanOrEqual(1);
    // getDayNumber is mocked to always return 10 → week 2, goal 0.9km → floor(0.9*109)=98
    expect(stats.exerciseReps.running).toBe(98);
    // a cardio-only dashboard surfaces the weekly streak as the display streak
    expect(stats.displayStreak).toBeGreaterThanOrEqual(1);
    expect(stats.maxStreak).toBeGreaterThanOrEqual(1);
  });

  it('has no streak when the weekly distance falls short of the goal', () => {
    const cardioReps = { allSessions: [run(0.1)], running: 0 }; // 0.1 km < 0.45 km
    const stats = computeAllStats({}, cardioSettings, getDayNumber, cardioExercises, false, {}, getConfig, cardioReps, userStart);
    expect(stats.exerciseCurrentStreaks.running).toBe(0);
  });

  it('scales the weekly goal by the per-exercise difficulty', () => {
    const hardSettings = { exerciseDifficulties: { running: 2.0 } }; // goal becomes 0.9 km
    const cardioReps = { allSessions: [run(0.5)], running: 0 }; // 0.5 km < 0.9 km
    const stats = computeAllStats({}, hardSettings, getDayNumber, cardioExercises, false, {}, getConfig, cardioReps, userStart);
    expect(stats.exerciseCurrentStreaks.running).toBe(0);
  });

  it('returns a zero streak when there are no sessions at all', () => {
    const cardioReps = { allSessions: [], running: 0 };
    const stats = computeAllStats({}, cardioSettings, getDayNumber, cardioExercises, false, {}, getConfig, cardioReps, userStart);
    expect(stats.exerciseCurrentStreaks.running).toBe(0);
    expect(stats.exerciseMaxStreaks.running).toBe(0);
  });
});

describe('computeAllStats — badge time-of-day from stored localHour', () => {
  // Each completion carries `localHour` (the real wall-clock hour captured at
  // completion time). badgeStats must read it, so time-of-day badges — including
  // the narrow 3-4am "ghost" — are correct regardless of the UTC timestamp.
  const dayAt = (day, hour) => ({
    pushups: { isCompleted: true, count: 10, timestamp: `${day}T00:00:00`, localHour: hour },
    squats: { isCompleted: true, count: 10, timestamp: `${day}T00:00:00`, localHour: hour },
  });

  it('fires the ghost badge from a 3am localHour even when the UTC timestamp is midnight', () => {
    const completions = { [dateStr(0)]: dayAt(dateStr(0), 3) };
    const stats = computeAllStats(completions, settings, getDayNumber, allExercises, false, {}, getConfig);
    expect(stats.badgeStats.ghostWorkout).toBe(true);
    expect(stats.badgeStats.morningWorkouts).toBe(1);
  });

  it('buckets afternoon and evening hours from localHour', () => {
    const afternoon = dateStr(1);
    const evening = dateStr(2);
    const completions = { [afternoon]: dayAt(afternoon, 14), [evening]: dayAt(evening, 21) };
    const stats = computeAllStats(completions, settings, getDayNumber, allExercises, false, {}, getConfig);
    expect(stats.badgeStats.afternoonWorkouts).toBe(1);
    expect(stats.badgeStats.eveningWorkouts).toBe(1);
    expect(stats.badgeStats.ghostWorkout).toBe(false);
  });
});
