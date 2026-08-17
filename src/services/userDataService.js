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

async function saveCloudData(pathFn, data, entityName = null, explicitUid = null) {
  const ctx = getContext(explicitUid);
  if (!ctx) return false;
  const path = typeof pathFn === 'function' ? pathFn(ctx.uid) : pathFn;
  await set(ref(ctx.database, path), data);
  if (entityName) logger.success(`${entityName} synced to cloud`);
  return true;
}

async function loadCloudData(pathFn, entityName = null, explicitUid = null) {
  const ctx = getContext(explicitUid);
  if (!ctx) return null;
  const path = typeof pathFn === 'function' ? pathFn(ctx.uid) : pathFn;
  const snapshot = await get(ref(ctx.database, path));
  if (snapshot.exists()) {
    if (entityName) logger.success(`${entityName} loaded from cloud`);
    return snapshot.val();
  }
  return null;
}

function listenCloudData(pathFn, callback, emptyFallback = null, explicitUid = null) {
  const ctx = getContext(explicitUid);
  if (!ctx) return () => {};
  const path = typeof pathFn === 'function' ? pathFn(ctx.uid) : pathFn;
  return onValue(ref(ctx.database, path), (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : emptyFallback);
  });
}

// ── Settings ────────────────────────────────────────────────────────────

export const saveSettingsToCloud = (settings) => 
  saveCloudData(paths.userSettings, settings, 'Settings');

export const loadSettingsFromCloud = () => 
  loadCloudData(paths.userSettings, 'Settings');

export const listenToSettingsFromCloud = (callback) => 
  listenCloudData(paths.userSettings, callback, null);

// ── Purchase ────────────────────────────────────────────────────────────

export const loadPurchase = () => 
  loadCloudData(paths.userPurchase);

export const listenToPurchaseFromCloud = (callback) => 
  listenCloudData(paths.userPurchase, callback, null);

// ── Routines ────────────────────────────────────────────────────────────

export const saveRoutinesToCloud = (routines) => 
  saveCloudData(paths.userRoutines, routines || [], 'Routines');

export const loadRoutinesFromCloud = () => 
  loadCloudData(paths.userRoutines, 'Routines');

export const listenToRoutinesFromCloud = (callback) => 
  listenCloudData(paths.userRoutines, callback, []);

// ── Custom exercises ────────────────────────────────────────────────────

export const saveCustomExercisesToCloud = (exercises) => 
  saveCloudData(paths.userCustomExercises, exercises || [], 'Custom exercises');

export const loadCustomExercisesFromCloud = () => 
  loadCloudData(paths.userCustomExercises, 'Custom exercises');

export const listenToCustomExercisesFromCloud = (callback) => 
  listenCloudData(paths.userCustomExercises, callback, []);

// ── Program completions ─────────────────────────────────────────────────

export const saveProgramCompletionsToCloud = (programId, completions) => 
  saveCloudData((uid) => paths.userProgramCompletion(uid, programId), completions || {});

export const loadProgramCompletionsFromCloud = (programId) => 
  loadCloudData((uid) => paths.userProgramCompletion(uid, programId));

// ── Achievements (manual & social) ───────────────────────────────────────

export const saveAchievementsToCloud = (achievements, userId = null) => 
  saveCloudData(paths.userAchievements, achievements || {}, 'Achievements', userId);

export const loadAchievementsFromCloud = (userId = null) => 
  loadCloudData(paths.userAchievements, 'Achievements', userId);

// ── Exercise weights (current weight per exercise) ──────────────────────

export const saveExerciseWeightsToCloud = (weights) => 
  saveCloudData(paths.userExerciseWeights, weights || {}, 'Exercise weights');

export const loadExerciseWeightsFromCloud = () => 
  loadCloudData(paths.userExerciseWeights, 'Exercise weights');

// ── Custom categories ───────────────────────────────────────────────────

export const saveCustomCategoriesToCloud = (categories) => 
  saveCloudData(paths.userCustomCategories, categories || [], 'Custom categories');

export const loadCustomCategoriesFromCloud = () => 
  loadCloudData(paths.userCustomCategories, 'Custom categories');

export const listenToCustomCategoriesFromCloud = (callback) => 
  listenCloudData(paths.userCustomCategories, callback, []);
