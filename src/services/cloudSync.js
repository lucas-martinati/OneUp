import { initializeFirebase } from './firebase';
import * as authService from './authService';
import * as dataSyncService from './dataSyncService';
import * as leaderboardService from './leaderboardService';
import * as clanService from './clanService';
import * as userDataService from './userDataService';
import * as weightHistoryService from './weightHistoryService';
import * as cardioService from './cardioService';

const DELEGATED_SERVICES = [
  dataSyncService,
  leaderboardService,
  userDataService,
  weightHistoryService,
  cardioService,
  clanService,
];

const USER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class CloudSyncService {
  constructor() {
    this.listeners = new Set();
    this._userDetailsCache = new Map();
    this._initialized = false;

    for (const service of DELEGATED_SERVICES) {
      for (const [key, method] of Object.entries(service)) {
        if (typeof method === 'function') {
          if (key in this) {
            console.warn(`CloudSync: collision sur "${key}"`);
          }
          this[key] = method;
        }
      }
    }
  }

  /**
   * Lazily boot Firebase and the auth-state listener. Deferred out of the
   * constructor so visitors who were never signed in don't pay the cost of
   * loading the Firebase SDK and connecting the auth iframe on first paint.
   * Call before any sign-in, and on startup only for returning users.
   * Idempotent.
   */
  ensureInitialized() {
    if (this._initialized) return;
    this._initialized = true;
    initializeFirebase();
    authService.setupAuthListener(this.listeners);
  }

  subscribe(callback) {
    this.listeners.add(callback);
    // Replay the latest auth state: onAuthStateChanged may already have fired
    // before this subscriber mounted (would otherwise stay on loading screen).
    const last = authService.getLastAuthState();
    if (last) callback(last);
    return () => this.listeners.delete(callback);
  }

  /**
   * Load user details with built-in caching (5 min TTL).
   */
  async loadUserDetailsWithCache(uid) {
    const cached = this._userDetailsCache.get(uid);
    const now = Date.now();
    if (cached && (now - cached.timestamp) < USER_CACHE_TTL) {
      return cached.data;
    }
    const data = await this.loadUserDetails(uid);
    this._userDetailsCache.set(uid, { data, timestamp: now });
    return data;
  }

  // Auth methods need specific handling due to `this.listeners` injection or specific callbacks
  async signInWithGoogle(idToken) {
    return authService.signInWithGoogle(idToken, this.listeners);
  }

  async signInWithGoogleWeb(accessToken, userInfo) {
    return authService.signInWithGoogleWeb(accessToken, userInfo, this.listeners);
  }

  async signOut() {
    this._userDetailsCache.clear();
    return authService.signOut(this.listeners);
  }

  async deleteAccount() {
    this._userDetailsCache.clear();
    return authService.deleteAccount(
      this.listeners,
      (id) => clanService.leaveClan(id),
      () => clanService.getUserClans()
    );
  }

  checkSignInStatus() {
    return authService.checkSignInStatus();
  }

  getCurrentUserId() {
    return authService.getCurrentUserId();
  }
}

export const cloudSync = new CloudSyncService();