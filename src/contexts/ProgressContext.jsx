import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { useProgress } from '../hooks/useProgress';
import { useSettings } from '../hooks/useSettings';
import { useComputedStats } from '../hooks/useComputedStats';
import { useUserDetailsCache } from '../hooks/useUserDetailsCache';
import { useCloudAutoSave } from '../hooks/useCloudAutoSave';
import { cloudSync } from '../services/cloudSync';
import { EXERCISES } from '../config/exercises';
import { WEIGHT_EXERCISES } from '../config/weights';
import { createLogger } from '../utils/logger';
import { getLocalDateStr, isDayDoneFromCompletions } from '../utils/dateUtils';

const logger = createLogger('Progress');
const ProgressContext = createContext(null);

/**
 * Provides progress, settings, computed stats, and cloud sync orchestration.
 * This is the main data provider — extracted from App.jsx.
 */
export function ProgressProvider({ children }) {
  const auth = useAuth();
  const progress = useProgress(auth.user?.uid);
  const { settings, updateSettings } = useSettings(auth.user?.uid);

  const [conflictData, setConflictData] = useState(null);
  const [conflictCheckDone, setConflictCheckDone] = useState(false);
  const [isInitialSyncDone, setIsInitialSyncDone] = useState(false);
  const [isSyncPaused, setIsSyncPaused] = useState(false);
  const [syncError, setSyncError] = useState(null);

  const { i18n } = useTranslation();
  const {
    startDate, completions, startChallenge, toggleCompletion,
    getDayNumber, getTotalReps, isDayDone, isSetup, userStartDate,
    scheduleNotification, requestNotificationPermission,
    getExerciseCount, updateExerciseCount, getExerciseDone,
    saveToCloud, loadFromCloud, syncWithCloud, startCloudListener, deleteExerciseHistory,
    setHasShared, hasShared, manualBadges, lastCompletionChange,
    mergeWithAnonymousData, clearAnonymousData, hasGuestData,
  } = progress;

  const userDetailsCache = useUserDetailsCache(cloudSync);

  // computedStats needs customExercises — we accept it as a param via a ref
  // that gets set by ExercisesProvider after mount. For now, use empty array.
  const [customExercisesForStats, setCustomExercisesForStats] = useState([]);
  const computedStats = useComputedStats(completions, settings, getDayNumber, customExercisesForStats, hasShared, manualBadges);

  // ── Leaderboard publishing ──────────────────────────────────────────
  const publishLeaderboardNow = useCallback(async () => {
    try {
      if (!auth.isSignedIn) return;
      const classicTotalReps = EXERCISES.reduce((sum, ex) => sum + (computedStats.exerciseReps[ex.id] || 0), 0);
      const weightsTotalReps = WEIGHT_EXERCISES.reduce((sum, ex) => sum + (computedStats.exerciseReps[ex.id] || 0), 0);
      const todayStr = getLocalDateStr(new Date());
      const lastActiveDay = isDayDoneFromCompletions(completions, todayStr)
        ? todayStr
        : computedStats.sortedDates.slice().reverse().find(d => isDayDoneFromCompletions(completions, d)) || null;

      await cloudSync.publishToLeaderboard({
        pseudo: settings.leaderboardPseudo || auth.user?.displayName || 'Anonyme',
        totalReps: classicTotalReps,
        weightsTotalReps,
        exerciseReps: computedStats.exerciseReps,
        achievements: computedStats.badgeCount,
        isPublic: !!settings.leaderboardEnabled,
        lastActiveDay,
        isPerfectToday: computedStats.isPerfectToday,
        difficultyMultiplier: settings?.difficultyMultiplier,
      });
    } catch (e) {
      logger.error('Leaderboard publish failed:', e);
    }
  }, [auth, computedStats, completions, settings]);

  // ── Performance mode on document root ──────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute('data-perf', settings.performanceMode);
  }, [settings.performanceMode]);

  // ── Reset sync state when user signs out ───────────────────────────
  useEffect(() => {
    if (!auth.isSignedIn) {
      queueMicrotask(() => {
        setConflictCheckDone(false);
        setIsInitialSyncDone(false);
        setConflictData(null);
      });
    }
  }, [auth.isSignedIn, auth.user?.uid]);

  // ── Notification permission + scheduling ───────────────────────────
  useEffect(() => {
    if (isSetup) {
      requestNotificationPermission();
      if (settings.notificationsEnabled) {
        scheduleNotification(settings);
      }
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


  // ── Auto-save to cloud on completion change ─────────────────────────
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
      const timer = setTimeout(doSave, 1000);
      return () => clearTimeout(timer);
    }
  }, [lastCompletionChange, auth.isSignedIn, auth.loading, conflictData, conflictCheckDone, isInitialSyncDone, saveToCloud]);

  // ── Online recovery listener ────────────────────────────────────────
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

  // ── Sync settings with cloud on sign-in ─────────────────────────────
  useEffect(() => {
    if (auth.isSignedIn && !auth.loading) {
      const loadSettings = async () => {
        try {
          const cloudSettings = await cloudSync.loadSettingsFromCloud();
          if (cloudSettings) {
            const safeSettings = {
              ...cloudSettings,
              notificationTime: cloudSettings.notificationTime || { hour: 9, minute: 0 }
            };
            if (typeof safeSettings.notificationTime !== 'object') {
              safeSettings.notificationTime = { hour: 9, minute: 0 };
            }
            updateSettings(safeSettings);
          }
        } catch (error) { logger.error('Settings sync error:', error); }
      };
      loadSettings();
    }
  }, [auth.isSignedIn, auth.loading, updateSettings]);

  // ── Cloud auto-save for settings ────────────────────────────────────
  useCloudAutoSave(auth.isSignedIn && !auth.loading && isSetup, settings, cloudSync.saveSettingsToCloud, { delay: 2000 });

  // ── Anonymous (Guest) Data Detection & Merging ──────────────────────
  useEffect(() => {
    if (auth.isSignedIn && !auth.loading && isSetup && !conflictCheckDone) {
      const checkGuestAndCloud = async () => {
        try {
          const hasGuest = hasGuestData();
          if (hasGuest) {
            // Guest data exists — user was using the app while not signed in,
            // then signed in. We MUST ask the user before merging.
            const cloudData = await cloudSync.loadFromCloud();
            setConflictData({
              ...cloudData,
              isAnonymousMerge: true
            });
            // Mark as done so the Dashboard renders the conflict resolution UI
            setConflictCheckDone(true);
            setIsInitialSyncDone(true);
            return;
          }

          // Already signed in (page reload) — auto-merge silently, no dialog needed
          setConflictCheckDone(true);
        } catch (error) {
          logger.error('Conflict detection failed:', error);
          setConflictCheckDone(true);
        }
      };
      checkGuestAndCloud();
    } else if (auth.isSignedIn && !auth.loading && !isSetup && !conflictCheckDone) {
      // No local data — try loading from cloud first (user may have cloud data)
      const tryLoadFromCloud = async () => {
        try {
          const result = await loadFromCloud();
          if (result.success) {
            // Cloud data loaded and applied — skip the subsequent syncWithCloud
            // since we just fetched fresh data (avoids a redundant round-trip)
            logger.info('Cloud data restored for signed-in user with no local data');
            queueMicrotask(() => {
              setConflictCheckDone(true);
              setIsInitialSyncDone(true);
            });
            return;
          }
        } catch (error) {
          logger.error('Cloud load for signed-in user failed:', error);
        }
        queueMicrotask(() => setConflictCheckDone(true));
      };
      tryLoadFromCloud();
    }
  }, [auth.isSignedIn, auth.loading, isSetup, conflictCheckDone, hasGuestData, loadFromCloud]);

  // ── Full sync on startup once conflict check is resolved ────────────
  useEffect(() => {
    if (auth.isSignedIn && !auth.loading && conflictCheckDone && !isInitialSyncDone) {
      if (isSetup) {
        const initialSync = async () => {
          try {
            await syncWithCloud();
            queueMicrotask(() => setIsInitialSyncDone(true));
          } catch (error) {
            logger.error('Initial sync failed:', error);
            queueMicrotask(() => setIsInitialSyncDone(true));
          }
        };
        initialSync();
      } else {
        // No setup yet, and cloud didn't have data either
        queueMicrotask(() => setIsInitialSyncDone(true));
      }
    }
  }, [conflictCheckDone, auth.isSignedIn, auth.loading, isSetup, isInitialSyncDone, syncWithCloud]);

  // ── Real-time cloud listener ────────────────────────────────────────
  useEffect(() => {
    if (auth.isSignedIn && !auth.loading && conflictCheckDone && isInitialSyncDone && !isSyncPaused && !conflictData) {
      const unsubscribe = startCloudListener();
      return () => { if (unsubscribe) unsubscribe(); };
    }
  }, [auth.isSignedIn, auth.loading, conflictCheckDone, isInitialSyncDone, isSyncPaused, conflictData, startCloudListener]);

  // ── Auto-publish leaderboard when completions change ────────────────
  useEffect(() => {
    if (!auth.isSignedIn || auth.loading || !isSetup || !isInitialSyncDone) return;
    const timer = setTimeout(() => publishLeaderboardNow(), 2000);
    return () => clearTimeout(timer);
  }, [
    completions, settings.leaderboardEnabled, settings.leaderboardPseudo, settings.difficultyMultiplier,
    auth.isSignedIn, auth.loading, isSetup, isInitialSyncDone, computedStats, publishLeaderboardNow
  ]);

  // ── Conflict resolution ─────────────────────────────────────────────
  const handleResolveConflict = useCallback(async (action) => {
    try {
      const hasGuest = hasGuestData();
      if (action === 'restore') {
        if (hasGuest) clearAnonymousData();
        await loadFromCloud();
      } else if (action === 'upload') {
        if (hasGuest) {
          await mergeWithAnonymousData();
          clearAnonymousData();
        }
        await syncWithCloud();
      }
      setConflictData(null);
      setConflictCheckDone(true);
    } catch (error) { logger.error('Conflict resolution failed:', error); }
  }, [loadFromCloud, syncWithCloud, hasGuestData, clearAnonymousData, mergeWithAnonymousData]);

  // Pause / resume sync
  const pauseCloudSync = useCallback(() => setIsSyncPaused(true), []);
  const resumeCloudSync = useCallback(() => setIsSyncPaused(false), []);

  // Cloud sync object for components that need direct access
  const cloudSyncAPI = useMemo(() => ({
    saveToCloud, loadFromCloud, syncWithCloud,
    signIn: auth.signIn, signOut: auth.signOut,
    loadLeaderboard: () => cloudSync.loadLeaderboard(),
    loadUserDetails: (uid) => userDetailsCache.loadUserDetails(uid),
    getCurrentUserId: () => cloudSync.getCurrentUserId(),
    deleteAccount: () => cloudSync.deleteAccount(),
    // Clan methods
    createClan: (name) => cloudSync.createClan(name),
    joinClan: (code) => cloudSync.joinClan(code),
    leaveClan: (id) => cloudSync.leaveClan(id),
    getUserClans: () => cloudSync.getUserClans(),
    getClanDetails: (id) => cloudSync.getClanDetails(id),
    sendClanNotification: (uid, type, msg) => cloudSync.sendClanNotification(uid, type, msg),
    listenToNotifications: (cb) => cloudSync.listenToNotifications(cb),
    deleteNotification: (id) => cloudSync.deleteNotification(id),
    subscribe: (cb) => cloudSync.subscribe(cb),
    checkSignInStatus: () => cloudSync.checkSignInStatus(),
  }), [auth.signIn, auth.signOut, saveToCloud, loadFromCloud, syncWithCloud, userDetailsCache]);

  const value = useMemo(() => ({
    // Progress data
    startDate, completions, isSetup, userStartDate,
    hasShared, manualBadges,
    // Progress actions
    startChallenge, toggleCompletion, getDayNumber, getTotalReps, isDayDone,
    getExerciseCount, updateExerciseCount, getExerciseDone,
    deleteExerciseHistory, saveToCloud,
    setHasShared,
    scheduleNotification,
    // Settings
    settings, updateSettings,
    // Computed stats
    computedStats,
    setCustomExercisesForStats,
    // Cloud sync
    cloudSyncAPI, conflictData, onResolveConflict: handleResolveConflict,
    pauseCloudSync, resumeCloudSync,
    publishLeaderboardNow,
    syncError,
    isInitialSyncDone,
  }), [
    startDate, completions, isSetup, userStartDate, hasShared, manualBadges,
    startChallenge, toggleCompletion, getDayNumber, getTotalReps, isDayDone,
    getExerciseCount, updateExerciseCount, getExerciseDone,
    deleteExerciseHistory, saveToCloud, setHasShared, scheduleNotification,
    settings, updateSettings, computedStats, setCustomExercisesForStats,
    cloudSyncAPI, conflictData, handleResolveConflict,
    pauseCloudSync, resumeCloudSync, publishLeaderboardNow,
    syncError, isInitialSyncDone,
  ]);

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgressContext() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgressContext must be used within <ProgressProvider>');
  return ctx;
}
