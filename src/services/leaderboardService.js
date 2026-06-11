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

export async function loadUserDetails(uid) {
  let database = getDatabaseInstance();
  if (!database) { initializeFirebase(); database = getDatabaseInstance(); if (!database) return null; }

  const snapshot = await get(ref(database, `users/${uid}/progress`));
  if (!snapshot.exists()) return null;

  const data = snapshot.val();
  return {
    completions: data.completions || {},
    startDate: data.startDate || null,
    userStartDate: data.userStartDate || null,
  };
}
