import { ref, set, get, onValue } from 'firebase/database';
import { createLogger } from '@utils/logger';
import { getAuthInstance, getDatabaseInstance } from './firebase';
import { paths } from '@shared/dbSchema.js';

const logger = createLogger('UserData');

// ── Generic Firebase RTDB Helpers ────────────────────────────────────────

function getContext(explicitUid = null) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  const uid = explicitUid || auth?.currentUser?.uid;
  if (!uid || !database) return null;
  return { uid, database };
}

async function saveCloudData(path, data, entityName = null, explicitUid = null) {
  const ctx = getContext(explicitUid);
  if (!ctx) return false;
  await set(ref(ctx.database, path), data);
  if (entityName) logger.success(`${entityName} synced to cloud`);
  return true;
}

async function loadCloudData(path, entityName = null, explicitUid = null) {
  const ctx = getContext(explicitUid);
  if (!ctx) return null;
  const snapshot = await get(ref(ctx.database, path));
  if (snapshot.exists()) {
    if (entityName) logger.success(`${entityName} loaded from cloud`);
    return snapshot.val();
  }
  return null;
}

function listenCloudData(path, callback, emptyFallback = null, explicitUid = null) {
  const ctx = getContext(explicitUid);
  if (!ctx) return () => {};
  return onValue(ref(ctx.database, path), (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : emptyFallback);
  });
}

// ── Settings ────────────────────────────────────────────────────────────

export const saveSettingsToCloud = (settings) => {
  const ctx = getContext();
  return ctx ? saveCloudData(paths.userSettings(ctx.uid), settings, 'Settings') : Promise.resolve(false);
};

export const loadSettingsFromCloud = () => {
  const ctx = getContext();
  return ctx ? loadCloudData(paths.userSettings(ctx.uid), 'Settings') : Promise.resolve(null);
};

export const listenToSettingsFromCloud = (callback) => {
  const ctx = getContext();
  return ctx ? listenCloudData(paths.userSettings(ctx.uid), callback, null) : () => {};
};

// ── Purchase ────────────────────────────────────────────────────────────

export const loadPurchase = () => {
  const ctx = getContext();
  return ctx ? loadCloudData(paths.userPurchase(ctx.uid)) : Promise.resolve(null);
};

export const listenToPurchaseFromCloud = (callback) => {
  const ctx = getContext();
  return ctx ? listenCloudData(paths.userPurchase(ctx.uid), callback, null) : () => {};
};

// ── Routines ────────────────────────────────────────────────────────────

export const saveRoutinesToCloud = (routines) => {
  const ctx = getContext();
  return ctx ? saveCloudData(paths.userRoutines(ctx.uid), routines || [], 'Routines') : Promise.resolve(false);
};

export const loadRoutinesFromCloud = () => {
  const ctx = getContext();
  return ctx ? loadCloudData(paths.userRoutines(ctx.uid), 'Routines') : Promise.resolve(null);
};

export const listenToRoutinesFromCloud = (callback) => {
  const ctx = getContext();
  return ctx ? listenCloudData(paths.userRoutines(ctx.uid), callback, []) : () => {};
};

// ── Custom exercises ────────────────────────────────────────────────────

export const saveCustomExercisesToCloud = (exercises) => {
  const ctx = getContext();
  return ctx ? saveCloudData(paths.userCustomExercises(ctx.uid), exercises || [], 'Custom exercises') : Promise.resolve(false);
};

export const loadCustomExercisesFromCloud = () => {
  const ctx = getContext();
  return ctx ? loadCloudData(paths.userCustomExercises(ctx.uid), 'Custom exercises') : Promise.resolve(null);
};

export const listenToCustomExercisesFromCloud = (callback) => {
  const ctx = getContext();
  return ctx ? listenCloudData(paths.userCustomExercises(ctx.uid), callback, []) : () => {};
};

// ── Program completions ─────────────────────────────────────────────────

export const saveProgramCompletionsToCloud = (programId, completions) => {
  const ctx = getContext();
  return ctx ? saveCloudData(paths.userProgramCompletion(ctx.uid, programId), completions || {}) : Promise.resolve(false);
};

export const loadProgramCompletionsFromCloud = (programId) => {
  const ctx = getContext();
  return ctx ? loadCloudData(paths.userProgramCompletion(ctx.uid, programId)) : Promise.resolve(null);
};

// ── Achievements (manual & social) ───────────────────────────────────────

export const saveAchievementsToCloud = (achievements, userId = null) => {
  const ctx = getContext(userId);
  return ctx ? saveCloudData(paths.userAchievements(ctx.uid), achievements || {}, 'Achievements', ctx.uid) : Promise.resolve(false);
};

export const loadAchievementsFromCloud = (userId = null) => {
  const ctx = getContext(userId);
  return ctx ? loadCloudData(paths.userAchievements(ctx.uid), 'Achievements', ctx.uid) : Promise.resolve(null);
};

// ── Exercise weights (current weight per exercise) ──────────────────────

export const saveExerciseWeightsToCloud = (weights) => {
  const ctx = getContext();
  return ctx ? saveCloudData(paths.userExerciseWeights(ctx.uid), weights || {}, 'Exercise weights') : Promise.resolve(false);
};

export const loadExerciseWeightsFromCloud = () => {
  const ctx = getContext();
  return ctx ? loadCloudData(paths.userExerciseWeights(ctx.uid), 'Exercise weights') : Promise.resolve(null);
};

// ── Custom categories ───────────────────────────────────────────────────

export const saveCustomCategoriesToCloud = (categories) => {
  const ctx = getContext();
  return ctx ? saveCloudData(paths.userCustomCategories(ctx.uid), categories || [], 'Custom categories') : Promise.resolve(false);
};

export const loadCustomCategoriesFromCloud = () => {
  const ctx = getContext();
  return ctx ? loadCloudData(paths.userCustomCategories(ctx.uid), 'Custom categories') : Promise.resolve(null);
};

export const listenToCustomCategoriesFromCloud = (callback) => {
  const ctx = getContext();
  return ctx ? listenCloudData(paths.userCustomCategories(ctx.uid), callback, []) : () => {};
};
