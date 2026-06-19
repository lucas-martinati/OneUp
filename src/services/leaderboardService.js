import { ref, get } from 'firebase/database';
import { getDatabaseInstance, initializeFirebase } from './firebase';
import { paths } from '../../functions/shared/dbSchema.js';
import i18n from '../i18n';

// NOTE: publishToLeaderboard has been removed.
// Leaderboard entries are now computed server-side by the Cloud Function
// `onProgressChange` / `onSettingsChange` in functions/index.js.
// Cleanup on account deletion is handled by `onAccountDeleted`.
// The client only reads from the leaderboard node.

export async function loadLeaderboard() {
  let database = getDatabaseInstance();
  if (!database) { initializeFirebase(); database = getDatabaseInstance(); if (!database) return []; }

  const snapshot = await get(ref(database, paths.leaderboard()));
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
      lastActiveDay: entry.lastActiveDay || null,
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

// Loads the data needed to render another user's detail card from the small,
// public, function-computed `publicProfiles/{uid}` node: DERIVED stats (streaks,
// per-exercise days…) plus the detail-only weights/difficulties maps — WITHOUT
// ever touching the user's private completions calendar or GPS tracks.
//
// exerciseReps is NOT here: the caller already has it from the leaderboard
// `entry` it holds (the list needs it for per-exercise ranking).
export async function loadUserDetails(uid) {
  let database = getDatabaseInstance();
  if (!database) { initializeFirebase(); database = getDatabaseInstance(); if (!database) return null; }

  const publicSnap = await get(ref(database, paths.publicProfile(uid)));
  if (!publicSnap.exists()) return null;

  const data = publicSnap.val();
  return {
    derivedStats: data.derivedStats || null,
    exerciseWeights: data.exerciseWeights || {},
    exerciseDifficulties: data.exerciseDifficulties || {},
    achievements: data.achievements || 0,
  };
}
