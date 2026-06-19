import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase/database
vi.mock('firebase/database', () => {
  const mRef = vi.fn((db, path) => path !== undefined ? path : 'mock_db_ref');
  const mPush = vi.fn((ref) => ({ key: 'clan_mock_key', ref }));
  
  return {
    ref: mRef,
    set: vi.fn(),
    get: vi.fn(),
    remove: vi.fn(),
    push: mPush,
    update: vi.fn(),
    onValue: vi.fn(),
    serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
    runTransaction: vi.fn(),
  };
});

// Mock ../firebase
vi.mock('../firebase', () => ({
  getAuthInstance: vi.fn(() => ({ currentUser: { uid: 'test-uid' } })),
  getDatabaseInstance: vi.fn(() => ({})),
}));

import { get, remove, push, update, onValue, runTransaction } from 'firebase/database';
import { 
  createClan, 
  joinClan, 
  leaveClan, 
  getUserClans, 
  getClanDetails, 
  sendPoke, 
  listenToNotifications, 
  deleteNotification 
} from '../clanService';

const snapshot = (val) => ({
  exists: () => val != null,
  val: () => val,
});

describe('clanService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createClan', () => {
    it('creates a clan, writes to clanCodes and updates user node successfully', async () => {
      // Stub get to indicate the generated code is unique
      vi.mocked(get).mockResolvedValueOnce(snapshot(null));
      vi.mocked(update).mockResolvedValue();

      const result = await createClan('My Awesome Clan');
      expect(result.success).toBe(true);
      expect(result.clanId).toBe('clan_mock_key');
      expect(result.code).toHaveLength(6);

      expect(push).toHaveBeenCalled();
      expect(get).toHaveBeenCalled();
      expect(update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          'clans/clan_mock_key': expect.objectContaining({
            name: 'My Awesome Clan',
            createdBy: 'test-uid',
            members: { 'test-uid': 'admin' }
          }),
          [`clanCodes/${result.code}`]: 'clan_mock_key',
          'users/test-uid/clans/clan_mock_key': 'admin'
        })
      );
    });

    it('retries generation when a code collision occurs', async () => {
      // First get says code exists, second get says it does not
      vi.mocked(get)
        .mockResolvedValueOnce(snapshot('existing-clan-id'))
        .mockResolvedValueOnce(snapshot(null));
      vi.mocked(update).mockResolvedValue();

      const result = await createClan('Retry Clan');
      expect(result.success).toBe(true);
      expect(result.clanId).toBe('clan_mock_key');
      expect(get).toHaveBeenCalledTimes(2);
      expect(update).toHaveBeenCalled();
    });

    it('catches update errors and retries (collision or write failure)', async () => {
      // First try: code doesn't exist, but update throws an error
      // Second try: code doesn't exist, update succeeds
      vi.mocked(get)
        .mockResolvedValueOnce(snapshot(null))
        .mockResolvedValueOnce(snapshot(null));

      vi.mocked(update)
        .mockRejectedValueOnce(new Error('Write failure'))
        .mockResolvedValueOnce();

      const result = await createClan('Retry Write Fail Clan');
      expect(result.success).toBe(true);
      expect(update).toHaveBeenCalledTimes(2);
    });
  });

  describe('joinClan', () => {
    it('joins a clan successfully when code is valid', async () => {
      const mockClan = {
        name: 'Target Clan',
        code: 'CLANCODE',
        members: { 'other-uid': 'admin' }
      };
      
      // 1. Get clanId from code mapping
      // 2. Get clan details
      // 3. Check user membership
      vi.mocked(get)
        .mockResolvedValueOnce(snapshot('clan_id_123'))
        .mockResolvedValueOnce(snapshot(mockClan))
        .mockResolvedValueOnce(snapshot(null));

      vi.mocked(update).mockResolvedValue();

      const result = await joinClan('CLANCODE');
      expect(result.success).toBe(true);
      expect(result.clanId).toBe('clan_id_123');

      expect(get).toHaveBeenCalledTimes(3);
      expect(update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          'clans/clan_id_123/members/test-uid': 'member',
          'users/test-uid/clans/clan_id_123': 'member'
        })
      );
    });

    it('returns error if the invitation code is not registered', async () => {
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

      vi.mocked(get)
        .mockResolvedValueOnce(snapshot('clan_id_123'))
        .mockResolvedValueOnce(snapshot(mockClan))
        .mockResolvedValueOnce(snapshot('member'));

      const result = await joinClan('CLANCODE');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('leaveClan', () => {
    it('leaves a clan and deletes it along with its code if empty', async () => {
      vi.mocked(get)
        .mockResolvedValueOnce(snapshot('member')) // user is member
        .mockResolvedValueOnce(snapshot({ members: { 'test-uid': 'member' }, code: 'MYCODE' })); // clan details with only test-uid
      vi.mocked(update).mockResolvedValue();

      const result = await leaveClan('clan_id_123');
      expect(result.success).toBe(true);
      expect(update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          'users/test-uid/clans/clan_id_123': null,
          'clans/clan_id_123': null,
          'clanCodes/MYCODE': null
        })
      );
    });

    it('leaves a clan but does not delete it if members remain', async () => {
      vi.mocked(get)
        .mockResolvedValueOnce(snapshot('member')) // user is member
        .mockResolvedValueOnce(snapshot({ members: { 'test-uid': 'member', 'other-uid': 'member' }, code: 'MYCODE' })); // other members remain
      vi.mocked(update).mockResolvedValue();

      const result = await leaveClan('clan_id_123');
      expect(result.success).toBe(true);
      expect(update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          'users/test-uid/clans/clan_id_123': null,
          'clans/clan_id_123/members/test-uid': null
        })
      );
    });
  });

  describe('getUserClans', () => {
    it('returns empty array if user has no joined clans', async () => {
      vi.mocked(get).mockResolvedValueOnce(snapshot(null));

      const result = await getUserClans();
      expect(result).toEqual([]);
    });

    it('returns clan details list for the user', async () => {
      vi.mocked(get)
        .mockResolvedValueOnce(snapshot({ clan1: 'admin', clan2: 'member' }))
        .mockResolvedValueOnce(snapshot({ name: 'Clan One', code: 'CODE1', members: { 'test-uid': 'admin' } }))
        .mockResolvedValueOnce(snapshot({ name: 'Clan Two', code: 'CODE2', members: { 'test-uid': 'member', 'other': 'admin' } }));

      const result = await getUserClans();
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'clan1',
        name: 'Clan One',
        code: 'CODE1',
        role: 'admin',
        memberCount: 1
      });
      expect(result[1]).toEqual({
        id: 'clan2',
        name: 'Clan Two',
        code: 'CODE2',
        role: 'member',
        memberCount: 2
      });
    });
  });

  describe('getClanDetails', () => {
    it('returns null if clan does not exist', async () => {
      vi.mocked(get).mockResolvedValueOnce(snapshot(null));

      const result = await getClanDetails('clan_id_123');
      expect(result).toBeNull();
    });

    it('returns sorted and decorated clan details', async () => {
      const mockClan = {
        name: 'Super Clan',
        code: 'CLANCODE',
        members: { 'test-uid': 'admin', 'user-2': 'member' }
      };
      
      const mockLeaderboard = {
        'test-uid': { pseudo: 'Alice', totalReps: 50 },
        'user-2': { pseudo: 'Bob', totalReps: 150, isPro: true }
      };

      vi.mocked(get)
        .mockResolvedValueOnce(snapshot(mockClan))
        .mockResolvedValueOnce(snapshot(mockLeaderboard));

      const result = await getClanDetails('clan_id_123');
      expect(result).not.toBeNull();
      expect(result.id).toBe('clan_id_123');
      expect(result.name).toBe('Super Clan');
      expect(result.code).toBe('CLANCODE');
      
      // Bob should be first because 150 > 50
      expect(result.members).toHaveLength(2);
      expect(result.members[0].pseudo).toBe('Bob');
      expect(result.members[0].totalReps).toBe(150);
      expect(result.members[0].isPro).toBe(true);
      expect(result.members[0].isCurrentUser).toBe(false);

      expect(result.members[1].pseudo).toBe('Alice');
      expect(result.members[1].totalReps).toBe(50);
      expect(result.members[1].isCurrentUser).toBe(true);
    });
  });

  describe('sendPoke', () => {
    it('sends poke successfully and increments count via transaction', async () => {
      let txCallback;
      vi.mocked(runTransaction).mockImplementationOnce((ref, callback) => {
        txCallback = callback;
        return Promise.resolve({ committed: true });
      });

      // Get sender pseudo from leaderboard
      vi.mocked(get).mockResolvedValueOnce(snapshot({ pseudo: 'SenderName', photoURL: 'photo-url' }));

      const result = await sendPoke('target-uid', 'nudge', 'Hello Poke');
      expect(result).toBe(true);
      expect(runTransaction).toHaveBeenCalled();

      // Test transaction count increment
      const currentTxState = { count: 3 };
      const nextTxState = txCallback(currentTxState);
      expect(nextTxState.count).toBe(4);
      expect(nextTxState.type).toBe('nudge');
      expect(nextTxState.message).toBe('Hello Poke');
      expect(nextTxState.fromName).toBe('SenderName');
      expect(nextTxState.fromPhoto).toBe('photo-url');
    });

    it('returns false if target is self', async () => {
      const result = await sendPoke('test-uid');
      expect(result).toBe(false);
      expect(runTransaction).not.toHaveBeenCalled();
    });

    it('handles transaction errors gracefully', async () => {
      vi.mocked(runTransaction).mockRejectedValueOnce(new Error('Tx Failed'));
      vi.mocked(get).mockResolvedValueOnce(snapshot({ pseudo: 'Sender' }));

      const result = await sendPoke('target-uid');
      expect(result).toBe(false);
    });
  });

  describe('listenToNotifications', () => {
    it('subscribes and maps notifications list through onValue', () => {
      const mockNotifs = {
        'sender-1': { type: 'poke', message: 'Hi', count: 1 }
      };

      const mockForEach = vi.fn((fn) => {
        Object.entries(mockNotifs).forEach(([key, val]) => {
          fn({ key, val: () => val });
        });
      });

      const mockSnapshot = {
        exists: () => true,
        forEach: mockForEach
      };

      vi.mocked(onValue).mockImplementationOnce((ref, callback) => {
        callback(mockSnapshot);
        return () => {};
      });

      const callback = vi.fn();
      listenToNotifications(callback);

      expect(onValue).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith([
        { id: 'sender-1', type: 'poke', message: 'Hi', count: 1 }
      ]);
    });
  });

  describe('deleteNotification', () => {
    it('deletes notification node successfully', async () => {
      vi.mocked(remove).mockResolvedValueOnce();

      const result = await deleteNotification('sender-1');
      expect(result).toBe(true);
      expect(remove).toHaveBeenCalledWith('notifications/test-uid/sender-1');
    });
  });

  describe('error handling / edge cases', () => {
    it('createClan fails gracefully after max retries or general error', async () => {
      vi.mocked(get).mockResolvedValue(snapshot('collision')); // always collides
      const result = await createClan('Retry Fail');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('joinClan handles unexpected errors gracefully', async () => {
      vi.mocked(get).mockRejectedValueOnce(new Error('Firebase error'));
      const result = await joinClan('CODE');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('leaveClan handles unexpected errors gracefully', async () => {
      vi.mocked(get).mockRejectedValueOnce(new Error('Firebase error'));
      const result = await leaveClan('clan-1');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('listenToNotifications handles empty snapshot', () => {
      vi.mocked(onValue).mockImplementationOnce((ref, callback) => {
        callback({ exists: () => false });
        return () => {};
      });

      const callback = vi.fn();
      listenToNotifications(callback);
      expect(callback).toHaveBeenCalledWith([]);
    });
  });
});
