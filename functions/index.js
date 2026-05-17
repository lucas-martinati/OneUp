const { onRequest } = require("firebase-functions/v2/https");
const { onValueWritten } = require("firebase-functions/v2/database");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK using Default Compute Service Account
admin.initializeApp();
const db = admin.database();

// ══════════════════════════════════════════════════════════════════════════════
// Exercise definitions — DUPLICATED from client-side config.
// Source of truth lives in TWO places that MUST stay in sync:
//   • Client:  src/config/exercises.js  (EXERCISES, getDailyGoal)
//   •          src/config/weights.js    (WEIGHT_EXERCISES)
//   • Server:  functions/index.js       (this file)
// Long-term: extract into a shared package (e.g. /shared/exercises.js)
// to eliminate duplication risk.
// ══════════════════════════════════════════════════════════════════════════════

const EXERCISES = [
  { id: 'pushups', multiplier: 1 },
  { id: 'squats', multiplier: 1 },
  { id: 'pullups', multiplier: 0.4 },
  { id: 'abs', multiplier: 1 },
  { id: 'jumpingjacks', multiplier: 1.5 },
  { id: 'lunges', multiplier: 1 },
  { id: 'burpees', multiplier: 0.5 },
  { id: 'planche', multiplier: 2 },
  { id: 'dips', multiplier: 1 },
  { id: 'mountain', multiplier: 2 },
];

const WEIGHT_EXERCISES = [
  { id: 'biceps_curl', multiplier: 0.5 },
  { id: 'hammer_curl', multiplier: 0.5 },
  { id: 'bench_press', multiplier: 0.5 },
  { id: 'overhead_press', multiplier: 0.4 },
  { id: 'squat_weights', multiplier: 0.5 },
  { id: 'deadlift', multiplier: 0.4 },
  { id: 'barbell_row', multiplier: 0.5 },
];

const CARDIO_EXERCISES = [
  { id: 'running' },
  { id: 'cycling' },
];

const ALL_STANDARD_IDS = new Set(EXERCISES.map(e => e.id));
const ALL_WEIGHT_IDS = new Set(WEIGHT_EXERCISES.map(e => e.id));
const ALL_EXERCISE_IDS = new Set([
  ...EXERCISES.map(e => e.id),
  ...WEIGHT_EXERCISES.map(e => e.id),
  ...CARDIO_EXERCISES.map(e => e.id),
]);

// ══════════════════════════════════════════════════════════════════════════════
// Helper functions
// ══════════════════════════════════════════════════════════════════════════════

function getDailyGoal(exercise, dayNumber, userMultiplier = 1.0) {
  const mult = exercise.multiplier !== undefined ? exercise.multiplier : 1;
  return Math.max(1, Math.ceil(dayNumber * mult * userMultiplier));
}

function getDayNumber(startDate, dateStr) {
  const start = new Date(startDate);
  const current = new Date(dateStr);
  const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const utcCurrent = Date.UTC(current.getFullYear(), current.getMonth(), current.getDate());
  return Math.floor((utcCurrent - utcStart) / (1000 * 60 * 60 * 24)) + 1;
}

// ══════════════════════════════════════════════════════════════════════════════
// Core: recompute leaderboard entry from source of truth
// ══════════════════════════════════════════════════════════════════════════════

async function recomputeLeaderboardEntry(uid, progress) {
  if (!progress) return;

  // ── Read auxiliary data in parallel ─────────────────────────────────────
  const [settingsSnap, purchaseSnap, existingSnap, achievementsSnap] = await Promise.all([
    db.ref(`users/${uid}/settings`).once('value'),
    db.ref(`users/${uid}/purchase`).once('value'),
    db.ref(`leaderboard/${uid}`).once('value'),
    db.ref(`users/${uid}/achievements`).once('value'),
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
      lastActiveDay = dateStr; // sortedDates is chronological, so last wins
    }
  }

  // ── Cardio reps from Strava sessions ───────────────────────────────────
  const cardioSessions = progress.cardio?.sessions || {};
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

  // ── Badge count from achievements node ─────────────────────────────────
  const badgeCount = Object.values(achievements).filter(v => v === true).length;

  // ── Determine pseudo and visibility ────────────────────────────────────
  const pseudo = settings.leaderboardPseudo
    || userRecord?.displayName
    || existing.pseudo
    || 'Anonyme';
  const photoURL = userRecord?.photoURL || existing.photoURL || null;
  const isPublic = settings.leaderboardEnabled !== false;

  // ── Compute shield status server-side ────────────────────────────────────
  // Green: lastActiveDay matches server "today" (UTC, +1 day tolerance for UTC+ timezones)
  // Orange: lastActiveDay is clearly in the past (user backdated)
  // This is immune to client clock manipulation.
  const serverNow = new Date();
  const serverTodayUTC = `${serverNow.getUTCFullYear()}-${String(serverNow.getUTCMonth() + 1).padStart(2, '0')}-${String(serverNow.getUTCDate()).padStart(2, '0')}`;
  const tomorrow = new Date(serverNow.getTime() + 24 * 60 * 60 * 1000);
  const serverTomorrowUTC = `${tomorrow.getUTCFullYear()}-${String(tomorrow.getUTCMonth() + 1).padStart(2, '0')}-${String(tomorrow.getUTCDate()).padStart(2, '0')}`;

  let shieldStatus = 'none';
  if (lastActiveDay === serverTodayUTC || lastActiveDay === serverTomorrowUTC) {
    shieldStatus = 'green'; // Today (or ahead due to positive UTC offset)
  } else if (lastActiveDay) {
    shieldStatus = 'orange'; // Past day — user backdated
  }

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
    shieldStatus,
    shieldDate: serverTodayUTC,
    isPro: !!purchase.isPro,
    isSupporter: !!purchase.isSupporter,
    lastUpdated: admin.database.ServerValue.TIMESTAMP,
  });

  console.log(`[Leaderboard] Recomputed for ${uid}: ${totalClassicReps + cardioTotalReps} reps, last=${lastActiveDay}, perfect=${isPerfectToday}`);
}

// ══════════════════════════════════════════════════════════════════════════════
// Cloud Function triggers
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Triggered when users/{uid}/progress changes (exercise completions, cardio, etc.)
 */
exports.onProgressChange = onValueWritten("users/{uid}/progress", async (event) => {
  const uid = event.params.uid;
  const progress = event.data.after.val();
  if (!progress) return; // Progress was deleted

  try {
    await recomputeLeaderboardEntry(uid, progress);
  } catch (error) {
    console.error(`[Leaderboard] Error recomputing for ${uid}:`, error);
  }
});

/**
 * Triggered when users/{uid}/settings changes (pseudo, difficulty, visibility, etc.)
 */
exports.onSettingsChange = onValueWritten("users/{uid}/settings", async (event) => {
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
exports.onPurchaseChange = onValueWritten("users/{uid}/purchase", async (event) => {
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

// ══════════════════════════════════════════════════════════════════════════════
// RevenueCat Webhook (existing)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * onRevenueCatWebhook
 * Listens for RevenueCat subscription events and updates Firebase Realtime Database.
 * Endpoint URL: https://<REGION>-<PROJECT_ID>.cloudfunctions.net/onRevenueCatWebhook
 */
exports.onRevenueCatWebhook = onRequest({ secrets: ["REVENUECAT_WEBHOOK_SECRET"] }, async (req, res) => {
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
