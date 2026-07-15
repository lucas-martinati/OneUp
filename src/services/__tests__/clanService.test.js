import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as clanService from '../clanService';
import { get, remove, push, update, onValue, runTransaction } from 'firebase/database';
import { getAuthInstance, getDatabaseInstance } from '../firebase';


vi.mock('firebase/database', () => ({
  ref: vi.fn((db, path) => path),
  get: vi.fn(),
  remove: vi.fn(),
  push: vi.fn(() => ({ key: 'new_id' })),
  update: vi.fn(),
  onValue: vi.fn(),
  serverTimestamp: vi.fn(() => 'ts'),
  runTransaction: vi.fn()
}));

vi.mock('@utils/logger', () => ({
  createLogger: () => ({
    success: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  })
}));

vi.mock('../firebase', () => ({
  getAuthInstance: vi.fn(),
  getDatabaseInstance: vi.fn()
}));

vi.mock('@shared/dbSchema.js', () => ({
  paths: {
    clans: () => 'clans',
    clan: (id) => `clan/${id}`,
    clanCode: (code) => `code/${code}`,
    userClan: (uid, clanId) => `userClan/${uid}/${clanId}`,
    clanMember: (clanId, uid) => `clanMember/${clanId}/${uid}`,
    userClans: (uid) => `userClans/${uid}`,
    leaderboard: () => 'leaderboard',
    leaderboardEntry: (uid) => `lb/${uid}`,
    notification: (target, from) => `notif/${target}/${from}`,
    notifications: (uid) => `notifs/${uid}`
  }
}));

vi.mock('../../i18n', () => ({
  default: {
    t: vi.fn((k) => k)
  }
}));

