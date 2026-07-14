import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cloudSync } from '../cloudSync';
import { initializeFirebase, getAuthInstance } from '../firebase';

vi.mock('../firebase', () => ({
    initializeFirebase: vi.fn(),
    getAuthInstance: vi.fn(),
}));

vi.mock('@utils/syncUtils', () => ({
    mergeData: vi.fn((a, b) => ({ ...a, ...b }))
}));

// Mock dynamic imports by intercepting them or mocking the resolved modules
const mockDataSyncService = {
    saveToCloud: vi.fn(),
    loadFromCloud: vi.fn(),
    syncData: vi.fn(),
    listenToCloudChanges: vi.fn(() => vi.fn())
};

const mockLeaderboardService = {
    loadLeaderboard: vi.fn(),
    loadUserDetails: vi.fn()
};

const mockUserDataService = {
    saveSettingsToCloud: vi.fn(),
    listenToSettingsFromCloud: vi.fn(() => vi.fn()),
    saveRoutinesToCloud: vi.fn(),
    listenToRoutinesFromCloud: vi.fn(() => vi.fn()),
    saveCustomExercisesToCloud: vi.fn(),
    listenToCustomExercisesFromCloud: vi.fn(() => vi.fn()),
    saveCustomCategoriesToCloud: vi.fn(),
    listenToCustomCategoriesFromCloud: vi.fn(() => vi.fn()),
    loadPurchase: vi.fn(),
    saveAchievementsToCloud: vi.fn(),
    loadAchievementsFromCloud: vi.fn(),
    loadSettingsFromCloud: vi.fn(),
    loadRoutinesFromCloud: vi.fn(),
    loadCustomExercisesFromCloud: vi.fn(),
    saveProgramCompletionsToCloud: vi.fn(),
    loadProgramCompletionsFromCloud: vi.fn(),
    saveExerciseWeightsToCloud: vi.fn(),
    loadExerciseWeightsFromCloud: vi.fn(),
    loadCustomCategoriesFromCloud: vi.fn()
};

const mockWeightHistoryService = {
    saveWeightHistoryToCloud: vi.fn(),
    listenToWeightHistoryFromCloud: vi.fn(() => vi.fn())
};

const mockCardioService = {
    saveCardioSessionsToCloud: vi.fn(),
    listenToCardioSessionsFromCloud: vi.fn(() => vi.fn())
};

const mockClanService = {
    createClan: vi.fn(),
    joinClan: vi.fn(),
    leaveClan: vi.fn(),
    getUserClans: vi.fn(),
    getClanDetails: vi.fn(),
    sendPoke: vi.fn(),
    listenToNotifications: vi.fn(() => vi.fn()),
    deleteNotification: vi.fn()
};

const mockAuthService = {
    setupAuthListener: vi.fn(),
    getLastAuthState: vi.fn(() => ({ isSignedIn: true })),
    signInWithGoogle: vi.fn(),
    signInWithGoogleWeb: vi.fn(),
    signOut: vi.fn(),
    deleteAccount: vi.fn(),
    checkSignInStatus: vi.fn()
};

vi.mock('../dataSyncService', () => mockDataSyncService);
vi.mock('../leaderboardService', () => mockLeaderboardService);
vi.mock('../userDataService', () => mockUserDataService);
vi.mock('../weightHistoryService', () => mockWeightHistoryService);
vi.mock('../cardioService', () => mockCardioService);
vi.mock('../clanService', () => mockClanService);
vi.mock('../authService', () => mockAuthService);

