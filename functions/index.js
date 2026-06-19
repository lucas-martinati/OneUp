import { onRequest } from "firebase-functions/v2/https";
import { onValueWritten } from "firebase-functions/v2/database";
import functionsV1 from "firebase-functions/v1";
import admin from "firebase-admin";
import { BADGE_RULES, isBadgeUnlocked } from "./shared/badgeRules.js";

// Initialize Firebase Admin SDK using Default Compute Service Account
admin.initializeApp();
const db = admin.database();

// ══════════════════════════════════════════════════════════════════════════════
// Exercise definitions — Single source of truth in functions/shared/exerciseRules.js,
// imported here AND by the client — no copy-paste.
// ══════════════════════════════════════════════════════════════════════════════

import {
  EXERCISES,
  WEIGHT_EXERCISES,
  CARDIO_EXERCISES,
  ALL_STANDARD_IDS,
  ALL_WEIGHT_IDS,
  ALL_EXERCISE_IDS,
  getDailyGoal,
} from "./shared/exerciseRules.js";


function getDayNumber(startDate, dateStr) {
  const start = new Date(startDate);
  const current = new Date(dateStr);
  const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const utcCurrent = Date.UTC(current.getFullYear(), current.getMonth(), current.getDate());
  return Math.floor((utcCurrent - utcStart) / (1000 * 60 * 60 * 24)) + 1;
}

function isTimestampSuspicious(dateStr, timestamp) {
  if (!timestamp) return false;
  
  const tsMs = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
  if (isNaN(tsMs)) return false;

  // Parse dateStr (local date of client)
  const parts = dateStr.split('-');
  if (parts.length !== 3) return false;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed in JS Date
  const day = parseInt(parts[2], 10);

  // Get UTC start of the local day
  const localDayStartUTC = Date.UTC(year, month, day);

  // Calculate the difference in hours
  const diffHours = (tsMs - localDayStartUTC) / (1000 * 60 * 60);

  // Legitimate timezone offset is between -12 and +14.
  // We use exactly [-15, 37) to accommodate 1-hour of drift/network latency.
  if (diffHours < -15 || diffHours >= 37) {
    return true; // Suspicious!
  }

  return false;
}

function getUserLocalDate(completions, serverNow) {
  const nowMs = serverNow.getTime();
  
  // Only check the date strings of yesterday, today, and tomorrow in UTC (O(1) complexity)
  const datesToCheck = [];
  for (let i = -1; i <= 1; i++) {
    const d = new Date(nowMs + i * 24 * 60 * 60 * 1000);
    const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    datesToCheck.push(dateStr);
  }

  let closestDateStr = null;
  let minDiff = Infinity;

  for (const dateStr of datesToCheck) {
    const day = completions[dateStr];
    if (!day || typeof day !== 'object') continue;
    for (const [, exData] of Object.entries(day)) {
      if (exData?.timestamp) {
        const ts = typeof exData.timestamp === 'number' ? exData.timestamp : new Date(exData.timestamp).getTime();
        if (!isNaN(ts)) {
          const diff = Math.abs(nowMs - ts);
          if (diff < minDiff && diff < 10 * 60 * 1000) { // within 10 minutes of now
            minDiff = diff;
            closestDateStr = dateStr;
          }
        }
      }
    }
  }

  // Fallback to serverTodayUTC if no recent write timestamp is found
  if (!closestDateStr) {
    closestDateStr = `${serverNow.getUTCFullYear()}-${String(serverNow.getUTCMonth() + 1).padStart(2, '0')}-${String(serverNow.getUTCDate()).padStart(2, '0')}`;
  }
  return closestDateStr;
}

// ══════════════════════════════════════════════════════════════════════════════
// Achievements — shared rules so the leaderboard publishes the REAL badge count
// (previously it only counted the manual flags stored in the `achievements`
// node — first_share / white_hat — i.e. at most 2).
// Badge unlock logic is the SINGLE SOURCE OF TRUTH in functions/shared/badgeRules.js,
// imported here AND by the client (src/config/badgeDefinitions.js) — no copy-paste.
// The stats snapshot below mirrors src/hooks/useComputedStats.js.
// ══════════════════════════════════════════════════════════════════════════════

const MAX_STREAK_WINDOW = 365;

