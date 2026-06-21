import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../firebase', () => ({
  initializeFirebase: vi.fn(),
  getAuthInstance: vi.fn(() => ({ currentUser: { uid: 'me' } })),
}));

vi.mock('@utils/syncUtils', () => ({
  mergeData: vi.fn((a, b) => ({ merged: [a, b] })),
}));

const unsubMarker = vi.fn();

vi.mock('../dataSyncService', () => ({
  saveToCloud: vi.fn(() => Promise.resolve('saved')),
  loadFromCloud: vi.fn(() => Promise.resolve('loaded')),
  syncData: vi.fn(() => Promise.resolve('synced')),
  listenToCloudChanges: vi.fn(() => unsubMarker),
  delegatedOnly: vi.fn(() => 'delegated'),
}));
vi.mock('../leaderboardService', () => ({
  loadLeaderboard: vi.fn(() => Promise.resolve(['lb'])),
  loadUserDetails: vi.fn((uid) => Promise.resolve({ uid })),
}));
vi.mock('../userDataService', () => ({
  saveSettingsToCloud: vi.fn(() => Promise.resolve(true)),
  loadSettingsFromCloud: vi.fn(() => Promise.resolve({ s: 1 })),
  listenToSettingsFromCloud: vi.fn(() => unsubMarker),
  loadPurchase: vi.fn(() => Promise.resolve(null)),
}));
vi.mock('../weightHistoryService', () => ({
  saveWeightHistoryToCloud: vi.fn(() => Promise.resolve(true)),
  listenToWeightHistoryFromCloud: vi.fn(() => unsubMarker),
}));
vi.mock('../cardioService', () => ({
  saveCardioSessionsToCloud: vi.fn(() => Promise.resolve(true)),
  listenToCardioSessionsFromCloud: vi.fn(() => unsubMarker),
}));
vi.mock('../clanService', () => ({
  createClan: vi.fn(() => Promise.resolve({ id: 'c' })),
  joinClan: vi.fn(() => Promise.resolve()),
  leaveClan: vi.fn(() => Promise.resolve()),
  getUserClans: vi.fn(() => Promise.resolve([{ id: 'c' }])),
  sendPoke: vi.fn(() => Promise.resolve()),
  listenToNotifications: vi.fn(() => unsubMarker),
  deleteNotification: vi.fn(() => Promise.resolve()),
}));
let lastAuth = null;
vi.mock('../authService', () => ({
  setupAuthListener: vi.fn(),
  getLastAuthState: vi.fn(() => lastAuth),
  signInWithGoogle: vi.fn(() => Promise.resolve({ uid: 'g' })),
  signInWithGoogleWeb: vi.fn(() => Promise.resolve({ uid: 'gw' })),
  signOut: vi.fn(() => Promise.resolve()),
  deleteAccount: vi.fn(() => Promise.resolve(true)),
  checkSignInStatus: vi.fn(() => Promise.resolve({ isSignedIn: true })),
}));

import { initializeFirebase, getAuthInstance } from '../firebase';
import * as authService from '../authService';
import * as leaderboardService from '../leaderboardService';
import { cloudSync } from '../cloudSync';

beforeEach(() => {
  vi.clearAllMocks();
  lastAuth = null;
});

describe('mergeData (pure, no init)', () => {
  it('delegates to the syncUtils merge without booting firebase', () => {
    expect(cloudSync.mergeData('l', 'c')).toEqual({ merged: ['l', 'c'] });
    expect(initializeFirebase).not.toHaveBeenCalled();
  });
});

describe('getCurrentUserId', () => {
  it('reads the uid from the global auth instance', () => {
    expect(cloudSync.getCurrentUserId()).toBe('me');
    vi.mocked(getAuthInstance).mockReturnValueOnce(null);
    expect(cloudSync.getCurrentUserId()).toBeNull();
  });
});

