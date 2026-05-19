import { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useProgressStore } from '../../store/useProgressStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useCloudSyncStore } from '../../store/useCloudSyncStore';
import { useNotificationManager } from '../../hooks/useNotificationManager';
import { useCloudAutoSave } from '../../hooks/useCloudAutoSave';
import { cloudSync } from '../../services/cloudSync';
import { createLogger } from '../../utils/logger';
import { updateWidgetData } from '../../utils/widgetBridge';

const logger = createLogger('Orchestrator');

/**
 * Invisible component that handles all app-level orchestration effects.
 * Replaces the side-effect logic that was inside ProgressProvider.
 *
 * This component renders nothing — it only runs useEffect hooks.
 *
 * @param {Object} props
 * @param {Object} props.computedStats - Computed stats from useComputedStatsStore(s => s.stats)
 */
export function AppOrchestrator({ computedStats }) {
  const auth = useAuth();

  // ── Progress Store ───────────────────────────────────────────────────
  const isStoreInitialized = useProgressStore(s => s.isStoreInitialized);
  const isSetup = useProgressStore(s => s.isSetup);
  const completions = useProgressStore(s => s.completions);
  const lastCompletionChange = useProgressStore(s => s.lastCompletionChange);
  const saveToCloud = useProgressStore(s => s.saveToCloud);
  const loadFromCloud = useProgressStore(s => s.loadFromCloud);
  const syncWithCloud = useProgressStore(s => s.syncWithCloud);
  const startCloudListener = useProgressStore(s => s.startCloudListener);
  const hasGuestData = useProgressStore(s => s.hasGuestData);
  const isDayDone = useProgressStore(s => s.isDayDone);
  const getDayNumber = useProgressStore(s => s.getDayNumber);
  const initProgressForUser = useProgressStore(s => s.initForUser);

  // ── Settings Store ──────────────────────────────────────────────────
  const settings = useSettingsStore(s => s.settings);
  const settingsInitialSyncDone = useSettingsStore(s => s.settingsInitialSyncDone);
  const markSettingsSynced = useSettingsStore(s => s.markSettingsSynced);
  const applyCloudSettings = useSettingsStore(s => s.applyCloudSettings);
  const initSettingsForUser = useSettingsStore(s => s.initForUser);

  // ── Cloud Sync Store ────────────────────────────────────────────────
  const conflictData = useCloudSyncStore(s => s.conflictData);
  const setConflictData = useCloudSyncStore(s => s.setConflictData);
  const conflictCheckDone = useCloudSyncStore(s => s.conflictCheckDone);
  const setConflictCheckDone = useCloudSyncStore(s => s.setConflictCheckDone);
  const isInitialSyncDone = useCloudSyncStore(s => s.isInitialSyncDone);
  const setIsInitialSyncDone = useCloudSyncStore(s => s.setIsInitialSyncDone);
  const isSyncPaused = useCloudSyncStore(s => s.isSyncPaused);
  const setSyncError = useCloudSyncStore(s => s.setSyncError);
  const resetSyncState = useCloudSyncStore(s => s.resetSyncState);
  const refreshUserClans = useCloudSyncStore(s => s.refreshUserClans);

  // ── Notifications ──────────────────────────────────────────────────
  const { scheduleNotification, requestNotificationPermission } = useNotificationManager({
    isDayDone,
    getDayNumber,
  });

  // ── Init stores when userId changes ────────────────────────────────
  useEffect(() => {
    if (auth.user?.uid) {
      initSettingsForUser(auth.user.uid);
      initProgressForUser(auth.user.uid);
    } else if (!auth.loading) {
      initSettingsForUser(null);
      initProgressForUser(null);
    }
  }, [auth.user?.uid, auth.loading, initSettingsForUser, initProgressForUser]);

  // ── Push widget data ───────────────────────────────────────────────
  useEffect(() => {
    updateWidgetData(computedStats, completions);
  }, [computedStats, completions]);

  // ── Performance mode & Theme on document root ──────────────────────
  useEffect(() => {
    document.documentElement.setAttribute('data-perf', settings.performanceMode);
    document.documentElement.setAttribute('data-theme', settings.appTheme || 'dark');
  }, [settings.performanceMode, settings.appTheme]);

  // ── Reset sync state when user signs out ───────────────────────────
  useEffect(() => {
    if (!auth.isSignedIn) {
      queueMicrotask(() => resetSyncState());
    }
  }, [auth.isSignedIn, auth.user?.uid, resetSyncState]);

  // ── Notification permission + scheduling ───────────────────────────
  useEffect(() => {
    if (isSetup && settings.notificationsEnabled) {
      requestNotificationPermission();
      scheduleNotification(settings);
    }
  }, [isSetup, settings.notificationsEnabled, requestNotificationPermission, scheduleNotification, settings]);

  useEffect(() => {
    if (isSetup && settings.notificationsEnabled) {
      scheduleNotification(settings);
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 30, 0);
      const midnightTimer = setTimeout(() => {
        scheduleNotification(settings);
      }, tomorrow.getTime() - now.getTime());
      return () => clearTimeout(midnightTimer);
    }
  }, [isSetup, settings.notificationsEnabled, settings.notificationTime, completions, scheduleNotification, settings]);

  // ── Auto-save to cloud on completion change ────────────────────────
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

  // ── Force save on visibility change ────────────────────────────────
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

  // ── Online recovery listener ───────────────────────────────────────
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

  // ── Cloud settings load ────────────────────────────────────────────
  useEffect(() => {
    if (auth.isSignedIn && !auth.loading) {
      const loadSettings = async () => {
        try {
          const cloudSettings = await cloudSync.loadSettingsFromCloud();
          if (cloudSettings) {
            logger.info('Cloud settings loaded:', cloudSettings);
            applyCloudSettings(cloudSettings);
            setTimeout(() => markSettingsSynced(), 0);
          } else {
            setTimeout(() => markSettingsSynced(), 0);
          }
        } catch (error) {
          logger.error('Settings sync error:', error);
        }
      };
      loadSettings();
    } else if (!auth.isSignedIn && !auth.loading) {
      setTimeout(() => markSettingsSynced(), 0);
    }
  }, [auth.isSignedIn, auth.loading, applyCloudSettings, markSettingsSynced]);

  // ── Cloud auto-save for settings ───────────────────────────────────
  useCloudAutoSave(
    auth.isSignedIn && !auth.loading && isStoreInitialized && isSetup && settingsInitialSyncDone,
    settings,
    cloudSync.saveSettingsToCloud,
    { delay: 2000 }
  );

  // ── Anonymous (Guest) Data Detection & Merging ─────────────────────
  useEffect(() => {
    if (!isStoreInitialized) return; // Guard against uninitialized store

    if (auth.isSignedIn && !auth.loading && isSetup && !conflictCheckDone) {
      const checkGuestAndCloud = async () => {
        try {
          const hasGuest = await hasGuestData();
          if (hasGuest) {
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 10000));
            const cloudData = await Promise.race([cloudSync.loadFromCloud(), timeoutPromise]);
            setConflictData({
              ...cloudData,
              isAnonymousMerge: true,
            });
            setConflictCheckDone(true);
            setIsInitialSyncDone(true);
            return;
          }
          setConflictCheckDone(true);
        } catch (error) {
          logger.error('Conflict detection failed or timed out:', error);
          setConflictCheckDone(true);
        }
      };
      checkGuestAndCloud();
    } else if (auth.isSignedIn && !auth.loading && !isSetup && !conflictCheckDone) {
      const tryLoadFromCloud = async () => {
        try {
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 10000));
          const result = await Promise.race([loadFromCloud(), timeoutPromise]);
          if (result && result.success) {
            logger.info('Cloud data restored for signed-in user with no local data');
            queueMicrotask(() => {
              setConflictCheckDone(true);
              setIsInitialSyncDone(true);
            });
            return;
          }
        } catch (error) {
          logger.error('Cloud load for signed-in user failed or timed out:', error);
        }
        queueMicrotask(() => setConflictCheckDone(true));
      };
      tryLoadFromCloud();
    }
  }, [auth.isSignedIn, auth.loading, isStoreInitialized, isSetup, conflictCheckDone, hasGuestData, loadFromCloud, setConflictData, setConflictCheckDone, setIsInitialSyncDone]);

  // ── Full sync on startup once conflict check is resolved ───────────
  useEffect(() => {
    if (auth.isSignedIn && !auth.loading && isStoreInitialized && conflictCheckDone && !isInitialSyncDone) {
      if (isSetup) {
        const initialSync = async () => {
          try {
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 10000));
            await Promise.race([syncWithCloud(), timeoutPromise]);
            queueMicrotask(() => setIsInitialSyncDone(true));
          } catch (error) {
            logger.error('Initial sync failed or timed out:', error);
            queueMicrotask(() => setIsInitialSyncDone(true));
          }
        };
        initialSync();
      } else {
        queueMicrotask(() => setIsInitialSyncDone(true));
      }
    }
  }, [conflictCheckDone, auth.isSignedIn, auth.loading, isStoreInitialized, isSetup, isInitialSyncDone, syncWithCloud, setIsInitialSyncDone]);

  // ── Real-time cloud listener ───────────────────────────────────────
  useEffect(() => {
    if (auth.isSignedIn && !auth.loading && isStoreInitialized && conflictCheckDone && isInitialSyncDone && !isSyncPaused && !conflictData) {
      const unsubscribe = startCloudListener();
      return () => { if (unsubscribe) unsubscribe(); };
    }
  }, [auth.isSignedIn, auth.loading, isStoreInitialized, conflictCheckDone, isInitialSyncDone, isSyncPaused, conflictData, startCloudListener]);


  // ── Pre-load user clans ────────────────────────────────────────────
  useEffect(() => {
    if (auth.isSignedIn && !auth.loading) {
      refreshUserClans();
    }
  }, [auth.isSignedIn, auth.loading, refreshUserClans]);

  return null;
}
