import { describe, it, expect, vi } from 'vitest';
import { computeAllStats } from '../useComputedStats';
import { isGlobalPerfectDay } from '@utils/statUtils';

// We need to mock dependencies
vi.mock('@shared/dateUtils', () => ({
  getLocalDateStr: vi.fn((d) => d.toISOString().split('T')[0]),
  calculateExerciseStreak: vi.fn(() => 5),
  MAX_STREAK_WINDOW: 7,
  parseTimestamp: vi.fn((ts) => new Date(ts)),
  getWeekBounds: vi.fn(() => ({ start: new Date('2026-07-06'), end: new Date('2026-07-12') })),
  isDayDoneFromCompletions: vi.fn((comps, day) => {
    return Object.values(comps[day] || {}).some(e => e.isCompleted);
  }),
  walkStreak: vi.fn((dateAt) => {
    // Call dateAt to hit branch coverage for the internal dateAt function
    dateAt(0);
    return 3;
  })
}));

vi.mock('@config/exercises', () => ({
  EXERCISES: [{ id: 'pushups' }, { id: 'squats' }],
  getDailyGoal: vi.fn(() => 10),
  getWeeklyGoalKm: vi.fn(() => 5),
  CARDIO_REPS_PER_KM: { running: 100, cycling: 40 }
}));

vi.mock('@utils/cardioStreak', () => ({
  evaluateCardioWeek: vi.fn((sessions, mode, weekOffset) => {
    // Return true for week 0 and 2, false for others to break the streak and hit the else branches
    if (weekOffset === 0 || weekOffset === 2) return { achieved: true };
    return { achieved: false };
  })
}));

vi.mock('@config/weights', () => ({
  WEIGHT_EXERCISES: [{ id: 'bench' }]
}));

vi.mock('@config/badgeDefinitions', () => ({
  BADGE_DEFINITIONS: [{ id: 'test_badge' }],
  isBadgeUnlocked: vi.fn(() => true)
}));

vi.mock('@shared/achievementStats.js', () => ({
  computeAchievementStats: vi.fn(() => ({}))
}));

vi.mock('@utils/statUtils', () => ({
  isGlobalPerfectDay: vi.fn(() => false)
}));

