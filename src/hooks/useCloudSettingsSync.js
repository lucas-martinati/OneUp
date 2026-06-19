import { useCallback, useEffect } from 'react';
import { useProgressStore } from '@store/useProgressStore';
import { useSettingsStore, LOCAL_ONLY_KEYS } from '@store/useSettingsStore';
import { useCloudAutoSave } from './useCloudAutoSave';
import { cloudSync } from '@services/cloudSync';
import { createLogger } from '@utils/logger';

const logger = createLogger('SettingsSync');

/** Drop device-local settings so they are never written to the cloud. */
function stripLocalOnly(settings) {
  const out = { ...settings };
  for (const key of LOCAL_ONLY_KEYS) delete out[key];
  return out;
}

/**
 * Settings ↔ cloud synchronization: loads cloud settings on sign-in and
 * auto-saves local settings changes afterwards.
 */
export function useCloudSettingsSync(auth) {
  const settings = useSettingsStore(s => s.settings);
  const settingsInitialSyncDone = useSettingsStore(s => s.settingsInitialSyncDone);
  const markSettingsSynced = useSettingsStore(s => s.markSettingsSynced);
  const applyCloudSettings = useSettingsStore(s => s.applyCloudSettings);

  const isStoreInitialized = useProgressStore(s => s.isStoreInitialized);
  const isSetup = useProgressStore(s => s.isSetup);

  // ── Live cloud settings sync ───────────────────────────────────────────
  // A real-time listener keeps settings in sync when they are changed from the
  // admin panel or another device. It fires once immediately with the current
  // cloud value, which also drives the initial load.
  // Gated on `authConfirmed`: the listener needs the real Firebase currentUser,
  // which isn't available yet during an optimistic boot.
  useEffect(() => {
    if (auth.isSignedIn && auth.authConfirmed) {
      let firstSnapshot = true;
      const unsubscribe = cloudSync.listenToSettingsFromCloud((cloudSettings) => {
        if (cloudSettings) {
          logger.info('Cloud settings received:', cloudSettings);
          applyCloudSettings(cloudSettings);
        }
        if (firstSnapshot) {
          firstSnapshot = false;
          setTimeout(() => markSettingsSynced(), 0);
        }
      });
      return unsubscribe;
    } else if (!auth.isSignedIn && auth.authConfirmed) {
      setTimeout(() => markSettingsSynced(), 0);
    }
  }, [auth.isSignedIn, auth.authConfirmed, applyCloudSettings, markSettingsSynced]);

  // ── Cloud auto-save for settings ───────────────────────────────────────
  const saveSettings = useCallback(
    (s) => cloudSync.saveSettingsToCloud(stripLocalOnly(s)),
    []
  );

  useCloudAutoSave(
    auth.isSignedIn && !auth.loading && isStoreInitialized && isSetup && settingsInitialSyncDone,
    settings,
    saveSettings,
    { delay: 2000 }
  );
}
