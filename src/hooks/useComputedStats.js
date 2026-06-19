import { getLocalDateStr, calculateExerciseStreak, MAX_STREAK_WINDOW, parseTimestamp, getWeekBounds, isDayDoneFromCompletions } from '@utils/dateUtils';
import { EXERCISES, getDailyGoal } from '@config/exercises';
import { evaluateCardioWeek } from '@utils/cardioStreak';
import { WEIGHT_EXERCISES } from '@config/weights';
import { BADGE_DEFINITIONS, isBadgeUnlocked } from '@config/badgeDefinitions';
import { isGlobalPerfectDay } from '@utils/statUtils';

/**
 * Pure function that computes all stats in a single pass.
 * Exported separately so it can be used outside React (e.g. for leaderboard publish).
 */
export function computeAllStats(completions, settings, getDayNumber, allExercises, hasShared = false, achievements = {}, getConfig = null, cardioReps = null, userStartDateStr = null) {
    const todayStr = getLocalDateStr(new Date());
    const today = new Date(todayStr);

    const isDayDoneLocal = (dateStr) => {
        const day = completions[dateStr];
        if (!day) return false;
        return Object.entries(day).some(([exId, exData]) => 
            exData?.isCompleted && allExercises.some(e => e.id === exId)
        );
    };

    const calculateLocalStreak = (dateStr) => {
        let streak = 0;
        const checkDate = new Date(dateStr);
        for (let i = 0; i < MAX_STREAK_WINDOW; i++) {
            const d = new Date(checkDate);
            d.setDate(d.getDate() - i);
            if (isDayDoneLocal(getLocalDateStr(d))) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    };

    // ─── Accumulators ────────────────────────────────────────────────────
    let totalDays = 0;
    let perfectDays = 0;
    let totalExerciseCompletions = 0;
    let isPerfectToday = false;
    let standardPerfectToday = false;
    let weightsPerfectToday = false;
    let weekdayWorkouts = 0;
    let weekendWorkouts = 0;
    let morningWorkouts = 0;
    let afternoonWorkouts = 0;
    let eveningWorkouts = 0;
    let ghostWorkout = false;

    // Per-exercise accumulators
    const exerciseReps = {};      // { exId: totalReps }
    const exerciseDays = {};      // { exId: daysCompleted }
    allExercises.forEach(ex => { exerciseReps[ex.id] = 0; exerciseDays[ex.id] = 0; });

    // Best day tracking
    let bestDayDate = null;
    let bestDayReps = 0;
    let bestDayExCount = 0;
    let bestDayExReps = {};

    // Monthly activity
    const monthlyActivityByExercise = allExercises.map(() => Array(12).fill(0));
    const monthlyActivityTotal = Array(12).fill(0);

    // Pie chart data (time of day)
    const pieData = [
        { name: 'Matin', id: 'morning', value: 0, color: '#f59e0b' },
        { name: 'Après-midi', id: 'afternoon', value: 0, color: '#0ea5e9' },
        { name: 'Soir', id: 'evening', value: 0, color: '#8b5cf6' }
    ];
    let trackedCount = 0;

    // Completed exercise IDs (for polyvalent badge)
    const completedExIds = new Set();

    // First active date
    let firstActiveDate = null;

    // Daily reps for line chart
    const dailyRepsData = [];

    // ─── SINGLE PASS over completions ────────────────────────────────────
    const sortedDates = Object.keys(completions).sort();

    for (const dateStr of sortedDates) {
        const day = completions[dateStr];
        if (!day || typeof day !== 'object') continue;

        const anyDone = isDayDoneLocal(dateStr);
        if (!anyDone) continue;

        totalDays++;
        if (!firstActiveDate) firstActiveDate = dateStr;

        // Perfect day check (category-aware, non-custom)
        const isPerfect = isGlobalPerfectDay(day, allExercises);
        
        if (isPerfect) perfectDays++;
        if (dateStr === todayStr) {
            // Recalculate category-specific perfection for specific flags
            const hasStandard = EXERCISES.every(ex => allExercises.some(e => e.id === ex.id));
            const hasWeights = WEIGHT_EXERCISES.length > 0 && WEIGHT_EXERCISES.every(ex => allExercises.some(e => e.id === ex.id));
            if (hasStandard && EXERCISES.every(ex => day[ex.id]?.isCompleted)) standardPerfectToday = true;
            if (hasWeights && WEIGHT_EXERCISES.every(ex => day[ex.id]?.isCompleted)) weightsPerfectToday = true;
            if (isPerfect) isPerfectToday = true;
        }

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

            // Exercise reps
            const ex = allExercises.find(e => e.id === exId);
            if (ex) {
                totalExerciseCompletions++;
                dayExCount++;
                completedExIds.add(exId);

                const diffToUse = getConfig ? getConfig(exId, dateStr).difficulty : 1.0;
                
                let reps = 0;
                if (exId === 'running' || exId === 'cycling') {
                    // Cardio reps are now computed from distance * 15 in useCardio.js
                    // We don't add daily reps for cardio here to avoid double counting
                } else {
                    reps = getDailyGoal(ex, dayNum, diffToUse);
                }

                if (reps > 0) {
                    exerciseReps[exId] = (exerciseReps[exId] || 0) + reps;
                    dayReps += reps;
                    currentDayExReps[exId] = reps;
                }
                
                exerciseDays[exId] = (exerciseDays[exId] || 0) + 1;

                // Monthly by exercise
                const exIndex = allExercises.findIndex(e => e.id === exId);
                if (exIndex !== -1) {
                    monthlyActivityByExercise[exIndex][monthIdx]++;
                }
            }

            // Time of day (derived from timestamp)
            let timeOfDay = null;
            if (exData.timestamp) {
                const tsDate = parseTimestamp(exData.timestamp);
                // Only count if the timestamp date matches the entry date
                if (getLocalDateStr(tsDate) === dateStr) {
                    const hour = tsDate.getHours();
                    if (hour < 12) timeOfDay = 'morning';
                    else if (hour < 18) timeOfDay = 'afternoon';
                    else timeOfDay = 'evening';
                }
            }

            if (timeOfDay === 'morning') dayHasMorning = true;
            if (timeOfDay === 'afternoon') dayHasAfternoon = true;
            if (timeOfDay === 'evening') dayHasEvening = true;

            // Pie chart (first completed exercise per day)
            if (!dayTimeTracked && timeOfDay) {
                if (timeOfDay === 'morning') pieData[0].value++;
                else if (timeOfDay === 'afternoon') pieData[1].value++;
                else if (timeOfDay === 'evening') pieData[2].value++;
                trackedCount++;
                dayTimeTracked = true;
            }

            // Ghost check (3h-4h)
            if (!ghostWorkout && exData.timestamp) {
                const hour = parseTimestamp(exData.timestamp).getHours();
                if (hour >= 3 && hour < 4) ghostWorkout = true;
            }
        }

        if (dayHasMorning) morningWorkouts++;
        if (dayHasAfternoon) afternoonWorkouts++;
        if (dayHasEvening) eveningWorkouts++;

        // Daily reps for line chart
        if (dayReps > 0) {
            dailyRepsData.push({ date: dateStr, reps: dayReps });
        }

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
    for (let i = 0; i < MAX_STREAK_WINDOW; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        if (isDayDoneLocal(getLocalDateStr(d))) {
            tempStreak++;
            if (tempStreak > maxStreak) maxStreak = tempStreak;
        } else {
            tempStreak = 0;
        }
    }

    const currentStreak = calculateLocalStreak(todayStr);
    const yesterdayDate = new Date(today);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStreak = calculateLocalStreak(getLocalDateStr(yesterdayDate));

    // Perfect streak (consecutive perfect days)
    let perfectStreak = 0, maxPerfectStreak = 0;
    const hasStandard = EXERCISES.every(ex => allExercises.some(exe => exe.id === ex.id));
    const hasWeights = WEIGHT_EXERCISES.length > 0 && WEIGHT_EXERCISES.every(ex => allExercises.some(exe => exe.id === ex.id));

    for (let i = 0; i < MAX_STREAK_WINDOW; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = getLocalDateStr(d);
        const dayCompletions = completions[dateStr];
        
        const isStandardPerfect = hasStandard && EXERCISES.every(ex => dayCompletions?.[ex.id]?.isCompleted);
        const isWeightsPerfect = hasWeights && WEIGHT_EXERCISES.length > 0 && WEIGHT_EXERCISES.every(ex => dayCompletions?.[ex.id]?.isCompleted);
        
        const isPerfect = isStandardPerfect || isWeightsPerfect;
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

    function getWeeklyCompletion(comps, mode, date) {
        const { start, end } = getWeekBounds(date);
        let loop = new Date(start);
        while (loop <= end) {
            if (comps[getLocalDateStr(loop)]?.[mode]?.isCompleted) return true;
            loop.setDate(loop.getDate() + 1);
        }
        return false;
    }

    // Streaks cardio : on ne casse PAS la boucle sur weekNum < 1, car des sessions
    // Strava peuvent exister avant la date de début du challenge.
    function computeCardioMaxStreak(sessions, mode, challengeStartDate, currentDifficulty, completions) {
        if (!sessions.length) return 0;
        let maxStreak = 0;
        let streak = 0;
        for (let weekOffset = 0; weekOffset < 52; weekOffset++) {
            const { achieved } = evaluateCardioWeek(sessions, mode, weekOffset, challengeStartDate, currentDifficulty, completions);
            if (achieved) {
                streak++;
                if (streak > maxStreak) maxStreak = streak;
            } else if (weekOffset > 0) {
                // Semaine manquée : on remet à zéro mais on continue pour trouver d'anciens streaks.
                streak = 0;
            }
        }
        return maxStreak;
    }

    function computeCardioCurrentStreak(sessions, mode, challengeStartDate, currentDifficulty, completions) {
        if (!sessions.length) return 0;
        let streak = 0;
        for (let weekOffset = 0; weekOffset < 52; weekOffset++) {
            const { achieved } = evaluateCardioWeek(sessions, mode, weekOffset, challengeStartDate, currentDifficulty, completions);
            if (achieved) {
                streak++;
            } else if (weekOffset > 0) {
                break;
            }
        }
        return streak;
    }

    for (const ex of allExercises) {
        if (ex.id === 'running' || ex.id === 'cycling') {
            const cardioSessions = cardioReps?.allSessions || [];
            const userStartDate = userStartDateStr || firstActiveDate || sortedDates[0] || todayStr;
            const currentDifficulty = settings?.exerciseDifficulties?.[ex.id] ?? 1.0;
            
            exerciseCurrentStreaks[ex.id] = computeCardioCurrentStreak(cardioSessions, ex.id, userStartDate, currentDifficulty, completions);
            exerciseMaxStreaks[ex.id] = computeCardioMaxStreak(cardioSessions, ex.id, userStartDate, currentDifficulty, completions);
            exerciseDoneToday[ex.id] = isDayDoneFromCompletions(completions, todayStr) && !!getWeeklyCompletion(completions, ex.id, today);
        } else {
            exerciseCurrentStreaks[ex.id] = calculateExerciseStreak(completions, todayStr, ex.id);
            exerciseYesterdayStreaks[ex.id] = calculateExerciseStreak(completions, getLocalDateStr(yesterdayDate), ex.id);
            exerciseDoneToday[ex.id] = !!completions[todayStr]?.[ex.id]?.isCompleted;

            // Max streak
            let maxExStreak = 0, tempExStreak = 0;
            for (let i = 0; i < MAX_STREAK_WINDOW; i++) {
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
    }

    // Inject cardio reps (from the cardioReps argument; cardio lives in its own node now)
    const runningReps = cardioReps?.running;
    const cyclingReps = cardioReps?.cycling;

    if (runningReps && allExercises.some(e => e.id === 'running')) exerciseReps['running'] = runningReps;
    if (cyclingReps && allExercises.some(e => e.id === 'cycling')) exerciseReps['cycling'] = cyclingReps;

    // ─── Derived values ──────────────────────────────────────────────────
    const globalTotalReps = Object.values(exerciseReps).reduce((sum, r) => sum + r, 0) ;
    const successRate = totalDays > 0 ? Math.round((totalDays / MAX_STREAK_WINDOW) * 100) : 0;
    const hasCompletedAllExercisesOnce = EXERCISES.every(ex => completedExIds.has(ex.id));
    const todayDone = isDayDoneLocal(todayStr);
    
    let finalMaxStreak = maxStreak;
    let finalDisplayStreak = todayDone ? currentStreak : yesterdayStreak;
    let finalCurrentStreak = currentStreak;

    // If filtering by cardio only, daily consecutive streaks don't make sense.
    // Return the max weekly streak instead.
    const isOnlyCardio = allExercises.length > 0 && allExercises.every(ex => ex.id === 'running' || ex.id === 'cycling');
    if (isOnlyCardio) {
        finalMaxStreak = Math.max(0, ...Object.values(exerciseMaxStreaks));
        finalDisplayStreak = Math.max(0, ...Object.values(exerciseCurrentStreaks));
        finalCurrentStreak = finalDisplayStreak;
    }

    const streakActive = todayDone || (isOnlyCardio && finalCurrentStreak > 0);

    // Exercise stats array (for Stats.jsx)
    const exerciseStats = allExercises.map(ex => {
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
        exId: ex.id,
        reps: ex.totalReps,
        fullMark: maxExReps
    }));

    // Champion exercise
    const champion = exerciseStats.length > 0
        ? exerciseStats.reduce((best, ex) => ex.totalReps > (best?.totalReps || 0) ? ex : best, exerciseStats[0])
        : null;

    // Stats snapshot for badge testing
    const statsSnapshot = {
        totalDays, maxStreak: finalMaxStreak, totalRepsAll: globalTotalReps, perfectDays,
        hasCompletedAllExercisesOnce, weekdayWorkouts, weekendWorkouts,
        morningWorkouts, afternoonWorkouts, eveningWorkouts,
        ghostWorkout, perfectStreak: maxPerfectStreak, hasShared,
    };

    // Badge count (supports manual overrides)
    const badgeCount = BADGE_DEFINITIONS.filter(b => isBadgeUnlocked(b.id, statsSnapshot, achievements)).length;

    // ─── Return everything ───────────────────────────────────────────────
    return {
        // Global stats
        totalDays,
        maxStreak: finalMaxStreak,
        currentStreak: finalCurrentStreak,
        yesterdayStreak,
        displayStreak: finalDisplayStreak,
        streakActive,
        todayDone,
        globalTotalReps,
        perfectDays,
        totalExerciseCompletions,
        successRate,
        firstActiveDate,
        isPerfectToday,
        standardPerfectToday,
        weightsPerfectToday,

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
        hasShared,
        achievements,
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
        dailyRepsData,

        // Sorted dates
        sortedDates
    };
}