describe('computeAllStats', () => {
  const allExercises = [
    { id: 'pushups', label: 'Pushups' },
    { id: 'squats', label: 'Squats' },
    { id: 'bench', label: 'Bench Press' },
    { id: 'running', label: 'Running' }
  ];

  const getDayNumber = vi.fn(() => 1);
  const getConfig = vi.fn(() => ({ difficulty: 1.0 }));

  it('computes basic empty stats', () => {
    const result = computeAllStats({}, {}, getDayNumber, allExercises);
    expect(result.totalDays).toBe(0);
    expect(result.maxStreak).toBe(0);
    expect(result.perfectDays).toBe(0);
  });

  it('computes correct stats for a populated completions object', () => {
    const completions = {
      '2026-07-10': { // A Friday
        pushups: { isCompleted: true, timestamp: new Date('2026-07-10T08:00:00').getTime() },
        running: { isCompleted: true, timestamp: new Date('2026-07-10T14:00:00').getTime() }
      },
      '2026-07-11': { // A Saturday (Weekend)
        squats: { isCompleted: true, timestamp: new Date('2026-07-11T20:00:00').getTime() },
        bench: { isCompleted: true } // no timestamp
      }
    };

    const cardioReps = { allSessions: [{ id: 's1' }] };
    
    // We mock Date to be exactly 2026-07-12
    const originalDate = globalThis.Date;
    const mockDate = new Date('2026-07-12T12:00:00Z');
    globalThis.Date = class extends originalDate {
      constructor(...args) {
        if (args.length) return new originalDate(...args);
        return mockDate;
      }
    };

    const result = computeAllStats(completions, {}, getDayNumber, allExercises, false, {}, getConfig, cardioReps);

    expect(result.totalDays).toBe(2);
    expect(result.firstActiveDate).toBe('2026-07-10');
    expect(result.weekdayWorkouts).toBe(1); // Friday
    expect(result.weekendWorkouts).toBe(1); // Saturday

    // Time of day checks based on our mock dates
    expect(result.morningWorkouts).toBe(1); // 08:00
    expect(result.afternoonWorkouts).toBe(1); // 14:00
    expect(result.eveningWorkouts).toBe(1); // 20:00

    expect(result.pieData[0].value).toBe(1); // morning (pushups)
    expect(result.pieData[2].value).toBe(1); // evening (squats)

    expect(result.exerciseReps.pushups).toBe(10); // getDailyGoal mock returns 10
    expect(result.exerciseReps.running).toBe(500); // getWeeklyGoalKm(5) * CARDIO_REPS_PER_KM(100) * diff(1.0) = 500
    
    // restore date
    globalThis.Date = originalDate;
  });

  it('handles ghost workout detection', () => {
    const completions = {
      '2026-07-10': {
        pushups: { isCompleted: true, timestamp: new Date('2026-07-10T03:30:00').getTime() },
      }
    };
    const result = computeAllStats(completions, {}, getDayNumber, allExercises, false, {}, getConfig);
    expect(result.ghostWorkout).toBe(true);
  });

  it('handles only cardio case', () => {
    const onlyCardio = [{ id: 'running' }];
    const completions = {
      '2026-07-10': {
        running: { isCompleted: true, timestamp: new Date('2026-07-10T03:30:00').getTime() },
      }
    };
    
    const cardioReps = { allSessions: [{ id: '1' }] };
    // the evaluateCardioWeek mock returns achieved: true 
    const result = computeAllStats(completions, {}, getDayNumber, onlyCardio, false, {}, getConfig, cardioReps);
    
    // If only cardio, streak is calculated from the weekly cardio streaks (which evaluates to 52 for current because our mock always returns achieved)
    // Wait, the mock evaluateCardioWeek always returns true so streak goes up to 52.
    expect(result.currentStreak).toBeGreaterThan(0);
  });
  
  it('detects standard and weights perfect days today', () => {
      // Mock global Date
      const originalDate = globalThis.Date;
      const mockDateStr = '2026-07-10T12:00:00Z';
      const mockDate = new originalDate(mockDateStr);
      globalThis.Date = class extends originalDate {
        constructor(...args) {
          if (args.length) return new originalDate(...args);
          return mockDate;
        }
      };

      isGlobalPerfectDay.mockReturnValueOnce(true);

      const completions = {
        '2026-07-10': {
          pushups: { isCompleted: true },
          squats: { isCompleted: true },
          bench: { isCompleted: true }
        }
      };

      const result = computeAllStats(completions, {}, getDayNumber, allExercises);
      expect(result.standardPerfectToday).toBe(true);
      expect(result.weightsPerfectToday).toBe(true);
      expect(result.isPerfectToday).toBe(true);

      globalThis.Date = originalDate;
  });

  it('computes streaks with frozen days', () => {
      // walkStreak is mocked to return 3
      const frozenDays = {
          '2026-07-10': true
      };
      
      const completions = {
          '2026-07-09': { pushups: { isCompleted: true } },
          // 10th is frozen and empty
          '2026-07-11': { pushups: { isCompleted: true } },
      };

      const originalDate = globalThis.Date;
      globalThis.Date = class extends originalDate {
        constructor(...args) {
          if (args.length) return new originalDate(...args);
          return new originalDate('2026-07-12T12:00:00Z');
        }
      };

      const result = computeAllStats(completions, {}, getDayNumber, allExercises, false, {}, getConfig, null, null, frozenDays);
      // It should call walkStreak, which we mocked to 3
      expect(result.currentStreak).toBe(3);
      
      globalThis.Date = originalDate;
  });

  it('handles empty exercise list for champion and null exData/missing ex in map', () => {
    const completions = {
      '2026-07-10': {
        unknown_ex: { isCompleted: true },
        pushups: { isCompleted: false },
        squats: null
      }
    };
    
    // Pass empty array for allExercises to hit exerciseStats.length === 0
    const result = computeAllStats(completions, {}, getDayNumber, []);
    
    expect(result.champion).toBeNull();
    // Also hits branches for:
    // !exData?.isCompleted (pushups, squats)
    // if (ex) false (unknown_ex)
  });
});
