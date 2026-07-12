import { onRequest } from "firebase-functions/v2/https";
import { onValueWritten } from "firebase-functions/v2/database";
import { onSchedule } from "firebase-functions/v2/scheduler";
import functionsV1 from "firebase-functions/v1";
import admin from "firebase-admin";
import crypto from "crypto";
import { BADGE_RULES, isBadgeUnlocked } from "./shared/badgeRules.js";
import { DB_SCHEMA, LEAF, paths } from "./shared/dbSchema.js";
import { walkStreak, normalizeFrozenDays, reconcileStreakFreezeState } from "./shared/streakFreeze.js";
import { computeAchievementStats } from "./shared/achievementStats.js";

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
  getWeeklyGoalKm,
  CARDIO_REPS_PER_KM,
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
// Public profile — derived per-exercise stats published to `publicProfiles/{uid}`
// so the social detail view (UserDetail.jsx) never needs to read another user's
// PRIVATE `users/{uid}/progress` (which holds the full completions calendar AND,
// historically, GPS tracks). Mirrors computeStats() in src/components/social/UserDetail.jsx.
// Streaks are anchored on the user's local date (best server-side approximation).
// ══════════════════════════════════════════════════════════════════════════════

const MAX_STREAK_WINDOW = 365;

// All known exercise ids (standard + weights + cardio), as a flat list.
const ALL_EX_OBJECTS = [...EXERCISES, ...WEIGHT_EXERCISES, ...CARDIO_EXERCISES];

