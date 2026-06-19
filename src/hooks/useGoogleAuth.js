import { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { cloudSync } from '@services/cloudSync';
import { createLogger } from '@utils/logger';
import { isNativePlatform } from '@utils/platform';
import { Preferences } from '@utils/preferences';

const logger = createLogger('GoogleAuth');

// Client ID for Google OAuth (from environment variable)
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export function useGoogleAuth() {
  const [authState, setAuthState] = useState({
    isSignedIn: false,
    user: null,
    loading: true,
    // True once Firebase has definitively resolved the auth state (or we know
    // for sure there's no session). Optimistic boot sets isSignedIn=true while
    // this stays false, so cloud reads/writes stay paused until Firebase is
    // actually ready — see useCloudStartupSync / useCloudSettingsSync.
    authConfirmed: false,
    error: null,
    syncStatus: 'idle' // idle, syncing, synced, error
  });

  const isNative = isNativePlatform();

  // Web sign-in handler using GIS (always call the hook to satisfy rules-of-hooks)
  const webSignInHandler = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      if (isNative) return; // No-op on native
      try {
        logger.info('GIS sign-in successful, retrieving user info...');

        // Get user info from Google
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        const userInfo = await userInfoResponse.json();

        logger.success('User info retrieved:', userInfo.email);

        // Sign in to Firebase with access token and user info
        await cloudSync.signInWithGoogleWeb(tokenResponse.access_token, userInfo);

      } catch (error) {
        logger.error('GIS sign-in error:', error);
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Failed to sign in with Google',
          syncStatus: 'error'
        }));
      }
    },
    onError: (error) => {
      if (isNative) return; // No-op on native
      logger.error('GIS login failed:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to sign in with Google',
        syncStatus: 'error'
      }));
    },
    scope: 'profile email'
  });

  // Initialize Capacitor Google Auth for native platforms
  useEffect(() => {
    let cancelled = false;

    if (!isNative) {
      logger.info('Using GIS for web platform');
      return undefined;
    }

    import('@codetrix-studio/capacitor-google-auth')
      .then(({ GoogleAuth }) => {
        if (cancelled) return;

        GoogleAuth.initialize({
          clientId: GOOGLE_CLIENT_ID,
          scopes: ['profile', 'email'],
        });
        logger.info('Capacitor Google Auth initialized for native platform');
      })
      .catch((error) => {
        logger.error('Capacitor Google Auth initialization failed:', error);
      });

    return () => {
      cancelled = true;
    };
  }, [isNative]);

  // Check auth status on mount
  useEffect(() => {
    let isMounted = true;

    // Step 1: Check the local cached flag FIRST (instant, no network)
    // This tells us if the user was previously signed in, so we can
    // keep showing the loading screen instead of flashing the Onboarding.
    const initAuth = async () => {
      const { value: wasPreviouslySignedIn } = await Preferences.get({ key: 'user_signed_in' });

      if (wasPreviouslySignedIn === 'true') {
        // User was signed in before → boot Firebase so onAuthStateChanged can
        // restore the real session. New visitors skip this entirely, keeping
        // first paint free of the Firebase SDK + auth iframe.
        cloudSync.ensureInitialized();
        logger.info('Previously signed-in user detected, waiting for Firebase to restore session...');

        // Optimistic boot: render the app immediately from the cached identity
        // and local data, while Firebase restores the real session in the
        // background. On a slow network onAuthStateChanged can take 10-15s
        // (it refreshes the ID token first) — without this the whole app sits
        // on "Initialisation...". Cloud access stays gated on `authConfirmed`,
        // so nothing hits the network until Firebase is genuinely ready.
        const { value: cachedUid } = await Preferences.get({ key: 'user_id' });
        if (cachedUid && isMounted) {
          let cachedUser = { uid: cachedUid };
          try {
            const { value: profileJson } = await Preferences.get({ key: 'user_profile' });
            if (profileJson) cachedUser = { ...cachedUser, ...JSON.parse(profileJson) };
          } catch { /* ignore malformed cache */ }
          setAuthState(prev => ({
            ...prev,
            isSignedIn: true,
            user: cachedUser,
            loading: false,
          }));
        }
      } else {
        // Never signed in → definitive state immediately, no need to wait
        if (isMounted) {
          setAuthState(prev => ({
            ...prev,
            loading: false,
            isSignedIn: false,
            user: null,
            authConfirmed: true,
          }));
        }
      }
    };

    initAuth();

    // Step 2: Subscribe to cloudSync state changes (onAuthStateChanged)
    // This is the source of truth — it fires once Firebase restores the session
    const unsubscribe = cloudSync.subscribe((state) => {
      if (isMounted) {
        setAuthState(prev => ({
          ...prev,
          isSignedIn: state.isSignedIn,
          user: state.user,
          loading: false,
          authConfirmed: true
        }));
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Native sign-in using Capacitor
  const signInNative = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
      const googleUser = await GoogleAuth.signIn();
      logger.success('Capacitor Google Sign-In successful:', googleUser.email);

      // Sign in to Firebase with the ID token
      await cloudSync.signInWithGoogle(googleUser.authentication.idToken);

    } catch (error) {
      logger.error('Native sign-in error:', JSON.stringify(error));
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to sign in',
        syncStatus: 'error'
      }));
      throw error;
    }
  };

  // Unified sign-in function
  const signIn = async () => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    // Boot Firebase before authenticating (no-op if already initialized).
    cloudSync.ensureInitialized();

    if (isNative) {
      await signInNative();
    } else {
      // Trigger GIS login flow
      if (webSignInHandler) {
        webSignInHandler();
      } else {
        logger.error('Web sign-in handler not initialized');
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: 'Web sign-in not available',
          syncStatus: 'error'
        }));
      }
    }
  };

  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      // Sign out from both Google and Firebase
      if (isNative) {
        const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
        await GoogleAuth.signOut();
      }
      // For web GIS, there's no explicit logout needed, just Firebase

      await cloudSync.signOut();

      setAuthState({
        isSignedIn: false,
        user: null,
        loading: false,
        authConfirmed: true,
        error: null,
        syncStatus: 'idle'
      });
    } catch (error) {
      logger.error('Sign out error:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to sign out',
        syncStatus: 'error'
      }));
      throw error;
    }
  };

  const updateSyncStatus = (status) => {
    setAuthState(prev => ({ ...prev, syncStatus: status }));
  };

  return {
    ...authState,
    signIn,
    signOut,
    refresh: () => {}, // Auth state is now managed by onAuthStateChanged listener
    updateSyncStatus
  };
}
