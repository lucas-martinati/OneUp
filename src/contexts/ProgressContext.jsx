import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useProgress } from '../hooks/useProgress';
import { useSettings } from '../hooks/useSettings';
import { useComputedStats } from '../hooks/useComputedStats';
import { useUserDetailsCache } from '../hooks/useUserDetailsCache';
import { useCloudAutoSave } from '../hooks/useCloudAutoSave';
import { cloudSync } from '../services/cloudSync';
import { EXERCISES, CARDIO_EXERCISES } from '../config/exercises';
import { WEIGHT_EXERCISES } from '../config/weights';
import { createLogger } from '../utils/logger';
import { getLocalDateStr, isDayDoneFromCompletions } from '../utils/dateUtils';
import { updateWidgetData } from '../utils/widgetBridge';
import { loadCachedEntitlements } from '../utils/entitlements';

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
  const [settingsInitialSyncDone, setSettingsInitialSyncDone] = useState(false);
  const [isSyncPaused, setIsSyncPaused] = useState(false);
  const [syncError, setSyncError] = useState(null);

  const {
    startDate, completions, startChallenge, toggleCompletion,
    getDayNumber, getTotalReps, isDayDone, isSetup, userStartDate,
    scheduleNotification, requestNotificationPermission,
    getExerciseCount, updateExerciseCount, getExerciseDone,
    saveToCloud, loadFromCloud, syncWithCloud, startCloudListener, deleteExerciseHistory,
    setHasShared, hasShared, achievements, lastCompletionChange,
    mergeWithAnonymousData, clearAnonymousData, hasGuestData,
    cardio, updateCardioSessions,
  } = progress;

  const cardioReps = useMemo(() => {
    const sessions = Object.values(cardio?.sessions || {});
    const runningKm = sessions.filter(s => s.type === 'running').reduce((sum, s) => sum + (s.distance || 0), 0) / 1000;
    const cyclingKm = sessions.filter(s => s.type === 'cycling').reduce((sum, s) => sum + (s.distance || 0), 0) / 1000;
    return {
      running: Math.floor(runningKm * 15),
      cycling: Math.floor(cyclingKm * 15)
    };
  }, [cardio]);

  const userDetailsCache = useUserDetailsCache(cloudSync);
  const getDifficulty = useCallback((exId, dateStr = null) => {
    // If a specific date is requested and the exercise is completed on that date,
    // we use the difficulty saved at that time to ensure rep counts remain stable
    // even if the user changes their current settings later.
    if (dateStr && completions?.[dateStr]?.[exId]?.isCompleted) {
      const savedDiff = completions[dateStr][exId].difficulty;
      // If we have a saved difficulty for this specific workout, use it.
      if (savedDiff !== undefined) return savedDiff;
      
      // If NO saved difficulty exists on a completed day, it's old data from 
      // before the per-exercise difficulty system. Fallback to 1.0.
      return 1.0;
    }

    // For current/future workouts or sessions in progress, use current settings.
    const currentPrefs = settings?.exerciseDifficulties || {};
    if (currentPrefs[exId] !== undefined) {
      return currentPrefs[exId];
    }
    return 1.0;
  }, [completions, settings.exerciseDifficulties]);

  const updateDifficulty = useCallback((exId, value) => {
    updateSettings(prev => ({
      exerciseDifficulties: {
        ...(prev.exerciseDifficulties || {}),
        [exId]: value
      }
    }));
  }, [updateSettings]);

  // computedStats needs customExercises — we accept it as a param via a ref
  // that gets set by ExercisesProvider after mount. For now, use empty array.
  const [customExercisesForStats, setCustomExercisesForStats] = useState([]);
  const [userClans, setUserClans] = useState([]);
  
  const internalGetConfig = useCallback((exId, dateStr) => ({
    difficulty: getDifficulty(exId, dateStr),
    weight: null,
  }), [getDifficulty]);

  const computedStats = useComputedStats(completions, settings, getDayNumber, customExercisesForStats, hasShared, achievements, internalGetConfig, cardioReps);

  // ── Leaderboard publishing ──────────────────────────────────────────
  const publishLeaderboardNow = useCallback(async () => {
    try {
      if (!auth.isSignedIn) return;
      const classicTotalReps = EXERCISES.reduce((sum, ex) => sum + (computedStats.exerciseReps[ex.id] || 0), 0);
      const weightsTotalReps = WEIGHT_EXERCISES.reduce((sum, ex) => sum + (computedStats.exerciseReps[ex.id] || 0), 0);
      const computedCardioReps = CARDIO_EXERCISES.reduce((sum, ex) => sum + (computedStats.exerciseReps[ex.id] || 0), 0);
      const todayStr = getLocalDateStr(new Date());
      const lastActiveDay = isDayDoneFromCompletions(completions, todayStr)
        ? todayStr
        : computedStats.sortedDates.slice().reverse().find(d => isDayDoneFromCompletions(completions, d)) || null;

      const { isPro, isSupporter } = loadCachedEntitlements();

      await cloudSync.publishToLeaderboard({
        pseudo: settings.leaderboardPseudo || auth.user?.displayName || 'Anonyme',
        totalReps: classicTotalReps + computedCardioReps,
        weightsTotalReps,
        cardioTotalReps: computedCardioReps,
        exerciseReps: computedStats.exerciseReps,
        exerciseDifficulties: settings.exerciseDifficulties,
        achievements: computedStats.badgeCount,
        isPublic: !!settings.leaderboardEnabled,
        lastActiveDay,
        isPerfectToday: computedStats.isPerfectToday,
        isPro,
        isSupporter,
      });
    } catch (e) {
      logger.error('Leaderboard publish failed:', e);
    }
  }, [auth, computedStats, completions, settings]);

  // ── Push widget data to SharedPreferences for native Android widget ──
  useEffect(() => {
    updateWidgetData(computedStats, completions);
  }, [computedStats, completions]);

  // ── Performance mode & Theme on document root ──────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute('data-perf', settings.performanceMode);
    document.documentElement.setAttribute('data-theme', settings.appTheme || 'dark');
  }, [settings.performanceMode, settings.appTheme]);

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
      // Reduce delay to 400ms for better responsiveness
      const timer = setTimeout(doSave, 400);
      return () => clearTimeout(timer);
    }
  }, [lastCompletionChange, auth.isSignedIn, auth.loading, conflictData, conflictCheckDone, isInitialSyncDone, saveToCloud]);

  // ── Force save on visibility change (Capacitor / Web) ────────────────
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

  useEffect(() => {
    if (auth.isSignedIn && !auth.loading) {
      const loadSettings = async () => {
        try {
          const cloudSettings = await cloudSync.loadSettingsFromCloud();
          if (cloudSettings) {
            logger.info('Cloud settings loaded:', cloudSettings);
            updateSettings(prev => {
              const cleanedCloud = { ...cloudSettings };
              delete cleanedCloud.difficultyHistory;
              delete cleanedCloud.difficultyMultiplier;
              delete cleanedCloud.hasSharedFirstTime;
              delete cleanedCloud.runningStreak;
              delete cleanedCloud.cyclingStreak;
              delete cleanedCloud.cardioTotalReps;
              delete cleanedCloud.runningReps;
              delete cleanedCloud.cyclingReps;
              
              const safeSettings = {
                ...cleanedCloud,
                notificationTime: cloudSettings.notificationTime || { hour: 9, minute: 0 },
                exerciseDifficulties: {
                  ...(prev.exerciseDifficulties || {}),
                  ...(cloudSettings.exerciseDifficulties || {})
                }
              };
              if (typeof safeSettings.notificationTime !== 'object') {
                safeSettings.notificationTime = { hour: 9, minute: 0 };
              }
              return safeSettings;
            });
            // Mark as synced only AFTER updateSettings has been queued
            setTimeout(() => setSettingsInitialSyncDone(true), 0);
          } else {
            // No cloud data found — safe to assume local is the truth
            setTimeout(() => setSettingsInitialSyncDone(true), 0);
          }
        } catch (error) { 
          logger.error('Settings sync error:', error); 
          // Don't set initialSyncDone to true on error to avoid overwriting cloud with empty local
        }
      };
      loadSettings();
    } else if (!auth.isSignedIn && !auth.loading) {
      setTimeout(() => setSettingsInitialSyncDone(true), 0);
    }
  }, [auth.isSignedIn, auth.loading, updateSettings]);

  // ── Cloud auto-save for settings ────────────────────────────────────
  useCloudAutoSave(auth.isSignedIn && !auth.loading && isSetup && settingsInitialSyncDone, settings, cloudSync.saveSettingsToCloud, { delay: 2000 });

  // ── Anonymous (Guest) Data Detection & Merging ──────────────────────
  useEffect(() => {
    if (auth.isSignedIn && !auth.loading && isSetup && !conflictCheckDone) {
      const checkGuestAndCloud = async () => {
        try {
          const hasGuest = hasGuestData();
          if (hasGuest) {
            // Guest data exists — user was using the app while not signed in,
            // then signed in. We MUST ask the user before merging.
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 4000));
            const cloudData = await Promise.race([cloudSync.loadFromCloud(), timeoutPromise]);
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
          logger.error('Conflict detection failed or timed out:', error);
          setConflictCheckDone(true);
        }
      };
      checkGuestAndCloud();
    } else if (auth.isSignedIn && !auth.loading && !isSetup && !conflictCheckDone) {
      // No local data — try loading from cloud first (user may have cloud data)
      const tryLoadFromCloud = async () => {
        try {
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 4000));
          const result = await Promise.race([loadFromCloud(), timeoutPromise]);
          if (result && result.success) {
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
          logger.error('Cloud load for signed-in user failed or timed out:', error);
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
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 4000));
            await Promise.race([syncWithCloud(), timeoutPromise]);
            queueMicrotask(() => setIsInitialSyncDone(true));
          } catch (error) {
            logger.error('Initial sync failed or timed out:', error);
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
    completions, settings.leaderboardEnabled, settings.leaderboardPseudo, settings.exerciseDifficulties,
    auth.isSignedIn, auth.loading, isSetup, isInitialSyncDone, computedStats, publishLeaderboardNow
  ]);

  // ── Conflict resolution ─────────────────────────────────────────────
  const handleResolveConflict = useCallback(async (action) => {
    try {
      const hasGuest = hasGuestData();
      if (action === 'restore') {
        if (hasGuest) {
          clearAnonymousData();
          localStorage.removeItem('oneup_settings'); // Clear guest settings too
          localStorage.removeItem('oneup_routines');
          localStorage.removeItem('oneup_custom_exercises');
        }
        await loadFromCloud();
      } else if (action === 'upload') {
        if (hasGuest) {
          // Merge settings
          const guestSettings = localStorage.getItem('oneup_settings');
          if (guestSettings) {
            try {
              const parsed = JSON.parse(guestSettings);
              if (parsed.exerciseDifficulties) {
                updateSettings(prev => ({ 
                    exerciseDifficulties: { 
                        ...parsed.exerciseDifficulties, 
                        ...(prev.exerciseDifficulties || {}) 
                    } 
                }));
              }
            } catch { /* ignore */ }
          }
          await mergeWithAnonymousData();
          clearAnonymousData();
          localStorage.removeItem('oneup_settings');
        }
        await syncWithCloud();
      }
      setConflictData(null);
      setConflictCheckDone(true);
    } catch (error) { logger.error('Conflict resolution failed:', error); }
  }, [loadFromCloud, syncWithCloud, hasGuestData, clearAnonymousData, mergeWithAnonymousData, updateSettings]);

  // Pause / resume sync
  const pauseCloudSync = useCallback(() => setIsSyncPaused(true), []);
  const resumeCloudSync = useCallback(() => setIsSyncPaused(false), []);

  // Pre-load user clans
  useEffect(() => {
    let mounted = true;
    const fetchClans = async () => {
      if (auth.isSignedIn && !auth.loading) {
        try {
          const clans = await cloudSync.getUserClans();
          if (mounted) setUserClans(clans);
        } catch (e) {
          logger.error('Failed to prefetch clans', e);
        }
      }
    };
    fetchClans();
    return () => { mounted = false; };
  }, [auth.isSignedIn, auth.loading]);

  const refreshUserClans = useCallback(async () => {
    if (auth.isSignedIn && !auth.loading) {
      try {
        const clans = await cloudSync.getUserClans();
        setUserClans(clans);
        return clans;
      } catch (e) {
        logger.error('Failed to refresh clans', e);
      }
    }
    return [];
  }, [auth.isSignedIn, auth.loading]);

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
    hasShared, achievements,
    // Progress actions
    startChallenge: (userStart, selected) => startChallenge(userStart, selected, settings?.exerciseDifficulties || {}),
    toggleCompletion: (dateStr) => toggleCompletion(dateStr, settings?.exerciseDifficulties || {}),
    getDayNumber, getTotalReps, isDayDone,
    getExerciseCount, updateExerciseCount, getExerciseDone,
    deleteExerciseHistory, saveToCloud,
    setHasShared,
    scheduleNotification,
    getDifficulty, updateDifficulty,
    // Settings
    settings, updateSettings,
    // Computed stats
    computedStats,
    setCustomExercisesForStats,
    userClans, refreshUserClans,
    // Cloud sync
    cloudSyncAPI, conflictData, onResolveConflict: handleResolveConflict,
    pauseCloudSync, resumeCloudSync,
    publishLeaderboardNow,
    syncError,
    isInitialSyncDone,
    updateCardioSessions,
  }), [
    startDate, completions, isSetup, userStartDate, hasShared, achievements,
    startChallenge, toggleCompletion, getDayNumber, getTotalReps, isDayDone,
    getExerciseCount, updateExerciseCount, getExerciseDone,
    deleteExerciseHistory, saveToCloud, setHasShared, scheduleNotification,
    getDifficulty, updateDifficulty,
    settings, updateSettings, computedStats, setCustomExercisesForStats,
    userClans, refreshUserClans,
    cloudSyncAPI, conflictData, handleResolveConflict,
    pauseCloudSync, resumeCloudSync, publishLeaderboardNow,
    syncError, isInitialSyncDone, updateCardioSessions,
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