describe('cloudSync', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset the singleton instance state
        cloudSync._initialized = false;
        cloudSync._initPromise = null;
        cloudSync._userDetailsCache.clear();
        cloudSync.listeners.clear();
        // Re-add the internal listener
        cloudSync.listeners.add((state) => {
            cloudSync.lastAuthState = state;
        });
        cloudSync.lastAuthState = null;
    });

    it('initializes once', async () => {
        const promise1 = cloudSync.ensureInitialized();
        const promise2 = cloudSync.ensureInitialized();
        
        expect(promise1).toBe(promise2);
        
        await promise1;
        expect(initializeFirebase).toHaveBeenCalled();
        expect(cloudSync._initialized).toBe(true);
    });

    it('delegates methods correctly after initialization', async () => {
        await cloudSync.saveToCloud({ test: true });
        expect(mockDataSyncService.saveToCloud).toHaveBeenCalledWith({ test: true });
        
        await cloudSync.loadLeaderboard();
        expect(mockLeaderboardService.loadLeaderboard).toHaveBeenCalled();
        
        await cloudSync.saveSettingsToCloud({});
        expect(mockUserDataService.saveSettingsToCloud).toHaveBeenCalled();
        
        await cloudSync.saveWeightHistoryToCloud([]);
        expect(mockWeightHistoryService.saveWeightHistoryToCloud).toHaveBeenCalled();
        
        await cloudSync.createClan();
        expect(mockClanService.createClan).toHaveBeenCalled();
    });

    it('caches loadUserDetails', async () => {
        mockLeaderboardService.loadUserDetails.mockResolvedValue({ name: 'Alice' });
        
        const res1 = await cloudSync.loadUserDetailsWithCache('user1');
        expect(res1).toEqual({ name: 'Alice' });
        expect(mockLeaderboardService.loadUserDetails).toHaveBeenCalledTimes(1);
        
        const res2 = await cloudSync.loadUserDetailsWithCache('user1');
        expect(res2).toEqual({ name: 'Alice' });
        expect(mockLeaderboardService.loadUserDetails).toHaveBeenCalledTimes(1);
    });

    it('merges data synchronously', () => {
        const local = { a: 1 };
        const cloud = { b: 2 };
        const result = cloudSync.mergeData(local, cloud);
        expect(result).toEqual({ a: 1, b: 2 });
    });

    it('subscribes to auth state', async () => {
        const callback = vi.fn();
        const unsubscribe = cloudSync.subscribe(callback);
        
        expect(callback).toHaveBeenCalledWith({ isSignedIn: true }); // From mockAuthService
        
        unsubscribe();
        expect(cloudSync.listeners.has(callback)).toBe(false);
    });
    
    it('getCurrentUserId non-blocking check', () => {
        getAuthInstance.mockReturnValue({ currentUser: { uid: '123' } });
        expect(cloudSync.getCurrentUserId()).toBe('123');
        
        getAuthInstance.mockReturnValue(null);
        expect(cloudSync.getCurrentUserId()).toBe(null);
    });

    it('auth proxy functions', async () => {
        await cloudSync.signInWithGoogle('token');
        expect(mockAuthService.signInWithGoogle).toHaveBeenCalled();

        await cloudSync.signInWithGoogleWeb('token', {});
        expect(mockAuthService.signInWithGoogleWeb).toHaveBeenCalled();

        await cloudSync.signOut();
        expect(mockAuthService.signOut).toHaveBeenCalled();

        await cloudSync.deleteAccount();
        expect(mockAuthService.deleteAccount).toHaveBeenCalled();

        await cloudSync.checkSignInStatus();
        expect(mockAuthService.checkSignInStatus).toHaveBeenCalled();
    });

    it('listener proxy functions subscribe and unsubscribe', async () => {
        // We will test listenToCloudChanges as a representative
        const callback = vi.fn();
        const unsub = cloudSync.listenToCloudChanges(callback);
        
        // Before promise resolves, actualUnsubscribe is null. 
        // If we unsub now, it sets unsubscribed = true
        unsub(); 
        
        await cloudSync.ensureInitialized();
        // Since unsubscribed was true, it should return early
        expect(mockDataSyncService.listenToCloudChanges).not.toHaveBeenCalled();
    });

    it('listener proxy functions call actual unsubscribe if already resolved', async () => {
        const callback = vi.fn();
        const mockUnsub = vi.fn();
        mockDataSyncService.listenToCloudChanges.mockReturnValue(mockUnsub);
        
        const unsub = cloudSync.listenToCloudChanges(callback);
        await cloudSync.ensureInitialized();
        
        // Wait a microtask to let the `.then` resolve
        await new Promise(r => setTimeout(r, 0));
        
        expect(mockDataSyncService.listenToCloudChanges).toHaveBeenCalledWith(callback);
        
        unsub();
        expect(mockUnsub).toHaveBeenCalled();
    });

    it('covers all other listen methods', async () => {
        const methods = [
            'listenToSettingsFromCloud',
            'listenToRoutinesFromCloud',
            'listenToCustomExercisesFromCloud',
            'listenToCustomCategoriesFromCloud',
            'listenToWeightHistoryFromCloud',
            'listenToCardioSessionsFromCloud',
            'listenToNotifications'
        ];
        for (const method of methods) {
            const unsub = cloudSync[method](vi.fn());
            unsub();
        }
    });

    it('covers actualUnsubscribe calls in listen methods', async () => {
        await cloudSync.ensureInitialized();
        const methods = [
            'listenToSettingsFromCloud',
            'listenToRoutinesFromCloud',
            'listenToCustomExercisesFromCloud',
            'listenToCustomCategoriesFromCloud',
            'listenToWeightHistoryFromCloud',
            'listenToCardioSessionsFromCloud',
            'listenToNotifications'
        ];
        for (const method of methods) {
            const unsub = cloudSync[method](vi.fn());
            await new Promise(r => setTimeout(r, 0)); // wait for promise to resolve
            unsub(); // calls actualUnsubscribe
        }
    });

    it('covers all other simple async methods', async () => {
        await cloudSync.saveRoutinesToCloud();
        await cloudSync.saveCustomExercisesToCloud();
        await cloudSync.saveCustomCategoriesToCloud();
        await cloudSync.loadPurchase();
        await cloudSync.saveAchievementsToCloud();
        await cloudSync.loadAchievementsFromCloud();
        await cloudSync.listenToWeightHistoryFromCloud();
        await cloudSync.saveCardioSessionsToCloud();
        await cloudSync.listenToCardioSessionsFromCloud();
        await cloudSync.joinClan();
        await cloudSync.leaveClan();
        await cloudSync.getUserClans();
        await cloudSync.getClanDetails();
        await cloudSync.sendPoke();
        await cloudSync.deleteNotification();
        await cloudSync.loadCustomExercisesFromCloud();
        await cloudSync.saveProgramCompletionsToCloud();
        await cloudSync.loadProgramCompletionsFromCloud();
        await cloudSync.saveExerciseWeightsToCloud();
        await cloudSync.loadExerciseWeightsFromCloud();
        await cloudSync.loadCustomCategoriesFromCloud();
    });

    it('loads settings and routines via proxy', async () => {
        await cloudSync.loadSettingsFromCloud();
        expect(mockUserDataService.loadSettingsFromCloud).toHaveBeenCalled();
        
        await cloudSync.loadRoutinesFromCloud();
        expect(mockUserDataService.loadRoutinesFromCloud).toHaveBeenCalled();
    });
});
