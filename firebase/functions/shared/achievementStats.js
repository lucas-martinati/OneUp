/**
 * SINGLE SOURCE OF TRUTH for the achievement STATS SNAPSHOT (the numbers the
 * badge rules test against: totalDays, streaks, perfect days, weekday/weekend
 * and time-of-day workout counts…).
 *
 * ES Module consumed by BOTH:
 *   • the Cloud Function — functions/index.js, to publish the badge count to
 *                          `publicProfiles/{uid}.achievements`.
 *   • the client UI      — src/hooks/useComputedStats.js, so the count shown on
 *                          the Stats page / leaderboard detail / admin panel is
 *                          computed IDENTICALLY and never drifts from the server.
 *
 * The unlock predicates live in `badgeRules.js`; this file only builds the
 * snapshot they consume. Keep it import-light (only exerciseRules) so both the
 * Node function runtime and the Vite client bundle can load it unchanged.
 *
 * IMPORTANT — time-of-day derivation: workout timestamps are stored in UTC while
 * the badge day key (`dateStr`) is the user's LOCAL date. We derive the hour as
 * the offset from the local day's UTC-midnight so client and server compute the
 * EXACT same value from the EXACT same inputs. It is not the true wall-clock hour
 * for users far from UTC, but it is deterministic and — crucially — consistent
 * across both runtimes, which is what keeps the badge count in sync everywhere.
 */

import {
  EXERCISES,
  WEIGHT_EXERCISES,
  ALL_STANDARD_IDS,
  ALL_EXERCISE_IDS,
} from './exerciseRules.js';

const MAX_STREAK_WINDOW = 365;

// Deterministic "local hour" shared by client and server: hours elapsed between
// the local day's UTC-midnight and the recorded UTC timestamp, wrapped to 0-23.
function badgeLocalHour(dateStr, ts) {
  const ms = typeof ts === 'number' ? ts : new Date(ts).getTime();
  if (isNaN(ms)) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return null;
  const diffH = (ms - Date.UTC(y, m - 1, d)) / (1000 * 60 * 60);
  return ((Math.floor(diffH) % 24) + 24) % 24;
}

/**
 * Build the achievement stats snapshot from the user's completions.
 *
 * @param {Object} completions  Map of `dateStr` → { exId: { isCompleted, timestamp } }.
 * @param {number} totalRepsAll Total reps across every category (volume badges).
 * @param {Object} frozenDays   Map of `dateStr` → true for streak-frozen days.
 * @returns {Object} snapshot consumed by BADGE_RULES.
 */
export function computeAchievementStats(completions, totalRepsAll, frozenDays = {}) {
  const pad = n => String(n).padStart(2, '0');
  const toStr = d => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  const dayIsDone = day => !!day && typeof day === 'object' &&
    Object.entries(day).some(([id, e]) => e?.isCompleted && ALL_EXERCISE_IDS.has(id));
  const isStandardPerfect = day => EXERCISES.every(ex => day[ex.id]?.isCompleted);
  const isWeightsPerfect = day => WEIGHT_EXERCISES.length > 0 && WEIGHT_EXERCISES.every(ex => day[ex.id]?.isCompleted);

  let totalDays = 0, perfectDays = 0, weekdayWorkouts = 0, weekendWorkouts = 0;
  let morningWorkouts = 0, afternoonWorkouts = 0, eveningWorkouts = 0, ghostWorkout = false;
  const completedStandard = new Set();

  for (const [dateStr, day] of Object.entries(completions)) {
    if (!dayIsDone(day)) continue;
    totalDays++;
    if (isStandardPerfect(day) || isWeightsPerfect(day)) perfectDays++;

    const [y, m, d] = dateStr.split('-').map(Number);
    const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    if (dow >= 1 && dow <= 5) weekdayWorkouts++;
    if (dow === 0 || dow === 6) weekendWorkouts++;

    let hasMorning = false, hasAfternoon = false, hasEvening = false;
    for (const [exId, exData] of Object.entries(day)) {
      if (!exData?.isCompleted) continue;
      if (ALL_STANDARD_IDS.has(exId)) completedStandard.add(exId);
      if (exData.timestamp) {
        const h = badgeLocalHour(dateStr, exData.timestamp);
        if (h !== null) {
          if (h < 12) hasMorning = true;
          else if (h < 18) hasAfternoon = true;
          else hasEvening = true;
          if (h >= 3 && h < 4) ghostWorkout = true;
        }
      }
    }
    if (hasMorning) morningWorkouts++;
    if (hasAfternoon) afternoonWorkouts++;
    if (hasEvening) eveningWorkouts++;
  }

  const hasCompletedAllExercisesOnce = EXERCISES.every(ex => completedStandard.has(ex.id));

  // Streaks: walk backwards from today (UTC) over the window.
  const now = new Date();
  const todayUTCms = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  let maxStreak = 0, tempStreak = 0, perfectStreak = 0, tempPerfect = 0;
  for (let i = 0; i < MAX_STREAK_WINDOW; i++) {
    const dateStr = toStr(new Date(todayUTCms - i * 86400000));
    const day = completions[dateStr];
    if (dayIsDone(day)) { tempStreak++; if (tempStreak > maxStreak) maxStreak = tempStreak; }
    else if (frozenDays[dateStr]) { /* protected — keep the run alive */ }
    else tempStreak = 0;
    // A Streak Freeze protects the daily streak, not perfect days (a frozen day
    // wasn't trained, so it can't be perfect) — perfect streak breaks as usual.
    if (day && (isStandardPerfect(day) || isWeightsPerfect(day))) {
      tempPerfect++; if (tempPerfect > perfectStreak) perfectStreak = tempPerfect;
    } else tempPerfect = 0;
  }

  return {
    totalDays, perfectDays, weekdayWorkouts, weekendWorkouts,
    morningWorkouts, afternoonWorkouts, eveningWorkouts, ghostWorkout,
    hasCompletedAllExercisesOnce, maxStreak, perfectStreak,
    totalRepsAll,
  };
}
