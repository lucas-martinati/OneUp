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

class CloudSyncService {
  constructor() {
    this.listeners = new Set();
    initializeFirebase();
    authService.setupAuthListener(this.listeners);

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

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Auth methods need specific handling due to `this.listeners` injection or specific callbacks
  async signInWithGoogle(idToken) {
    return authService.signInWithGoogle(idToken, this.listeners);
  }

  async signInWithGoogleWeb(accessToken, userInfo) {
    return authService.signInWithGoogleWeb(accessToken, userInfo, this.listeners);
  }

  async signOut() {
    return authService.signOut(this.listeners);
  }

  async deleteAccount() {
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