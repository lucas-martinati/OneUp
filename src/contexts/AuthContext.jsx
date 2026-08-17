import { createContext, useContext, useMemo } from 'react';
import { useGoogleAuth } from '@hooks/useGoogleAuth';

const AuthContext = createContext(null);

/**
 * Provides authentication state and actions to the entire app.
 * Wraps useGoogleAuth so no component needs to receive auth as props.
 *
 * Exposes: isSignedIn, user, loading, error, syncStatus, signIn, signOut, refresh
 */
export function AuthProvider({ children }) {
  const auth = useGoogleAuth();

  // Keep the context value reference stable across renders so consumers don't
  // re-render when unrelated state changes.
  const value = useMemo(() => auth, [auth]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth state from any component.
 * @returns {{ isSignedIn, user, loading, error, syncStatus, signIn, signOut, refresh, updateSyncStatus }}
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
