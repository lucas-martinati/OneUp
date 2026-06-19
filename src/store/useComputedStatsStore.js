import { create } from 'zustand';
import { computeAllStats } from '@hooks/useComputedStats';
import { EXERCISES } from '@config/exercises';
import { WEIGHT_EXERCISES } from '@config/weights';
import { CARDIO_EXERCISES } from '@config/exercises';

/**
 * Default empty stats shape — used before the first computation.
 * Ensures consumers never receive null.
 */
const EMPTY_STATS = {
    totalDays: 0, maxStreak: 0, currentStreak: 0, yesterdayStreak: 0,
    displayStreak: 0, streakActive: false, todayDone: false,
    globalTotalReps: 0, perfectDays: 0, totalExerciseCompletions: 0,
    successRate: 0, firstActiveDate: null,
    isPerfectToday: false, standardPerfectToday: false, weightsPerfectToday: false,
    exerciseReps: {}, exerciseDays: {}, exerciseStats: [],
    exerciseCurrentStreaks: {}, exerciseMaxStreaks: {}, exerciseDoneToday: {},
    morningWorkouts: 0, afternoonWorkouts: 0, eveningWorkouts: 0,
    weekdayWorkouts: 0, weekendWorkouts: 0,
    pieData: [
        { name: 'Matin', id: 'morning', value: 0, color: '#f59e0b' },
        { name: 'Après-midi', id: 'afternoon', value: 0, color: '#0ea5e9' },
        { name: 'Soir', id: 'evening', value: 0, color: '#8b5cf6' }
    ],
    trackedCount: 0,
    hasCompletedAllExercisesOnce: false, ghostWorkout: false,
    perfectStreak: 0, hasShared: false, achievements: {},
    badgeCount: 0, totalRepsAll: 0, totalExerciseReps: {},
    bestDayDate: null, bestDayReps: 0, bestDayExCount: 0, bestDayExReps: {},
    monthlyActivityByExercise: [], monthlyActivityTotal: Array(12).fill(0),
    radarData: [], champion: null, dailyRepsData: [], sortedDates: [],
};

/**
 * Zustand store that holds the centralized computed stats.
 */
export const useComputedStatsStore = create((set) => ({
    stats: EMPTY_STATS,

    /**
     * Recompute stats from inputs.
     * Called by the single ComputedStatsSynchronizer component.
     */
    recompute: (completions, settings, getDayNumber, customExercises, hasShared, achievements, getConfig, cardioData, userStartDate) => {
        const allExercises = [...EXERCISES, ...WEIGHT_EXERCISES, ...CARDIO_EXERCISES, ...(customExercises || [])];
        const result = computeAllStats(
            completions, settings, getDayNumber,
            allExercises, hasShared, achievements,
            getConfig, cardioData, userStartDate
        );
        set({ stats: result });
    },
}));