describe('clanService', () => {
  const mockAuth = { currentUser: { uid: 'u1' } };
  const mockDb = {};

  beforeEach(() => {
    vi.clearAllMocks();
    getAuthInstance.mockReturnValue(mockAuth);
    getDatabaseInstance.mockReturnValue(mockDb);
  });

  describe('createClan', () => {
    it('creates clan successfully on first attempt', async () => {
      // Mock code doesn't exist
      get.mockResolvedValueOnce({ exists: () => false });
      update.mockResolvedValueOnce();

      const result = await clanService.createClan('My Clan');
      expect(result.success).toBe(true);
      expect(result.clanId).toBe('new_id');
      expect(result.code).toHaveLength(6);
      expect(push).toHaveBeenCalledWith('clans');
      expect(update).toHaveBeenCalled();
    });

    it('retries on code collision', async () => {
      // First attempt collision
      get.mockResolvedValueOnce({ exists: () => true });
      // Second attempt success
      get.mockResolvedValueOnce({ exists: () => false });
      update.mockResolvedValueOnce();

      const result = await clanService.createClan('Retry Clan');
      expect(result.success).toBe(true);
      expect(get).toHaveBeenCalledTimes(2);
    });

    it('returns error if all attempts fail', async () => {
      get.mockResolvedValue({ exists: () => true });
      const result = await clanService.createClan('Fail Clan');
      expect(result.success).toBe(false);
      expect(result.error).toBe('clan.createError');
      expect(get).toHaveBeenCalledTimes(5);
    });

    it('handles unexpected errors', async () => {
      get.mockRejectedValueOnce(new Error('db err'));
      const result = await clanService.createClan('Error Clan');
      expect(result.success).toBe(false);
      expect(result.error).toBe('clan.createError');
    });

    it('throws if not initialized', async () => {
      getAuthInstance.mockReturnValueOnce(null);
      const result = await clanService.createClan('My Clan');
      expect(result.success).toBe(false);
    });
  });

  describe('joinClan', () => {
    it('joins successfully if code is valid and user is not member', async () => {
      // code lookup
      get.mockResolvedValueOnce({ exists: () => true, val: () => 'clan1' });
      // clan exists
      get.mockResolvedValueOnce({ exists: () => true });
      // user not in clan
      get.mockResolvedValueOnce({ exists: () => false });
      
      const result = await clanService.joinClan('ABCDEF');
      expect(result.success).toBe(true);
      expect(result.clanId).toBe('clan1');
      expect(update).toHaveBeenCalledWith(undefined, {
        'clanMember/clan1/u1': 'member',
        'userClan/u1/clan1': 'member'
      });
    });

    it('fails if code does not exist', async () => {
      get.mockResolvedValueOnce({ exists: () => false });
      const result = await clanService.joinClan('BADCODE');
      expect(result.success).toBe(false);
      expect(result.error).toBe('clan.invalidCode');
    });

    it('fails if clan node does not exist', async () => {
      get.mockResolvedValueOnce({ exists: () => true, val: () => 'clan1' });
      get.mockResolvedValueOnce({ exists: () => false }); // clan gone
      const result = await clanService.joinClan('ABCDEF');
      expect(result.success).toBe(false);
      expect(result.error).toBe('clan.invalidCode');
    });

    it('fails if already a member', async () => {
      get.mockResolvedValueOnce({ exists: () => true, val: () => 'clan1' });
      get.mockResolvedValueOnce({ exists: () => true });
      get.mockResolvedValueOnce({ exists: () => true }); // already member
      const result = await clanService.joinClan('ABCDEF');
      expect(result.success).toBe(false);
      expect(result.error).toBe('clan.alreadyMember');
    });

    it('handles errors', async () => {
      get.mockRejectedValueOnce(new Error('err'));
      const result = await clanService.joinClan('ABCDEF');
      expect(result.success).toBe(false);
      expect(result.error).toBe('clan.joinError');
    });

    it('returns error if uninitialized', async () => {
      getAuthInstance.mockReturnValueOnce(null);
      const result = await clanService.joinClan('ABCDEF');
      expect(result.success).toBe(false);
      expect(result.error).toBe('clan.joinError');
    });
  });

  describe('leaveClan', () => {
    it('leaves successfully and removes clan if last member', async () => {
      get.mockResolvedValueOnce({ exists: () => true }); // user is in clan
      get.mockResolvedValueOnce({ 
        exists: () => true, 
        val: () => ({ code: 'XYZ123', members: { u1: 'admin' } }) 
      });
      
      const result = await clanService.leaveClan('clan1');
      expect(result.success).toBe(true);
      expect(update).toHaveBeenCalledWith(undefined, expect.objectContaining({
        'userClan/u1/clan1': null,
        'clan/clan1': null,
        'code/XYZ123': null
      }));
    });

    it('leaves successfully and removes only member if not last', async () => {
      get.mockResolvedValueOnce({ exists: () => true }); // user is in clan
      get.mockResolvedValueOnce({ 
        exists: () => true, 
        val: () => ({ code: 'XYZ123', members: { u1: 'admin', u2: 'member' } }) 
      });
      
      const result = await clanService.leaveClan('clan1');
      expect(result.success).toBe(true);
      expect(update).toHaveBeenCalledWith(undefined, expect.objectContaining({
        'userClan/u1/clan1': null,
        'clanMember/clan1/u1': null
      }));
    });

    it('returns early if not a member', async () => {
      get.mockResolvedValueOnce({ exists: () => false });
      const result = await clanService.leaveClan('clan1');
      expect(result.success).toBe(true);
      expect(update).not.toHaveBeenCalled();
    });

    it('returns error if no clanId', async () => {
      const result = await clanService.leaveClan(null);
      expect(result.success).toBe(false);
      expect(result.error).toBe('clan.missingId');
    });

    it('handles unexpected errors', async () => {
      get.mockRejectedValueOnce(new Error('err'));
      const result = await clanService.leaveClan('clan1');
      expect(result.success).toBe(false);
      expect(result.error).toBe('clan.leaveError');
    });

    it('returns error if uninitialized', async () => {
      getAuthInstance.mockReturnValueOnce(null);
      const result = await clanService.leaveClan('clan1');
      expect(result.success).toBe(false);
    });
  });

  describe('getUserClans', () => {
    it('returns list of clans', async () => {
      get.mockResolvedValueOnce({ exists: () => true, val: () => ({ 'clan1': 'admin', 'clan2': 'member' }) });
      get.mockResolvedValueOnce({ exists: () => true, val: () => ({ name: 'C1', code: 'A', members: { u1: 'admin' } }) });
      get.mockResolvedValueOnce({ exists: () => true, val: () => ({ name: 'C2', code: 'B', members: { u1: 'member', u2: 'admin' } }) });

      const clans = await clanService.getUserClans();
      expect(clans).toHaveLength(2);
      expect(clans[0]).toEqual({ id: 'clan1', name: 'C1', code: 'A', role: 'admin', memberCount: 1 });
      expect(clans[1]).toEqual({ id: 'clan2', name: 'C2', code: 'B', role: 'member', memberCount: 2 });
    });

    it('ignores missing clans', async () => {
      get.mockResolvedValueOnce({ exists: () => true, val: () => ({ 'clan1': 'admin' }) });
      get.mockResolvedValueOnce({ exists: () => false });

      const clans = await clanService.getUserClans();
      expect(clans).toHaveLength(0);
    });

    it('returns empty if user has no clans', async () => {
      get.mockResolvedValueOnce({ exists: () => false });
      const clans = await clanService.getUserClans();
      expect(clans).toEqual([]);
    });

    it('returns empty if uninitialized', async () => {
      getAuthInstance.mockReturnValueOnce(null);
      const clans = await clanService.getUserClans();
      expect(clans).toEqual([]);
    });
  });

  describe('getClanDetails', () => {
    it('returns populated clan details', async () => {
      get.mockResolvedValueOnce({ exists: () => true, val: () => ({ name: 'C', code: 'A', members: { u1: 'admin', u2: 'member' } }) });
      get.mockResolvedValueOnce({ exists: () => true, val: () => ({
        u1: { pseudo: 'U1', totalReps: 100 },
        u2: { pseudo: 'U2', totalReps: 200 }
      })});

      const details = await clanService.getClanDetails('clan1');
      expect(details.name).toBe('C');
      expect(details.members).toHaveLength(2);
      expect(details.members[0].uid).toBe('u2'); // sorted by totalReps desc
      expect(details.members[1].isCurrentUser).toBe(true); // u1 is current user
    });

    it('handles empty leaderboard gracefully', async () => {
      get.mockResolvedValueOnce({ exists: () => true, val: () => ({ name: 'C', code: 'A', members: { u1: 'admin' } }) });
      get.mockResolvedValueOnce({ exists: () => false }); // no lb data

      const details = await clanService.getClanDetails('clan1');
      expect(details.members[0].pseudo).toBe('common.anonymous');
      expect(details.members[0].totalReps).toBe(0);
    });

    it('returns null if clan not found', async () => {
      get.mockResolvedValueOnce({ exists: () => false });
      const details = await clanService.getClanDetails('clan1');
      expect(details).toBeNull();
    });

    it('returns null if uninitialized', async () => {
      getAuthInstance.mockReturnValueOnce(null);
      const details = await clanService.getClanDetails('clan1');
      expect(details).toBeNull();
    });
  });

  describe('sendPoke', () => {
    it('sends poke and looks up sender info', async () => {
      get.mockResolvedValueOnce({ exists: () => true, val: () => ({ pseudo: 'Me', photoURL: 'p.jpg' }) });
      runTransaction.mockImplementationOnce((ref, updateFn) => {
        const newData = updateFn({ count: 1 });
        expect(newData.count).toBe(2);
        expect(newData.fromName).toBe('Me');
        expect(newData.type).toBe('nudge');
        return Promise.resolve();
      });

      const res = await clanService.sendPoke('u2', 'nudge', 'msg');
      expect(res).toBe(true);
      expect(runTransaction).toHaveBeenCalled();
    });

    it('handles missing sender info gracefully', async () => {
      get.mockRejectedValueOnce(new Error('fail'));
      runTransaction.mockImplementationOnce((ref, updateFn) => {
        const newData = updateFn(null); // no existing
        expect(newData.count).toBe(1);
        expect(newData.fromName).toBe('common.member');
        return Promise.resolve();
      });

      const res = await clanService.sendPoke('u2', 'nudge', 'msg');
      expect(res).toBe(true);
    });

    it('returns false if poking self', async () => {
      const res = await clanService.sendPoke('u1');
      expect(res).toBe(false);
    });

    it('returns false if uninitialized', async () => {
      getAuthInstance.mockReturnValueOnce(null);
      const res = await clanService.sendPoke('u2');
      expect(res).toBe(false);
    });

    it('handles transaction failure', async () => {
      runTransaction.mockRejectedValueOnce(new Error('tx fail'));
      const res = await clanService.sendPoke('u2');
      expect(res).toBe(false);
    });
  });

  describe('listenToNotifications', () => {
    it('sets up listener and parses notifications', () => {
      const cb = vi.fn();
      let listener;
      onValue.mockImplementationOnce((ref, cbImpl) => { listener = cbImpl; });
      
      clanService.listenToNotifications(cb);
      expect(onValue).toHaveBeenCalled();

      // Trigger with data
      const mockSnap = {
        exists: () => true,
        forEach: (fn) => {
          fn({ key: 'n1', val: () => ({ type: 'nudge' }) });
          fn({ key: 'n2', val: () => ({ type: 'poke' }) });
        }
      };
      listener(mockSnap);
      expect(cb).toHaveBeenCalledWith([{ id: 'n1', type: 'nudge' }, { id: 'n2', type: 'poke' }]);

      // Trigger empty
      listener({ exists: () => false });
      expect(cb).toHaveBeenCalledWith([]);
    });

    it('returns null if uninitialized', () => {
      getAuthInstance.mockReturnValueOnce(null);
      expect(clanService.listenToNotifications(() => {})).toBeNull();
    });
  });

  describe('deleteNotification', () => {
    it('deletes notification', async () => {
      const res = await clanService.deleteNotification('n1');
      expect(res).toBe(true);
      expect(remove).toHaveBeenCalledWith('notif/u1/n1');
    });

    it('returns false if uninitialized', async () => {
      getAuthInstance.mockReturnValueOnce(null);
      const res = await clanService.deleteNotification('n1');
      expect(res).toBe(false);
    });
  });
});
