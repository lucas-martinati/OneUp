import { ref, get, onValue, serverTimestamp, update } from 'firebase/database';
import { createLogger } from '../utils/logger';
import { getAuthInstance, getDatabaseInstance } from './firebase';
import { syncSessionHistory } from '../features/share/services/sessionHistoryService';

const logger = createLogger('DataSync');

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
        ...(ex.weight !== undefined ? { weight: ex.weight } : {}),
        ...(ex.difficulty !== undefined ? { difficulty: ex.difficulty } : {})
      };
    });
    sanitizedCompletions[dateStr] = sanitizedDay;
  });
  
  // Remove achievements and hasShared from progress sync (they are handled independently or deprecated)
  const { achievements: _a, hasShared: _h, ...restOfData } = data;
  return { ...restOfData, completions: sanitizedCompletions };
}

export async function saveToCloud(data) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) throw new Error('User not signed in or Firebase not initialized');

  // SAFEGUARD: Never overwrite cloud data with empty completions.
  // This prevents a race condition where a save fires after sign-out reset
  // but before auth.isSignedIn becomes false, wiping the user's progress.
  const completionCount = data?.completions ? Object.keys(data.completions).length : 0;
  if (completionCount === 0 && !data?.isSetup) {
    logger.warn('Blocked save with empty completions and no setup — possible race condition');
    return false;
  }

  const userId = auth.currentUser.uid;
  const cleanData = sanitizeForCloud(data);
  
  try {
    await update(ref(database, `users/${userId}/progress`), { 
      ...cleanData, 
      lastCompletionChange: data.lastCompletionChange || serverTimestamp() 
    });
    logger.success('Data saved to cloud successfully');
    return true;
  } catch (error) {
    logger.error('Error saving to cloud:', error);
    throw error;
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

  logger.info(`Merging data: local has ${Object.keys(localData.completions).length} days, cloud has ${cloudData.completions ? Object.keys(cloudData.completions).length : 0} days`);

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
          
          // Use cloud version if it has a strictly newer timestamp,
          // or if local has a placeholder and cloud has a real timestamp.
          const localIsPlaceholder = localEx?.timestamp && typeof localEx.timestamp === 'object' && localEx.timestamp['.sv'];
          const cloudIsPlaceholder = cloudEx?.timestamp && typeof cloudEx.timestamp === 'object' && cloudEx.timestamp['.sv'];
          
          const localTs = localIsPlaceholder ? 0 : (localEx?.timestamp ? new Date(localEx.timestamp).getTime() : 0);
          const cloudTs = cloudIsPlaceholder ? 0 : (cloudEx?.timestamp ? new Date(cloudEx.timestamp).getTime() : 0);
          
          const cloudIsNewer = cloudTs > localTs;
          const localHasNoTimestamp = (cloudEx?.timestamp && !localEx?.timestamp);
          const cloudReplacesPlaceholder = localIsPlaceholder && !cloudIsPlaceholder && cloudEx?.timestamp;

          if (!localEx || cloudIsNewer || localHasNoTimestamp || cloudReplacesPlaceholder) {
            merged[exId] = { ...localEx, ...cloudEx };
          }
        });
        // Ensure local-only exercises (added offline) are preserved on shared days
        Object.keys(localDay).forEach(exId => {
          if (!merged[exId]) {
            merged[exId] = localDay[exId];
          }
        });
        mergedCompletions[dateStr] = merged;
      }
    });
  }

  const localLCC = localData.lastCompletionChange;
  const cloudLCC = cloudData.lastCompletionChange;
  const localLCCIsPlaceholder = localLCC && typeof localLCC === 'object' && localLCC['.sv'];
  const cloudLCCIsPlaceholder = cloudLCC && typeof cloudLCC === 'object' && cloudLCC['.sv'];
  
  const localLCCTs = localLCCIsPlaceholder ? 0 : (localLCC ? new Date(localLCC).getTime() : 0);
  const cloudLCCTs = cloudLCCIsPlaceholder ? 0 : (cloudLCC ? new Date(cloudLCC).getTime() : 0);
  
  const finalLCC = (cloudLCCTs > localLCCTs || (localLCCIsPlaceholder && !cloudLCCIsPlaceholder)) 
    ? cloudLCC 
    : localLCC;

  const result = {
    startDate: localData.startDate || cloudData.startDate,
    userStartDate: localData.userStartDate || cloudData.userStartDate,
    completions: mergedCompletions,
    isSetup: localData.isSetup || cloudData.isSetup,
    lastCompletionChange: finalLCC
  };

  logger.debug(`Merge complete. Final completion days: ${Object.keys(result.completions).length}`);
  return result;
}

export async function syncData(localData) {
  logger.info('Starting full data synchronization...');
  
  // Sync session history concurrently
  syncSessionHistory().catch(err => logger.error('Failed to sync session history:', err));

  const cloudData = await loadFromCloud();
  const mergedData = mergeData(localData, cloudData);
  await saveToCloud(mergedData);
  return mergedData;
}
