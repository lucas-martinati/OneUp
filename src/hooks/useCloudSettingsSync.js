import { useEffect } from 'react';
import { useProgressStore } from '../store/useProgressStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useCloudAutoSave } from './useCloudAutoSave';
import { cloudSync } from '../services/cloudSync';
import { createLogger } from '../utils/logger';

const logger = createLogger('SettingsSync');

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

  // ── Cloud settings load ────────────────────────────────────────────────
  useEffect(() => {
    if (auth.isSignedIn && !auth.loading) {
      const loadSettings = async () => {
        try {
          const cloudSettings = await cloudSync.loadSettingsFromCloud();
          if (cloudSettings) {
            logger.info('Cloud settings loaded:', cloudSettings);
            applyCloudSettings(cloudSettings);
          }
          setTimeout(() => markSettingsSynced(), 0);
        } catch (error) {
          logger.error('Settings sync error:', error);
        }
      };
      loadSettings();
    } else if (!auth.isSignedIn && !auth.loading) {
      setTimeout(() => markSettingsSynced(), 0);
    }
  }, [auth.isSignedIn, auth.loading, applyCloudSettings, markSettingsSynced]);

  // ── Cloud auto-save for settings ───────────────────────────────────────
  useCloudAutoSave(
    auth.isSignedIn && !auth.loading && isStoreInitialized && isSetup && settingsInitialSyncDone,
    settings,
    cloudSync.saveSettingsToCloud,
    { delay: 2000 }
  );
}
