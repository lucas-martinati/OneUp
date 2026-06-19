import { ref, set, get, onValue } from 'firebase/database';
import { createLogger } from '../utils/logger';
import { getAuthInstance, getDatabaseInstance } from './firebase';
import { paths } from '../../functions/shared/dbSchema.js';

const logger = createLogger('UserData');

// ── Settings ────────────────────────────────────────────────────────────

export async function saveSettingsToCloud(settings) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return false;

  await set(ref(database, paths.userSettings(auth.currentUser.uid)), settings);
  logger.success('Settings synced to cloud');
  return true;
}

export async function loadSettingsFromCloud() {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return null;

  const snapshot = await get(ref(database, paths.userSettings(auth.currentUser.uid)));
  if (snapshot.exists()) { logger.success('Settings loaded from cloud'); return snapshot.val(); }
  return null;
}

/**
 * Subscribe to live settings changes (e.g. edited from the admin panel or
 * another device). Fires once immediately with the current value (or null when
 * none exist). Returns an unsubscribe function.
 */
export function listenToSettingsFromCloud(callback) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return () => {};

  return onValue(ref(database, paths.userSettings(auth.currentUser.uid)), (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });
}

// ── Purchase ────────────────────────────────────────────────────────────

export async function loadPurchase() {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return null;

  const snapshot = await get(ref(database, paths.userPurchase(auth.currentUser.uid)));
  if (snapshot.exists()) return snapshot.val();
  return null;
}

// ── Routines ────────────────────────────────────────────────────────────

export async function saveRoutinesToCloud(routines) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return false;

  await set(ref(database, paths.userRoutines(auth.currentUser.uid)), routines || []);
  logger.success('Routines synced to cloud');
  return true;
}

export async function loadRoutinesFromCloud() {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return null;

  const snapshot = await get(ref(database, paths.userRoutines(auth.currentUser.uid)));
  if (snapshot.exists()) { logger.success('Routines loaded from cloud'); return snapshot.val(); }
  return null;
}

export function listenToRoutinesFromCloud(callback) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return () => {};

  return onValue(ref(database, paths.userRoutines(auth.currentUser.uid)), (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : []);
  });
}

// ── Custom exercises ────────────────────────────────────────────────────

export async function saveCustomExercisesToCloud(exercises) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return false;

  await set(ref(database, paths.userCustomExercises(auth.currentUser.uid)), exercises || []);
  logger.success('Custom exercises synced to cloud');
  return true;
}

export async function loadCustomExercisesFromCloud() {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return null;

  const snapshot = await get(ref(database, paths.userCustomExercises(auth.currentUser.uid)));
  if (snapshot.exists()) { logger.success('Custom exercises loaded from cloud'); return snapshot.val(); }
  return null;
}

export function listenToCustomExercisesFromCloud(callback) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return () => {};

  return onValue(ref(database, paths.userCustomExercises(auth.currentUser.uid)), (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : []);
  });
}

// ── Program completions ─────────────────────────────────────────────────

export async function saveProgramCompletionsToCloud(programId, completions) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return false;

  await set(ref(database, paths.userProgramCompletion(auth.currentUser.uid, programId)), completions || {});
  return true;
}

export async function loadProgramCompletionsFromCloud(programId) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return null;

  const snapshot = await get(ref(database, paths.userProgramCompletion(auth.currentUser.uid, programId)));
  if (snapshot.exists()) return snapshot.val();
  return null;
}

// ── Achievements (manual & social) ───────────────────────────────────────

export async function saveAchievementsToCloud(achievements, userId = null) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  const uid = userId || auth?.currentUser?.uid;
  if (!uid || !database) return false;

  await set(ref(database, paths.userAchievements(uid)), achievements || {});
  logger.success('Achievements synced to cloud');
  return true;
}

export async function loadAchievementsFromCloud(userId = null) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  const uid = userId || auth?.currentUser?.uid;
  if (!uid || !database) return null;

  const snapshot = await get(ref(database, paths.userAchievements(uid)));
  if (snapshot.exists()) { logger.success('Achievements loaded from cloud'); return snapshot.val(); }
  return null;
}

// ── Exercise weights (current weight per exercise) ──────────────────────

export async function saveExerciseWeightsToCloud(weights) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return false;

  await set(ref(database, paths.userExerciseWeights(auth.currentUser.uid)), weights || {});
  logger.success('Exercise weights synced to cloud');
  return true;
}

export async function loadExerciseWeightsFromCloud() {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return null;

  const snapshot = await get(ref(database, paths.userExerciseWeights(auth.currentUser.uid)));
  if (snapshot.exists()) { logger.success('Exercise weights loaded from cloud'); return snapshot.val(); }
  return null;
}
// ── Custom categories ───────────────────────────────────────────────────
export async function saveCustomCategoriesToCloud(categories) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return false;

  await set(ref(database, paths.userCustomCategories(auth.currentUser.uid)), categories || []);
  logger.success('Custom categories synced to cloud');
  return true;
}

export async function loadCustomCategoriesFromCloud() {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return null;

  const snapshot = await get(ref(database, paths.userCustomCategories(auth.currentUser.uid)));
  if (snapshot.exists()) { logger.success('Custom categories loaded from cloud'); return snapshot.val(); }
  return null;
}

export function listenToCustomCategoriesFromCloud(callback) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return () => {};

  return onValue(ref(database, paths.userCustomCategories(auth.currentUser.uid)), (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : []);
  });
}
