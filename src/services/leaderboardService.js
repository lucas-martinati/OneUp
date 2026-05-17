import { ref, set, get, update, serverTimestamp } from 'firebase/database';
import { createLogger } from '../utils/logger';
import { getAuthInstance, getDatabaseInstance, initializeFirebase } from './firebase';
import i18n from '../i18n';

const logger = createLogger('Leaderboard');

export async function publishToLeaderboard({ pseudo, totalReps, weightsTotalReps, exerciseReps, exerciseWeights, exerciseDifficulties, achievements, isPublic = true, lastActiveDay = null, difficultyMultiplier = 1, isPerfectToday, localPublishDate = null }) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return false;

  let finalWeights = exerciseWeights;
  if (!finalWeights) {
    try { finalWeights = JSON.parse(localStorage.getItem('oneup_exercise_weights') || '{}'); } catch (e) { logger.debug('Skip parsing err', e); }
  }

  const uid = auth.currentUser.uid;
  const lbRef = ref(database, `leaderboard/${uid}`);

  const sanitizedDifficulties = Object.fromEntries(
    Object.entries(exerciseDifficulties || {}).filter(([, v]) => typeof v === 'number')
  );

  // ── Soft tampering detection (heuristic, not a security gate) ──────────
  // Compares localPublishDate (client-provided) vs lastUpdated (server timestamp)
  // to detect clock manipulation. This is bypassable by a savvy client who forges
  // localPublishDate — intentionally a soft signal, not a hard block.
  // The orange shield (hadTimeTampering) is purely cosmetic: no score penalty,
  // no leaderboard exclusion. It serves as gentle social signaling.
  // NOTE: get() + update() is non-atomic (race condition possible between reads),
  // but acceptable here since only the entry owner writes to their own leaderboard node.
  let hadTimeTampering = false;
  try {
    const currentSnapshot = await get(lbRef);
    if (currentSnapshot.exists()) {
      const current = currentSnapshot.val();
      // Preserve sticky flag — once set, never unset
      if (current.hadTimeTampering) hadTimeTampering = true;
      // Detect mismatch from previous publish
      if (!hadTimeTampering && current.localPublishDate && current.lastUpdated) {
        const serverDate = new Date(current.lastUpdated);
        const serverDateStr = `${serverDate.getFullYear()}-${String(serverDate.getMonth() + 1).padStart(2, '0')}-${String(serverDate.getDate()).padStart(2, '0')}`;
        if (current.localPublishDate !== serverDateStr) {
          hadTimeTampering = true;
        }
      }
    }
  } catch (e) {
    logger.debug('Skip tampering check:', e);
  }

  await update(lbRef, {
    pseudo: pseudo || auth.currentUser.displayName || i18n.t('common.anonymous'),
    photoURL: auth.currentUser.photoURL || null,
    totalReps: totalReps || 0,
    weightsTotalReps: weightsTotalReps || 0,
    exerciseReps: exerciseReps || {},
    exerciseWeights: finalWeights || {},
    exerciseDifficulties: sanitizedDifficulties,
    achievements: achievements || 0,
    lastActiveDay,
    difficultyMultiplier: difficultyMultiplier || 1,
    isPublic: isPublic !== false,
    isPerfectToday: !!isPerfectToday,
    localPublishDate: localPublishDate || null,
    hadTimeTampering,
    lastUpdated: serverTimestamp()
  });

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
      exerciseWeights: entry.exerciseWeights || {},
      exerciseDifficulties: entry.exerciseDifficulties || {},
      achievements: entry.achievements || 0,
      lastActiveDay: entry.lastActiveDay || null,
      difficultyMultiplier: entry.difficultyMultiplier || 1,
      lastUpdated: entry.lastUpdated || null,
      hadTimeTampering: !!entry.hadTimeTampering,
      isSupporter: !!entry.isSupporter,
      isPro: !!entry.isPro,
      isPerfectToday: !!entry.isPerfectToday
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
