import { ref, get, set, update } from 'firebase/database';
import { getDatabaseInstance } from './firebase';
import { createLogger } from '../utils/logger';

const logger = createLogger('AdminService');

/**
 * Fetch all user database records.
 * Only works if logged in as the admin user (rules verified).
 */
export async function fetchAllUsersData() {
  const database = getDatabaseInstance();
  if (!database) {
    logger.error('Database not initialized');
    throw new Error('Database not initialized');
  }

  try {
    const snapshot = await get(ref(database, 'users'));
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return {};
  } catch (error) {
    logger.error('Error fetching all users data:', error);
    throw error;
  }
}

/**
 * Replace entire user document.
 */
export async function saveUserData(uid, data) {
  const database = getDatabaseInstance();
  if (!database) {
    logger.error('Database not initialized');
    throw new Error('Database not initialized');
  }

  try {
    await set(ref(database, `users/${uid}`), data);
    logger.success(`Successfully saved user data for uid: ${uid}`);
    return true;
  } catch (error) {
    logger.error(`Error saving user data for uid: ${uid}:`, error);
    throw error;
  }
}

/**
 * Update user's progress statistics.
 */
export async function updateUserProgress(uid, progress) {
  const database = getDatabaseInstance();
  if (!database) throw new Error('Database not initialized');
  await update(ref(database, `users/${uid}/progress`), progress);
  logger.success(`Updated progress for ${uid}`);
  return true;
}

/**
 * Update user's settings options.
 */
export async function updateUserSettings(uid, settings) {
  const database = getDatabaseInstance();
  if (!database) throw new Error('Database not initialized');
  await update(ref(database, `users/${uid}/settings`), settings);
  logger.success(`Updated settings for ${uid}`);
  return true;
}

/**
 * Update user's profile info.
 */
export async function updateUserProfile(uid, profile) {
  const database = getDatabaseInstance();
  if (!database) throw new Error('Database not initialized');
  await update(ref(database, `users/${uid}/profile`), profile);
  logger.success(`Updated profile for ${uid}`);
  return true;
}

/**
 * Update user's purchase (Pro/Supporter status).
 */
export async function updateUserPurchase(uid, purchase) {
  const database = getDatabaseInstance();
  if (!database) throw new Error('Database not initialized');
  await set(ref(database, `users/${uid}/purchase`), purchase);
  logger.success(`Updated purchase info for ${uid}`);
  return true;
}
