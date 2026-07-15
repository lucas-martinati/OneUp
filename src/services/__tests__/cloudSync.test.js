import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cloudSync } from '../cloudSync';
import { getAuthInstance } from '../firebase';
import { mergeData } from '@utils/syncUtils';

// Mock dependencies
vi.mock('../firebase', () => ({
  initializeFirebase: vi.fn(),
  getAuthInstance: vi.fn(() => ({ currentUser: { uid: 'user123' } }))
}));

vi.mock('@utils/syncUtils', () => ({
  mergeData: vi.fn(() => ({ merged: true }))
}));

const createMockService = (methods) => {
  const service = {};
  methods.forEach(m => {
    if (m.startsWith('listen')) {
      service[m] = vi.fn(() => vi.fn()); // returns unsubscribe function
    } else {
      service[m] = vi.fn().mockResolvedValue('success');
    }
  });
  return service;
};

const mockDataSync = createMockService(['saveToCloud', 'loadFromCloud', 'syncData', 'listenToCloudChanges']);
const mockLeaderboard = createMockService(['loadUserDetails', 'loadLeaderboard']);
const mockUserData = createMockService([
  'saveSettingsToCloud', 'listenToSettingsFromCloud', 'saveRoutinesToCloud', 'listenToRoutinesFromCloud',
  'saveCustomExercisesToCloud', 'listenToCustomExercisesFromCloud', 'saveCustomCategoriesToCloud',
  'listenToCustomCategoriesFromCloud', 'loadPurchase', 'saveAchievementsToCloud', 'loadAchievementsFromCloud',
  'loadSettingsFromCloud', 'loadRoutinesFromCloud', 'loadCustomExercisesFromCloud', 'saveProgramCompletionsToCloud',
  'loadProgramCompletionsFromCloud', 'saveExerciseWeightsToCloud', 'loadExerciseWeightsFromCloud',
  'loadCustomCategoriesFromCloud'
]);
const mockWeightHistory = createMockService(['saveWeightHistoryToCloud', 'listenToWeightHistoryFromCloud']);
const mockCardio = createMockService(['saveCardioSessionsToCloud', 'listenToCardioSessionsFromCloud']);
const mockClan = createMockService(['leaveClan', 'getUserClans', 'createClan', 'joinClan', 'getClanDetails', 'sendPoke', 'listenToNotifications', 'deleteNotification']);
const mockAuth = {
  setupAuthListener: vi.fn(),
  getLastAuthState: vi.fn(),
  signInWithGoogle: vi.fn().mockResolvedValue('google-success'),
  signInWithGoogleWeb: vi.fn().mockResolvedValue('google-web-success'),
  signOut: vi.fn().mockResolvedValue('signout-success'),
  deleteAccount: vi.fn().mockResolvedValue('delete-success'),
  checkSignInStatus: vi.fn().mockResolvedValue('status'),
};

vi.mock('../dataSyncService', () => mockDataSync);
vi.mock('../leaderboardService', () => mockLeaderboard);
vi.mock('../userDataService', () => mockUserData);
vi.mock('../weightHistoryService', () => mockWeightHistory);
vi.mock('../cardioService', () => mockCardio);
vi.mock('../clanService', () => mockClan);
vi.mock('../authService', () => mockAuth);

