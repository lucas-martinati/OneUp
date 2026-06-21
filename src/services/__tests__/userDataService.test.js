import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('firebase/database', () => ({
  ref: vi.fn((db, path) => ({ db, path })),
  set: vi.fn(() => Promise.resolve()),
  get: vi.fn(),
  onValue: vi.fn(),
}));

vi.mock('../firebase', () => ({
  getAuthInstance: vi.fn(),
  getDatabaseInstance: vi.fn(),
}));

vi.mock('@utils/logger', () => ({
  createLogger: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() }),
}));

import { set, get, onValue } from 'firebase/database';
import { getAuthInstance, getDatabaseInstance } from '../firebase';
import * as svc from '../userDataService';

const snap = (val) => ({ exists: () => val != null, val: () => val });

/** Make the auth+db guard pass (signed-in user + a db instance). */
function signedIn(uid = 'u1') {
  vi.mocked(getAuthInstance).mockReturnValue({ currentUser: { uid } });
  vi.mocked(getDatabaseInstance).mockReturnValue({ db: true });
}
/** Make the guard fail (no user). */
function signedOut() {
  vi.mocked(getAuthInstance).mockReturnValue({ currentUser: null });
  vi.mocked(getDatabaseInstance).mockReturnValue({ db: true });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(set).mockResolvedValue();
});

// ── Savers: return false when signed out, true (and call set) when signed in ──
describe('userDataService savers', () => {
  const savers = [
    ['saveSettingsToCloud', { a: 1 }],
    ['saveRoutinesToCloud', [{ id: 'r' }]],
    ['saveCustomExercisesToCloud', [{ id: 'e' }]],
    ['saveExerciseWeightsToCloud', { pushups: 10 }],
    ['saveCustomCategoriesToCloud', [{ id: 'c' }]],
  ];

  it.each(savers)('%s returns false when signed out and does not write', async (name, payload) => {
    signedOut();
    await expect(svc[name](payload)).resolves.toBe(false);
    expect(set).not.toHaveBeenCalled();
  });

  it.each(savers)('%s writes and returns true when signed in', async (name, payload) => {
    signedIn();
    await expect(svc[name](payload)).resolves.toBe(true);
    expect(set).toHaveBeenCalledTimes(1);
  });

  it('savers coerce nullish payloads to a default empty container', async () => {
    signedIn();
    await svc.saveRoutinesToCloud(undefined);
    await svc.saveCustomExercisesToCloud(null);
    await svc.saveExerciseWeightsToCloud(null);
    await svc.saveCustomCategoriesToCloud(undefined);
    const written = vi.mocked(set).mock.calls.map(c => c[1]);
    expect(written).toEqual([[], [], {}, []]);
  });

  it('saveProgramCompletionsToCloud guards and writes per programId', async () => {
    signedOut();
    expect(await svc.saveProgramCompletionsToCloud('p1', { d: 1 })).toBe(false);
    signedIn();
    expect(await svc.saveProgramCompletionsToCloud('p1', null)).toBe(true);
    expect(set).toHaveBeenCalledTimes(1);
    expect(vi.mocked(set).mock.calls[0][1]).toEqual({});
  });

  it('saveAchievementsToCloud accepts an explicit userId and guards on missing uid', async () => {
    vi.mocked(getAuthInstance).mockReturnValue({ currentUser: null });
    vi.mocked(getDatabaseInstance).mockReturnValue({ db: true });
    // No currentUser and no explicit id → false
    expect(await svc.saveAchievementsToCloud({ x: 1 })).toBe(false);
    // Explicit userId bypasses the missing currentUser
    expect(await svc.saveAchievementsToCloud({ x: 1 }, 'explicit')).toBe(true);
    expect(set).toHaveBeenCalledTimes(1);
  });
});

// ── Loaders: null when signed out, value when snapshot exists, fallback otherwise ──
describe('userDataService loaders', () => {
  const loaders = [
    'loadSettingsFromCloud',
    'loadPurchase',
    'loadRoutinesFromCloud',
    'loadCustomExercisesFromCloud',
    'loadProgramCompletionsFromCloud',
    'loadAchievementsFromCloud',
    'loadExerciseWeightsFromCloud',
    'loadCustomCategoriesFromCloud',
  ];

  it.each(loaders)('%s returns null when signed out', async (name) => {
    signedOut();
    // Called with no args: loadAchievements would otherwise treat a positional
    // arg as an explicit userId and bypass the signed-out guard.
    await expect(svc[name]()).resolves.toBeNull();
    expect(get).not.toHaveBeenCalled();
  });

  it.each(loaders)('%s returns the stored value when the snapshot exists', async (name) => {
    signedIn();
    vi.mocked(get).mockResolvedValue(snap({ stored: true }));
    await expect(svc[name]('arg')).resolves.toEqual({ stored: true });
  });

  it.each(loaders)('%s returns null when the snapshot is empty', async (name) => {
    signedIn();
    vi.mocked(get).mockResolvedValue(snap(null));
    await expect(svc[name]('arg')).resolves.toBeNull();
  });

  it('loadAchievementsFromCloud honours an explicit userId', async () => {
    vi.mocked(getAuthInstance).mockReturnValue({ currentUser: null });
    vi.mocked(getDatabaseInstance).mockReturnValue({ db: true });
    vi.mocked(get).mockResolvedValue(snap({ a: 1 }));
    await expect(svc.loadAchievementsFromCloud('explicit')).resolves.toEqual({ a: 1 });
  });
});

// ── Listeners: noop unsubscribe when signed out, callback wiring when signed in ──
describe('userDataService listeners', () => {
  const listeners = [
    ['listenToSettingsFromCloud', null],
    ['listenToRoutinesFromCloud', []],
    ['listenToCustomExercisesFromCloud', []],
    ['listenToCustomCategoriesFromCloud', []],
  ];

  it.each(listeners)('%s returns a noop unsubscribe when signed out', (name) => {
    signedOut();
    const unsub = svc[name](vi.fn());
    expect(typeof unsub).toBe('function');
    expect(() => unsub()).not.toThrow();
    expect(onValue).not.toHaveBeenCalled();
  });

  it.each(listeners)('%s forwards the stored value to the callback', (name) => {
    signedIn();
    const unsubMock = vi.fn();
    vi.mocked(onValue).mockImplementation((_ref, cb) => { cb(snap({ live: 1 })); return unsubMock; });
    const cb = vi.fn();
    const unsub = svc[name](cb);
    expect(cb).toHaveBeenCalledWith({ live: 1 });
    expect(unsub).toBe(unsubMock);
  });

  it.each(listeners)('%s forwards the empty fallback when the snapshot is missing', (name, fallback) => {
    signedIn();
    vi.mocked(onValue).mockImplementation((_ref, cb) => { cb(snap(null)); return vi.fn(); });
    const cb = vi.fn();
    svc[name](cb);
    expect(cb).toHaveBeenCalledWith(fallback);
  });
});