function computeExerciseDerived(completions, anchorDateStr, frozenDays = {}, startDate = null) {
  const pad = n => String(n).padStart(2, '0');
  const dayStr = d => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  const dayIsDone = day => !!day && typeof day === 'object' &&
    Object.entries(day).some(([id, e]) => e?.isCompleted && ALL_EXERCISE_IDS.has(id));

  // Per-exercise total days completed. Dates before the challenge start are
  // excluded — e.g. cardio weeks retroactively marked "completed" from
  // historical Health Connect/Strava imports that predate the user's own
  // challenge (see the reps loop in recomputeLeaderboardEntry for the same rule).
  const exerciseDays = {};
  for (const ex of ALL_EX_OBJECTS) exerciseDays[ex.id] = 0;
  for (const [dateStr, day] of Object.entries(completions)) {
    if (!day || typeof day !== 'object') continue;
    if (startDate && dateStr < startDate) continue;
    for (const ex of ALL_EX_OBJECTS) {
      if (day[ex.id]?.isCompleted) exerciseDays[ex.id]++;
    }
  }

  // Streaks counting backwards from the user's local "today".
  const [ay, am, ad] = anchorDateStr.split('-').map(Number);
  const anchorMs = Date.UTC(ay, am - 1, ad);

  // Frozen days are transparent in the global streak walk (see @shared/streakFreeze).
  const currentStreak = walkStreak(
    (offset) => dayStr(new Date(anchorMs - offset * 86400000)),
    (ds) => (!startDate || ds >= startDate) && dayIsDone(completions[ds]),
    (ds) => !!frozenDays[ds],
    MAX_STREAK_WINDOW
  );

  const exerciseStreaks = {};
  const exerciseDoneToday = {};
  for (const ex of ALL_EX_OBJECTS) {
    let streak = 0;
    for (let i = 0; i < MAX_STREAK_WINDOW; i++) {
      const ds = dayStr(new Date(anchorMs - i * 86400000));
      if (startDate && ds < startDate) break;
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
  // Exercise weights live in `users/{uid}/exerciseWeights` (NOT in settings).
  // Cardio reps are goal-based (see the completions loop below) so raw
  // `users/{uid}/cardioSessions` distance never needs to be read here.
  const [settingsSnap, purchaseSnap, existingSnap, achievementsSnap, weightsSnap] = await Promise.all([
    db.ref(paths.userSettings(uid)).once('value'),
    db.ref(paths.userPurchase(uid)).once('value'),
    db.ref(paths.leaderboardEntry(uid)).once('value'),
    db.ref(paths.userAchievements(uid)).once('value'),
    db.ref(paths.userExerciseWeights(uid)).once('value'),
  ]);

  const settings = settingsSnap.val() || {};
  const purchase = purchaseSnap.val() || {};
  const existing = existingSnap.val() || {};
  const achievements = achievementsSnap.val() || {};
  const exerciseWeights = weightsSnap.val() || {};

  // ── Get user auth info (displayName, photoURL) ─────────────────────────
  let userRecord = null;
  try {
    userRecord = await admin.auth().getUser(uid);
  } catch {
    // User may have been deleted — silently ignore
  }

  // ── Extract data ───────────────────────────────────────────────────────
  const completions = progress.completions || {};
  const rawFrozenDays = normalizeFrozenDays(progress.frozenDays);

  // ── Server-side frozenDays validation ──────────────────────────────────
  // A frozen day must be a MISSED day — if the user completed it, the
  // freeze entry is bogus (possibly injected). Cap at MAX_STREAK_WINDOW: the
  // streak walk never looks further back than that, so keeping the most recent
  // window's worth of entries can't truncate a day that affects the streak,
  // while still bounding the abuse surface. The client prunes older entries too.
  const MAX_FROZEN_DAYS = MAX_STREAK_WINDOW;
  const dayIsDoneForValidation = (day) => !!day && typeof day === 'object' &&
    Object.entries(day).some(([id, e]) => e?.isCompleted && ALL_EXERCISE_IDS.has(id));
  const validatedEntries = Object.keys(rawFrozenDays)
    .filter(ds => !dayIsDoneForValidation(completions[ds]))
    .sort()
    .slice(-MAX_FROZEN_DAYS);
  const frozenDays = {};
  for (const ds of validatedEntries) frozenDays[ds] = true;

  const startDate = progress.startDate;
  if (!startDate) return; // No start date means no challenge started

  const exerciseDifficulties = settings.exerciseDifficulties || {};

  // ── Compute server dates ───────────────────────────────────────────────
  const serverNow = new Date();
  const serverTodayUTC = `${serverNow.getUTCFullYear()}-${String(serverNow.getUTCMonth() + 1).padStart(2, '0')}-${String(serverNow.getUTCDate()).padStart(2, '0')}`;
  const tomorrow = new Date(serverNow.getTime() + 24 * 60 * 60 * 1000);
  const serverTomorrowUTC = `${tomorrow.getUTCFullYear()}-${String(tomorrow.getUTCMonth() + 1).padStart(2, '0')}-${String(tomorrow.getUTCDate()).padStart(2, '0')}`;

  // ── Compute per-exercise reps ──────────────────────────────────────────
  const exerciseReps = {};
  let totalClassicReps = 0;
  let weightsTotalReps = 0;
  let runningReps = 0;
  let cyclingReps = 0;
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

      if (exId === 'running' || exId === 'cycling') {
        // Cardio is validated per WEEK (not per day — see useCardio.js), and
        // only the week's goal distance counts, never the actual distance
        // logged: same "goal, not overage" rule as getDailyGoal for every
        // other exercise. A validated week where the user ran 40km still only
        // counts that week's (small, linearly-growing) goal in km.
        const weekNum = Math.floor((dayNum - 1) / 7) + 1;
        const difficulty = exData.difficulty ?? 1;
        const goalKm = getWeeklyGoalKm(exId, weekNum) * difficulty;
        const reps = Math.floor(goalKm * CARDIO_REPS_PER_KM[exId]);
        exerciseReps[exId] = (exerciseReps[exId] || 0) + reps;
        if (exId === 'running') runningReps += reps; else cyclingReps += reps;
        continue;
      }

      const exercise = EXERCISES.find(e => e.id === exId) || WEIGHT_EXERCISES.find(e => e.id === exId);
      if (!exercise) continue;

      const diff = exerciseDifficulties[exId] ?? 1.0;
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
  const badgeStats = computeAchievementStats(completions, totalRepsAll, frozenDays);
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
  await db.ref(paths.leaderboardEntry(uid)).update({
    pseudo,
    photoURL,
    totalReps: totalClassicReps + cardioTotalReps,
    weightsTotalReps,
    exerciseReps,
    lastActiveDay,
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
    const derived = computeExerciseDerived(completions, userLocalDate, frozenDays, startDate);
    await db.ref(paths.publicProfile(uid)).set({
      // Detail-view-only payload. exerciseReps lives in the leaderboard entry
      // (needed for the list's per-exercise ranking); everything below is only
      // read when opening a user's detail card.
      exerciseWeights,
      exerciseDifficulties: exerciseDifficulties || {},
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
    await db.ref(paths.publicProfile(uid)).remove();
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
          db.ref(paths.leaderboardEntry(uid)).remove(),
          db.ref(paths.publicProfile(uid)).remove(),
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
    const progressSnap = await db.ref(paths.userProgress(uid)).once('value');
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
    const progressSnap = await db.ref(paths.userProgress(uid)).once('value');
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
    const progressSnap = await db.ref(paths.userProgress(uid)).once('value');
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
      db.ref(paths.user(uid)).remove(),
      db.ref(paths.leaderboardEntry(uid)).remove(),
      db.ref(paths.publicProfile(uid)).remove(),
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
export const backfillUserProfiles = onRequest({ secrets: ["ADMIN_API_KEY"] }, async (req, res) => {
  if (!checkAdminAuth(req, res, process.env.ADMIN_API_KEY)) return;
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
        const profileSnap = await db.ref(paths.userProfile(uid)).once('value');
        const currentProfile = profileSnap.val() || {};

        if (!currentProfile.email) {
          updates[`${paths.userProfile(uid)}/email`] = email;
          updates[`${paths.userProfile(uid)}/displayName`] = currentProfile.displayName || displayName;
          updates[`${paths.userProfile(uid)}/photoURL`] = currentProfile.photoURL || photoURL;
          updates[`${paths.userProfile(uid)}/lastSeen`] = currentProfile.lastSeen || new Date().toISOString();
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
// Stale-data tooling — driven by functions/shared/dbSchema.js
//
// `auditStaleData` and `pruneStaleData` are COMMENTED OUT by default to prevent
// DoS attacks and Firebase billing abuse (they perform full database reads).
// Uncomment them (+ deploy) ONLY when you need to run an audit or prune,
// run them via curl, then re-comment and redeploy.
//
// Both share the helpers below. Output is colored for the terminal (curl renders
// the ANSI escapes).
// ══════════════════════════════════════════════════════════════════════════════

// Walks a DB subtree against its schema and collects the paths of every key that
// is NOT declared in the schema (stale data). Only descends into FIXED-object
// schema levels; LEAF (and wildcard→LEAF) subtrees are left untouched.
function collectStalePaths(node, schema, path, out) {
  if (schema === LEAF) return;                       // free-form: stop
  if (!node || typeof node !== 'object') return;

  if (schema.$ !== undefined) {                      // wildcard map
    for (const [key, child] of Object.entries(node)) {
      collectStalePaths(child, schema.$, `${path}/${key}`, out);
    }
    return;
  }

  for (const [key, child] of Object.entries(node)) { // fixed object
    const childPath = `${path}/${key}`;
    if (!(key in schema)) {
      out.push(childPath);                           // stale → whole key removed
    } else {
      collectStalePaths(child, schema[key], childPath, out);
    }
  }
}

// Helper to timing-safely verify admin API key auth
function checkAdminAuth(req, res, expectedSecret) {
  if (!expectedSecret) {
    console.error("CRITICAL: ADMIN_API_KEY not configured");
    res.status(500).send("Server Configuration Error");
    return false;
  }
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).send("Unauthorized: Missing or invalid Authorization header");
    return false;
  }
  const token = authHeader.substring(7);
  const expectedBuffer = Buffer.from(expectedSecret);
  const tokenBuffer = Buffer.from(token);
  if (tokenBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(tokenBuffer, expectedBuffer)) {
    res.status(401).send("Unauthorized: Invalid API Key");
    return false;
  }
  return true;
}

// Reads the whole DB once and returns the sorted list of stale paths + a
// per-key tally. Fine for small/medium databases.
async function scanStaleData() {
  const snap = await db.ref('/').once('value');
  const root = snap.val() || {};
  const stalePaths = [];
  collectStalePaths(root, DB_SCHEMA, '', stalePaths);
  stalePaths.sort();
  const byKey = {};
  for (const p of stalePaths) {
    const name = p.split('/').pop();
    byKey[name] = (byKey[name] || 0) + 1;
  }
  return { stalePaths, byKey };
}

// Builds a colored, line-by-line report for the terminal (ANSI escapes).
// `deleted`: true when the paths were actually removed (pruneStaleData),
// false for the read-only audit.
function formatStaleReport(deleted, stalePaths, byKey) {
  const R = '\x1b[0m', B = '\x1b[1m';
  const RED = '\x1b[31m', GREEN = '\x1b[32m', YELLOW = '\x1b[33m', CYAN = '\x1b[36m', GRAY = '\x1b[90m';
  const L = [];
  L.push('');
  L.push(`${B}${CYAN}══════════ ${deleted ? 'pruneStaleData' : 'auditStaleData (lecture seule)'} ══════════${R}`);
  L.push(`${B}Total :${R} ${RED}${stalePaths.length}${R} chemin(s)`);
  L.push('');
  L.push(`${B}Par clé :${R}`);
  for (const [k, c] of Object.entries(byKey).sort((a, b) => b[1] - a[1])) {
    L.push(`  ${YELLOW}${k.padEnd(22)}${R}${GRAY}×${R} ${c}`);
  }
  L.push('');
  L.push(`${B}Chemins :${R}`);
  for (const p of stalePaths) {
    const i = p.lastIndexOf('/');
    L.push(`  ${GRAY}${p.slice(0, i + 1)}${R}${RED}${p.slice(i + 1)}${R}`);
  }
  L.push('');
  L.push(deleted
    ? `${GREEN}✓ ${stalePaths.length} chemin(s) supprimé(s).${R}`
    : `${YELLOW}Lecture seule — rien supprimé. Pour supprimer : décommenter ${B}pruneStaleData${R}${YELLOW}.${R}`);
  L.push('');
  return L.join('\n');
}

// ══════════════════════════════════════════════════════════════════════
// UTILITAIRES D'AUDIT ET PURGE (DÉCOMMENTÉS ET SÉCURISÉS)
// ══════════════════════════════════════════════════════════════════════

// READ-ONLY audit: reports stale data, never deletes.
export const auditStaleData = onRequest({ secrets: ["ADMIN_API_KEY"] }, async (req, res) => {
  if (!checkAdminAuth(req, res, process.env.ADMIN_API_KEY)) return;
  try {
    const { stalePaths, byKey } = await scanStaleData();
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.status(200).send(formatStaleReport(false, stalePaths, byKey));
  } catch (error) {
    console.error("Audit failed:", error);
    res.status(500).send("Erreur lors de l'audit : " + error.message);
  }
});

// DESTRUCTIF — supprime les données obsolètes.
export const pruneStaleData = onRequest({ secrets: ["ADMIN_API_KEY"] }, async (req, res) => {
  if (!checkAdminAuth(req, res, process.env.ADMIN_API_KEY)) return;
  try {
    const { stalePaths } = await scanStaleData();
    if (stalePaths.length > 0) {
      const updates = {};
      for (const p of stalePaths) updates[p.replace(/^\//, '')] = null;
      await db.ref().update(updates);
    }
    const byKey = {};
    for (const p of stalePaths) {
      const name = p.split('/').pop();
      byKey[name] = (byKey[name] || 0) + 1;
    }
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.status(200).send(formatStaleReport(true, stalePaths, byKey));
  } catch (error) {
    console.error("Prune failed:", error);
    res.status(500).send("Erreur lors de la purge : " + error.message);
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
  const authBuffer = Buffer.from(authValue);
  const secretBuffer = Buffer.from(expectedSecret);
  
  if (authBuffer.length !== secretBuffer.length || !crypto.timingSafeEqual(authBuffer, secretBuffer)) {
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
    const profileRef = db.ref(paths.userPurchase(app_user_id));
    const leaderboardRef = db.ref(paths.leaderboardEntry(app_user_id));

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

// ══════════════════════════════════════════════════════════════════════════════
// Strava OAuth Token Proxy
// ══════════════════════════════════════════════════════════════════════════════
//
// The client sends ONLY the authorization code (or refresh_token). The secret
// never leaves the server. Both functions read STRAVA_CLIENT_ID and
// STRAVA_CLIENT_SECRET from Firebase Cloud Secret Manager (set via
// `firebase functions:secrets:set STRAVA_CLIENT_SECRET`).
// ══════════════════════════════════════════════════════════════════════════════

const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";

// Public web origin allowed to call the OAuth proxies. Read from the APP_URL
// env var (set via the functions .env / deploy environment) so the domain is
// not hardcoded; falls back to the production URL so CORS stays valid even if
// the var is missing at deploy time.
const APP_URL = process.env.APP_URL || "https://oneupme.me";

// Allowed origins for the OAuth token proxies. The Capacitor Android webview
// serves the app from https://localhost, so we must allow BOTH http (web dev)
// and https (native) localhost. iOS/older Capacitor uses the capacitor:// scheme.
const OAUTH_PROXY_CORS = [
  APP_URL,
  /^https?:\/\/localhost(:\d+)?$/,
  "capacitor://localhost",
];

const STRAVA_SECRETS_CONFIG = {
  secrets: ["STRAVA_CLIENT_ID", "STRAVA_CLIENT_SECRET"],
  cors: OAUTH_PROXY_CORS,
};

/**
 * stravaExchangeToken
 * Exchanges an OAuth authorization code for tokens.
 * Client sends: { code: string }
 * Returns:      The full Strava token response (access_token, refresh_token, expires_at, athlete, …)
 */
export const stravaExchangeToken = onRequest(STRAVA_SECRETS_CONFIG, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const { code } = req.body || {};
  if (!code || typeof code !== "string") {
    res.status(400).json({ error: "Missing or invalid 'code' parameter" });
    return;
  }

  try {
    const response = await fetch(STRAVA_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[Strava] Token exchange failed:", data);
      res.status(response.status).json(data);
      return;
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("[Strava] Token exchange error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * stravaRefreshToken
 * Refreshes an expired access token.
 * Client sends: { refresh_token: string }
 * Returns:      The refreshed Strava token response (access_token, refresh_token, expires_at, …)
 */
export const stravaRefreshToken = onRequest(STRAVA_SECRETS_CONFIG, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const { refresh_token } = req.body || {};
  if (!refresh_token || typeof refresh_token !== "string") {
    res.status(400).json({ error: "Missing or invalid 'refresh_token' parameter" });
    return;
  }

  try {
    const response = await fetch(STRAVA_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        refresh_token,
        grant_type: "refresh_token",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[Strava] Token refresh failed:", data);
      res.status(response.status).json(data);
      return;
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("[Strava] Token refresh error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// Google Health API OAuth Token Proxy (web cardio source)
// ══════════════════════════════════════════════════════════════════════════════
//
// The web app reads recorded exercises from the Google Health API. Auth is
// standard Google OAuth 2.0: the browser gets an authorization code, and these
// functions exchange/refresh it against Google's token endpoint with the client
// secret (kept in Cloud Secret Manager via
// `firebase functions:secrets:set GOOGLE_HEALTH_CLIENT_SECRET`).
// ══════════════════════════════════════════════════════════════════════════════

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

const GOOGLE_HEALTH_SECRETS_CONFIG = {
  secrets: ["GOOGLE_HEALTH_CLIENT_ID", "GOOGLE_HEALTH_CLIENT_SECRET"],
  cors: OAUTH_PROXY_CORS,
};

/** POST a form-encoded body to Google's token endpoint and relay the result. */
async function googleTokenRequest(res, extraParams, context) {
  try {
    const body = new URLSearchParams({
      client_id: process.env.GOOGLE_HEALTH_CLIENT_ID,
      client_secret: process.env.GOOGLE_HEALTH_CLIENT_SECRET,
      ...extraParams,
    });

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[GoogleHealth] ${context} failed:`, data);
      res.status(response.status).json(data);
      return;
    }

    res.status(200).json(data);
  } catch (error) {
    console.error(`[GoogleHealth] ${context} error:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * googleHealthExchangeToken
 * Exchanges an OAuth authorization code for tokens.
 * Client sends: { code: string, redirect_uri: string }
 */
export const googleHealthExchangeToken = onRequest(GOOGLE_HEALTH_SECRETS_CONFIG, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const { code, redirect_uri: redirectUri } = req.body || {};
  if (!code || typeof code !== "string") {
    res.status(400).json({ error: "Missing or invalid 'code' parameter" });
    return;
  }
  if (!redirectUri || typeof redirectUri !== "string") {
    res.status(400).json({ error: "Missing or invalid 'redirect_uri' parameter" });
    return;
  }

  await googleTokenRequest(res, {
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  }, "Token exchange");
});

/**
 * googleHealthRefreshToken
 * Refreshes an expired access token.
 * Client sends: { refresh_token: string }
 */
export const googleHealthRefreshToken = onRequest(GOOGLE_HEALTH_SECRETS_CONFIG, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const { refresh_token: refreshToken } = req.body || {};
  if (!refreshToken || typeof refreshToken !== "string") {
    res.status(400).json({ error: "Missing or invalid 'refresh_token' parameter" });
    return;
  }

  await googleTokenRequest(res, {
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  }, "Token refresh");
});

// ══════════════════════════════════════════════════════════════════════════════
// Scheduled Jobs
// ══════════════════════════════════════════════════════════════════════════════

export const autoReconcileStreakFreezes = onSchedule("every hour", async (event) => {
  const usersSnap = await db.ref(paths.users()).once('value');
  const users = usersSnap.val() || {};

  const serverNow = new Date();
  const pad = n => String(n).padStart(2, '0');

  const updates = {};
  let usersProcessed = 0;

  for (const [uid, user] of Object.entries(users)) {
    try {
      const progress = user.progress;
      if (!progress || !progress.isSetup) continue;

      const userTimezone = user.settings?.timezone || 'UTC';
      let userTodayStr;
      try {
        userTodayStr = new Intl.DateTimeFormat('en-CA', { timeZone: userTimezone }).format(serverNow);
      } catch (e) {
        userTodayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC' }).format(serverNow);
      }

      const isPro = !!user.purchase?.isPro;
      const isSupporter = !!user.purchase?.isSupporter;

      const getWeekBounds = (date) => {
        const d = new Date(date);
        const day = d.getUTCDay();
        const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
        const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff));
        return start;
      };

      const isDayDone = (dateStr) => {
        const dayData = progress.completions?.[dateStr];
        if (dayData && typeof dayData === 'object' && Object.values(dayData).some(e => e?.isCompleted)) {
          return true;
        }
        
        const [y, m, d] = dateStr.split('-').map(Number);
        const current = new Date(Date.UTC(y, m - 1, d));
        const monday = getWeekBounds(current);
        
        let loop = new Date(monday);
        while (loop <= current) {
          const dStr = `${loop.getUTCFullYear()}-${pad(loop.getUTCMonth() + 1)}-${pad(loop.getUTCDate())}`;
          const dData = progress.completions?.[dStr];
          if (dData && (dData.running?.isCompleted || dData.cycling?.isCompleted)) {
            return true;
          }
          loop.setUTCDate(loop.getUTCDate() + 1);
        }
        return false;
      };

      const result = reconcileStreakFreezeState({
        completions: progress.completions || {},
        frozenDays: progress.frozenDays || {},
        streakFreezes: progress.streakFreezes || {},
        startDate: progress.startDate,
        isPro: isPro || isSupporter,
        todayStr: userTodayStr,
        isDayDone
      });

      if (result.changed) {
        updates[`${paths.userProgress(uid)}/frozenDays`] = result.frozenDays;
        updates[`${paths.userProgress(uid)}/streakFreezes`] = result.streakFreezes;
        usersProcessed++;
      }
    } catch (err) {
      console.error(`[autoReconcileStreakFreezes] Failed to process user ${uid}:`, err);
    }
  }

  if (Object.keys(updates).length > 0) {
    await db.ref().update(updates);
    console.log(`[autoReconcileStreakFreezes] Successfully reconciled freezes for ${usersProcessed} users.`);
  } else {
    console.log(`[autoReconcileStreakFreezes] No users needed streak freeze reconciliation.`);
  }
});
