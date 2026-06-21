import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, get, set, update } from 'firebase/database';
import { getDatabaseInstance } from '@services/firebase';
import {
  fetchAllUsersData,
  saveUserData,
  updateUserProfile,
  updateUserSettings,
  updateUserProgress,
  updateUserPurchase,
  resetUserProgress,
  deleteUserData
} from '@services/adminService';

// Mock firebase/database
vi.mock('firebase/database', () => ({
  ref: vi.fn((db, path) => path),
  set: vi.fn(),
  get: vi.fn(),
  update: vi.fn(),
}));

// Mock @services/firebase
vi.mock('@services/firebase', () => ({
  getDatabaseInstance: vi.fn(() => ({})),
}));

describe('adminService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getDatabaseInstance).mockReturnValue({});
  });

  describe('fetchAllUsersData', () => {
    it('fetches all users data successfully', async () => {
      const mockUsers = { uid1: { profile: { email: 'test@example.com' } } };
      vi.mocked(get).mockResolvedValueOnce({
        exists: () => true,
        val: () => mockUsers,
      });

      const result = await fetchAllUsersData();
      expect(ref).toHaveBeenCalledWith(expect.anything(), 'users');
      expect(get).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });

    it('returns empty object when no users exist', async () => {
      vi.mocked(get).mockResolvedValueOnce({
        exists: () => false,
      });

      const result = await fetchAllUsersData();
      expect(result).toEqual({});
    });
  });

  describe('saveUserData', () => {
    it('sets user data at user path', async () => {
      const mockData = { profile: { email: 'test@example.com' } };
      vi.mocked(set).mockResolvedValueOnce();

      const result = await saveUserData('test-uid', mockData);
      expect(ref).toHaveBeenCalledWith(expect.anything(), 'users/test-uid');
      expect(set).toHaveBeenCalledWith('users/test-uid', mockData);
      expect(result).toBe(true);
    });
  });

  describe('updateUserProfile', () => {
    it('updates user profile successfully', async () => {
      const mockProfile = { email: 'test@example.com', displayName: 'Test' };
      vi.mocked(update).mockResolvedValueOnce();

      const result = await updateUserProfile('test-uid', mockProfile);
      expect(ref).toHaveBeenCalledWith(expect.anything(), 'users/test-uid/profile');
      expect(update).toHaveBeenCalledWith('users/test-uid/profile', mockProfile);
      expect(result).toBe(true);
    });
  });

  describe('updateUserSettings', () => {
    it('updates user settings successfully', async () => {
      const mockSettings = { leaderboardPseudo: 'Test' };
      vi.mocked(update).mockResolvedValueOnce();

      const result = await updateUserSettings('test-uid', mockSettings);
      expect(ref).toHaveBeenCalledWith(expect.anything(), 'users/test-uid/settings');
      expect(update).toHaveBeenCalledWith('users/test-uid/settings', mockSettings);
      expect(result).toBe(true);
    });
  });

  describe('updateUserProgress', () => {
    it('updates user progress successfully', async () => {
      const mockProgress = { isSetup: true };
      vi.mocked(update).mockResolvedValueOnce();

      const result = await updateUserProgress('test-uid', mockProgress);
      expect(ref).toHaveBeenCalledWith(expect.anything(), 'users/test-uid/progress');
      expect(update).toHaveBeenCalledWith('users/test-uid/progress', mockProgress);
      expect(result).toBe(true);
    });
  });

  describe('updateUserPurchase', () => {
    it('sets user purchase successfully', async () => {
      const mockPurchase = { isPro: true };
      vi.mocked(set).mockResolvedValueOnce();

      const result = await updateUserPurchase('test-uid', mockPurchase);
      expect(ref).toHaveBeenCalledWith(expect.anything(), 'users/test-uid/purchase');
      expect(set).toHaveBeenCalledWith('users/test-uid/purchase', mockPurchase);
      expect(result).toBe(true);
    });
  });

  describe('resetUserProgress', () => {
    it('clears completions and zeroes leaderboard totals atomically', async () => {
      vi.mocked(update).mockResolvedValueOnce();

      const result = await resetUserProgress('test-uid');

      expect(update).toHaveBeenCalledTimes(1);
      const payload = vi.mocked(update).mock.calls[0][1];
      expect(payload['users/test-uid/progress/completions']).toBeNull();
      expect(payload['leaderboard/test-uid/totalReps']).toBe(0);
      expect(payload['leaderboard/test-uid/weightsTotalReps']).toBe(0);
      expect(payload['leaderboard/test-uid/exerciseReps']).toBeNull();
      expect(typeof payload['users/test-uid/progress/lastCompletionChange']).toBe('string');
      expect(result).toBe(true);
    });
  });

  describe('deleteUserData', () => {
    it('removes the user record and leaderboard entry atomically', async () => {
      vi.mocked(update).mockResolvedValueOnce();

      const result = await deleteUserData('test-uid');

      expect(update).toHaveBeenCalledTimes(1);
      expect(vi.mocked(update).mock.calls[0][1]).toEqual({
        'users/test-uid': null,
        'leaderboard/test-uid': null,
      });
      expect(result).toBe(true);
    });
  });

  describe('database not initialized', () => {
    beforeEach(() => {
      vi.mocked(getDatabaseInstance).mockReturnValue(null);
    });

    it('throws from fetchAllUsersData', async () => {
      await expect(fetchAllUsersData()).rejects.toThrow('Database not initialized');
    });

    it('throws from saveUserData', async () => {
      await expect(saveUserData('uid', {})).rejects.toThrow('Database not initialized');
    });

    it('throws from updateUserProgress', async () => {
      await expect(updateUserProgress('uid', {})).rejects.toThrow('Database not initialized');
    });

    it('throws from resetUserProgress', async () => {
      await expect(resetUserProgress('uid')).rejects.toThrow('Database not initialized');
    });

    it('throws from deleteUserData', async () => {
      await expect(deleteUserData('uid')).rejects.toThrow('Database not initialized');
    });
  });

  describe('error propagation', () => {
    it('rethrows when get fails in fetchAllUsersData', async () => {
      vi.mocked(get).mockRejectedValueOnce(new Error('network'));
      await expect(fetchAllUsersData()).rejects.toThrow('network');
    });

    it('rethrows when set fails in saveUserData', async () => {
      vi.mocked(set).mockRejectedValueOnce(new Error('denied'));
      await expect(saveUserData('uid', {})).rejects.toThrow('denied');
    });
  });
});
