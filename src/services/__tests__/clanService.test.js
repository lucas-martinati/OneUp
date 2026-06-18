import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase/database
vi.mock('firebase/database', () => {
  const mRef = vi.fn((db, path) => path);
  const mQuery = vi.fn((ref, ...constraints) => ({ ref, constraints }));
  const mOrderByChild = vi.fn((child) => ({ type: 'orderByChild', child }));
  const mEqualTo = vi.fn((val) => ({ type: 'equalTo', val }));
  const mLimitToFirst = vi.fn((limit) => ({ type: 'limitToFirst', limit }));
  const mPush = vi.fn((ref) => ({ key: 'clan_mock_key', ref }));
  
  return {
    ref: mRef,
    set: vi.fn(),
    get: vi.fn(),
    remove: vi.fn(),
    push: mPush,
    onValue: vi.fn(),
    serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
    runTransaction: vi.fn(),
    query: mQuery,
    orderByChild: mOrderByChild,
    equalTo: mEqualTo,
    limitToFirst: mLimitToFirst,
  };
});

// Mock ../firebase
vi.mock('../firebase', () => ({
  getAuthInstance: vi.fn(() => ({ currentUser: { uid: 'test-uid' } })),
  getDatabaseInstance: vi.fn(() => ({})),
}));

import { set, get, remove, push, query, orderByChild, equalTo, limitToFirst } from 'firebase/database';
import { createClan, joinClan, leaveClan } from '../clanService';

const snapshot = (val) => ({
  exists: () => val != null,
  val: () => val,
});

describe('clanService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createClan', () => {
    it('creates a clan and updates user node successfully', async () => {
      vi.mocked(set).mockResolvedValue();

      const result = await createClan('My Awesome Clan');
      expect(result.success).toBe(true);
      expect(result.clanId).toBe('clan_mock_key');
      expect(result.code).toHaveLength(6);

      expect(push).toHaveBeenCalled();
      expect(set).toHaveBeenCalledWith(expect.objectContaining({ key: 'clan_mock_key' }), expect.objectContaining({
        name: 'My Awesome Clan',
        createdBy: 'test-uid',
        members: { 'test-uid': 'admin' }
      }));
      expect(set).toHaveBeenCalledWith('users/test-uid/clans/clan_mock_key', 'admin');
    });
  });

  describe('joinClan', () => {
    it('joins a clan successfully when code is valid', async () => {
      const mockClan = {
        name: 'Target Clan',
        code: 'CLANCODE',
        members: { 'other-uid': 'admin' }
      };
      
      // Stub the query get result
      vi.mocked(get).mockResolvedValueOnce(snapshot({
        'clan_id_123': mockClan
      }));
      
      // Stub the user membership check result (not a member yet)
      vi.mocked(get).mockResolvedValueOnce(snapshot(null));

      vi.mocked(set).mockResolvedValue();

      const result = await joinClan('CLANCODE');
      expect(result.success).toBe(true);
      expect(result.clanId).toBe('clan_id_123');

      // Verify that query helper was called correctly
      expect(query).toHaveBeenCalled();
      expect(orderByChild).toHaveBeenCalledWith('code');
      expect(equalTo).toHaveBeenCalledWith('CLANCODE');
      expect(limitToFirst).toHaveBeenCalledWith(1);

      expect(set).toHaveBeenCalledWith('clans/clan_id_123/members/test-uid', 'member');
      expect(set).toHaveBeenCalledWith('users/test-uid/clans/clan_id_123', 'member');
    });

    it('returns error if the invitation code is invalid', async () => {
      vi.mocked(get).mockResolvedValueOnce(snapshot(null));

      const result = await joinClan('BADCODE');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('returns error if the user is already a member', async () => {
      const mockClan = {
        name: 'Target Clan',
        code: 'CLANCODE',
        members: { 'test-uid': 'member' }
      };

      vi.mocked(get).mockResolvedValueOnce(snapshot({
        'clan_id_123': mockClan
      }));
      vi.mocked(get).mockResolvedValueOnce(snapshot('member'));

      const result = await joinClan('CLANCODE');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('leaveClan', () => {
    it('leaves a clan and deletes it if empty', async () => {
      vi.mocked(get).mockResolvedValueOnce(snapshot('member')); // user is member
      vi.mocked(remove).mockResolvedValue();
      
      // Mock remaining members lookup as empty
      vi.mocked(get).mockResolvedValueOnce(snapshot({ members: {} }));

      const result = await leaveClan('clan_id_123');
      expect(result.success).toBe(true);
      expect(remove).toHaveBeenCalledWith('clans/clan_id_123/members/test-uid');
      expect(remove).toHaveBeenCalledWith('users/test-uid/clans/clan_id_123');
      expect(remove).toHaveBeenCalledWith('clans/clan_id_123');
    });
  });
});
