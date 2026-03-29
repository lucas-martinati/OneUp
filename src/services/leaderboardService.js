import { ref, set, get, serverTimestamp } from 'firebase/database';
import { createLogger } from '../utils/logger';
import { getAuthInstance, getDatabaseInstance, initializeFirebase } from './firebase';
import i18n from '../i18n';

const logger = createLogger('Leaderboard');

export async function publishToLeaderboard({ pseudo, totalReps, weightsTotalReps, exerciseReps, achievements, isPublic = true, lastActiveDay = null, difficultyMultiplier = 1, isSupporter, isPro }) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return false;

  const uid = auth.currentUser.uid;
  const lbRef = ref(database, `leaderboard/${uid}`);
  const existing = await get(lbRef);
  const existingData = existing.exists() ? existing.val() : {};

  await set(lbRef, {
    pseudo: pseudo || auth.currentUser.displayName || i18n.t('common.anonymous'),
    photoURL: auth.currentUser.photoURL || null,
    totalReps: totalReps || 0,
    weightsTotalReps: weightsTotalReps || 0,
    exerciseReps: exerciseReps || {},
    achievements: achievements || 0,
    lastActiveDay,
    difficultyMultiplier: difficultyMultiplier || 1,
    isPublic: isPublic !== false,
    isSupporter: isSupporter !== undefined ? isSupporter : (existingData.isSupporter || false),
    isPro: isPro !== undefined ? isPro : (existingData.isPro || false),
    lastUpdated: serverTimestamp()
  });

  logger.success('Leaderboard entry published');
  return true;
}

export async function removeFromLeaderboard() {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return false;

  await set(ref(database, `leaderboard/${auth.currentUser.uid}`), null);
  logger.success('Leaderboard entry removed');
  return true;
}

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
      achievements: entry.achievements || 0,
      lastActiveDay: entry.lastActiveDay || null,
      difficultyMultiplier: entry.difficultyMultiplier || 1,
      lastUpdated: entry.lastUpdated || null,
      isSupporter: !!entry.isSupporter,
      isPro: !!entry.isPro
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
