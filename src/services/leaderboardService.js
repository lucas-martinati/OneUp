import { ref, get } from 'firebase/database';
import { getDatabaseInstance, initializeFirebase } from './firebase';
import i18n from '../i18n';

// NOTE: publishToLeaderboard has been removed.
// Leaderboard entries are now computed server-side by the Cloud Function
// `onProgressChange` / `onSettingsChange` in functions/index.js.
// Cleanup on account deletion is handled by `onAccountDeleted`.
// The client only reads from the leaderboard node.

export async function loadLeaderboard() {
  let database = getDatabaseInstance();
  if (!database) { initializeFirebase(); database = getDatabaseInstance(); if (!database) return []; }

  const snapshot = await get(ref(database, 'leaderboard'));
  if (!snapshot.exists()) return [];

  const data = snapshot.val();
  const entries = Object.entries(data)
    .filter(([, entry]) => entry.isPublic !== false)
    .map(([uid, entry]) => ({
      uid,
      pseudo: entry.pseudo || i18n.t('common.anonymous'),
      photoURL: entry.photoURL || null,
      totalReps: entry.totalReps || 0,
      weightsTotalReps: entry.weightsTotalReps || 0,
      exerciseReps: entry.exerciseReps || {},
      exerciseWeights: entry.exerciseWeights || {},
      exerciseDifficulties: entry.exerciseDifficulties || {},
      achievements: entry.achievements || 0,
      lastActiveDay: entry.lastActiveDay || null,
      difficultyMultiplier: entry.difficultyMultiplier || 1,
      lastUpdated: entry.lastUpdated || null,
      isSupporter: !!entry.isSupporter,
      isPro: !!entry.isPro,
      isPerfectToday: !!entry.isPerfectToday,
      shieldGreen: !!entry.shieldGreen,
      shieldOrange: !!entry.shieldOrange,
      shieldDate: entry.shieldDate || null
    }));

  entries.sort((a, b) => b.totalReps - a.totalReps);
  return entries;
}

// Loads the data needed to render another user's detail card.
//
// Preferred source: `publicProfiles/{uid}` — a small, public, function-computed
// node that exposes DERIVED stats (streaks, per-exercise days…) WITHOUT the
// user's private completions calendar or GPS tracks. When it exists, the caller
// reads `details.derivedStats` directly and never touches private data.
//
// Fallback: legacy read of `users/{uid}/progress` (still permitted by rules
// during the migration window) for users whose public profile hasn't been
// backfilled yet. Returns `completions` so the caller can compute stats itself.
export async function loadUserDetails(uid) {
  let database = getDatabaseInstance();
  if (!database) { initializeFirebase(); database = getDatabaseInstance(); if (!database) return null; }

  const publicSnap = await get(ref(database, `publicProfiles/${uid}`));
  if (publicSnap.exists()) {
    const data = publicSnap.val();
    return {
      derivedStats: data.derivedStats || null,
      exerciseReps: data.exerciseReps || {},
      exerciseWeights: data.exerciseWeights || {},
      exerciseDifficulties: data.exerciseDifficulties || {},
    };
  }

  // Legacy fallback (pre-migration users).
  const snapshot = await get(ref(database, `users/${uid}/progress`));
  if (!snapshot.exists()) return null;

  const data = snapshot.val();
  return {
    completions: data.completions || {},
    startDate: data.startDate || null,
    userStartDate: data.userStartDate || null,
  };
}
