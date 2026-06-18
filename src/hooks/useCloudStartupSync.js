import { useEffect, useRef } from 'react';
import { useProgressStore } from '../store/useProgressStore';
import { useCloudSyncStore } from '../store/useCloudSyncStore';
import { cloudSync } from '../services/cloudSync';
import { createLogger } from '../utils/logger';

const logger = createLogger('CloudStartup');

const CLOUD_TIMEOUT_MS = 10000;
const withTimeout = (promise) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), CLOUD_TIMEOUT_MS)),
]);

/**
 * Startup cloud sequence, as one linear async flow instead of a chain of
 * flag-driven effects:
 *
 *   1. Local data + guest data found  → surface the conflict overlay and stop
 *      (sync resumes once the user resolves it).
 *   2. Local data, no guest data      → full sync with the cloud.
 *   3. No local data                  → try to restore from the cloud.
 *
 * Every cloud call is capped at 10s — on failure or timeout the app always
 * starts on local data. The sequence runs once per sign-in.
 */
async function runStartupSequence() {
  const progress = useProgressStore.getState();
  const sync = useCloudSyncStore.getState();

  if (progress.isSetup) {
    // ── Local data exists: check for a guest-data conflict first ──
    try {
      if (await progress.hasGuestData()) {
        // Raw service load: the cloud snapshot feeds the conflict overlay,
        // it must NOT be applied to the local store.
        const cloudData = await withTimeout(cloudSync.loadFromCloud());
        sync.setConflictData({ ...cloudData, isAnonymousMerge: true });
        sync.setConflictCheckDone(true);
        sync.setIsInitialSyncDone(true);
        return; // wait for the user to resolve the conflict
      }
    } catch (error) {
      logger.error('Conflict detection failed or timed out:', error);
    }
    sync.setConflictCheckDone(true);

    // ── Initial full sync ──
    try {
      await withTimeout(progress.syncWithCloud());
    } catch (error) {
      logger.error('Initial sync failed or timed out:', error);
    }
    sync.setIsInitialSyncDone(true);
  } else {
    // ── No local data: try to restore from the cloud ──
    try {
      const result = await withTimeout(progress.loadFromCloud());
      if (result?.success) {
        logger.info('Cloud data restored for signed-in user with no local data');
      }
    } catch (error) {
      logger.error('Cloud load for signed-in user failed or timed out:', error);
    }
    sync.setConflictCheckDone(true);
    sync.setIsInitialSyncDone(true);
  }
}

export function useCloudStartupSync(auth) {
  const isStoreInitialized = useProgressStore(s => s.isStoreInitialized);
  const resetSyncState = useCloudSyncStore(s => s.resetSyncState);
  const startedForUid = useRef(null);

  // Reset all sync flags when the user signs out
  useEffect(() => {
    if (!auth.isSignedIn) {
      startedForUid.current = null;
      queueMicrotask(() => resetSyncState());
    }
  }, [auth.isSignedIn, auth.user?.uid, resetSyncState]);

  // Launch the startup sequence once per signed-in user, after local init.
  // Gated on `authConfirmed` (not just !loading): during an optimistic boot the
  // app is rendered before Firebase is ready, and cloud calls would fail and
  // never retry. We wait for the real session.
  useEffect(() => {
    if (!auth.isSignedIn || !auth.authConfirmed || !isStoreInitialized) return;
    if (useCloudSyncStore.getState().conflictCheckDone) return;
    if (startedForUid.current === auth.user?.uid) return;
    startedForUid.current = auth.user?.uid;
    runStartupSequence();
  }, [auth.isSignedIn, auth.authConfirmed, auth.user?.uid, isStoreInitialized]);
}
