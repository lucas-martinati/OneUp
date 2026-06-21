import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: { credential: vi.fn((idToken, accessToken) => ({ idToken, accessToken })) },
  signInWithCredential: vi.fn(),
  signOut: vi.fn(() => Promise.resolve()),
  onAuthStateChanged: vi.fn(),
  deleteUser: vi.fn(() => Promise.resolve()),
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn((db, path) => ({ db, path })),
  remove: vi.fn(() => Promise.resolve()),
  update: vi.fn(() => Promise.resolve()),
}));

vi.mock('@utils/logger', () => ({
  createLogger: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() }),
}));

const prefStore = {};
vi.mock('@utils/preferences', () => ({
  Preferences: {
    set: vi.fn(({ key, value }) => { prefStore[key] = value; return Promise.resolve(); }),
    get: vi.fn(({ key }) => Promise.resolve({ value: prefStore[key] ?? null })),
    remove: vi.fn(({ key }) => { delete prefStore[key]; return Promise.resolve(); }),
  },
}));

vi.mock('../firebase', () => ({
  getAuthInstance: vi.fn(),
  getDatabaseInstance: vi.fn(),
  initializeFirebase: vi.fn(),
}));

import { signInWithCredential, signOut as fbSignOut, onAuthStateChanged, deleteUser } from 'firebase/auth';
import { remove } from 'firebase/database';
import { getAuthInstance, getDatabaseInstance } from '../firebase';
import * as auth from '../authService';

beforeEach(() => {
  vi.clearAllMocks();
  for (const k of Object.keys(prefStore)) delete prefStore[k];
  vi.mocked(getDatabaseInstance).mockReturnValue({ db: true });
});

describe('setupAuthListener', () => {
  it('does nothing when there is no auth instance', () => {
    vi.mocked(getAuthInstance).mockReturnValue(null);
    auth.setupAuthListener([vi.fn()]);
    expect(onAuthStateChanged).not.toHaveBeenCalled();
  });

  it('notifies listeners and persists identity on sign-in', async () => {
    vi.mocked(getAuthInstance).mockReturnValue({});
    const listener = vi.fn();
    vi.mocked(onAuthStateChanged).mockImplementation((_a, cb) => cb({
      uid: 'u1', email: 'a@b.c', displayName: 'A', photoURL: 'p',
    }));
    auth.setupAuthListener([listener]);
    await vi.waitFor(() => expect(listener).toHaveBeenCalled());
    expect(listener).toHaveBeenCalledWith({ isSignedIn: true, user: expect.objectContaining({ uid: 'u1' }) });
    expect(auth.getLastAuthState().isSignedIn).toBe(true);
    expect(prefStore.user_signed_in).toBe('true');
  });

  it('notifies a signed-out state when no user', async () => {
    vi.mocked(getAuthInstance).mockReturnValue({});
    const listener = vi.fn();
    vi.mocked(onAuthStateChanged).mockImplementation((_a, cb) => cb(null));
    auth.setupAuthListener([listener]);
    await vi.waitFor(() => expect(listener).toHaveBeenCalledWith({ isSignedIn: false, user: null }));
  });
});

describe('signInWithGoogle / signInWithGoogleWeb', () => {
  it('throws when firebase is not initialized', async () => {
    vi.mocked(getAuthInstance).mockReturnValue(null);
    await expect(auth.signInWithGoogle('tok', [])).rejects.toThrow('Firebase not initialized');
    await expect(auth.signInWithGoogleWeb('tok', {}, [])).rejects.toThrow('Firebase not initialized');
  });

  it('signs in with an id token and notifies listeners', async () => {
    vi.mocked(getAuthInstance).mockReturnValue({});
    vi.mocked(signInWithCredential).mockResolvedValue({ user: { uid: 'u2', email: 'e', displayName: 'D', photoURL: 'p' } });
    const listener = vi.fn();
    const user = await auth.signInWithGoogle('idtok', [listener]);
    expect(user.uid).toBe('u2');
    expect(listener).toHaveBeenCalledWith({ isSignedIn: true, user: expect.objectContaining({ uid: 'u2' }) });
    expect(prefStore.user_id).toBe('u2');
  });

  it('web sign-in falls back to userInfo fields when firebase profile is empty', async () => {
    vi.mocked(getAuthInstance).mockReturnValue({});
    vi.mocked(signInWithCredential).mockResolvedValue({ user: { uid: 'u3', email: null, displayName: null, photoURL: null } });
    const listener = vi.fn();
    await auth.signInWithGoogleWeb('access', { email: 'fallback@x', name: 'Fallback', picture: 'pic' }, [listener]);
    expect(listener).toHaveBeenCalledWith({
      isSignedIn: true,
      user: expect.objectContaining({ email: 'fallback@x', displayName: 'Fallback', photoURL: 'pic' }),
    });
  });
});

