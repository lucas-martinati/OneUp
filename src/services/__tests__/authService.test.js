import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authService from '../authService';
import {
  GoogleAuthProvider,
  signInWithCredential,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  deleteUser
} from 'firebase/auth';
import { remove, update } from 'firebase/database';
import { Preferences } from '@utils/preferences';
import { getAuthInstance, getDatabaseInstance, initializeFirebase } from '../firebase';


// Mock Dependencies
vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: { credential: vi.fn(() => 'mock_credential') },
  signInWithCredential: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  deleteUser: vi.fn(),
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn((db, path) => path),
  remove: vi.fn(),
  update: vi.fn(),
}));

vi.mock('@utils/logger', () => ({
  createLogger: () => ({
    warn: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('@utils/preferences', () => ({
  Preferences: {
    set: vi.fn(() => Promise.resolve()),
    get: vi.fn(),
    remove: vi.fn(() => Promise.resolve()),
  }
}));

vi.mock('../firebase', () => ({
  getAuthInstance: vi.fn(),
  getDatabaseInstance: vi.fn(),
  initializeFirebase: vi.fn(),
}));

vi.mock('@shared/dbSchema.js', () => ({
  paths: {
    userProfile: (uid) => `userProfile/${uid}`,
    user: (uid) => `user/${uid}`,
    leaderboardEntry: (uid) => `leaderboard/${uid}`,
  }
}));

describe('authService', () => {
  let mockAuth, mockDb;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth = { currentUser: { uid: 'u1', email: 'a@b.com', displayName: 'A', photoURL: 'a.jpg' } };
    mockDb = {};
    getAuthInstance.mockReturnValue(mockAuth);
    getDatabaseInstance.mockReturnValue(mockDb);
  });

  describe('setupAuthListener', () => {
    it('sets up listener and handles sign in', async () => {
      let listenerCallback;
      onAuthStateChanged.mockImplementation((auth, cb) => { listenerCallback = cb; });
      const listeners = [vi.fn()];
      
      authService.setupAuthListener(listeners);
      expect(onAuthStateChanged).toHaveBeenCalledWith(mockAuth, expect.any(Function));
      
      // Simulate user signing in
      const mockUser = { uid: 'u2', email: 'b@c.com', displayName: 'B', photoURL: 'b.jpg' };
      await listenerCallback(mockUser);
      
      expect(Preferences.set).toHaveBeenCalledWith({ key: 'user_signed_in', value: 'true' });
      expect(Preferences.set).toHaveBeenCalledWith({ key: 'user_profile', value: expect.any(String) });
      expect(update).toHaveBeenCalledWith(
        `userProfile/u2`,
        expect.objectContaining({ email: 'b@c.com', displayName: 'B' })
      );
      expect(listeners[0]).toHaveBeenCalledWith({
        isSignedIn: true,
        user: { uid: 'u2', email: 'b@c.com', displayName: 'B', photoURL: 'b.jpg' }
      });
      expect(authService.getLastAuthState()).toEqual({
        isSignedIn: true,
        user: { uid: 'u2', email: 'b@c.com', displayName: 'B', photoURL: 'b.jpg' }
      });
    });

    it('handles sign in with missing profile fields and database failure', async () => {
      update.mockRejectedValueOnce(new Error('DB Error'));
      let listenerCallback;
      onAuthStateChanged.mockImplementation((auth, cb) => { listenerCallback = cb; });
      const listeners = [vi.fn()];
      authService.setupAuthListener(listeners);
      
      await listenerCallback({ uid: 'u3' }); // missing email etc
      expect(update).toHaveBeenCalled();
      // It should just log and not crash
    });

    it('does nothing if no db instance', async () => {
      getDatabaseInstance.mockReturnValueOnce(null);
      let listenerCallback;
      onAuthStateChanged.mockImplementation((auth, cb) => { listenerCallback = cb; });
      authService.setupAuthListener([vi.fn()]);
      
      await listenerCallback({ uid: 'u4' });
      expect(update).not.toHaveBeenCalled();
    });

    it('sets up listener and handles sign out', async () => {
      let listenerCallback;
      onAuthStateChanged.mockImplementation((auth, cb) => { listenerCallback = cb; });
      const listeners = [vi.fn()];
      
      authService.setupAuthListener(listeners);
      
      // Simulate user signing out (null user)
      await listenerCallback(null);
      
      expect(listeners[0]).toHaveBeenCalledWith({ isSignedIn: false, user: null });
      expect(authService.getLastAuthState()).toEqual({ isSignedIn: false, user: null });
    });

    it('returns early if no auth instance', () => {
      getAuthInstance.mockReturnValueOnce(null);
      authService.setupAuthListener([]);
      expect(onAuthStateChanged).not.toHaveBeenCalled();
    });
  });

  describe('signInWithGoogle', () => {
    it('signs in and notifies listeners', async () => {
      signInWithCredential.mockResolvedValueOnce({
        user: { uid: 'u5', email: 'e', displayName: 'D', photoURL: 'P' }
      });
      const listeners = [vi.fn()];
      
      const user = await authService.signInWithGoogle('token123', listeners);
      
      expect(GoogleAuthProvider.credential).toHaveBeenCalledWith('token123');
      expect(signInWithCredential).toHaveBeenCalledWith(mockAuth, 'mock_credential');
      expect(Preferences.set).toHaveBeenCalledWith({ key: 'user_signed_in', value: 'true' });
      expect(listeners[0]).toHaveBeenCalledWith({
        isSignedIn: true,
        user: { uid: 'u5', email: 'e', displayName: 'D', photoURL: 'P' }
      });
      expect(update).toHaveBeenCalled(); // profile sync
      expect(user.uid).toBe('u5');
    });

    it('throws if no auth instance', async () => {
      getAuthInstance.mockReturnValueOnce(null);
      await expect(authService.signInWithGoogle('token', [])).rejects.toThrow('Firebase not initialized');
    });
  });

  describe('signInWithGoogleWeb', () => {
    it('signs in, uses fallback user info, and notifies listeners', async () => {
      signInWithCredential.mockResolvedValueOnce({
        user: { uid: 'u6' } // missing email, displayName, photoURL
      });
      const listeners = [vi.fn()];
      
      const userInfo = { email: 'fb', name: 'fbn', picture: 'fbp' };
      const user = await authService.signInWithGoogleWeb('accToken', userInfo, listeners);
      
      expect(GoogleAuthProvider.credential).toHaveBeenCalledWith(null, 'accToken');
      expect(listeners[0]).toHaveBeenCalledWith({
        isSignedIn: true,
        user: { uid: 'u6', email: 'fb', displayName: 'fbn', photoURL: 'fbp' }
      });
      expect(user.uid).toBe('u6');
    });

    it('throws if no auth instance', async () => {
      getAuthInstance.mockReturnValueOnce(null);
      await expect(authService.signInWithGoogleWeb('t', {}, [])).rejects.toThrow('Firebase not initialized');
    });
  });

  describe('signOut', () => {
    it('signs out and notifies listeners', async () => {
      const listeners = [vi.fn()];
      await authService.signOut(listeners);
      
      expect(firebaseSignOut).toHaveBeenCalledWith(mockAuth);
      expect(Preferences.remove).toHaveBeenCalledWith({ key: 'user_signed_in' });
      expect(Preferences.remove).toHaveBeenCalledWith({ key: 'user_id' });
      expect(Preferences.remove).toHaveBeenCalledWith({ key: 'user_profile' });
      expect(listeners[0]).toHaveBeenCalledWith({ isSignedIn: false, user: null });
    });

    it('throws if no auth instance', async () => {
      getAuthInstance.mockReturnValueOnce(null);
      await expect(authService.signOut([])).rejects.toThrow('Firebase not initialized');
    });
  });

  describe('deleteAccount', () => {
    it('deletes account, leaves clans, removes data, and signs out', async () => {
      const listeners = [vi.fn()];
      const leaveClanFn = vi.fn();
      const getUserClansFn = vi.fn(() => Promise.resolve([{ id: 'c1' }, { id: 'c2' }]));
      
      const result = await authService.deleteAccount(listeners, leaveClanFn, getUserClansFn);
      
      expect(getUserClansFn).toHaveBeenCalled();
      expect(leaveClanFn).toHaveBeenCalledWith('c1');
      expect(leaveClanFn).toHaveBeenCalledWith('c2');
      
      expect(remove).toHaveBeenCalledWith('user/u1');
      expect(remove).toHaveBeenCalledWith('leaderboard/u1');
      
      expect(Preferences.remove).toHaveBeenCalledWith({ key: 'user_signed_in' });
      
      expect(deleteUser).toHaveBeenCalledWith(mockAuth.currentUser);
      expect(result).toBe(true);
    });

    it('handles clan leave failure gracefully', async () => {
      const getUserClansFn = vi.fn(() => Promise.resolve([{ id: 'c1' }]));
      const leaveClanFn = vi.fn(() => Promise.reject(new Error('clan fail')));
      
      await authService.deleteAccount([], leaveClanFn, getUserClansFn);
      // should continue to deleteUser
      expect(deleteUser).toHaveBeenCalled();
    });

    it('handles missing database by initializing it', async () => {
      getDatabaseInstance.mockReturnValueOnce(null);
      const getUserClansFn = vi.fn(() => Promise.resolve([]));
      await authService.deleteAccount([], vi.fn(), getUserClansFn);
      expect(initializeFirebase).toHaveBeenCalled();
    });

    it('handles client-side DB remove failure gracefully', async () => {
      remove.mockRejectedValue(new Error('permission denied')); // for user and leaderboard
      const getUserClansFn = vi.fn(() => Promise.resolve([]));
      
      await authService.deleteAccount([], vi.fn(), getUserClansFn);
      expect(deleteUser).toHaveBeenCalled(); // still deletes user
    });

    it('handles requires-recent-login by signing out', async () => {
      deleteUser.mockRejectedValueOnce({ code: 'auth/requires-recent-login' });
      const getUserClansFn = vi.fn(() => Promise.resolve([]));
      
      const result = await authService.deleteAccount([], vi.fn(), getUserClansFn);
      
      expect(firebaseSignOut).toHaveBeenCalled();
      expect(result).toBe(true); // wait, it returns true? Yes, it returns true and catches the error.
    });

    it('throws other auth errors', async () => {
      deleteUser.mockRejectedValueOnce({ code: 'auth/unknown' });
      const getUserClansFn = vi.fn(() => Promise.resolve([]));
      
      await expect(authService.deleteAccount([], vi.fn(), getUserClansFn)).rejects.toEqual({ code: 'auth/unknown' });
    });

    it('throws if no current user', async () => {
      getAuthInstance.mockReturnValueOnce({ currentUser: null });
      await expect(authService.deleteAccount([], vi.fn(), vi.fn())).rejects.toThrow('User not signed in');
    });
  });

  describe('checkSignInStatus', () => {
    it('returns signed in status if pref is true and user exists', async () => {
      Preferences.get.mockResolvedValueOnce({ value: 'true' });
      const result = await authService.checkSignInStatus();
      
      expect(result.isSignedIn).toBe(true);
      expect(result.user.uid).toBe('u1');
    });

    it('returns false if pref is false', async () => {
      Preferences.get.mockResolvedValueOnce({ value: 'false' });
      const result = await authService.checkSignInStatus();
      
      expect(result.isSignedIn).toBe(false);
    });

    it('returns false if pref is true but no currentUser', async () => {
      Preferences.get.mockResolvedValueOnce({ value: 'true' });
      getAuthInstance.mockReturnValueOnce({ currentUser: null });
      const result = await authService.checkSignInStatus();
      
      expect(result.isSignedIn).toBe(false);
    });
  });

  describe('getCurrentUserId', () => {
    it('returns uid if user is present', () => {
      expect(authService.getCurrentUserId()).toBe('u1');
    });

    it('returns null if no user', () => {
      getAuthInstance.mockReturnValueOnce({ currentUser: null });
      expect(authService.getCurrentUserId()).toBeNull();
    });

    it('returns null if no auth instance', () => {
      getAuthInstance.mockReturnValueOnce(null);
      expect(authService.getCurrentUserId()).toBeNull();
    });
  });
});
