import { ref, get, onValue, serverTimestamp, update } from 'firebase/database';
import { createLogger } from '../utils/logger';
import { getAuthInstance, getDatabaseInstance } from './firebase';
import { syncSessionHistory } from '../features/share/services/sessionHistoryService';
import { sanitizeForCloud, mergeData } from '../utils/syncUtils';

const logger = createLogger('DataSync');

export { sanitizeForCloud, mergeData };

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

export async function syncData(localData) {
  logger.info('Starting full data synchronization...');
  
  // Sync session history concurrently
  syncSessionHistory().catch(err => logger.error('Failed to sync session history:', err));

  const cloudData = await loadFromCloud();
  const mergedData = mergeData(localData, cloudData);
  await saveToCloud(mergedData);
  return mergedData;
}