describe('signOut', () => {
  it('throws without an auth instance', async () => {
    vi.mocked(getAuthInstance).mockReturnValue(null);
    await expect(auth.signOut([])).rejects.toThrow('Firebase not initialized');
  });

  it('clears preferences and notifies a signed-out state', async () => {
    vi.mocked(getAuthInstance).mockReturnValue({});
    prefStore.user_signed_in = 'true';
    const listener = vi.fn();
    await auth.signOut([listener]);
    expect(fbSignOut).toHaveBeenCalled();
    expect(prefStore.user_signed_in).toBeUndefined();
    expect(listener).toHaveBeenCalledWith({ isSignedIn: false, user: null });
  });
});

describe('deleteAccount', () => {
  const setupSignedIn = () => vi.mocked(getAuthInstance).mockReturnValue({ currentUser: { uid: 'u9' } });

  it('throws when no user is signed in', async () => {
    vi.mocked(getAuthInstance).mockReturnValue({ currentUser: null });
    await expect(auth.deleteAccount([], vi.fn(), vi.fn())).rejects.toThrow('User not signed in');
  });

  it('leaves clans, wipes data and deletes the user', async () => {
    setupSignedIn();
    const leaveClan = vi.fn(() => Promise.resolve());
    const getUserClans = vi.fn(() => Promise.resolve([{ id: 'c1' }, { id: 'c2' }]));
    const listener = vi.fn();
    const ok = await auth.deleteAccount([listener], leaveClan, getUserClans);
    expect(ok).toBe(true);
    expect(leaveClan).toHaveBeenCalledTimes(2);
    expect(remove).toHaveBeenCalledTimes(2);
    expect(deleteUser).toHaveBeenCalled();
    expect(listener).toHaveBeenCalledWith({ isSignedIn: false, user: null });
  });

  it('tolerates clan-leave failures and data-removal denials', async () => {
    setupSignedIn();
    vi.mocked(remove).mockRejectedValue(new Error('permission denied'));
    const getUserClans = vi.fn(() => Promise.reject(new Error('boom')));
    const ok = await auth.deleteAccount([], vi.fn(), getUserClans);
    expect(ok).toBe(true);
    expect(deleteUser).toHaveBeenCalled();
  });

  it('signs out instead of throwing on requires-recent-login', async () => {
    setupSignedIn();
    vi.mocked(deleteUser).mockRejectedValue({ code: 'auth/requires-recent-login' });
    const ok = await auth.deleteAccount([], vi.fn(), vi.fn(() => Promise.resolve([])));
    expect(ok).toBe(true);
    expect(fbSignOut).toHaveBeenCalled();
  });

  it('rethrows unexpected auth deletion errors', async () => {
    setupSignedIn();
    vi.mocked(deleteUser).mockRejectedValue({ code: 'auth/network-request-failed' });
    await expect(auth.deleteAccount([], vi.fn(), vi.fn(() => Promise.resolve([])))).rejects.toEqual({ code: 'auth/network-request-failed' });
  });
});

describe('checkSignInStatus / getCurrentUserId', () => {
  it('reports signed-in when the flag and currentUser agree', async () => {
    prefStore.user_signed_in = 'true';
    vi.mocked(getAuthInstance).mockReturnValue({ currentUser: { uid: 'u1', email: 'e', displayName: 'D', photoURL: 'p' } });
    const status = await auth.checkSignInStatus();
    expect(status).toEqual({ isSignedIn: true, user: expect.objectContaining({ uid: 'u1' }) });
  });

  it('reports signed-out when the flag is missing', async () => {
    vi.mocked(getAuthInstance).mockReturnValue({ currentUser: { uid: 'u1' } });
    const status = await auth.checkSignInStatus();
    expect(status).toEqual({ isSignedIn: false, user: null });
  });

  it('getCurrentUserId returns the uid or null', () => {
    vi.mocked(getAuthInstance).mockReturnValue({ currentUser: { uid: 'abc' } });
    expect(auth.getCurrentUserId()).toBe('abc');
    vi.mocked(getAuthInstance).mockReturnValue(null);
    expect(auth.getCurrentUserId()).toBeNull();
  });
});
