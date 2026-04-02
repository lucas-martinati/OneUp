import { ref, set, get } from 'firebase/database';
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

export async function savePurchase({ isSupporter, isPro }) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return false;

  await set(ref(database, `users/${auth.currentUser.uid}/purchase`), { isSupporter: !!isSupporter, isPro: !!isPro });
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

  await set(ref(database, `users/${auth.currentUser.uid}/customExercises`), exercises || []);
  logger.success('Custom exercises synced to cloud');
  return true;
}

export async function loadCustomExercisesFromCloud() {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return null;

  const snapshot = await get(ref(database, `users/${auth.currentUser.uid}/customExercises`));
  if (snapshot.exists()) { logger.success('Custom exercises loaded from cloud'); return snapshot.val(); }
  return null;
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
