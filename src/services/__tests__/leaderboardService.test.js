import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('firebase/database', () => ({
  ref: vi.fn((db, path) => path ?? 'root'),
  get: vi.fn(),
}));

vi.mock('../firebase', () => ({
  getDatabaseInstance: vi.fn(() => ({})),
  initializeFirebase: vi.fn(),
}));

vi.mock('../../i18n', () => ({ default: { t: (k) => k } }));

import { get } from 'firebase/database';
import { getDatabaseInstance, initializeFirebase } from '../firebase';
import { loadLeaderboard, loadUserDetails } from '../leaderboardService';

const snapshot = (val) => ({ exists: () => val != null, val: () => val });

beforeEach(() => {
  vi.clearAllMocks();
  getDatabaseInstance.mockReturnValue({});
});

describe('loadLeaderboard', () => {
  it('maps, filters private entries and sorts by totalReps desc', async () => {
    get.mockResolvedValue(snapshot({
      u1: { pseudo: 'A', totalReps: 100, isPublic: true },
      u2: { pseudo: 'B', totalReps: 300 },
      hidden: { pseudo: 'H', totalReps: 999, isPublic: false },
    }));
    const result = await loadLeaderboard();
    expect(result.map(e => e.uid)).toEqual(['u2', 'u1']);
    expect(result.find(e => e.uid === 'hidden')).toBeUndefined();
  });

  it('defaults missing fields', async () => {
    get.mockResolvedValue(snapshot({ u1: {} }));
    const [entry] = await loadLeaderboard();
    expect(entry.pseudo).toBe('common.anonymous');
    expect(entry.totalReps).toBe(0);
    expect(entry.exerciseReps).toEqual({});
    expect(entry.isPro).toBe(false);
  });

  it('returns [] when leaderboard node is empty', async () => {
    get.mockResolvedValue(snapshot(null));
    expect(await loadLeaderboard()).toEqual([]);
  });

  it('initializes firebase when the database is not ready, then bails if still null', async () => {
    getDatabaseInstance.mockReturnValue(null);
    expect(await loadLeaderboard()).toEqual([]);
    expect(initializeFirebase).toHaveBeenCalled();
  });
});

describe('loadUserDetails', () => {
  it('returns the derived public profile fields', async () => {
    get.mockResolvedValue(snapshot({
      derivedStats: { streak: 5 },
      exerciseWeights: { bench: 60 },
      exerciseDifficulties: { bench: 'hard' },
      achievements: 3,
    }));
    const result = await loadUserDetails('u1');
    expect(result.derivedStats).toEqual({ streak: 5 });
    expect(result.exerciseWeights).toEqual({ bench: 60 });
    expect(result.achievements).toBe(3);
  });

  it('defaults missing fields to empty', async () => {
    get.mockResolvedValue(snapshot({}));
    const result = await loadUserDetails('u1');
    expect(result.derivedStats).toBeNull();
    expect(result.exerciseWeights).toEqual({});
    expect(result.achievements).toBe(0);
  });

  it('returns null when the profile does not exist', async () => {
    get.mockResolvedValue(snapshot(null));
    expect(await loadUserDetails('u1')).toBeNull();
  });

  it('returns null when the database stays unavailable', async () => {
    getDatabaseInstance.mockReturnValue(null);
    expect(await loadUserDetails('u1')).toBeNull();
  });
});
