import { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { cloudSync } from '../services/cloudSync';
import { createLogger } from '../utils/logger';

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

  const isNative = Capacitor.isNativePlatform();

  // Web sign-in handler using GIS (only for web)
  const webSignInHandler = !isNative ? useGoogleLogin({
    onSuccess: async (tokenResponse) => {
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
      logger.error('GIS login failed:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to sign in with Google',
        syncStatus: 'error'
      }));
    },
    scope: 'profile email'
  }) : null;

  // Initialize Capacitor Google Auth for native platforms
  useEffect(() => {
    if (isNative) {
      GoogleAuth.initialize({
        clientId: GOOGLE_CLIENT_ID,
        scopes: ['profile', 'email'],
      });
      logger.info('Capacitor Google Auth initialized for native platform');
    } else {
      logger.info('Using GIS for web platform');
    }
  }, [isNative]);

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
    
    // Subscribe to cloudSync state changes
    const unsubscribe = cloudSync.subscribe((state) => {
      setAuthState(prev => ({
        ...prev,
        isSignedIn: state.isSignedIn,
        user: state.user,
        loading: false
      }));
    });

    return () => unsubscribe();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const status = await cloudSync.checkSignInStatus();
      setAuthState({
        isSignedIn: status.isSignedIn,
        user: status.user,
        loading: false,
        error: null,
        syncStatus: 'idle'
      });
    } catch (error) {
      logger.error('Error checking auth status:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message,
        syncStatus: 'error'
      }));
    }
  };

  // Native sign-in using Capacitor
  const signInNative = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

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
    refresh: checkAuthStatus,
    updateSyncStatus
  };
}
