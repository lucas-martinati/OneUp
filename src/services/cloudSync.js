import { createLogger } from '../utils/logger';
import { initializeFirebase } from './firebase';
import {
  setupAuthListener, signInWithGoogle, signInWithGoogleWeb,
  signOut as authSignOut, deleteAccount as authDeleteAccount,
  checkSignInStatus, getCurrentUserId
} from './authService';
import {
  saveToCloud, loadFromCloud, listenToCloudChanges,
  mergeData, syncData
} from './dataSyncService';
import {
  publishToLeaderboard, removeFromLeaderboard,
  loadLeaderboard, loadUserDetails
} from './leaderboardService';
import {
  createClan, joinClan, leaveClan, getUserClans,
  getClanDetails, sendClanNotification,
  listenToNotifications, deleteNotification
} from './clanService';
import {
  saveSettingsToCloud, loadSettingsFromCloud,
  savePurchase, loadPurchase,
  saveRoutinesToCloud, loadRoutinesFromCloud,
  saveCustomExercisesToCloud, loadCustomExercisesFromCloud,
  saveProgramCompletionsToCloud, loadProgramCompletionsFromCloud
} from './userDataService';

const logger = createLogger('CloudSync');

class CloudSyncService {
  constructor() {
    this.listeners = new Set();
    initializeFirebase();
    setupAuthListener(this.listeners);
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Auth
  async signInWithGoogle(idToken) { return signInWithGoogle(idToken, this.listeners); }
  async signInWithGoogleWeb(accessToken, userInfo) { return signInWithGoogleWeb(accessToken, userInfo, this.listeners); }
  async signOut() { return authSignOut(this.listeners); }
  async deleteAccount() { return authDeleteAccount(this.listeners, (id) => leaveClan(id), () => getUserClans()); }
  checkSignInStatus() { return checkSignInStatus(); }
  getCurrentUserId() { return getCurrentUserId(); }

  // Data sync
  saveToCloud(data) { return saveToCloud(data); }
  loadFromCloud() { return loadFromCloud(); }
  listenToCloudChanges(cb) { return listenToCloudChanges(cb); }
  mergeData(local, cloud) { return mergeData(local, cloud); }
  syncData(local) { return syncData(local); }

  // Leaderboard
  publishToLeaderboard(data) { return publishToLeaderboard(data); }
  removeFromLeaderboard() { return removeFromLeaderboard(); }
  loadLeaderboard() { return loadLeaderboard(); }
  loadUserDetails(uid) { return loadUserDetails(uid); }

  // Settings
  saveSettingsToCloud(s) { return saveSettingsToCloud(s); }
  loadSettingsFromCloud() { return loadSettingsFromCloud(); }

  // Purchase
  savePurchase(p) { return savePurchase(p); }
  loadPurchase() { return loadPurchase(); }

  // Routines
  saveRoutinesToCloud(r) { return saveRoutinesToCloud(r); }
  loadRoutinesFromCloud() { return loadRoutinesFromCloud(); }

  // Custom exercises
  saveCustomExercisesToCloud(e) { return saveCustomExercisesToCloud(e); }
  loadCustomExercisesFromCloud() { return loadCustomExercisesFromCloud(); }

  // Program completions
  saveProgramCompletionsToCloud(id, c) { return saveProgramCompletionsToCloud(id, c); }
  loadProgramCompletionsFromCloud(id) { return loadProgramCompletionsFromCloud(id); }

  // Clan
  createClan(name) { return createClan(name); }
  joinClan(code) { return joinClan(code); }
  leaveClan(id) { return leaveClan(id); }
  getUserClans() { return getUserClans(); }
  getClanDetails(id) { return getClanDetails(id); }
  sendClanNotification(uid, type, msg) { return sendClanNotification(uid, type, msg); }
  listenToNotifications(cb) { return listenToNotifications(cb); }
  deleteNotification(id) { return deleteNotification(id); }
}

export const cloudSync = new CloudSyncService();
