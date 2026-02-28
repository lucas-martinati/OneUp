import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getDatabase,
  ref,
  set,
  get,
  onValue,
  serverTimestamp
} from 'firebase/database';
import { Preferences } from '@capacitor/preferences';
import { createLogger } from '../utils/logger';

const logger = createLogger('CloudSync');

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialiser Firebase
let app;
let auth;
let database;
let isInitialized = false;

const initializeFirebase = () => {
  if (!isInitialized) {
    try {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      database = getDatabase(app);
      isInitialized = true;
      logger.success('Firebase initialized successfully');
    } catch (error) {
      logger.error('Firebase initialization error:', error);
    }
  }
};

// Service de synchronisation cloud
class CloudSyncService {
  constructor() {
    this.syncInProgress = false;
    this.listeners = new Set();
    initializeFirebase();

    // Listen for auth state changes (restore session)
    if (auth) {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          logger.info('Firebase Auth Restored:', user.email);

          await Preferences.set({
            key: 'user_signed_in',
            value: 'true'
          });
          await Preferences.set({
            key: 'user_id',
            value: user.uid
          });

          this.notifyListeners({
            isSignedIn: true,
            user: {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL
            }
          });
        } else {
          // Only notify sign out if we were previously thought to be signed in
          // to avoid initial flickering if possible, but for safety we notify.
          this.notifyListeners({
            isSignedIn: false,
            user: null
          });
        }
      });
    }
  }

  // Notifier les listeners des changements d'état
  notifyListeners(state) {
    this.listeners.forEach(listener => listener(state));
  }

  // S'abonner aux changements d'état
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Connexion avec Google (native - using ID token)
  async signInWithGoogle(idToken) {
    try {
      if (!auth) {
        throw new Error('Firebase not initialized');
      }

      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);

      // Sauvegarder l'état de connexion
      await Preferences.set({
        key: 'user_signed_in',
        value: 'true'
      });

      await Preferences.set({
        key: 'user_id',
        value: result.user.uid
      });

      this.notifyListeners({
        isSignedIn: true,
        user: {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL
        }
      });

      return result.user;
    } catch (error) {
      logger.error('Sign in error:', error);
      throw error;
    }
  }

  // Connexion avec Google (web - using access token from GIS)
  async signInWithGoogleWeb(accessToken, userInfo) {
    try {
      if (!auth) {
        throw new Error('Firebase not initialized');
      }

      // For web with GIS, we use the access token to create a credential
      const credential = GoogleAuthProvider.credential(null, accessToken);
      const result = await signInWithCredential(auth, credential);

      // Sauvegarder l'état de connexion
      await Preferences.set({
        key: 'user_signed_in',
        value: 'true'
      });

      await Preferences.set({
        key: 'user_id',
        value: result.user.uid
      });

      this.notifyListeners({
        isSignedIn: true,
        user: {
          uid: result.user.uid,
          email: result.user.email || userInfo.email,
          displayName: result.user.displayName || userInfo.name,
          photoURL: result.user.photoURL || userInfo.picture
        }
      });

      return result.user;
    } catch (error) {
      logger.error('Web sign in error:', error);
      throw error;
    }
  }

  // Déconnexion
  async signOut() {
    try {
      if (!auth) {
        throw new Error('Firebase not initialized');
      }

      await firebaseSignOut(auth);

      await Preferences.remove({ key: 'user_signed_in' });
      await Preferences.remove({ key: 'user_id' });

      this.notifyListeners({
        isSignedIn: false,
        user: null
      });
    } catch (error) {
      logger.error('Sign out error:', error);
      throw error;
    }
  }

  // Vérifier si l'utilisateur est connecté
  async checkSignInStatus() {
    try {
      const { value } = await Preferences.get({ key: 'user_signed_in' });

      if (value === 'true' && auth?.currentUser) {
        return {
          isSignedIn: true,
          user: {
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
            displayName: auth.currentUser.displayName,
            photoURL: auth.currentUser.photoURL
          }
        };
      }

      return { isSignedIn: false, user: null };
    } catch (error) {
      logger.error('Check sign in status error:', error);
      return { isSignedIn: false, user: null };
    }
  }

  // Sanitize data for cloud (only save isCompleted boolean, strip count)
  sanitizeForCloud(data) {
    if (!data || !data.completions) return data;

    const sanitizedCompletions = {};
    Object.keys(data.completions).forEach(dateStr => {
      const dayEntry = data.completions[dateStr];
      if (!dayEntry || typeof dayEntry !== 'object') return;

      const sanitizedDay = {};
      Object.keys(dayEntry).forEach(exerciseId => {
        const ex = dayEntry[exerciseId];
        if (!ex || typeof ex !== 'object') return;
        // Only save isCompleted, timestamp, timeOfDay — no count
        sanitizedDay[exerciseId] = {
          isCompleted: ex.isCompleted || false,
          timestamp: ex.timestamp || null,
          timeOfDay: ex.timeOfDay || null,
        };
      });
      sanitizedCompletions[dateStr] = sanitizedDay;
    });

    return {
      ...data,
      completions: sanitizedCompletions
    };
  }

  // Sauvegarder les données dans le cloud
  async saveToCloud(data) {
    try {
      if (!auth?.currentUser || !database) {
        throw new Error('User not signed in or Firebase not initialized');
      }

      if (this.syncInProgress) {
        logger.debug('Sync already in progress, skipping...');
        return;
      }

      this.syncInProgress = true;

      const userId = auth.currentUser.uid;
      const userRef = ref(database, `users/${userId}/progress`);

      // Sanitize data (remove pushup counts as per privacy requirement)
      const cleanData = this.sanitizeForCloud(data);

      // Ajouter un timestamp pour la dernière mise à jour
      const dataWithTimestamp = {
        ...cleanData,
        lastSyncedAt: serverTimestamp()
      };

      await set(userRef, dataWithTimestamp);

      logger.success('Data saved to cloud successfully');
      this.syncInProgress = false;

      return true;
    } catch (error) {
      logger.error('Error saving to cloud:', error);
      this.syncInProgress = false;
      throw error;
    }
  }

  // Récupérer les données depuis le cloud
  async loadFromCloud() {
    try {
      if (!auth?.currentUser || !database) {
        throw new Error('User not signed in or Firebase not initialized');
      }

      const userId = auth.currentUser.uid;
      const userRef = ref(database, `users/${userId}/progress`);

      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        logger.success('Data loaded from cloud successfully');
        return snapshot.val();
      }

      logger.info('No cloud data found');
      return null;
    } catch (error) {
      logger.error('Error loading from cloud:', error);
      throw error;
    }
  }

  // Écouter les changements en temps réel
  listenToCloudChanges(callback) {
    try {
      if (!auth?.currentUser || !database) {
        logger.warn('User not signed in or Firebase not initialized');
        return null;
      }

      const userId = auth.currentUser.uid;
      const userRef = ref(database, `users/${userId}/progress`);

      const unsubscribe = onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.val());
        }
      });

      return unsubscribe;
    } catch (error) {
      logger.error('Error setting up cloud listener:', error);
      return null;
    }
  }

  // Fusionner les données locales et cloud
  mergeData(localData, cloudData) {
    if (!cloudData) return localData;
    if (!localData) return cloudData;

    // Fusionner les completions en gardant la donnée la plus récente
    const mergedCompletions = { ...localData.completions };

    if (cloudData.completions) {
      Object.keys(cloudData.completions).forEach(dateStr => {
        const cloudDay = cloudData.completions[dateStr];
        const localDay = mergedCompletions[dateStr];

        if (!localDay) {
          // Cloud-only entry — take it
          mergedCompletions[dateStr] = cloudDay;
        } else if (cloudDay && typeof cloudDay === 'object') {
          // Both exist — merge per exercise, prefer the one with a more recent timestamp
          const merged = { ...localDay };
          Object.keys(cloudDay).forEach(exId => {
            const cloudEx = cloudDay[exId];
            const localEx = merged[exId];
            if (!localEx ||
              (cloudEx?.timestamp && localEx?.timestamp &&
                new Date(cloudEx.timestamp) > new Date(localEx.timestamp)) ||
              (cloudEx?.timestamp && !localEx?.timestamp)) {
              // Preserve count from local if possible, as cloud only has isCompleted
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

  // Synchronisation complète (merge local + cloud puis save)
  async syncData(localData) {
    try {
      const cloudData = await this.loadFromCloud();
      const mergedData = this.mergeData(localData, cloudData);
      await this.saveToCloud(mergedData);

      return mergedData;
    } catch (error) {
      logger.error('Sync error:', error);
      throw error;
    }
  }


  // ── Leaderboard ──────────────────────────────────────────────────────

  /**
   * Publish (or update) this user's leaderboard entry.
   * Stored at `leaderboard/{uid}`.
   */
  async publishToLeaderboard({ pseudo, totalReps, exerciseReps }) {
    try {
      if (!auth?.currentUser || !database) return false;

      const uid = auth.currentUser.uid;
      const entry = {
        pseudo: pseudo || auth.currentUser.displayName || 'Anonyme',
        photoURL: auth.currentUser.photoURL || null,
        totalReps: totalReps || 0,
        exerciseReps: exerciseReps || {},
        lastUpdated: serverTimestamp()
      };

      const lbRef = ref(database, `leaderboard/${uid}`);
      await set(lbRef, entry);
      logger.success('Leaderboard entry published');
      return true;
    } catch (error) {
      logger.error('Error publishing to leaderboard:', error);
      return false;
    }
  }

  /**
   * Remove this user's leaderboard entry (opt-out).
   */
  async removeFromLeaderboard() {
    try {
      if (!auth?.currentUser || !database) return false;

      const uid = auth.currentUser.uid;
      const lbRef = ref(database, `leaderboard/${uid}`);
      await set(lbRef, null);
      logger.success('Leaderboard entry removed');
      return true;
    } catch (error) {
      logger.error('Error removing from leaderboard:', error);
      return false;
    }
  }

  /**
   * Load the full leaderboard (all users who opted in).
   * Returns an array sorted by totalReps desc.
   */
  async loadLeaderboard() {
    try {
      if (!database) {
        initializeFirebase();
        if (!database) return [];
      }

      const lbRef = ref(database, 'leaderboard');
      const snapshot = await get(lbRef);

      if (!snapshot.exists()) return [];

      const data = snapshot.val();
      const entries = Object.entries(data).map(([uid, entry]) => ({
        uid,
        pseudo: entry.pseudo || 'Anonyme',
        photoURL: entry.photoURL || null,
        totalReps: entry.totalReps || 0,
        exerciseReps: entry.exerciseReps || {},
        lastUpdated: entry.lastUpdated || null
      }));

      // Sort by total reps descending
      entries.sort((a, b) => b.totalReps - a.totalReps);
      return entries;
    } catch (error) {
      logger.error('Error loading leaderboard:', error);
      return [];
    }
  }

  /**
   * Get the current user's UID (needed to highlight own entry).
   */
  getCurrentUserId() {
    return auth?.currentUser?.uid || null;
  }

  // Save settings to cloud
  async saveSettingsToCloud(settings) {
    try {
      if (!auth?.currentUser || !database) {
        // Silently fail if not logged in, it's fine for local-only
        return false;
      }

      const userId = auth.currentUser.uid;
      const settingsRef = ref(database, `users/${userId}/settings`);

      await set(settingsRef, settings);
      logger.success('Settings synced to cloud');
      return true;
    } catch (error) {
      logger.error('Error syncing settings:', error);
      return false;
    }
  }

  // Load settings from cloud
  async loadSettingsFromCloud() {
    try {
      if (!auth?.currentUser || !database) return null;

      const userId = auth.currentUser.uid;
      const settingsRef = ref(database, `users/${userId}/settings`);

      const snapshot = await get(settingsRef);
      if (snapshot.exists()) {
        logger.success('Settings loaded from cloud');
        return snapshot.val();
      }
      return null;
    } catch (error) {
      logger.error('Error loading settings:', error);
      return null;
    }
  }
}

// Exporter une instance singleton
export const cloudSync = new CloudSyncService();
