import { useState, useEffect } from 'react';
import { cloudSync } from '../services/cloudSync';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { createLogger } from '../utils/logger';

const logger = createLogger('GoogleAuth');

export function useGoogleAuth() {
  const [authState, setAuthState] = useState({
    isSignedIn: false,
    user: null,
    loading: true,
    error: null,
    syncStatus: 'idle' // idle, syncing, synced, error
  });

  // Initialiser le plugin Google Auth
  useEffect(() => {
    GoogleAuth.initialize({
      clientId: '595493181718-m1je2o82qoa4d88rml1h2hbnpl3rge0t.apps.googleusercontent.com',
      scopes: ['profile', 'email'],
    });
  }, []);

  // Vérifier le statut de connexion au chargement
  useEffect(() => {
    checkAuthStatus();
    
    // S'abonner aux changements d'état
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

  const signIn = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      // 1. Google Sign-In natif via Capacitor
      const googleUser = await GoogleAuth.signIn();
      
      logger.success('Google Sign-In successful:', googleUser.email);

      // 2. Connexion à Firebase avec le token ID
      await cloudSync.signInWithGoogle(googleUser.authentication.idToken);

      // L'état sera mis à jour via le listener cloudSync
    } catch (error) {
      logger.error('Sign in error:', JSON.stringify(error));
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to sign in',
        syncStatus: 'error'
      }));
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      // Déconnexion de Google et Firebase
      await GoogleAuth.signOut();
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