// Build the achievement stats snapshot from the user's completions.
// NOTE: time-of-day badges (morning/afternoon/evening/ghost) depend on the
// user's LOCAL hour, which can't be recovered exactly server-side (we only have
// the UTC timestamp + the local date string). We approximate the local hour as
// the offset from the recorded local day's UTC midnight — accurate for users
// near UTC, slightly off for far timezones. All date-based badges are exact.
function computeAchievementStats(completions, totalRepsAll) {
  const pad = n => String(n).padStart(2, '0');
  const toStr = d => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  const dayIsDone = day => !!day && typeof day === 'object' &&
    Object.entries(day).some(([id, e]) => e?.isCompleted && ALL_EXERCISE_IDS.has(id));
  const isStandardPerfect = day => EXERCISES.every(ex => day[ex.id]?.isCompleted);
  const isWeightsPerfect = day => WEIGHT_EXERCISES.length > 0 && WEIGHT_EXERCISES.every(ex => day[ex.id]?.isCompleted);

  const localHour = (dateStr, ts) => {
    const ms = typeof ts === 'number' ? ts : new Date(ts).getTime();
    if (isNaN(ms)) return null;
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return null;
    const diffH = (ms - Date.UTC(y, m - 1, d)) / (1000 * 60 * 60);
    return ((Math.floor(diffH) % 24) + 24) % 24;
  };

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
        const h = localHour(dateStr, exData.timestamp);
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

  // Streaks: walk backwards from today (server UTC) over the window.
  const now = new Date();
  const todayUTCms = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  let maxStreak = 0, tempStreak = 0, perfectStreak = 0, tempPerfect = 0;
  for (let i = 0; i < MAX_STREAK_WINDOW; i++) {
    const day = completions[toStr(new Date(todayUTCms - i * 86400000))];
    if (dayIsDone(day)) { tempStreak++; if (tempStreak > maxStreak) maxStreak = tempStreak; }
    else tempStreak = 0;
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

// ══════════════════════════════════════════════════════════════════════════════
// Public profile — derived per-exercise stats published to `publicProfiles/{uid}`
// so the social detail view (UserDetail.jsx) never needs to read another user's
// PRIVATE `users/{uid}/progress` (which holds the full completions calendar AND,
// historically, GPS tracks). Mirrors computeStats() in src/components/social/UserDetail.jsx.
// Streaks are anchored on the user's local date (best server-side approximation).
// ══════════════════════════════════════════════════════════════════════════════

// All known exercise ids (standard + weights + cardio), as a flat list.
const ALL_EX_OBJECTS = [...EXERCISES, ...WEIGHT_EXERCISES, ...CARDIO_EXERCISES];

function computeExerciseDerived(completions, anchorDateStr) {
  const pad = n => String(n).padStart(2, '0');
  const dayStr = d => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  const dayIsDone = day => !!day && typeof day === 'object' &&
    Object.entries(day).some(([id, e]) => e?.isCompleted && ALL_EXERCISE_IDS.has(id));

  // Per-exercise total days completed.
  const exerciseDays = {};
  for (const ex of ALL_EX_OBJECTS) exerciseDays[ex.id] = 0;
  for (const day of Object.values(completions)) {
    if (!day || typeof day !== 'object') continue;
    for (const ex of ALL_EX_OBJECTS) {
      if (day[ex.id]?.isCompleted) exerciseDays[ex.id]++;
    }
  }

  // Streaks counting backwards from the user's local "today".
  const [ay, am, ad] = anchorDateStr.split('-').map(Number);
  const anchorMs = Date.UTC(ay, am - 1, ad);

  let currentStreak = 0;
  for (let i = 0; i < MAX_STREAK_WINDOW; i++) {
    if (dayIsDone(completions[dayStr(new Date(anchorMs - i * 86400000))])) currentStreak++;
    else break;
  }

  const exerciseStreaks = {};
  const exerciseDoneToday = {};
  for (const ex of ALL_EX_OBJECTS) {
    let streak = 0;
    for (let i = 0; i < MAX_STREAK_WINDOW; i++) {
      const ds = dayStr(new Date(anchorMs - i * 86400000));
      if (completions[ds]?.[ex.id]?.isCompleted) streak++;
      else break;
    }
    exerciseStreaks[ex.id] = streak;
    exerciseDoneToday[ex.id] = !!completions[anchorDateStr]?.[ex.id]?.isCompleted;
  }

  return { currentStreak, exerciseDays, exerciseStreaks, exerciseDoneToday };
}

// ══════════════════════════════════════════════════════════════════════════════
// Core: recompute leaderboard entry from source of truth
// ══════════════════════════════════════════════════════════════════════════════

async function recomputeLeaderboardEntry(uid, progress, beforeProgress = null) {
  if (!progress) return;

  // ── Read auxiliary data in parallel ─────────────────────────────────────
  // cardioSessions are read from the decoupled node `users/{uid}/cardioSessions`
  // (new location, out of `progress` so GPS tracks stay private). During the
  // migration window we also honour the legacy `progress.cardio.sessions`.
  const [settingsSnap, purchaseSnap, existingSnap, achievementsSnap, cardioSnap] = await Promise.all([
    db.ref(`users/${uid}/settings`).once('value'),
    db.ref(`users/${uid}/purchase`).once('value'),
    db.ref(`leaderboard/${uid}`).once('value'),
    db.ref(`users/${uid}/achievements`).once('value'),
    db.ref(`users/${uid}/cardioSessions`).once('value'),
  ]);

  const settings = settingsSnap.val() || {};
  const purchase = purchaseSnap.val() || {};
  const existing = existingSnap.val() || {};
  const achievements = achievementsSnap.val() || {};

  // ── Get user auth info (displayName, photoURL) ─────────────────────────
  let userRecord = null;
  try {
    userRecord = await admin.auth().getUser(uid);
  } catch {
    // User may have been deleted — silently ignore
  }

  // ── Extract data ───────────────────────────────────────────────────────
  const completions = progress.completions || {};
  const startDate = progress.startDate;
  if (!startDate) return; // No start date means no challenge started

  const exerciseDifficulties = settings.exerciseDifficulties || {};
  const difficultyMultiplier = settings.difficultyMultiplier ?? 1.0;

  // ── Compute server dates ───────────────────────────────────────────────
  const serverNow = new Date();
  const serverTodayUTC = `${serverNow.getUTCFullYear()}-${String(serverNow.getUTCMonth() + 1).padStart(2, '0')}-${String(serverNow.getUTCDate()).padStart(2, '0')}`;
  const tomorrow = new Date(serverNow.getTime() + 24 * 60 * 60 * 1000);
  const serverTomorrowUTC = `${tomorrow.getUTCFullYear()}-${String(tomorrow.getUTCMonth() + 1).padStart(2, '0')}-${String(tomorrow.getUTCDate()).padStart(2, '0')}`;

  // ── Compute per-exercise reps ──────────────────────────────────────────
  const exerciseReps = {};
  let totalClassicReps = 0;
  let weightsTotalReps = 0;
  let lastActiveDay = null;

  const sortedDates = Object.keys(completions).sort();

  for (const dateStr of sortedDates) {
    const day = completions[dateStr];
    if (!day || typeof day !== 'object') continue;
    if (dateStr < startDate) continue; // Skip dates before challenge start

    const dayNum = getDayNumber(startDate, dateStr);
    if (dayNum < 1) continue;

    let anyDone = false;

    for (const [exId, exData] of Object.entries(day)) {
      if (!exData?.isCompleted) continue;
      if (!ALL_EXERCISE_IDS.has(exId)) continue; // Skip unknown exercises (custom exercises use their own IDs)

      anyDone = true;

      // Skip cardio — reps computed from distance below
      if (exId === 'running' || exId === 'cycling') continue;

      const exercise = EXERCISES.find(e => e.id === exId) || WEIGHT_EXERCISES.find(e => e.id === exId);
      if (!exercise) continue;

      const diff = exerciseDifficulties[exId] ?? difficultyMultiplier;
      const reps = getDailyGoal(exercise, dayNum, diff);

      exerciseReps[exId] = (exerciseReps[exId] || 0) + reps;

      if (ALL_STANDARD_IDS.has(exId)) {
        totalClassicReps += reps;
      } else if (ALL_WEIGHT_IDS.has(exId)) {
        weightsTotalReps += reps;
      }


    }

    // Also check for custom exercises (exercises not in standard/weight/cardio lists)
    for (const [exId, exData] of Object.entries(day)) {
      if (!exData?.isCompleted) continue;
      if (ALL_EXERCISE_IDS.has(exId)) continue; // Already processed above
      anyDone = true; // Custom exercises count as activity
    }

    if (anyDone) {
      if (dateStr <= serverTomorrowUTC) {
        lastActiveDay = dateStr; // sortedDates is chronological, so last wins
      }
    }
  }

  // ── Cardio reps from Strava sessions ───────────────────────────────────
  // Merge the decoupled node with the legacy in-progress location (new wins on
  // id collision) so reps stay correct throughout the migration window.
  const cardioSessions = { ...(progress.cardio?.sessions || {}), ...(cardioSnap.val() || {}) };
  let runningDistanceM = 0;
  let cyclingDistanceM = 0;

  for (const session of Object.values(cardioSessions)) {
    if (session.type === 'running' || session.type === 'Run') {
      runningDistanceM += session.distance || 0;
    } else if (session.type === 'cycling' || session.type === 'Ride') {
      cyclingDistanceM += session.distance || 0;
    }
  }

  const runningReps = Math.floor((runningDistanceM / 1000) * 15);
  const cyclingReps = Math.floor((cyclingDistanceM / 1000) * 15);
  if (runningReps > 0) exerciseReps['running'] = runningReps;
  if (cyclingReps > 0) exerciseReps['cycling'] = cyclingReps;
  const cardioTotalReps = runningReps + cyclingReps;

  // ── isPerfectToday ─────────────────────────────────────────────────────
  // Check if lastActiveDay has all standard OR all weight exercises completed
  let isPerfectToday = false;
  if (lastActiveDay && completions[lastActiveDay]) {
    const dayData = completions[lastActiveDay];
    const isStandardPerfect = EXERCISES.length > 0 &&
      EXERCISES.every(ex => dayData[ex.id]?.isCompleted);
    const isWeightsPerfect = WEIGHT_EXERCISES.length > 0 &&
      WEIGHT_EXERCISES.every(ex => dayData[ex.id]?.isCompleted);
    isPerfectToday = isStandardPerfect || isWeightsPerfect;
  }

  // ── Badge count — computed from stats (derived badges) + the manual flags
  //    stored in the achievements node (first_share / white_hat) ────────────
  const totalRepsAll = totalClassicReps + weightsTotalReps + cardioTotalReps;
  const badgeStats = computeAchievementStats(completions, totalRepsAll);
  const badgeCount = BADGE_RULES.filter(b => isBadgeUnlocked(b.id, badgeStats, achievements)).length;

  // ── Determine pseudo and visibility ────────────────────────────────────
  const pseudo = settings.leaderboardPseudo
    || userRecord?.displayName
    || existing.pseudo
    || 'Anonyme';
  const photoURL = userRecord?.photoURL || existing.photoURL || null;
  const isPublic = settings.leaderboardEnabled !== false;

  // ── Compute shield status server-side ────────────────────────────────────
  // 🟢 Green: did they complete an exercise in the last 26 hours?
  let hasCompletedRecently = false;
  const nowMs = serverNow.getTime();
  const maxElapsedMs = 26 * 60 * 60 * 1000; // 26 hours in milliseconds

  // O(1) optimization: Only scan the last 4 days (from 2 days ago to tomorrow UTC)
  // Any legitimate completion in the last 26 hours MUST fall in this window.
  const datesToCheckForGreen = [];
  for (let i = -2; i <= 1; i++) {
    const d = new Date(nowMs + i * 24 * 60 * 60 * 1000);
    const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    datesToCheckForGreen.push(dateStr);
  }

  for (const dateStr of datesToCheckForGreen) {
    const day = completions[dateStr];
    if (!day || typeof day !== 'object') continue;
    for (const exData of Object.values(day)) {
      if (exData?.isCompleted && exData.timestamp) {
        const ts = typeof exData.timestamp === 'number' ? exData.timestamp : new Date(exData.timestamp).getTime();
        if (!isNaN(ts)) {
          const elapsed = nowMs - ts;
          if (elapsed >= 0 && elapsed <= maxElapsedMs) {
            // Only count if the completion itself is not suspicious (cheated)
            if (!isTimestampSuspicious(dateStr, ts)) {
              hasCompletedRecently = true;
            }
          }
        }
      }
    }
  }

  // Fallback to checking date strings for timezones / legacy data / cardio
  const shieldGreen = hasCompletedRecently || lastActiveDay === serverTodayUTC || lastActiveDay === serverTomorrowUTC;

  // 🟠 Orange: user modified their phone date to complete exercises
  let shieldOrange = false;
  // Preserve the flag if already set today (sticky within the day)
  if (existing.shieldDate === serverTodayUTC) {
    shieldOrange = !!existing.shieldOrange;
  }

  // Detect backdating by checking ONLY modified completions in this write
  if (!shieldOrange) {
    if (beforeProgress) {
      const beforeCompletions = beforeProgress.completions || {};
      const afterCompletions = progress.completions || {};
      
      // Check only days that exist in the new completions
      for (const [dateStr, afterDay] of Object.entries(afterCompletions)) {
        if (!afterDay || typeof afterDay !== 'object') continue;
        const beforeDay = beforeCompletions[dateStr] || {};
        
        // Fast O(1)-like optimization: check if anything in this day changed before diving deeper
        let dayChanged = false;
        const allExIds = new Set([...Object.keys(beforeDay), ...Object.keys(afterDay)]);
        for (const exId of allExIds) {
          if (beforeDay[exId]?.isCompleted !== afterDay[exId]?.isCompleted || 
              beforeDay[exId]?.timestamp !== afterDay[exId]?.timestamp) {
            dayChanged = true;
            break;
          }
        }
        if (!dayChanged) continue;

        for (const [exId, exData] of Object.entries(afterDay)) {
          const wasCompleted = beforeDay[exId]?.isCompleted;
          // If the exercise was newly completed or the timestamp changed in this write
          if (exData?.isCompleted && (!wasCompleted || beforeDay[exId]?.timestamp !== exData.timestamp)) {
            if (exData.timestamp) {
              const ts = typeof exData.timestamp === 'number' ? exData.timestamp : new Date(exData.timestamp).getTime();
              // Only check if the completion happened in this write (within the last 10 minutes)
              if (!isNaN(ts) && Math.abs(nowMs - ts) < 10 * 60 * 1000) {
                if (isTimestampSuspicious(dateStr, ts)) {
                  shieldOrange = true;
                  break;
                }
              }
            }
          }
        }
        if (shieldOrange) break;
      }
    } else {
      // Fallback if beforeProgress is null (e.g. first setup or settings change):
      // Only scan completions written in the last 10 minutes (to avoid scanning historical data)
      for (const [dateStr, day] of Object.entries(completions)) {
        if (!day || typeof day !== 'object') continue;
        for (const [, exData] of Object.entries(day)) {
          if (exData?.isCompleted && exData.timestamp) {
            const ts = typeof exData.timestamp === 'number' ? exData.timestamp : new Date(exData.timestamp).getTime();
            if (!isNaN(ts) && Math.abs(nowMs - ts) < 10 * 60 * 1000) { // within 10 minutes
              if (isTimestampSuspicious(dateStr, ts)) {
                shieldOrange = true;
                break;
              }
            }
          }
        }
        if (shieldOrange) break;
      }
    }
  }

  // Determine userLocalDate and shieldDate
  const userLocalDate = getUserLocalDate(completions, serverNow);
  const shieldDate = shieldOrange ? serverTodayUTC : userLocalDate;

  // ── Write to leaderboard ───────────────────────────────────────────────
  await db.ref(`leaderboard/${uid}`).update({
    pseudo,
    photoURL,
    totalReps: totalClassicReps + cardioTotalReps,
    weightsTotalReps,
    exerciseReps,
    exerciseDifficulties: exerciseDifficulties || {},
    exerciseWeights: settings.exerciseWeights || existing.exerciseWeights || {},
    achievements: badgeCount,
    lastActiveDay,
    difficultyMultiplier: difficultyMultiplier || 1,
    isPublic,
    isPerfectToday,
    shieldGreen,
    shieldOrange,
    shieldDate,
    isPro: !!purchase.isPro,
    isSupporter: !!purchase.isSupporter,
    lastUpdated: admin.database.ServerValue.TIMESTAMP,
  });

  // ── Write public profile (detail view payload) ──────────────────────────
  // Only published for users who are visible on the leaderboard. The derived
  // stats let UserDetail.jsx render streaks/days WITHOUT reading anyone's
  // private completions calendar.
  if (isPublic) {
    const derived = computeExerciseDerived(completions, userLocalDate);
    await db.ref(`publicProfiles/${uid}`).set({
      exerciseReps,
      exerciseWeights: settings.exerciseWeights || existing.exerciseWeights || {},
      exerciseDifficulties: exerciseDifficulties || {},
      difficultyMultiplier: difficultyMultiplier || 1,
      achievements: badgeCount,
      derivedStats: {
        currentStreak: derived.currentStreak,
        maxStreak: badgeStats.maxStreak,
        totalDays: badgeStats.totalDays,
        perfectDays: badgeStats.perfectDays,
        exerciseDays: derived.exerciseDays,
        exerciseStreaks: derived.exerciseStreaks,
        exerciseDoneToday: derived.exerciseDoneToday,
        lastActiveDay,
      },
      lastUpdated: admin.database.ServerValue.TIMESTAMP,
    });
  } else {
    // User went private — drop any stale public profile.
    await db.ref(`publicProfiles/${uid}`).remove();
  }

  console.log(`[Leaderboard] Recomputed for ${uid}: ${totalClassicReps + cardioTotalReps} reps, last=${lastActiveDay}, perfect=${isPerfectToday}`);
}

// ══════════════════════════════════════════════════════════════════════════════
// Cloud Function triggers
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Triggered when users/{uid}/progress changes (exercise completions, cardio, etc.)
 */
export const onProgressChange = onValueWritten("users/{uid}/progress", async (event) => {
  const uid = event.params.uid;
  const progress = event.data.after.val();
  const beforeProgress = event.data.before.val();
  if (!progress) {
    // Progress wiped (account deletion or admin reset) → remove the orphaned
    // leaderboard + public profile entries. Clients cannot do it (writes denied).
    if (beforeProgress) {
      try {
        await Promise.all([
          db.ref(`leaderboard/${uid}`).remove(),
          db.ref(`publicProfiles/${uid}`).remove(),
        ]);
        console.log(`[Leaderboard] Entry removed for ${uid} (progress deleted)`);
      } catch (error) {
        console.error(`[Leaderboard] Failed to remove entry for ${uid}:`, error);
      }
    }
    return;
  }

  try {
    await recomputeLeaderboardEntry(uid, progress, beforeProgress);
  } catch (error) {
    console.error(`[Leaderboard] Error recomputing for ${uid}:`, error);
  }
});

/**
 * Triggered when users/{uid}/cardioSessions changes.
 * Cardio is decoupled from `progress` (so GPS tracks stay private), therefore
 * onProgressChange no longer fires on cardio writes — this trigger keeps the
 * leaderboard/public-profile cardio reps in sync.
 */
export const onCardioChange = onValueWritten("users/{uid}/cardioSessions", async (event) => {
  const uid = event.params.uid;

  try {
    const progressSnap = await db.ref(`users/${uid}/progress`).once('value');
    const progress = progressSnap.val();
    if (!progress) return;

    await recomputeLeaderboardEntry(uid, progress);
  } catch (error) {
    console.error(`[Leaderboard] Error recomputing for ${uid} (cardio change):`, error);
  }
});

/**
 * Triggered when users/{uid}/settings changes (pseudo, difficulty, visibility, etc.)
 */
export const onSettingsChange = onValueWritten("users/{uid}/settings", async (event) => {
  const uid = event.params.uid;

  try {
    // Read progress separately since this trigger is on settings
    const progressSnap = await db.ref(`users/${uid}/progress`).once('value');
    const progress = progressSnap.val();
    if (!progress) return;

    await recomputeLeaderboardEntry(uid, progress);
  } catch (error) {
    console.error(`[Leaderboard] Error recomputing for ${uid} (settings change):`, error);
  }
});

/**
 * Triggered when users/{uid}/purchase changes (Pro/Supporter status via RevenueCat).
 * Ensures the leaderboard reflects updated entitlements immediately,
 * without waiting for the next progress or settings write.
 */
export const onPurchaseChange = onValueWritten("users/{uid}/purchase", async (event) => {
  const uid = event.params.uid;

  try {
    const progressSnap = await db.ref(`users/${uid}/progress`).once('value');
    const progress = progressSnap.val();
    if (!progress) return;

    await recomputeLeaderboardEntry(uid, progress);
  } catch (error) {
    console.error(`[Leaderboard] Error recomputing for ${uid} (purchase change):`, error);
  }
});

/**
 * Triggered when a Firebase Auth account is deleted.
 * Removes all RTDB data for the user. This is the authoritative cleanup:
 * security rules prevent clients from deleting users/{uid} as a whole
 * (the purchase node is write-protected) and from writing to leaderboard.
 */
export const onAccountDeleted = functionsV1.auth.user().onDelete(async (user) => {
  const uid = user.uid;
  try {
    await Promise.all([
      db.ref(`users/${uid}`).remove(),
      db.ref(`leaderboard/${uid}`).remove(),
      db.ref(`publicProfiles/${uid}`).remove(),
    ]);
    console.log(`[AccountCleanup] Removed all data for deleted user ${uid}`);
  } catch (error) {
    console.error(`[AccountCleanup] Failed to remove data for ${uid}:`, error);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// Profile Backfill Function (Administrative utility)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Backfills user profiles with email and name from Firebase Auth database.
 * Admin can invoke this manually once to populate missing profile nodes.
 */
export const backfillUserProfiles = onRequest(async (req, res) => {
  try {
    let nextPageToken;
    let totalUpdated = 0;
    const updates = {};
    
    do {
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
      for (const userRecord of listUsersResult.users) {
        const uid = userRecord.uid;
        const email = userRecord.email || '';
        const displayName = userRecord.displayName || '';
        const photoURL = userRecord.photoURL || '';
        
        // Fetch current profile to check if it's missing or incomplete
        const profileSnap = await db.ref(`users/${uid}/profile`).once('value');
        const currentProfile = profileSnap.val() || {};
        
        if (!currentProfile.email) {
          updates[`users/${uid}/profile/email`] = email;
          updates[`users/${uid}/profile/displayName`] = currentProfile.displayName || displayName;
          updates[`users/${uid}/profile/photoURL`] = currentProfile.photoURL || photoURL;
          updates[`users/${uid}/profile/lastSeen`] = currentProfile.lastSeen || new Date().toISOString();
          totalUpdated++;
        }
      }
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);
    
    if (Object.keys(updates).length > 0) {
      await db.ref().update(updates);
    }
    
    res.status(200).send(`Backfill terminé. ${totalUpdated} profils d'utilisateurs mis à jour.`);
  } catch (error) {
    console.error("Backfill failed:", error);
    res.status(500).send("Erreur lors du backfill : " + error.message);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// One-shot migration: publicProfiles backfill + cardio decoupling
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Migrates every user to the new data layout, idempotently:
 *   1. Moves legacy `users/{uid}/progress/cardio/sessions` → `users/{uid}/cardioSessions`
 *      then deletes the legacy `progress/cardio` node (GPS tracks leave the
 *      socially-readable progress subtree).
 *   2. Recomputes the leaderboard + backfills `publicProfiles/{uid}` via the
 *      single source of truth `recomputeLeaderboardEntry` (no logic duplication).
 *
 * Safe to run multiple times. Invoke manually once after deploying functions and
 * BEFORE tightening the `progress` read rule.
 */
export const migrateToPublicProfiles = onRequest(async (req, res) => {
  try {
    let nextPageToken;
    let processed = 0;
    let cardioMoved = 0;

    do {
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
      for (const userRecord of listUsersResult.users) {
        const uid = userRecord.uid;
        const progressSnap = await db.ref(`users/${uid}/progress`).once('value');
        const progress = progressSnap.val();
        if (!progress) continue;

        // 1. Move legacy cardio out of progress.
        const legacySessions = progress.cardio?.sessions;
        if (legacySessions && Object.keys(legacySessions).length > 0) {
          await db.ref(`users/${uid}/cardioSessions`).update(legacySessions);
          await db.ref(`users/${uid}/progress/cardio`).remove();
          cardioMoved++;
        }

        // 2. Recompute (writes leaderboard + publicProfiles, merges cardio).
        try {
          await recomputeLeaderboardEntry(uid, progress);
        } catch (err) {
          console.error(`[Migrate] recompute failed for ${uid}:`, err);
        }
        processed++;
      }
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    res.status(200).send(`Migration terminée. ${processed} utilisateurs traités, ${cardioMoved} avec cardio déplacé.`);
  } catch (error) {
    console.error("Migration failed:", error);
    res.status(500).send("Erreur lors de la migration : " + error.message);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// RevenueCat Webhook (existing)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * onRevenueCatWebhook
 * Listens for RevenueCat subscription events and updates Firebase Realtime Database.
 * Endpoint URL: https://<REGION>-<PROJECT_ID>.cloudfunctions.net/onRevenueCatWebhook
 */
export const onRevenueCatWebhook = onRequest({ secrets: ["REVENUECAT_WEBHOOK_SECRET"] }, async (req, res) => {
  // Reject non-POST requests immediately
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  // Verify RevenueCat webhook signature
  // RevenueCat signs requests with X-Signature header using shared secret
  const signature = req.headers['x-signature'] || req.headers['authorization'];
  const expectedSecret = process.env.REVENUECAT_WEBHOOK_SECRET;
  
  if (!expectedSecret) {
    console.error("CRITICAL: REVENUECAT_WEBHOOK_SECRET not configured");
    res.status(500).send("Server Configuration Error");
    return;
  }

  // Simple signature verification: compare the Authorization header
  // Format: "RevenueCat <secret>" or raw secret depending on setup
  const authValue = signature?.replace(/^RevenueCat\s+/i, '') || '';
  if (authValue !== expectedSecret) {
    console.log(`[RevenueCat Webhook] Invalid signature rejected. Expected secret present: ${!!expectedSecret}`);
    res.status(401).send("Unauthorized: Invalid signature");
    return;
  }

  try {
    const event = req.body?.event;
    if (!event) {
      res.status(400).send("Bad Request: Missing 'event' payload");
      return;
    }

    const { type, app_user_id, entitlement_ids } = event;

    // We process lifecycle events that alter boolean entitlement status
    const actionableEvents = [
      "INITIAL_PURCHASE",
      "RENEWAL",
      "UNCANCELLATION",  // User resumed before expiration
      "TRANSFER",        // Subscription moved to another UI
      "EXPIRATION",
      "CANCELLATION",    // Sandbox refunds or immediate billing error cancellations
      "NON_RENEWING_PURCHASE" // Action trigger when API 'Promotional' is used
    ];

    if (!actionableEvents.includes(type)) {
      res.status(200).send(`Event type ${type} ignored by design.`);
      return;
    }

    if (!app_user_id) {
      res.status(400).send("Missing app_user_id in RevenueCat payload");
      return;
    }

    // Determine target boolean status:
    let isActive = false;
    if (["INITIAL_PURCHASE", "RENEWAL", "UNCANCELLATION", "TRANSFER", "NON_RENEWING_PURCHASE"].includes(type)) {
      // Even for grants, ensure it hasn't technically already expired (in case of delayed webhook)
      const now = event.event_timestamp_ms || Date.now();
      isActive = !(event.expiration_at_ms && event.expiration_at_ms <= now);
    } else if (type === "CANCELLATION") {
      // For cancellations, we keep isActive = true ONLY if the expiration date is still in the future.
      const now = event.event_timestamp_ms || Date.now();
      isActive = event.expiration_at_ms && event.expiration_at_ms > now;
    } else if (type === "EXPIRATION") {
      // If it's an expiration event, the entitlement is by definition no longer active.
      isActive = false;
    }

    const updatePayload = {};

    // Map RevenueCat custom Entitlements back to OneUp database fields
    let ents = entitlement_ids;
    // Fallback based on product_id if entitlement_ids is missing (happens for some promotional/sandbox events)
    if ((!ents || ents.length === 0) && event.product_id) {
       ents = [];
       if (event.product_id.includes('pro')) ents.push('pro');
       if (event.product_id.includes('supporter')) ents.push('supporter');
    }

    if (ents && ents.length > 0) {
      ents.forEach((entId) => {
        const key = entId.toLowerCase();
        if (key === "pro") {
          updatePayload.isPro = isActive;
          if (isActive) updatePayload.hadPro = true; // Permanently remember they had Pro
        }
        if (key === "supporter") updatePayload.isSupporter = isActive;
      });
    } else {
      res.status(200).send("No entitlements specified in event");
      return;
    }

    // If no matching OneUp tiers were found within this payload
    if (Object.keys(updatePayload).length === 0) {
      res.status(200).send("No OneUp compatible tiers found");
      return;
    }

    console.log(`[RevenueCat DB Update] UID ${app_user_id} | Type: ${type} ->`, updatePayload);

    // Apply the update selectively to BOTH Firebase nodes
    const profileRef = db.ref(`users/${app_user_id}/purchase`);
    const leaderboardRef = db.ref(`leaderboard/${app_user_id}`);

    // Update private profile
    await profileRef.update(updatePayload);
    
    // For leaderboard, we only update IF the user ALREADY exists.
    // We do not want to force-create a dummy leaderboard entry for private users.
    const lbSnapshot = await leaderboardRef.once("value");
    if (lbSnapshot.exists()) {
      await leaderboardRef.update(updatePayload);
    }

    res.status(200).send("Webhook processed successfully");

  } catch (error) {
    console.error("Critical Webhook Error:", error);
    res.status(500).send("Internal Server Error");
  }
});
