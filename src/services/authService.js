import {
  GoogleAuthProvider,
  signInWithCredential,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  deleteUser
} from 'firebase/auth';
import { Preferences } from '@capacitor/preferences';
import { createLogger } from '../utils/logger';
import { getAuthInstance, initializeFirebase } from './firebase';

const logger = createLogger('Auth');

function notifyListeners(listeners, state) {
  listeners.forEach(listener => listener(state));
}

export function setupAuthListener(listeners) {
  const auth = getAuthInstance();
  if (!auth) return;

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      logger.info('Firebase Auth Restored:', user.email);
      await Preferences.set({ key: 'user_signed_in', value: 'true' });
      await Preferences.set({ key: 'user_id', value: user.uid });
      notifyListeners(listeners, {
        isSignedIn: true,
        user: { uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL }
      });
    } else {
      notifyListeners(listeners, { isSignedIn: false, user: null });
    }
  });
}

export async function signInWithGoogle(idToken, listeners) {
  const auth = getAuthInstance();
  if (!auth) throw new Error('Firebase not initialized');

  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);

  await Preferences.set({ key: 'user_signed_in', value: 'true' });
  await Preferences.set({ key: 'user_id', value: result.user.uid });

  notifyListeners(listeners, {
    isSignedIn: true,
    user: { uid: result.user.uid, email: result.user.email, displayName: result.user.displayName, photoURL: result.user.photoURL }
  });
  return result.user;
}

export async function signInWithGoogleWeb(accessToken, userInfo, listeners) {
  const auth = getAuthInstance();
  if (!auth) throw new Error('Firebase not initialized');

  const credential = GoogleAuthProvider.credential(null, accessToken);
  const result = await signInWithCredential(auth, credential);

  await Preferences.set({ key: 'user_signed_in', value: 'true' });
  await Preferences.set({ key: 'user_id', value: result.user.uid });

  notifyListeners(listeners, {
    isSignedIn: true,
    user: {
      uid: result.user.uid,
      email: result.user.email || userInfo.email,
      displayName: result.user.displayName || userInfo.name,
      photoURL: result.user.photoURL || userInfo.picture
    }
  });
  return result.user;
}

export async function signOut(listeners) {
  const auth = getAuthInstance();
  if (!auth) throw new Error('Firebase not initialized');

  await firebaseSignOut(auth);
  await Preferences.remove({ key: 'user_signed_in' });
  await Preferences.remove({ key: 'user_id' });
  notifyListeners(listeners, { isSignedIn: false, user: null });
}

export async function deleteAccount(listeners, leaveClanFn, getUserClansFn) {
  const auth = getAuthInstance();
  if (!auth?.currentUser) throw new Error('User not signed in');

  const userId = auth.currentUser.uid;

  try {
    const userClans = await getUserClansFn();
    for (const clan of userClans) {
      await leaveClanFn(clan.id);
    }
  } catch (clanErr) {
    logger.warn('Failed to leave some clans during account deletion', clanErr);
  }

  const { ref, remove } = await import('firebase/database');
  const { database } = await import('./firebase');
  const db = database || (await (async () => { initializeFirebase(); return (await import('./firebase')).getDatabaseInstance(); })());

  await remove(ref(db, `users/${userId}`));
  await remove(ref(db, `leaderboard/${userId}`));

  await Preferences.remove({ key: 'user_signed_in' });
  await Preferences.remove({ key: 'user_id' });
  notifyListeners(listeners, { isSignedIn: false, user: null });

  try {
    await deleteUser(auth.currentUser);
    logger.success('Account deleted successfully');
  } catch (authError) {
    if (authError.code === 'auth/requires-recent-login') {
      logger.warn('Account data deleted, but Firebase Auth deletion requires recent login. User signed out.');
      await firebaseSignOut(auth);
    } else {
      throw authError;
    }
  }
  return true;
}

export async function checkSignInStatus() {
  const auth = getAuthInstance();
  const { value } = await Preferences.get({ key: 'user_signed_in' });

  if (value === 'true' && auth?.currentUser) {
    return {
      isSignedIn: true,
      user: {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        displayName: auth.currentUser.displayName,
        photoURL: auth.currentUser.photoURL
      }
    };
  }
  return { isSignedIn: false, user: null };
}

export function getCurrentUserId() {
  return getAuthInstance()?.currentUser?.uid || null;
}
