import { ref, set, get } from 'firebase/database';
import { createLogger } from '@utils/logger';
import { getAuthInstance, getDatabaseInstance } from './firebase';
import { paths } from '@shared/dbSchema.js';

const logger = createLogger('WeightHistory');

/**
 * Save a single weight entry for a specific exercise and date.
 * Path: users/{uid}/weightHistory/{exerciseId}/{date}
 */
export async function saveWeightEntry(exerciseId, date, weight) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return false;

  const uid = auth.currentUser.uid;
  await set(ref(database, paths.userWeightEntry(uid, exerciseId, date)), weight);
  logger.success(`Weight entry saved: ${exerciseId} @ ${date} = ${weight}kg`);
  return true;
}

/**
 * Load the full weight history for a specific exercise.
 * Returns { [date]: weight } or null.
 */
export async function loadWeightHistory(exerciseId) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return null;

  const uid = auth.currentUser.uid;
  const snapshot = await get(ref(database, paths.userWeightHistoryEx(uid, exerciseId)));
  if (snapshot.exists()) {
    logger.success(`Weight history loaded for ${exerciseId}`);
    return snapshot.val();
  }
  return null;
}

/**
 * Load all weight histories for the current user.
 * Returns { [exerciseId]: { [date]: weight } } or null.
 */
export async function loadAllWeightHistories() {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return null;

  const uid = auth.currentUser.uid;
  const snapshot = await get(ref(database, paths.userWeightHistory(uid)));
  if (snapshot.exists()) {
    logger.success('All weight histories loaded');
    return snapshot.val();
  }
  return null;
}

/**
 * Load the latest weight per exercise for a given user (public reader).
 * Used in UserDetail to display another user's last weights.
 * Returns { [exerciseId]: weight } or null.
 */
export async function loadLatestWeights(uid) {
  const database = getDatabaseInstance();
  if (!database || !uid) return null;

  // Read the user's current exerciseWeights (quick snapshot)
  const snapshot = await get(ref(database, paths.userExerciseWeights(uid)));
  if (snapshot.exists()) return snapshot.val();
  return null;
}
