import { useEffect } from 'react';
import { useProgressStore } from '@store/useProgressStore';
import { useCloudSyncStore } from '@store/useCloudSyncStore';
import { createLogger } from '@utils/logger';

const logger = createLogger('ProgressAutoSave');

/**
 * Keeps cloud progress up to date once the startup sync is done:
 * - debounced save after every completion change
 * - immediate save when the app goes to background
 * - full re-sync when the device comes back online
 */
export function useProgressAutoSave(auth) {
  const lastCompletionChange = useProgressStore(s => s.lastCompletionChange);
  const saveToCloud = useProgressStore(s => s.saveToCloud);
  const syncWithCloud = useProgressStore(s => s.syncWithCloud);

  const conflictData = useCloudSyncStore(s => s.conflictData);
  const conflictCheckDone = useCloudSyncStore(s => s.conflictCheckDone);
  const isInitialSyncDone = useCloudSyncStore(s => s.isInitialSyncDone);
  const setSyncError = useCloudSyncStore(s => s.setSyncError);

  // ── Auto-save to cloud on completion change (debounced) ───────────────
  useEffect(() => {
    if (auth.isSignedIn && !auth.loading && !conflictData && conflictCheckDone && isInitialSyncDone) {
      const doSave = async () => {
        try {
          await saveToCloud();
          setSyncError(null);
        } catch (error) {
          logger.error('Auto-save failed:', error);
          setSyncError(error.message);
        }
      };
      const timer = setTimeout(doSave, 400);
      return () => clearTimeout(timer);
    }
  }, [lastCompletionChange, auth.isSignedIn, auth.loading, conflictData, conflictCheckDone, isInitialSyncDone, saveToCloud, setSyncError]);

  // ── Force save on visibility change ────────────────────────────────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && auth.isSignedIn && isInitialSyncDone) {
        logger.info('App hidden, forcing immediate cloud save...');
        saveToCloud().catch(err => logger.error('Force save failed:', err));
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [auth.isSignedIn, isInitialSyncDone, saveToCloud]);

  // ── Online recovery listener ───────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      logger.info('Device back online. Attempting synchronization...');
      if (auth.isSignedIn && !auth.loading && isInitialSyncDone) {
        syncWithCloud().catch(err => logger.error('Online recovery sync failed:', err));
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [auth.isSignedIn, auth.loading, isInitialSyncDone, syncWithCloud]);
}
