import { ref, set, get, onValue, serverTimestamp } from 'firebase/database';
import { createLogger } from '../utils/logger';
import { getAuthInstance, getDatabaseInstance } from './firebase';

const logger = createLogger('DataSync');

let syncInProgress = false;

export function sanitizeForCloud(data) {
  if (!data || !data.completions) return data;
  const sanitizedCompletions = {};
  Object.keys(data.completions).forEach(dateStr => {
    const dayEntry = data.completions[dateStr];
    if (!dayEntry || typeof dayEntry !== 'object') return;
    const sanitizedDay = {};
    Object.keys(dayEntry).forEach(exerciseId => {
      const ex = dayEntry[exerciseId];
      if (!ex || typeof ex !== 'object') return;
      sanitizedDay[exerciseId] = {
        isCompleted: ex.isCompleted || false,
        timestamp: ex.timestamp || null,
        timeOfDay: ex.timeOfDay || null,
      };
    });
    sanitizedCompletions[dateStr] = sanitizedDay;
  });
  return { ...data, completions: sanitizedCompletions };
}

export async function saveToCloud(data) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) throw new Error('User not signed in or Firebase not initialized');
  if (syncInProgress) { logger.debug('Sync already in progress, skipping...'); return; }

  syncInProgress = true;
  try {
    const userId = auth.currentUser.uid;
    const cleanData = sanitizeForCloud(data);
    await set(ref(database, `users/${userId}/progress`), { ...cleanData, lastSyncedAt: serverTimestamp() });
    logger.success('Data saved to cloud successfully');
    return true;
  } catch (error) {
    logger.error('Error saving to cloud:', error);
    throw error;
  } finally {
    syncInProgress = false;
  }
}

export async function loadFromCloud() {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) throw new Error('User not signed in or Firebase not initialized');

  const snapshot = await get(ref(database, `users/${auth.currentUser.uid}/progress`));
  if (snapshot.exists()) { logger.success('Data loaded from cloud successfully'); return snapshot.val(); }
  logger.info('No cloud data found');
  return null;
}

export function listenToCloudChanges(callback) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) { logger.warn('User not signed in or Firebase not initialized'); return null; }

  return onValue(ref(database, `users/${auth.currentUser.uid}/progress`), (snapshot) => {
    if (snapshot.exists()) callback(snapshot.val());
  });
}

export function mergeData(localData, cloudData) {
  if (!cloudData) return localData;
  if (!localData) return cloudData;

  const mergedCompletions = { ...localData.completions };
  if (cloudData.completions) {
    Object.keys(cloudData.completions).forEach(dateStr => {
      const cloudDay = cloudData.completions[dateStr];
      const localDay = mergedCompletions[dateStr];
      if (!localDay) {
        mergedCompletions[dateStr] = cloudDay;
      } else if (cloudDay && typeof cloudDay === 'object') {
        const merged = { ...localDay };
        Object.keys(cloudDay).forEach(exId => {
          const cloudEx = cloudDay[exId];
          const localEx = merged[exId];
          if (!localEx || (cloudEx?.timestamp && localEx?.timestamp && new Date(cloudEx.timestamp) > new Date(localEx.timestamp)) || (cloudEx?.timestamp && !localEx?.timestamp)) {
            merged[exId] = { ...localEx, ...cloudEx };
          }
        });
        mergedCompletions[dateStr] = merged;
      }
    });
  }

  return {
    startDate: localData.startDate || cloudData.startDate,
    userStartDate: localData.userStartDate || cloudData.userStartDate,
    completions: mergedCompletions,
    isSetup: localData.isSetup || cloudData.isSetup,
    lastSyncedAt: new Date().toISOString()
  };
}

export async function syncData(localData) {
  const cloudData = await loadFromCloud();
  const mergedData = mergeData(localData, cloudData);
  await saveToCloud(mergedData);
  return mergedData;
}