describe('ensureInitialized', () => {
  it('boots firebase, wires the auth listener and returns the same promise (idempotent)', async () => {
    const p1 = cloudSync.ensureInitialized();
    const p2 = cloudSync.ensureInitialized();
    expect(p1).toBe(p2);
    await p1;
    expect(initializeFirebase).toHaveBeenCalled();
    expect(authService.setupAuthListener).toHaveBeenCalledWith(cloudSync.listeners);
  });

  it('binds delegated methods that have no explicit proxy', async () => {
    await cloudSync.ensureInitialized();
    expect(typeof cloudSync.delegatedOnly).toBe('function');
    expect(cloudSync.delegatedOnly()).toBe('delegated');
  });
});

describe('auth proxies', () => {
  it('signInWithGoogle delegates with the listener set', async () => {
    await expect(cloudSync.signInWithGoogle('tok')).resolves.toEqual({ uid: 'g' });
    expect(authService.signInWithGoogle).toHaveBeenCalledWith('tok', cloudSync.listeners);
  });
  it('signInWithGoogleWeb delegates', async () => {
    await expect(cloudSync.signInWithGoogleWeb('a', { email: 'e' })).resolves.toEqual({ uid: 'gw' });
  });
  it('signOut clears the cache and delegates', async () => {
    await cloudSync.signOut();
    expect(authService.signOut).toHaveBeenCalled();
  });
  it('deleteAccount wires clan callbacks', async () => {
    await expect(cloudSync.deleteAccount()).resolves.toBe(true);
    expect(authService.deleteAccount).toHaveBeenCalled();
  });
  it('checkSignInStatus delegates', async () => {
    await expect(cloudSync.checkSignInStatus()).resolves.toEqual({ isSignedIn: true });
  });
});

describe('subscribe', () => {
  it('replays the cached last auth state immediately', () => {
    const cb = vi.fn();
    cloudSync.lastAuthState = { isSignedIn: true, user: { uid: 'x' } };
    const unsub = cloudSync.subscribe(cb);
    expect(cb).toHaveBeenCalledWith({ isSignedIn: true, user: { uid: 'x' } });
    unsub();
    cloudSync.lastAuthState = null;
  });

  it('falls back to the auth service last state when no cached state', async () => {
    await cloudSync.ensureInitialized();
    lastAuth = { isSignedIn: false, user: null };
    cloudSync.lastAuthState = null;
    const cb = vi.fn();
    const unsub = cloudSync.subscribe(cb);
    expect(cb).toHaveBeenCalledWith({ isSignedIn: false, user: null });
    unsub();
  });
});

describe('loadUserDetailsWithCache', () => {
  it('caches results within the TTL and refetches for a different uid', async () => {
    const a1 = await cloudSync.loadUserDetailsWithCache('u-a');
    const a2 = await cloudSync.loadUserDetailsWithCache('u-a');
    expect(a1).toEqual({ uid: 'u-a' });
    expect(a2).toBe(a1);
    expect(leaderboardService.loadUserDetails).toHaveBeenCalledTimes(1);
    await cloudSync.loadUserDetailsWithCache('u-b');
    expect(leaderboardService.loadUserDetails).toHaveBeenCalledTimes(2);
  });
});

describe('data + clan proxies', () => {
  it.each([
    ['saveToCloud', 'saved'],
    ['loadFromCloud', 'loaded'],
    ['syncData', 'synced'],
    ['loadLeaderboard', ['lb']],
    ['saveSettingsToCloud', true],
    ['loadSettingsFromCloud', { s: 1 }],
    ['loadPurchase', null],
    ['saveWeightHistoryToCloud', true],
    ['saveCardioSessionsToCloud', true],
    ['createClan', { id: 'c' }],
    ['getUserClans', [{ id: 'c' }]],
  ])('%s resolves through the delegated service', async (method, expected) => {
    await expect(cloudSync[method]('arg')).resolves.toEqual(expected);
  });
});

describe('listen wrappers', () => {
  it('return an unsubscribe that tears down the underlying listener after init', async () => {
    const unsub = cloudSync.listenToSettingsFromCloud(vi.fn());
    expect(typeof unsub).toBe('function');
    await cloudSync.ensureInitialized();
    await Promise.resolve();
    unsub();
    expect(unsubMarker).toHaveBeenCalled();
  });

  it('no-op when unsubscribed before initialization resolves', () => {
    const unsub = cloudSync.listenToCloudChanges(vi.fn());
    expect(() => unsub()).not.toThrow();
  });
});
