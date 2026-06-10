import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, get, set, update } from 'firebase/database';
import {
  fetchAllUsersData,
  saveUserData,
  updateUserProfile,
  updateUserSettings,
  updateUserProgress,
  updateUserPurchase
} from '../adminService';

// Mock firebase/database
vi.mock('firebase/database', () => ({
  ref: vi.fn((db, path) => path),
  set: vi.fn(),
  get: vi.fn(),
  update: vi.fn(),
}));

// Mock ./firebase
vi.mock('../firebase', () => ({
  getDatabaseInstance: vi.fn(() => ({})),
}));

describe('adminService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
