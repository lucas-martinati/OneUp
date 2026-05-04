import { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { cloudSync } from '../services/cloudSync';
import { createLogger } from '../utils/logger';
import { isNativePlatform } from '../utils/platform';
import { Preferences } from '../utils/preferences';

const logger = createLogger('GoogleAuth');

// Client ID for Google OAuth (from environment variable)
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export function useGoogleAuth() {
  const [authState, setAuthState] = useState({
    isSignedIn: false,
    user: null,
    loading: true,
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
        // User was signed in before → keep loading=true, wait for onAuthStateChanged
        // to fire with the real Firebase user (avoids flash of Onboarding)
        logger.info('Previously signed-in user detected, waiting for Firebase to restore session...');
      } else {
        // Never signed in → resolve immediately, no need to wait
        if (isMounted) {
          setAuthState(prev => ({
            ...prev,
            loading: false,
            isSignedIn: false,
            user: null,
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
          loading: false
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
