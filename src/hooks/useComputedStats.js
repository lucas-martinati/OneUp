import { useMemo } from 'react';
import { getLocalDateStr, isDayDoneFromCompletions, calculateStreak, calculateExerciseStreak } from '../utils/dateUtils';
import { EXERCISES, getDailyGoal } from '../config/exercises';

/**
 * Centralized computation hook.
 * Performs a SINGLE pass over completions to compute ALL stats, achievements,
 * streaks, and chart data. Memoized so it only recalculates when data changes.
 *
 * @param {Object} completions - { [dateStr]: { [exerciseId]: { isCompleted, timestamp, timeOfDay, count } } }
 * @param {Object} settings - { difficultyMultiplier, ... }
 * @param {Function} getDayNumber - (dateStr) => number
 * @returns {Object} computedStats
 */
export function useComputedStats(completions, settings, getDayNumber) {
    return useMemo(() => {
        return computeAllStats(completions, settings, getDayNumber);
    }, [completions, settings?.difficultyMultiplier, getDayNumber]);
}

/**
 * Pure function that computes all stats in a single pass.
 * Exported separately so it can be used outside React (e.g. for leaderboard publish).
 */
export function computeAllStats(completions, settings, getDayNumber) {
    const difficultyMultiplier = settings?.difficultyMultiplier ?? 1.0;
    const todayStr = getLocalDateStr(new Date());
    const today = new Date(todayStr);

    // ─── Accumulators ────────────────────────────────────────────────────
    let totalDays = 0;
    let perfectDays = 0;
    let totalExerciseCompletions = 0;
    let weekdayWorkouts = 0;
    let weekendWorkouts = 0;
    let morningWorkouts = 0;
    let afternoonWorkouts = 0;
    let eveningWorkouts = 0;
    let ghostWorkout = false;

    // Per-exercise accumulators
    const exerciseReps = {};      // { exId: totalReps }
    const exerciseDays = {};      // { exId: daysCompleted }
    EXERCISES.forEach(ex => { exerciseReps[ex.id] = 0; exerciseDays[ex.id] = 0; });

    // Best day tracking
    let bestDayDate = null;
    let bestDayReps = 0;
    let bestDayExCount = 0;
    let bestDayExReps = {};

    // Monthly activity
    const monthlyActivityByExercise = EXERCISES.map(() => Array(12).fill(0));
    const monthlyActivityTotal = Array(12).fill(0);

    // Pie chart data (time of day)
    const pieData = [
        { name: 'Matin', value: 0, color: '#f59e0b' },
        { name: 'Après-midi', value: 0, color: '#0ea5e9' },
        { name: 'Soir', value: 0, color: '#8b5cf6' }
    ];
    let trackedCount = 0;

    // Completed exercise IDs (for polyvalent badge)
    const completedExIds = new Set();

    // First active date
    let firstActiveDate = null;

    // ─── SINGLE PASS over completions ────────────────────────────────────
    const sortedDates = Object.keys(completions).sort();

    for (const dateStr of sortedDates) {
        const day = completions[dateStr];
        if (!day || typeof day !== 'object') continue;

        const anyDone = isDayDoneFromCompletions(completions, dateStr);
        if (!anyDone) continue;

        totalDays++;
        if (!firstActiveDate) firstActiveDate = dateStr;

        // Perfect day check
        const allDone = EXERCISES.every(ex => day[ex.id]?.isCompleted);
        if (allDone) perfectDays++;

        // Day of week
        const dateObj = new Date(dateStr);
        const dayOfWeek = dateObj.getDay();
        if (dayOfWeek >= 1 && dayOfWeek <= 5) weekdayWorkouts++;
        if (dayOfWeek === 0 || dayOfWeek === 6) weekendWorkouts++;

        // Monthly activity
        const monthIdx = dateObj.getMonth();
        monthlyActivityTotal[monthIdx]++;

        // Time of day (one per day — take first completed exercise)
        let dayTimeTracked = false;
        // Morning/afternoon/evening flags per day
        let dayHasMorning = false;
        let dayHasAfternoon = false;
        let dayHasEvening = false;

        // Per-exercise processing + best day
        let dayExCount = 0;
        let dayReps = 0;
        const dayNum = getDayNumber(dateStr);
        const currentDayExReps = {};

        for (const [exId, exData] of Object.entries(day)) {
            if (!exData?.isCompleted) continue;

            totalExerciseCompletions++;
            dayExCount++;
            completedExIds.add(exId);

            // Exercise reps
            const ex = EXERCISES.find(e => e.id === exId);
            if (ex) {
                const reps = getDailyGoal(ex, dayNum, difficultyMultiplier);
                exerciseReps[exId] = (exerciseReps[exId] || 0) + reps;
                exerciseDays[exId] = (exerciseDays[exId] || 0) + 1;
                dayReps += reps;
                currentDayExReps[exId] = reps;

                // Monthly by exercise
                const exIndex = EXERCISES.findIndex(e => e.id === exId);
                if (exIndex !== -1) {
                    monthlyActivityByExercise[exIndex][monthIdx]++;
                }
            }

            // Time of day
            if (exData.timeOfDay === 'morning') dayHasMorning = true;
            if (exData.timeOfDay === 'afternoon') dayHasAfternoon = true;
            if (exData.timeOfDay === 'evening') dayHasEvening = true;

            // Pie chart (first completed exercise per day)
            if (!dayTimeTracked && exData.timeOfDay) {
                if (exData.timeOfDay === 'morning') pieData[0].value++;
                else if (exData.timeOfDay === 'afternoon') pieData[1].value++;
                else if (exData.timeOfDay === 'evening') pieData[2].value++;
                trackedCount++;
                dayTimeTracked = true;
            }

            // Ghost check (3h-4h)
            if (!ghostWorkout && exData.timestamp) {
                const hour = new Date(exData.timestamp).getHours();
                if (hour >= 3 && hour < 4) ghostWorkout = true;
            }
        }

        if (dayHasMorning) morningWorkouts++;
        if (dayHasAfternoon) afternoonWorkouts++;
        if (dayHasEvening) eveningWorkouts++;

        // Best day
        if (dayReps > bestDayReps || (dayReps === bestDayReps && dayExCount > bestDayExCount)) {
            bestDayDate = dateStr;
            bestDayExCount = dayExCount;
            bestDayReps = dayReps;
            bestDayExReps = { ...currentDayExReps };
        }
    }

    // ─── Streak calculations (require backward day iteration) ────────────
    let maxStreak = 0, tempStreak = 0;
    for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        if (isDayDoneFromCompletions(completions, getLocalDateStr(d))) {
            tempStreak++;
            if (tempStreak > maxStreak) maxStreak = tempStreak;
        } else {
            tempStreak = 0;
        }
    }

    const currentStreak = calculateStreak(completions, todayStr);
    const yesterdayDate = new Date(today);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStreak = calculateStreak(completions, getLocalDateStr(yesterdayDate));

    // Perfect streak (consecutive perfect days)
    let perfectStreak = 0, maxPerfectStreak = 0;
    for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayCompletions = completions[dateStr];
        const isPerfect = EXERCISES.every(ex => dayCompletions?.[ex.id]?.isCompleted);
        if (isPerfect) {
            perfectStreak++;
            if (perfectStreak > maxPerfectStreak) maxPerfectStreak = perfectStreak;
        } else {
            perfectStreak = 0;
        }
    }

    // ─── Per-exercise streaks & max streaks ──────────────────────────────
    const exerciseCurrentStreaks = {};
    const exerciseMaxStreaks = {};
    const exerciseYesterdayStreaks = {};
    const exerciseDoneToday = {};

    for (const ex of EXERCISES) {
        exerciseCurrentStreaks[ex.id] = calculateExerciseStreak(completions, todayStr, ex.id);
        exerciseYesterdayStreaks[ex.id] = calculateExerciseStreak(completions, getLocalDateStr(yesterdayDate), ex.id);
        exerciseDoneToday[ex.id] = !!completions[todayStr]?.[ex.id]?.isCompleted;

        // Max streak
        let maxExStreak = 0, tempExStreak = 0;
        for (let i = 0; i < 365; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            if (completions[getLocalDateStr(d)]?.[ex.id]?.isCompleted) {
                tempExStreak++;
                if (tempExStreak > maxExStreak) maxExStreak = tempExStreak;
            } else {
                tempExStreak = 0;
            }
        }
        exerciseMaxStreaks[ex.id] = maxExStreak;
    }

    // ─── Derived values ──────────────────────────────────────────────────
    const globalTotalReps = Object.values(exerciseReps).reduce((sum, r) => sum + r, 0);
    const successRate = totalDays > 0 ? Math.round((totalDays / 365) * 100) : 0;
    const hasCompletedAllExercisesOnce = EXERCISES.every(ex => completedExIds.has(ex.id));
    const todayDone = isDayDoneFromCompletions(completions, todayStr);
    const displayStreak = todayDone ? currentStreak : yesterdayStreak;
    const streakActive = todayDone;

    // Exercise stats array (for Stats.jsx)
    const exerciseStats = EXERCISES.map(ex => {
        const exDoneToday = exerciseDoneToday[ex.id];
        const streak = exDoneToday ? exerciseCurrentStreaks[ex.id] : exerciseYesterdayStreaks[ex.id];
        const completionRate = totalDays > 0 ? Math.round(((exerciseDays[ex.id] || 0) / totalDays) * 100) : 0;
        return {
            ...ex,
            totalReps: exerciseReps[ex.id] || 0,
            daysCompleted: exerciseDays[ex.id] || 0,
            streak,
            streakActive: exDoneToday,
            maxStreak: exerciseMaxStreaks[ex.id] || 0,
            completionRate
        };
    });

    // Radar data
    const maxExReps = Math.max(...exerciseStats.map(e => e.totalReps), 100);
    const radarData = exerciseStats.map(ex => ({
        subject: ex.label,
        reps: ex.totalReps,
        fullMark: maxExReps
    }));

    // Champion exercise
    const champion = exerciseStats.length > 0
        ? exerciseStats.reduce((best, ex) => ex.totalReps > best.totalReps ? ex : best, exerciseStats[0])
        : null;

    // ─── Badge count (matches achievements.js exactly) ───────────────────
    let badgeCount = 0;

    // Streak
    if (totalDays >= 1) badgeCount++;
    if (maxStreak >= 3) badgeCount++;
    if (maxStreak >= 7) badgeCount++;
    if (maxStreak >= 14) badgeCount++;
    if (maxStreak >= 30) badgeCount++;
    if (maxStreak >= 60) badgeCount++;
    if (maxStreak >= 90) badgeCount++;
    if (maxStreak >= 180) badgeCount++;
    if (maxStreak >= 365) badgeCount++;

    // Quantity
    if (totalDays >= 10) badgeCount++;
    if (totalDays >= 50) badgeCount++;
    if (totalDays >= 100) badgeCount++;
    if (totalDays >= 200) badgeCount++;
    if (totalDays >= 500) badgeCount++;

    // Volume
    if (globalTotalReps >= 500) badgeCount++;
    if (globalTotalReps >= 1000) badgeCount++;
    if (globalTotalReps >= 5000) badgeCount++;
    if (globalTotalReps >= 10000) badgeCount++;
    if (globalTotalReps >= 50000) badgeCount++;

    // Perfection
    if (perfectDays >= 1) badgeCount++;
    if (perfectDays >= 5) badgeCount++;
    if (perfectDays >= 50) badgeCount++;
    if (perfectDays >= 100) badgeCount++;
    if (perfectDays >= 200) badgeCount++;

    // All exercises
    if (hasCompletedAllExercisesOnce) badgeCount++;

    // Weekday/Weekend
    if (weekdayWorkouts >= 25) badgeCount++;
    if (weekendWorkouts >= 25) badgeCount++;
    if (weekdayWorkouts >= 10 && weekendWorkouts >= 10) badgeCount++;

    // Schedule (9 badges)
    if (morningWorkouts >= 5) badgeCount++;
    if (morningWorkouts >= 10) badgeCount++;
    if (morningWorkouts >= 25) badgeCount++;
    if (afternoonWorkouts >= 5) badgeCount++;
    if (afternoonWorkouts >= 10) badgeCount++;
    if (afternoonWorkouts >= 25) badgeCount++;
    if (eveningWorkouts >= 5) badgeCount++;
    if (eveningWorkouts >= 10) badgeCount++;
    if (eveningWorkouts >= 25) badgeCount++;

    // Secrets
    if (ghostWorkout) badgeCount++;
    if (maxPerfectStreak >= 30) badgeCount++;
    if (globalTotalReps >= 100000) badgeCount++;

    // ─── Return everything ───────────────────────────────────────────────
    return {
        // Global stats
        totalDays,
        maxStreak,
        currentStreak,
        yesterdayStreak,
        displayStreak,
        streakActive,
        todayDone,
        globalTotalReps,
        perfectDays,
        totalExerciseCompletions,
        successRate,
        firstActiveDate,

        // Per-exercise
        exerciseReps,        // { exId: totalReps }
        exerciseDays,        // { exId: daysCompleted }
        exerciseStats,       // Array with full stats per exercise
        exerciseCurrentStreaks,
        exerciseMaxStreaks,
        exerciseDoneToday,

        // Time/schedule
        morningWorkouts,
        afternoonWorkouts,
        eveningWorkouts,
        weekdayWorkouts,
        weekendWorkouts,
        pieData,
        trackedCount,

        // Achievement-specific
        hasCompletedAllExercisesOnce,
        ghostWorkout,
        perfectStreak: maxPerfectStreak,
        badgeCount,
        totalRepsAll: globalTotalReps,
        totalExerciseReps: exerciseReps,

        // Best day
        bestDayDate,
        bestDayReps,
        bestDayExCount,
        bestDayExReps,

        // Charts
        monthlyActivityByExercise,
        monthlyActivityTotal,
        radarData,
        champion,

        // Sorted dates
        sortedDates
    };
}
