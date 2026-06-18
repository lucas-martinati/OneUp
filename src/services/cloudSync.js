import { initializeFirebase, getAuthInstance } from './firebase';
import { mergeData } from '../utils/syncUtils';

const USER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class CloudSyncService {
  constructor() {
    this.listeners = new Set();
    this.listeners.add((state) => {
      this.lastAuthState = state;
    });
    this._userDetailsCache = new Map();
    this._initialized = false;
    this._initPromise = null;
    this.lastAuthState = null;

    // Placeholders for dynamically imported services
    this._dataSyncService = null;
    this._leaderboardService = null;
    this._userDataService = null;
    this._weightHistoryService = null;
    this._cardioService = null;
    this._clanService = null;
    this._authService = null;
  }

  /**
   * Lazily boot Firebase and the auth-state listener. Deferred out of the
   * constructor so visitors who were never signed in don't pay the cost of
   * loading the Firebase SDK and connecting the auth iframe on first paint.
   * Call before any sign-in, and on startup only for returning users.
   * Idempotent.
   */
  ensureInitialized() {
    if (this._initPromise) return this._initPromise;

    this._initPromise = (async () => {
      initializeFirebase();

      // Dynamically load services to keep Firebase SDK out of initial bundle
      const [
        dataSync,
        leaderboard,
        userData,
        weightHistory,
        cardio,
        clan,
        auth
      ] = await Promise.all([
        import('./dataSyncService'),
        import('./leaderboardService'),
        import('./userDataService'),
        import('./weightHistoryService'),
        import('./cardioService'),
        import('./clanService'),
        import('./authService')
      ]);

      this._dataSyncService = dataSync;
      this._leaderboardService = leaderboard;
      this._userDataService = userData;
      this._weightHistoryService = weightHistory;
      this._cardioService = cardio;
      this._clanService = clan;
      this._authService = auth;

      // Delegate methods dynamically for any runtime methods not explicitly declared below
      const delegatedServices = [dataSync, leaderboard, userData, weightHistory, cardio, clan];
      for (const service of delegatedServices) {
        for (const [key, method] of Object.entries(service)) {
          if (typeof method === 'function') {
            if (!(key in this)) {
              this[key] = method.bind(service);
            }
          }
        }
      }

      // Setup the auth listener
      this._authService.setupAuthListener(this.listeners);

      this._initialized = true;
    })();

    return this._initPromise;
  }

  subscribe(callback) {
    this.listeners.add(callback);
    // Replay the latest auth state: onAuthStateChanged may already have fired
    // before this subscriber mounted (would otherwise stay on loading screen).
    if (this.lastAuthState) {
      callback(this.lastAuthState);
    } else if (this._authService) {
      const last = this._authService.getLastAuthState();
      if (last) callback(last);
    }
    return () => this.listeners.delete(callback);
  }

  // Pure function runs synchronously without loading Firebase
  mergeData(localData, cloudData) {
    return mergeData(localData, cloudData);
  }

  // ── Proxy functions that ensure initialization ─────────────────────

  async loadUserDetailsWithCache(uid) {
    const cached = this._userDetailsCache.get(uid);
    const now = Date.now();
    if (cached && (now - cached.timestamp) < USER_CACHE_TTL) {
      return cached.data;
    }
    await this.ensureInitialized();
    const data = await this._leaderboardService.loadUserDetails(uid);
    this._userDetailsCache.set(uid, { data, timestamp: now });
    return data;
  }

  async signInWithGoogle(idToken) {
    await this.ensureInitialized();
    return this._authService.signInWithGoogle(idToken, this.listeners);
  }

  async signInWithGoogleWeb(accessToken, userInfo) {
    await this.ensureInitialized();
    return this._authService.signInWithGoogleWeb(accessToken, userInfo, this.listeners);
  }

  async signOut() {
    this._userDetailsCache.clear();
    await this.ensureInitialized();
    return this._authService.signOut(this.listeners);
  }

  async deleteAccount() {
    this._userDetailsCache.clear();
    await this.ensureInitialized();
    return this._authService.deleteAccount(
      this.listeners,
      (id) => this._clanService.leaveClan(id),
      () => this._clanService.getUserClans()
    );
  }

  async checkSignInStatus() {
    await this.ensureInitialized();
    return this._authService.checkSignInStatus();
  }

  getCurrentUserId() {
    // Non-blocking lookup using the global Firebase Auth instance.
    // If not initialized yet, returns null. Doesn't trigger lazy-load on its own.
    const auth = getAuthInstance();
    return auth?.currentUser?.uid || null;
  }

  // ── Explicit proxy getters/wrappers for all delegated methods to prevent undefined errors ──

  saveToCloud = async (...args) => {
    await this.ensureInitialized();
    return this._dataSyncService.saveToCloud(...args);
  };

  loadFromCloud = async (...args) => {
    await this.ensureInitialized();
    return this._dataSyncService.loadFromCloud(...args);
  };

  syncData = async (...args) => {
    await this.ensureInitialized();
    return this._dataSyncService.syncData(...args);
  };

  listenToCloudChanges = (callback) => {
    let unsubscribed = false;
    let actualUnsubscribe = null;

    this.ensureInitialized().then(() => {
      if (unsubscribed) return;
      actualUnsubscribe = this._dataSyncService.listenToCloudChanges(callback);
    });

    return () => {
      unsubscribed = true;
      if (actualUnsubscribe) actualUnsubscribe();
    };
  };

  loadLeaderboard = async (...args) => {
    await this.ensureInitialized();
    return this._leaderboardService.loadLeaderboard(...args);
  };

  loadUserDetails = async (...args) => {
    await this.ensureInitialized();
    return this._leaderboardService.loadUserDetails(...args);
  };

  saveSettingsToCloud = async (...args) => {
    await this.ensureInitialized();
    return this._userDataService.saveSettingsToCloud(...args);
  };

  listenToSettingsFromCloud = (callback) => {
    let unsubscribed = false;
    let actualUnsubscribe = null;
    this.ensureInitialized().then(() => {
      if (unsubscribed) return;
      actualUnsubscribe = this._userDataService.listenToSettingsFromCloud(callback);
    });
    return () => {
      unsubscribed = true;
      if (actualUnsubscribe) actualUnsubscribe();
    };
  };

  saveRoutinesToCloud = async (...args) => {
    await this.ensureInitialized();
    return this._userDataService.saveRoutinesToCloud(...args);
  };

  listenToRoutinesFromCloud = (callback) => {
    let unsubscribed = false;
    let actualUnsubscribe = null;
    this.ensureInitialized().then(() => {
      if (unsubscribed) return;
      actualUnsubscribe = this._userDataService.listenToRoutinesFromCloud(callback);
    });
    return () => {
      unsubscribed = true;
      if (actualUnsubscribe) actualUnsubscribe();
    };
  };

  saveCustomExercisesToCloud = async (...args) => {
    await this.ensureInitialized();
    return this._userDataService.saveCustomExercisesToCloud(...args);
  };

  listenToCustomExercisesFromCloud = (callback) => {
    let unsubscribed = false;
    let actualUnsubscribe = null;
    this.ensureInitialized().then(() => {
      if (unsubscribed) return;
      actualUnsubscribe = this._userDataService.listenToCustomExercisesFromCloud(callback);
    });
    return () => {
      unsubscribed = true;
      if (actualUnsubscribe) actualUnsubscribe();
    };
  };

  saveCustomCategoriesToCloud = async (...args) => {
    await this.ensureInitialized();
    return this._userDataService.saveCustomCategoriesToCloud(...args);
  };

  listenToCustomCategoriesFromCloud = (callback) => {
    let unsubscribed = false;
    let actualUnsubscribe = null;
    this.ensureInitialized().then(() => {
      if (unsubscribed) return;
      actualUnsubscribe = this._userDataService.listenToCustomCategoriesFromCloud(callback);
    });
    return () => {
      unsubscribed = true;
      if (actualUnsubscribe) actualUnsubscribe();
    };
  };

  loadPurchase = async (...args) => {
    await this.ensureInitialized();
    return this._userDataService.loadPurchase(...args);
  };

  saveAchievementsToCloud = async (...args) => {
    await this.ensureInitialized();
    return this._userDataService.saveAchievementsToCloud(...args);
  };

  loadAchievementsFromCloud = async (...args) => {
    await this.ensureInitialized();
    return this._userDataService.loadAchievementsFromCloud(...args);
  };

  saveWeightHistoryToCloud = async (...args) => {
    await this.ensureInitialized();
    return this._weightHistoryService.saveWeightHistoryToCloud(...args);
  };

  listenToWeightHistoryFromCloud = (callback) => {
    let unsubscribed = false;
    let actualUnsubscribe = null;
    this.ensureInitialized().then(() => {
      if (unsubscribed) return;
      actualUnsubscribe = this._weightHistoryService.listenToWeightHistoryFromCloud(callback);
    });
    return () => {
      unsubscribed = true;
      if (actualUnsubscribe) actualUnsubscribe();
    };
  };

  saveCardioSessionsToCloud = async (...args) => {
    await this.ensureInitialized();
    return this._cardioService.saveCardioSessionsToCloud(...args);
  };

  listenToCardioSessionsFromCloud = (callback) => {
    let unsubscribed = false;
    let actualUnsubscribe = null;
    this.ensureInitialized().then(() => {
      if (unsubscribed) return;
      actualUnsubscribe = this._cardioService.listenToCardioSessionsFromCloud(callback);
    });
    return () => {
      unsubscribed = true;
      if (actualUnsubscribe) actualUnsubscribe();
    };
  };

  createClan = async (...args) => {
    await this.ensureInitialized();
    return this._clanService.createClan(...args);
  };

  joinClan = async (...args) => {
    await this.ensureInitialized();
    return this._clanService.joinClan(...args);
  };

  leaveClan = async (...args) => {
    await this.ensureInitialized();
    return this._clanService.leaveClan(...args);
  };

  getUserClans = async (...args) => {
    await this.ensureInitialized();
    return this._clanService.getUserClans(...args);
  };

  getClanDetails = async (...args) => {
    await this.ensureInitialized();
    return this._clanService.getClanDetails(...args);
  };

  sendPoke = async (...args) => {
    await this.ensureInitialized();
    return this._clanService.sendPoke(...args);
  };

  listenToNotifications = (callback) => {
    let unsubscribed = false;
    let actualUnsubscribe = null;
    this.ensureInitialized().then(() => {
      if (unsubscribed) return;
      actualUnsubscribe = this._clanService.listenToNotifications(callback);
    });
    return () => {
      unsubscribed = true;
      if (actualUnsubscribe) actualUnsubscribe();
    };
  };

  deleteNotification = async (...args) => {
    await this.ensureInitialized();
    return this._clanService.deleteNotification(...args);
  };

  loadSettingsFromCloud = async (...args) => {
    await this.ensureInitialized();
    return this._userDataService.loadSettingsFromCloud(...args);
  };

  loadRoutinesFromCloud = async (...args) => {
    await this.ensureInitialized();
    return this._userDataService.loadRoutinesFromCloud(...args);
  };

  loadCustomExercisesFromCloud = async (...args) => {
    await this.ensureInitialized();
    return this._userDataService.loadCustomExercisesFromCloud(...args);
  };

  saveProgramCompletionsToCloud = async (...args) => {
    await this.ensureInitialized();
    return this._userDataService.saveProgramCompletionsToCloud(...args);
  };

  loadProgramCompletionsFromCloud = async (...args) => {
    await this.ensureInitialized();
    return this._userDataService.loadProgramCompletionsFromCloud(...args);
  };

  saveExerciseWeightsToCloud = async (...args) => {
    await this.ensureInitialized();
    return this._userDataService.saveExerciseWeightsToCloud(...args);
  };

  loadExerciseWeightsFromCloud = async (...args) => {
    await this.ensureInitialized();
    return this._userDataService.loadExerciseWeightsFromCloud(...args);
  };

  loadCustomCategoriesFromCloud = async (...args) => {
    await this.ensureInitialized();
    return this._userDataService.loadCustomCategoriesFromCloud(...args);
  };
}

export const cloudSync = new CloudSyncService();
