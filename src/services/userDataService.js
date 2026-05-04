import { ref, set, get, onValue } from 'firebase/database';
import { createLogger } from '../utils/logger';
import { getAuthInstance, getDatabaseInstance } from './firebase';

const logger = createLogger('UserData');

// ── Settings ────────────────────────────────────────────────────────────

export async function saveSettingsToCloud(settings) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return false;

  await set(ref(database, `users/${auth.currentUser.uid}/settings`), settings);
  logger.success('Settings synced to cloud');
  return true;
}

export async function loadSettingsFromCloud() {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return null;

  const snapshot = await get(ref(database, `users/${auth.currentUser.uid}/settings`));
  if (snapshot.exists()) { logger.success('Settings loaded from cloud'); return snapshot.val(); }
  return null;
}

// ── Purchase ────────────────────────────────────────────────────────────

export async function savePurchase({ isSupporter, isPro, hadPro }) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return false;

  const payload = { isSupporter: !!isSupporter, isPro: !!isPro };
  if (hadPro !== undefined) payload.hadPro = !!hadPro;

  await set(ref(database, `users/${auth.currentUser.uid}/purchase`), payload);
  return true;
}

export async function loadPurchase() {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return null;

  const snapshot = await get(ref(database, `users/${auth.currentUser.uid}/purchase`));
  if (snapshot.exists()) return snapshot.val();
  return null;
}

// ── Routines ────────────────────────────────────────────────────────────

export async function saveRoutinesToCloud(routines) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return false;

  await set(ref(database, `users/${auth.currentUser.uid}/routines`), routines || []);
  logger.success('Routines synced to cloud');
  return true;
}

export async function loadRoutinesFromCloud() {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return null;

  const snapshot = await get(ref(database, `users/${auth.currentUser.uid}/routines`));
  if (snapshot.exists()) { logger.success('Routines loaded from cloud'); return snapshot.val(); }
  return null;
}

// ── Custom exercises ────────────────────────────────────────────────────

export async function saveCustomExercisesToCloud(exercises) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return false;

  await set(ref(database, `users/${auth.currentUser.uid}/custom/exercises`), exercises || []);
  logger.success('Custom exercises synced to cloud');
  return true;
}

export async function loadCustomExercisesFromCloud() {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return null;

  const snapshot = await get(ref(database, `users/${auth.currentUser.uid}/custom/exercises`));
  if (snapshot.exists()) { logger.success('Custom exercises loaded from cloud'); return snapshot.val(); }
  return null;
}

export function listenToCustomExercisesFromCloud(callback) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return () => {};

  return onValue(ref(database, `users/${auth.currentUser.uid}/custom/exercises`), (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : []);
  });
}

// ── Program completions ─────────────────────────────────────────────────

export async function saveProgramCompletionsToCloud(programId, completions) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return false;

  await set(ref(database, `users/${auth.currentUser.uid}/programCompletions/${programId}`), completions || {});
  return true;
}

export async function loadProgramCompletionsFromCloud(programId) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return null;

  const snapshot = await get(ref(database, `users/${auth.currentUser.uid}/programCompletions/${programId}`));
  if (snapshot.exists()) return snapshot.val();
  return null;
}

// ── Achievements (manual & social) ───────────────────────────────────────

export async function saveAchievementsToCloud(achievements, userId = null) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  const uid = userId || auth?.currentUser?.uid;
  if (!uid || !database) return false;

  await set(ref(database, `users/${uid}/achievements`), achievements || {});
  logger.success('Achievements synced to cloud');
  return true;
}

export async function loadAchievementsFromCloud(userId = null) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  const uid = userId || auth?.currentUser?.uid;
  if (!uid || !database) return null;

  const snapshot = await get(ref(database, `users/${uid}/achievements`));
  if (snapshot.exists()) { logger.success('Achievements loaded from cloud'); return snapshot.val(); }
  return null;
}

// ── Exercise weights (current weight per exercise) ──────────────────────

export async function saveExerciseWeightsToCloud(weights) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return false;

  await set(ref(database, `users/${auth.currentUser.uid}/exerciseWeights`), weights || {});
  logger.success('Exercise weights synced to cloud');
  return true;
}

export async function loadExerciseWeightsFromCloud() {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return null;

  const snapshot = await get(ref(database, `users/${auth.currentUser.uid}/exerciseWeights`));
  if (snapshot.exists()) { logger.success('Exercise weights loaded from cloud'); return snapshot.val(); }
  return null;
}
// ── Custom categories ───────────────────────────────────────────────────
export async function saveCustomCategoriesToCloud(categories) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return false;

  await set(ref(database, `users/${auth.currentUser.uid}/custom/categories`), categories || []);
  logger.success('Custom categories synced to cloud');
  return true;
}

export async function loadCustomCategoriesFromCloud() {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return null;

  const snapshot = await get(ref(database, `users/${auth.currentUser.uid}/custom/categories`));
  if (snapshot.exists()) { logger.success('Custom categories loaded from cloud'); return snapshot.val(); }
  return null;
}

export function listenToCustomCategoriesFromCloud(callback) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return () => {};

  return onValue(ref(database, `users/${auth.currentUser.uid}/custom/categories`), (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : []);
  });
}
