import { useEffect } from 'react';
import { useProgressStore } from '@store/useProgressStore';
import { useCloudSyncStore } from '@store/useCloudSyncStore';

/**
 * Subscribes to real-time cloud changes once the startup sync is complete.
 * The listener stays off while sync is paused or a conflict is unresolved.
 */
export function useRealtimeCloudListener(auth) {
  const isStoreInitialized = useProgressStore(s => s.isStoreInitialized);
  const startCloudListener = useProgressStore(s => s.startCloudListener);
  const conflictCheckDone = useCloudSyncStore(s => s.conflictCheckDone);
  const isInitialSyncDone = useCloudSyncStore(s => s.isInitialSyncDone);
  const isSyncPaused = useCloudSyncStore(s => s.isSyncPaused);
  const conflictData = useCloudSyncStore(s => s.conflictData);

  useEffect(() => {
    if (auth.isSignedIn && !auth.loading && isStoreInitialized && conflictCheckDone && isInitialSyncDone && !isSyncPaused && !conflictData) {
      const unsubscribe = startCloudListener();
      return () => { if (unsubscribe) unsubscribe(); };
    }
  }, [auth.isSignedIn, auth.loading, isStoreInitialized, conflictCheckDone, isInitialSyncDone, isSyncPaused, conflictData, startCloudListener]);
}
