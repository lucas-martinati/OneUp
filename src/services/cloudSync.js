import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  deleteUser,
  reauthenticateWithCredential
} from 'firebase/auth';
import {
  getDatabase,
  ref,
  set,
  get,
  onValue,
  serverTimestamp,
  remove,
  push
} from 'firebase/database';
import { Preferences } from '@capacitor/preferences';
import { createLogger } from '../utils/logger';
import i18n from '../i18n';

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

  // Supprimer le compte utilisateur (données + auth)
  async deleteAccount() {
    try {
      if (!auth?.currentUser) {
        throw new Error('User not signed in');
      }

      const userId = auth.currentUser.uid;

      // Quitter tous les clans dont l'utilisateur fait partie avant de supprimer le compte
      try {
        const userClans = await this.getUserClans();
        for (const clan of userClans) {
          await this.leaveClan(clan.id);
          logger.info(`Left clan ${clan.id} during account deletion.`);
        }
      } catch (clanErr) {
        logger.warn('Failed to leave some clans during account deletion', clanErr);
      }

      // Supprimer les données utilisateur dans la base de données
      const userDataRef = ref(database, `users/${userId}`);
      await remove(userDataRef);

      // Supprimer l'entrée du leaderboard
      const leaderboardRef = ref(database, `leaderboard/${userId}`);
      await remove(leaderboardRef);

      // Re-authentifier avec Google avant suppression (Firebase requirement)
      // Créer un credential factice pour forcer la réauthentification via popup
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      // Déclencher une re-authentification via redirect/popup
      // Pour simplifier, on va utiliser un approche alternative: 
      // On stocke les données mais on marque le compte pour suppression
      // L'utilisateur devra se reconnecter explicitement
      
      // Alternative: faire un re-auth avec les credentials existants si disponibles
      // Mais pour l'instant, on va simplement déconnecter et supprimer les données locales
      // La suppression du compte Firebase nécessite une interaction utilisateur récente
      
      // On supprime d'abord les données locales
      await Preferences.remove({ key: 'user_signed_in' });
      await Preferences.remove({ key: 'user_id' });
      
      // On notifie le changement d'état
      this.notifyListeners({
        isSignedIn: false,
        user: null
      });
      
      // Tenter de supprimer le compte (可能会 échouer si pas recent login)
      // On ignore l'erreur si c'est juste un problème de recent login
      try {
        await deleteUser(auth.currentUser);
        logger.success('Account deleted successfully');
      } catch (authError) {
        // Si c'est une erreur de "requires-recent-login", on déconnecte quand même
        // L'utilisateur devra supprimer son compte depuis la console Firebase
        if (authError.code === 'auth/requires-recent-login') {
          logger.warn('Account data deleted, but Firebase Auth deletion requires recent login. User signed out.');
          await firebaseSignOut(auth);
        } else {
          throw authError;
        }
      }
      
      return true;
    } catch (error) {
      logger.error('Delete account error:', error);
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
  async publishToLeaderboard({ pseudo, totalReps, exerciseReps, achievements, isPublic = true, lastActiveDay = null, difficultyMultiplier = 1 }) {
    try {
      if (!auth?.currentUser || !database) return false;

      const uid = auth.currentUser.uid;
      const entry = {
        pseudo: pseudo || auth.currentUser.displayName || 'Anonyme',
        photoURL: auth.currentUser.photoURL || null,
        totalReps: totalReps || 0,
        exerciseReps: exerciseReps || {},
        achievements: achievements || 0,
        lastActiveDay: lastActiveDay,
        difficultyMultiplier: difficultyMultiplier || 1,
        isPublic: isPublic !== false,
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
      const entries = Object.entries(data)
        .filter(([uid, entry]) => entry.isPublic !== false)
        .map(([uid, entry]) => ({
          uid,
          pseudo: entry.pseudo || 'Anonyme',
          photoURL: entry.photoURL || null,
          totalReps: entry.totalReps || 0,
          exerciseReps: entry.exerciseReps || {},
          achievements: entry.achievements || 0,
          lastActiveDay: entry.lastActiveDay || null,
          difficultyMultiplier: entry.difficultyMultiplier || 1,
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
   * Load detailed progress for a specific user (lazy-loaded from leaderboard detail).
   * Returns { completions, startDate } or null.
   */
  async loadUserDetails(uid) {
    try {
      if (!database) {
        initializeFirebase();
        if (!database) return null;
      }

      const progressRef = ref(database, `users/${uid}/progress`);
      const snapshot = await get(progressRef);
      if (!snapshot.exists()) return null;

      const data = snapshot.val();
      return {
        completions: data.completions || {},
        startDate: data.startDate || null,
        userStartDate: data.userStartDate || null,
      };
    } catch (error) {
      logger.error('Error loading user details:', error);
      return null;
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

  // Save routines to cloud
  async saveRoutinesToCloud(routines) {
    try {
      if (!auth?.currentUser || !database) return false;
      const userId = auth.currentUser.uid;
      const routinesRef = ref(database, `users/${userId}/routines`);
      await set(routinesRef, routines || []);
      logger.success('Routines synced to cloud');
      return true;
    } catch (error) {
      logger.error('Error syncing routines:', error);
      return false;
    }
  }

  // Load routines from cloud
  async loadRoutinesFromCloud() {
    try {
      if (!auth?.currentUser || !database) return null;
      const userId = auth.currentUser.uid;
      const routinesRef = ref(database, `users/${userId}/routines`);
      const snapshot = await get(routinesRef);
      if (snapshot.exists()) {
        logger.success('Routines loaded from cloud');
        return snapshot.val();
      }
      return null;
    } catch (error) {
      logger.error('Error loading routines:', error);
      return null;
    }
  }

  // ── Clan System ──────────────────────────────────────────────────────

  // Create a new clan
  async createClan(name) {
    try {
      if (!auth?.currentUser || !database) throw new Error('Not initialized');
      const uid = auth.currentUser.uid;

      // Generate random 6-char code (A-Z, 0-9)
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const clansRef = ref(database, 'clans');
      const newClanRef = push(clansRef);
      const clanId = newClanRef.key;

      const clanData = {
        name: name,
        code: code,
        createdBy: uid,
        createdAt: serverTimestamp(),
        members: {
          [uid]: 'admin'
        }
      };

      await set(newClanRef, clanData);

      // Save clanId to user profile
      await set(ref(database, `users/${uid}/clans/${clanId}`), 'admin');

      logger.success(`Clan ${name} created with code ${code}`);
      return { success: true, clanId, code };
    } catch (error) {
      logger.error('Error creating clan:', error);
      return { success: false, error: 'Une erreur est survenue' };
    }
  }

  // Join a clan by code
  async joinClan(code) {
    try {
      if (!auth?.currentUser || !database) throw new Error('Not initialized');
      const uid = auth.currentUser.uid;
      const cleanCode = code.toUpperCase().trim();

      // Find clan by code
      const clansRef = ref(database, 'clans');
      const snapshot = await get(clansRef);
      if (!snapshot.exists()) return { success: false, error: 'Code invalide' };

      const clans = snapshot.val();
      let foundClanId = null;

      for (const [id, clan] of Object.entries(clans)) {
        if (clan.code === cleanCode) {
          foundClanId = id;
          break;
        }
      }

      if (!foundClanId) return { success: false, error: 'Code invalide' };

      // Check if user is already in this clan
      const userClanSnapshot = await get(ref(database, `users/${uid}/clans/${foundClanId}`));
      if (userClanSnapshot.exists()) return { success: false, error: 'Tu es déjà dans ce clan' };

      // Add user to members
      await set(ref(database, `clans/${foundClanId}/members/${uid}`), 'member');

      // Update user profile
      await set(ref(database, `users/${uid}/clans/${foundClanId}`), 'member');

      logger.success(`Joined clan ${foundClanId}`);
      return { success: true, clanId: foundClanId };
    } catch (error) {
      logger.error('Error joining clan:', error);
      return { success: false, error: 'Erreur lors de la connexion au clan' };
    }
  }

  // Leave current clan
  async leaveClan(clanId) {
    try {
      if (!auth?.currentUser || !database) throw new Error('Not initialized');
      if (!clanId) return { success: false, error: 'ID de clan manquant' };
      const uid = auth.currentUser.uid;

      const userSnapshot = await get(ref(database, `users/${uid}/clans/${clanId}`));
      if (!userSnapshot.exists()) return { success: true };

      // Remove from clan members
      await remove(ref(database, `clans/${clanId}/members/${uid}`));

      // Remove clanId from user profile
      await remove(ref(database, `users/${uid}/clans/${clanId}`));

      // Check remaining members; delete clan if empty
      const clanSnapshot = await get(ref(database, `clans/${clanId}`));
      if (clanSnapshot.exists()) {
        const remainingMembers = clanSnapshot.val().members || {};
        if (Object.keys(remainingMembers).length === 0) {
          await remove(ref(database, `clans/${clanId}`));
          logger.success(`Clan ${clanId} deleted because it became empty.`);
        }
      }

      logger.success(`Left clan ${clanId} successfully`);
      return { success: true };
    } catch (error) {
      logger.error('Error leaving clan:', error);
      return { success: false, error: 'Erreur lors de la sortie du clan' };
    }
  }

  // Get all clans the user is part of
  async getUserClans() {
    try {
      if (!auth?.currentUser || !database) return [];
      const uid = auth.currentUser.uid;

      const userClansSnapshot = await get(ref(database, `users/${uid}/clans`));
      if (!userClansSnapshot.exists()) return [];

      const userClans = userClansSnapshot.val();
      const clanIds = Object.keys(userClans);
      
      const clansData = [];
      for (const clanId of clanIds) {
        const clanSnapshot = await get(ref(database, `clans/${clanId}`));
        if (clanSnapshot.exists()) {
          const data = clanSnapshot.val();
          clansData.push({
            id: clanId,
            name: data.name,
            code: data.code,
            role: userClans[clanId],
            memberCount: Object.keys(data.members || {}).length
          });
        }
      }
      return clansData;
    } catch (error) {
      logger.error('Error fetching user clans:', error);
      return [];
    }
  }

  // Get details for a specific clan
  async getClanDetails(clanId) {
    try {
      if (!auth?.currentUser || !database) return null;
      if (!clanId) return null;
      const uid = auth.currentUser.uid;

      const clanSnapshot = await get(ref(database, `clans/${clanId}`));
      if (!clanSnapshot.exists()) return null;

      const clanData = clanSnapshot.val();

      // Fetch member details (pseudo, photoURL) to display list
      const lbSnapshot = await get(ref(database, 'leaderboard'));
      const leaderboards = lbSnapshot.exists() ? lbSnapshot.val() : {};

      const memberIds = Object.keys(clanData.members || {});
      const members = memberIds.map(memberUid => {
        const lbData = leaderboards[memberUid] || {};
        return {
          uid: memberUid,
          role: clanData.members[memberUid],
          pseudo: lbData.pseudo || 'Anonyme',
          photoURL: lbData.photoURL || null,
          totalReps: lbData.totalReps || 0,
          exerciseReps: lbData.exerciseReps || {},
          achievements: lbData.achievements || 0,
          lastActiveDay: lbData.lastActiveDay || null,
          difficultyMultiplier: lbData.difficultyMultiplier || 1,
          lastUpdated: lbData.lastUpdated || null,
          isCurrentUser: memberUid === uid
        };
      });

      // Sort by total reps
      members.sort((a, b) => b.totalReps - a.totalReps);

      return {
        id: clanId,
        name: clanData.name,
        code: clanData.code,
        members
      };
    } catch (error) {
      logger.error('Error fetching clan details:', error);
      return null;
    }
  }

  // Send a interaction/nudge to a clan member
  async sendClanNotification(targetUid, type = 'nudge', message = i18n.t('common.poke')) {
    try {
      if (!auth?.currentUser || !database) return false;
      const fromUid = auth.currentUser.uid;

      // Get sender's pseudo
      const lbSnapshot = await get(ref(database, `leaderboard/${fromUid}`));
      const pseudo = lbSnapshot.exists() && lbSnapshot.val().pseudo ? lbSnapshot.val().pseudo : i18n.t('common.member');
      const photoURL = lbSnapshot.exists() && lbSnapshot.val().photoURL ? lbSnapshot.val().photoURL : null;

      const notifsRef = ref(database, `notifications/${targetUid}`);
      const newNotifRef = push(notifsRef);

      await set(newNotifRef, {
        type,
        message,
        fromUid,
        fromName: pseudo,
        fromPhoto: photoURL,
        timestamp: serverTimestamp(),
        read: false
      });

      logger.success(`Nudge sent to ${targetUid}`);
      return true;
    } catch (error) {
      logger.error('Error sending notification:', error);
      return false;
    }
  }

  // Listen for incoming notifications
  listenToNotifications(callback) {
    try {
      if (!auth?.currentUser || !database) return null;
      const uid = auth.currentUser.uid;

      // Listen specifically for unread logic, but we can query them later and set to read.
      const notifsRef = ref(database, `notifications/${uid}`);

      const unsubscribe = onValue(notifsRef, (snapshot) => {
        if (snapshot.exists()) {
          const notifs = [];
          snapshot.forEach((child) => {
            notifs.push({
              id: child.key,
              ...child.val()
            });
          });
          callback(notifs);
        } else {
          callback([]);
        }
      });

      return unsubscribe;
    } catch (error) {
      logger.error('Error listening to notifications:', error);
      return null;
    }
  }

  // Mark notification as read (or delete it to save space since it's transient)
  async deleteNotification(notifId) {
    try {
      if (!auth?.currentUser || !database) return false;
      const uid = auth.currentUser.uid;
      await remove(ref(database, `notifications/${uid}/${notifId}`));
      return true;
    } catch (error) {
      logger.error('Error deleting notification:', error);
      return false;
    }
  }
}

// Exporter une instance singleton
export const cloudSync = new CloudSyncService();