describe('CloudSyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization and Core Methods', () => {
    it('getCurrentUserId returns uid from firebase auth', () => {
      expect(cloudSync.getCurrentUserId()).toBe('user123');
      
      getAuthInstance.mockReturnValueOnce(null);
      expect(cloudSync.getCurrentUserId()).toBeNull();
    });

    it('mergeData calls syncUtils mergeData', () => {
      const result = cloudSync.mergeData({ a: 1 }, { b: 2 });
      expect(mergeData).toHaveBeenCalledWith({ a: 1 }, { b: 2 });
      expect(result).toEqual({ merged: true });
    });

    it('ensureInitialized loads services and sets up auth listener', async () => {
      // It is idempotent
      await cloudSync.ensureInitialized();
      await cloudSync.ensureInitialized();
      expect(mockAuth.setupAuthListener).toHaveBeenCalledTimes(1);
    });

    it('subscribe adds listener and replays state', () => {
      const cb = vi.fn();
      
      // Setup fake auth state
      cloudSync.lastAuthState = { user: 'test' };
      const unsubscribe = cloudSync.subscribe(cb);
      
      expect(cb).toHaveBeenCalledWith({ user: 'test' });
      
      // Cleanup
      cloudSync.lastAuthState = null;
      unsubscribe();
    });
    
    it('subscribe uses getLastAuthState if no lastAuthState', () => {
        const cb = vi.fn();
        mockAuth.getLastAuthState.mockReturnValueOnce({ user: 'mocked' });
        
        cloudSync.lastAuthState = null; // Ensure null
        cloudSync.subscribe(cb);
        expect(cb).toHaveBeenCalledWith({ user: 'mocked' });
    });
    
    it('loadUserDetailsWithCache caches results', async () => {
      mockLeaderboard.loadUserDetails.mockResolvedValueOnce({ user: '1' });
      
      const r1 = await cloudSync.loadUserDetailsWithCache('test-uid');
      const r2 = await cloudSync.loadUserDetailsWithCache('test-uid');
      
      expect(r1).toEqual({ user: '1' });
      expect(r2).toEqual({ user: '1' });
      expect(mockLeaderboard.loadUserDetails).toHaveBeenCalledTimes(1); // cached
    });
  });

  describe('Auth Methods', () => {
    it('signInWithGoogle', async () => {
      const res = await cloudSync.signInWithGoogle('token');
      expect(mockAuth.signInWithGoogle).toHaveBeenCalledWith('token', cloudSync.listeners);
      expect(res).toBe('google-success');
    });

    it('signInWithGoogleWeb', async () => {
      const res = await cloudSync.signInWithGoogleWeb('token', { info: 1 });
      expect(mockAuth.signInWithGoogleWeb).toHaveBeenCalledWith('token', { info: 1 }, cloudSync.listeners);
      expect(res).toBe('google-web-success');
    });

    it('signOut', async () => {
      const res = await cloudSync.signOut();
      expect(mockAuth.signOut).toHaveBeenCalledWith(cloudSync.listeners);
      expect(res).toBe('signout-success');
    });

    it('deleteAccount', async () => {
      const res = await cloudSync.deleteAccount();
      // Test the callbacks passed to deleteAccount
      const callbacks = mockAuth.deleteAccount.mock.calls[0];
      expect(callbacks[0]).toBe(cloudSync.listeners);
      
      // Test leaveClan callback
      await callbacks[1]('clan1');
      expect(mockClan.leaveClan).toHaveBeenCalledWith('clan1');
      
      // Test getUserClans callback
      await callbacks[2]();
      expect(mockClan.getUserClans).toHaveBeenCalled();
      
      expect(res).toBe('delete-success');
    });

    it('checkSignInStatus', async () => {
      const res = await cloudSync.checkSignInStatus();
      expect(mockAuth.checkSignInStatus).toHaveBeenCalled();
      expect(res).toBe('status');
    });
  });

  describe('Async Proxy Methods', () => {
    const methods = [
      { name: 'saveToCloud', mock: mockDataSync },
      { name: 'loadFromCloud', mock: mockDataSync },
      { name: 'syncData', mock: mockDataSync },
      { name: 'loadLeaderboard', mock: mockLeaderboard },
      { name: 'loadUserDetails', mock: mockLeaderboard },
      { name: 'saveSettingsToCloud', mock: mockUserData },
      { name: 'saveRoutinesToCloud', mock: mockUserData },
      { name: 'saveCustomExercisesToCloud', mock: mockUserData },
      { name: 'saveCustomCategoriesToCloud', mock: mockUserData },
      { name: 'loadPurchase', mock: mockUserData },
      { name: 'saveAchievementsToCloud', mock: mockUserData },
      { name: 'loadAchievementsFromCloud', mock: mockUserData },
      { name: 'saveWeightHistoryToCloud', mock: mockWeightHistory },
      { name: 'saveCardioSessionsToCloud', mock: mockCardio },
      { name: 'createClan', mock: mockClan },
      { name: 'joinClan', mock: mockClan },
      { name: 'leaveClan', mock: mockClan },
      { name: 'getUserClans', mock: mockClan },
      { name: 'getClanDetails', mock: mockClan },
      { name: 'sendPoke', mock: mockClan },
      { name: 'deleteNotification', mock: mockClan },
      { name: 'loadSettingsFromCloud', mock: mockUserData },
      { name: 'loadRoutinesFromCloud', mock: mockUserData },
      { name: 'loadCustomExercisesFromCloud', mock: mockUserData },
      { name: 'saveProgramCompletionsToCloud', mock: mockUserData },
      { name: 'loadProgramCompletionsFromCloud', mock: mockUserData },
      { name: 'saveExerciseWeightsToCloud', mock: mockUserData },
      { name: 'loadExerciseWeightsFromCloud', mock: mockUserData },
      { name: 'loadCustomCategoriesFromCloud', mock: mockUserData },
    ];

    methods.forEach(({ name, mock }) => {
      it(`delegates ${name} correctly`, async () => {
        const res = await cloudSync[name]('arg1', 'arg2');
        expect(mock[name]).toHaveBeenCalledWith('arg1', 'arg2');
        expect(res).toBe('success');
      });
    });
  });

  describe('Listener Proxy Methods', () => {
    const listeners = [
      { name: 'listenToCloudChanges', mock: mockDataSync },
      { name: 'listenToSettingsFromCloud', mock: mockUserData },
      { name: 'listenToRoutinesFromCloud', mock: mockUserData },
      { name: 'listenToCustomExercisesFromCloud', mock: mockUserData },
      { name: 'listenToCustomCategoriesFromCloud', mock: mockUserData },
      { name: 'listenToWeightHistoryFromCloud', mock: mockWeightHistory },
      { name: 'listenToCardioSessionsFromCloud', mock: mockCardio },
      { name: 'listenToNotifications', mock: mockClan },
    ];

    listeners.forEach(({ name, mock }) => {
      it(`delegates ${name} correctly and handles unsubscribing before init`, async () => {
        const cb = vi.fn();
        const mockUnsubscribe = vi.fn();
        mock[name].mockReturnValue(mockUnsubscribe);

        // Call listener (it triggers init asynchronously)
        const unsubscribe = cloudSync[name](cb);
        
        // Immediately unsubscribe before init completes
        unsubscribe();
        
        // Let promises resolve
        await new Promise(resolve => setTimeout(resolve, 0));
        
        // The underlying service should NOT have been subscribed to, because we aborted
        expect(mock[name]).not.toHaveBeenCalled();
      });

      it(`delegates ${name} correctly and handles unsubscribing after init`, async () => {
        const cb = vi.fn();
        const mockUnsubscribe = vi.fn();
        mock[name].mockReturnValue(mockUnsubscribe);

        // Ensure initialized first so we can test the normal path
        await cloudSync.ensureInitialized();
        
        const unsubscribe = cloudSync[name](cb);
        
        // Let promise resolve
        await new Promise(resolve => setTimeout(resolve, 0));
        
        expect(mock[name]).toHaveBeenCalledWith(cb);
        
        // Now unsubscribe
        unsubscribe();
        expect(mockUnsubscribe).toHaveBeenCalled();
      });
    });
  });
});
