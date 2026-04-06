import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  const progress = useProgress();
  const { settings, updateSettings } = useSettings();

  const [conflictData, setConflictData] = useState(null);
  const [conflictCheckDone, setConflictCheckDone] = useState(false);
  const [isInitialSyncDone, setIsInitialSyncDone] = useState(false);
  const [isSyncPaused, setIsSyncPaused] = useState(false);

  const {
    startDate, completions, startChallenge, toggleCompletion,
    getDayNumber, getTotalReps, isDayDone, isSetup, userStartDate,
    scheduleNotification, requestNotificationPermission,
    getExerciseCount, updateExerciseCount, getExerciseDone,
    saveToCloud, loadFromCloud, syncWithCloud, startCloudListener, deleteExerciseHistory,
    setHasShared, hasShared, manualBadges, lastCompletionChange,
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
      setConflictCheckDone(false);
      setIsInitialSyncDone(false);
      setConflictData(null);
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
  }, [isSetup, settings.notificationsEnabled]);

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
  }, [isSetup, settings.notificationsEnabled, settings.notificationTime, completions]);

  // ── Auto-save to cloud on completion change ─────────────────────────
  useEffect(() => {
    if (auth.isSignedIn && !auth.loading && !conflictData && conflictCheckDone && isInitialSyncDone) {
      const doSave = async () => {
        try { await saveToCloud(); } catch (error) { logger.error('Auto-save failed:', error); }
      };
      const timer = setTimeout(doSave, 1000);
      return () => clearTimeout(timer);
    }
  }, [lastCompletionChange, auth.isSignedIn, auth.loading, conflictData, conflictCheckDone, isInitialSyncDone, saveToCloud]);

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
  }, [auth.isSignedIn, auth.loading]);

  // ── Cloud auto-save for settings ────────────────────────────────────
  useCloudAutoSave(auth.isSignedIn && !auth.loading && isSetup, settings, cloudSync.saveSettingsToCloud, { delay: 2000 });

  // ── Conflict detection ──────────────────────────────────────────────
  useEffect(() => {
    if (auth.isSignedIn && !auth.loading && isSetup && !conflictCheckDone) {
      const detectConflict = async () => {
        try {
          const cloudData = await cloudSync.loadFromCloud();
          if (cloudData && cloudData.completions) {
            const cloudKeys = Object.keys(cloudData.completions);
            const localKeys = Object.keys(completions);
            const hasConflict = cloudKeys.length > 0 && (
              cloudKeys.some(key => !completions[key]) ||
              localKeys.some(key => !cloudData.completions[key]) ||
              cloudKeys.some(key => {
                const cloudDay = cloudData.completions[key];
                const localDay = completions[key];
                if (!cloudDay || !localDay) return true;
                const allExIds = new Set([...Object.keys(cloudDay), ...Object.keys(localDay)]);
                for (const exId of allExIds) {
                  if ((cloudDay[exId]?.isCompleted || false) !== (localDay[exId]?.isCompleted || false)) return true;
                }
                return false;
              })
            );
            if (hasConflict) setConflictData(cloudData);
            else setConflictCheckDone(true);
          } else {
            setConflictCheckDone(true);
          }
        } catch (error) {
          logger.error('Conflict detection failed:', error);
          setConflictCheckDone(true);
        }
      };
      detectConflict();
    } else if (auth.isSignedIn && !auth.loading && !isSetup && !conflictCheckDone) {
      setConflictCheckDone(true);
    }
  }, [auth.isSignedIn, auth.loading, isSetup, conflictCheckDone, completions]);

  // ── Full sync on startup once conflict check is resolved ────────────
  useEffect(() => {
    if (auth.isSignedIn && !auth.loading && conflictCheckDone && isSetup && !isInitialSyncDone) {
      const initialSync = async () => {
        try { await syncWithCloud(); setIsInitialSyncDone(true); }
        catch (error) { logger.error('Initial sync failed:', error); setIsInitialSyncDone(true); }
      };
      initialSync();
    }
  }, [conflictCheckDone, auth.isSignedIn, auth.loading, isSetup, isInitialSyncDone]);

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
    auth.isSignedIn, auth.loading, isSetup, isInitialSyncDone, computedStats
  ]);

  // ── Conflict resolution ─────────────────────────────────────────────
  const handleResolveConflict = useCallback(async (action) => {
    try {
      if (action === 'restore') await loadFromCloud();
      else if (action === 'upload') await saveToCloud();
      setConflictData(null);
      setConflictCheckDone(true);
    } catch (error) { logger.error('Conflict resolution failed:', error); }
  }, [loadFromCloud, saveToCloud]);

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
  }), [
    startDate, completions, isSetup, userStartDate, hasShared, manualBadges,
    startChallenge, toggleCompletion, getDayNumber, getTotalReps, isDayDone,
    getExerciseCount, updateExerciseCount, getExerciseDone,
    deleteExerciseHistory, saveToCloud, setHasShared, scheduleNotification,
    settings, updateSettings, computedStats, setCustomExercisesForStats,
    cloudSyncAPI, conflictData, handleResolveConflict,
    pauseCloudSync, resumeCloudSync, publishLeaderboardNow,
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
