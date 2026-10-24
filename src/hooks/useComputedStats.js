import { computeLevelStreaks, getDayLevel, getRecordedReps, isFullCompletion } from '@shared/exerciseLevels.js';
import { getLocalDateStr, MAX_STREAK_WINDOW, parseTimestamp, getWeekBounds, isDayDoneFromCompletions, parseLocalDate } from '@shared/dateUtils';
import { EXERCISES } from '@config/exercises';
import { computeCardioLevelStreaks, getCardioReps } from '@shared/cardioLevels.js';
import { WEIGHT_EXERCISES } from '@config/weights';
import { BADGE_DEFINITIONS, isBadgeUnlocked } from '@config/badgeDefinitions';
import { computeAchievementStats } from '@shared/achievementStats.js';
import { isGlobalPerfectDay } from '@utils/statUtils';

/**
 * Pure function that computes all stats in a single pass.
 * Exported separately so it can be used outside React (e.g. for leaderboard publish).
 */
export function computeAllStats(completions, settings, getDayNumber, allExercises, hasShared = false, achievements = {}, getConfig = null, userStartDateStr = null, frozenDays = {}, allExercisesMap = null) {
    if (!allExercisesMap && allExercises) {
        allExercisesMap = Object.fromEntries(allExercises.map(e => [e.id, e]));
    }
    const todayStr = getLocalDateStr(new Date());
    const today = parseLocalDate(todayStr);
    const weekStartDay = settings?.weekStartDay || 'monday';

    const isDayDoneLocal = dateStr => getDayLevel(completions, dateStr, allExercises.map(ex => ex.id), weekStartDay) > 0;

    // A Streak Freeze protects the GLOBAL daily streak: a frozen day is
    // transparent in the walk (neither breaks nor counts). See @shared/streakFreeze.
    const isFrozenDay = (dateStr) => !!frozenDays[dateStr];

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
    const allExercisesIndexMap = Object.fromEntries(allExercises.map((e, idx) => [e.id, idx]));
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

    const hasStandard = EXERCISES.every(ex => !!allExercisesMap[ex.id]);
    const hasWeights = WEIGHT_EXERCISES.length > 0 && WEIGHT_EXERCISES.every(ex => !!allExercisesMap[ex.id]);

    for (const dateStr of sortedDates) {
        const day = completions[dateStr];
        if (!day || typeof day !== 'object') continue;

        const anyDone = isDayDoneLocal(dateStr);
        const hasReps = Object.values(day).some(entry => entry?.count > 0);
        if (!anyDone && !hasReps) continue;

        if (anyDone) totalDays++;
        if (!firstActiveDate) firstActiveDate = dateStr;

        // Perfect day check (category-aware, non-custom)
        const isPerfect = isGlobalPerfectDay(day, allExercises);
        
        if (isPerfect) perfectDays++;
        if (dateStr === todayStr) {
            if (hasStandard && EXERCISES.every(ex => isFullCompletion(day[ex.id]))) standardPerfectToday = true;
            if (hasWeights && WEIGHT_EXERCISES.every(ex => isFullCompletion(day[ex.id]))) weightsPerfectToday = true;
            if (isPerfect) isPerfectToday = true;
        }

        // Day of week
        const dateObj = parseLocalDate(dateStr);
        const dayOfWeek = dateObj.getDay();
        if (anyDone && dayOfWeek >= 1 && dayOfWeek <= 5) weekdayWorkouts++;
        if (anyDone && (dayOfWeek === 0 || dayOfWeek === 6)) weekendWorkouts++;

        // Monthly activity (parse directly from YYYY-MM-DD for speed)
        const monthIdx = parseInt(dateStr.slice(5, 7), 10) - 1;
        if (anyDone) monthlyActivityTotal[monthIdx]++;

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
            if (!exData?.isCompleted) {
                if (allExercisesMap[exId] && exData?.count > 0) {
                    const reps = exId === 'running' || exId === 'cycling'
                        ? getCardioReps(exData, exId, Math.max(1, Math.floor((dayNum - 1) / 7) + 1))
                        : getRecordedReps(exData, allExercisesMap[exId], dayNum);
                    exerciseReps[exId] += reps;
                    dayReps += reps;
                    currentDayExReps[exId] = reps;
                }
                continue;
            }

            // Exercise reps
            const ex = allExercisesMap[exId];
            if (ex) {
                totalExerciseCompletions++;
                dayExCount++;
                completedExIds.add(exId);

                const diffToUse = getConfig ? getConfig(exId, dateStr).difficulty : 1.0;
                
                let reps = 0;
                if (exId === 'running' || exId === 'cycling') {
                    const weekNum = Math.max(1, Math.floor((dayNum - 1) / 7) + 1);
                    reps = getCardioReps(exData, exId, weekNum);
                } else {
                    reps = getRecordedReps(exData, ex, dayNum, diffToUse);
                }

                if (reps > 0) {
                    exerciseReps[exId] = (exerciseReps[exId] || 0) + reps;
                    dayReps += reps;
                    currentDayExReps[exId] = reps;
                }
                
                exerciseDays[exId] = (exerciseDays[exId] || 0) + 1;

                // Monthly by exercise
                const exIndex = allExercisesIndexMap[exId];
                if (exIndex !== undefined) {
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

        dailyRepsData.push({ date: dateStr, reps: dayReps });

        // Best day
        if (dayReps > bestDayReps || (dayReps === bestDayReps && dayExCount > bestDayExCount)) {
            bestDayDate = dateStr;
            bestDayExCount = dayExCount;
            bestDayReps = dayReps;
            bestDayExReps = { ...currentDayExReps };
        }
    }

    // ─── Streak calculations (require backward day iteration) ────────────
    const globalLevels = computeLevelStreaks(completions, todayStr, { exerciseIds: allExercises.map(ex => ex.id), frozenDays, weekStartDay });
    const maxStreak = globalLevels.levels[0].max;
    const currentStreak = isDayDoneLocal(todayStr) || isFrozenDay(todayStr) ? globalLevels.streak : 0;
    const yesterdayDate = parseLocalDate(today);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = getLocalDateStr(yesterdayDate);
    const yesterdayStreak = isDayDoneLocal(yesterdayStr) || isFrozenDay(yesterdayStr)
        ? computeLevelStreaks(completions, yesterdayStr, { exerciseIds: allExercises.map(ex => ex.id), frozenDays, weekStartDay }).streak : 0;

    // Perfect streak (consecutive perfect days)
    let perfectStreak = 0, maxPerfectStreak = 0;

    for (let i = 0; i < MAX_STREAK_WINDOW; i++) {
        const d = parseLocalDate(today);
        d.setDate(d.getDate() - i);
        const dateStr = getLocalDateStr(d);
        const dayCompletions = completions[dateStr];
        
        const isStandardPerfect = hasStandard && EXERCISES.every(ex => isFullCompletion(dayCompletions?.[ex.id]));
        const isWeightsPerfect = hasWeights && WEIGHT_EXERCISES.length > 0 && WEIGHT_EXERCISES.every(ex => isFullCompletion(dayCompletions?.[ex.id]));
        
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
    const exerciseLevels = {};

    function getWeeklyCompletion(comps, mode, date) {
        const { start, end } = getWeekBounds(date, weekStartDay);
        let loop = new Date(start);
        while (loop <= end) {
            if (comps[getLocalDateStr(loop)]?.[mode]?.isCompleted) return true;
            loop.setDate(loop.getDate() + 1);
        }
        return false;
    }

    // Streaks cardio : calculs mutualisés avec useCardio (les semaines
    // antérieures au début du challenge sont ignorées, weekNum < 1).
    for (const ex of allExercises) {
        if (ex.id === 'running' || ex.id === 'cycling') {
            const userStartDate = userStartDateStr || firstActiveDate || sortedDates[0] || todayStr;
            const levels = computeCardioLevelStreaks(completions, ex.id, userStartDate, todayStr, weekStartDay);
            exerciseLevels[ex.id] = levels;
            exerciseCurrentStreaks[ex.id] = levels.streak;
            exerciseMaxStreaks[ex.id] = levels.levels[0].max;
            exerciseDoneToday[ex.id] = isDayDoneFromCompletions(completions, todayStr) && !!getWeeklyCompletion(completions, ex.id, today);
        } else {
            const levels = computeLevelStreaks(completions, todayStr, { exerciseId: ex.id });
            exerciseLevels[ex.id] = levels;
            exerciseDoneToday[ex.id] = !!completions[todayStr]?.[ex.id]?.isCompleted;
            exerciseCurrentStreaks[ex.id] = exerciseDoneToday[ex.id] ? levels.streak : 0;
            exerciseYesterdayStreaks[ex.id] = completions[yesterdayStr]?.[ex.id]?.isCompleted
                ? computeLevelStreaks(completions, yesterdayStr, { exerciseId: ex.id }).streak : 0;
            exerciseMaxStreaks[ex.id] = levels.levels[0].max;
        }
    }

    // ─── Derived values ──────────────────────────────────────────────────
    const globalTotalReps = Object.values(exerciseReps).reduce((sum, r) => sum + r, 0) ;
    const successRate = totalDays > 0 ? Math.min(100, Math.round((totalDays / MAX_STREAK_WINDOW) * 100)) : 0;
    const hasCompletedAllExercisesOnce = EXERCISES.every(ex => completedExIds.has(ex.id));
    const todayDone = isDayDoneLocal(todayStr);
    
    let finalMaxStreak = maxStreak;
    let finalDisplayStreak = todayDone ? currentStreak : yesterdayStreak;
    let finalCurrentStreak = currentStreak;

    // If filtering by cardio only, daily consecutive streaks don't make sense.
    // Return the max weekly streak instead.
    const isOnlyCardio = allExercises.length > 0 && allExercises.every(ex => ex.id === 'running' || ex.id === 'cycling');
    const cardioMode = allExercises.length === 1 ? allExercises[0].id : null;
    const cardioLevels = isOnlyCardio ? computeCardioLevelStreaks(completions, cardioMode, userStartDateStr, todayStr, weekStartDay) : null;
    if (cardioLevels) {
        finalMaxStreak = cardioLevels.levels[0].max;
        finalDisplayStreak = cardioLevels.streak;
        finalCurrentStreak = cardioLevels.active ? cardioLevels.streak : 0;
    }

    const streakActive = cardioLevels ? cardioLevels.active : todayDone;

    // The streak is alive only because yesterday was protected by a Streak Freeze
    // (today not trained yet) — lets the UI show a "frozen but safe" state.
    // NOTE: cardio streak freeze is intentionally NOT supported — cardio uses a
    // weekly streak with its own logic, so `isOnlyCardio` deliberately
    // short-circuits this to false. Revisit this branch if freezes are ever
    // extended to cardio.
    const streakFrozen = !isOnlyCardio && !todayDone && finalDisplayStreak > 0
        && isFrozenDay(getLocalDateStr(yesterdayDate));

    // Exercise stats array (for Stats.jsx)
    const exerciseStats = allExercises.map(ex => {
        const exDoneToday = exerciseDoneToday[ex.id];
        const streak = exDoneToday ? exerciseCurrentStreaks[ex.id] : exerciseYesterdayStreaks[ex.id];
        const completionRate = totalDays > 0 ? Math.round(((exerciseDays[ex.id] || 0) / totalDays) * 100) : 0;
        const levelStats = exerciseLevels[ex.id];
        return {
            ...ex,
            streakLevel: levelStats?.level || 0,
            levelStreaks: levelStats?.levels || [],
            totalReps: exerciseReps[ex.id] || 0,
            daysCompleted: exerciseDays[ex.id] || 0,
            streak: levelStats ? levelStats.streak : streak,
            streakActive: exDoneToday,
            maxStreak: levelStats ? levelStats.levels[0].max : (exerciseMaxStreaks[ex.id] || 0),
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

    // Badge stats snapshot — computed by the SAME shared function the Cloud
    // Function uses (@shared/achievementStats.js). This is the single source of
    // truth for badge inputs, so the count on the Stats page matches the count
    // published to publicProfiles (leaderboard detail + admin) instead of drifting
    // between two separate implementations. The local counters above (weekday/
    // time-of-day…) still feed the charts, which stay device-local by design.
    const badgeStats = computeAchievementStats(completions, globalTotalReps, frozenDays, settings.weekStartDay || 'monday');

    // Badge count (supports manual overrides via the achievements node)
    const badgeCount = BADGE_DEFINITIONS.filter(b => isBadgeUnlocked(b.id, badgeStats, achievements)).length;

    // ─── Return everything ───────────────────────────────────────────────
    return {
        // Global stats
        totalDays,
        maxStreak: isOnlyCardio ? finalMaxStreak : globalLevels.levels[0].max,
        currentStreak: finalCurrentStreak,
        yesterdayStreak,
        displayStreak: isOnlyCardio ? finalDisplayStreak : globalLevels.streak,
        streakLevel: cardioLevels ? cardioLevels.level : globalLevels.level,
        levelStreaks: cardioLevels ? cardioLevels.levels : globalLevels.levels,
        streakActive,
        streakFrozen,
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
        badgeStats,
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

