import { useEffect, useState, useRef, Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { useProgress } from './hooks/useProgress';
import { useSettings } from './hooks/useSettings';
import { useGoogleAuth } from './hooks/useGoogleAuth';
import { useComputedStats } from './hooks/useComputedStats';
import { useUserDetailsCache } from './hooks/useUserDetailsCache';
import { useRoutines } from './hooks/useRoutines';
import { cloudSync } from './services/cloudSync';
import { initPurchases, checkSupporterStatus, purchaseSupporter, restorePurchases } from './services/purchaseService';
// Simple components stay static
import { EXERCISES } from './config/exercises';
import { createLogger } from './utils/logger';

// Heavy components are lazy loaded
const Dashboard = lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));
const Onboarding = lazy(() => import('./components/Onboarding').then(module => ({ default: module.Onboarding })));

const logger = createLogger('App');

function App() {
  const { t } = useTranslation();
  const progress = useProgress();
  const { settings, updateSettings } = useSettings();
  const googleAuth = useGoogleAuth();
  const { routines, saveRoutine, deleteRoutine, updateRoutine, setRoutinesFromCloud, maxRoutines } = useRoutines();
  const [conflictData, setConflictData] = useState(null);
  const [conflictCheckDone, setConflictCheckDone] = useState(false);
  const [isInitialSyncDone, setIsInitialSyncDone] = useState(false);
  const [isSyncPaused, setIsSyncPaused] = useState(false);
  const [isSupporter, setIsSupporter] = useState(() => localStorage.getItem('oneup_supporter') === 'true');
  const [purchaseHistory, setPurchaseHistory] = useState([]);

  const {
    startDate,
    completions,
    startChallenge,
    toggleCompletion,
    getDayNumber,
    getTotalReps,
    isDayDone,
    isSetup,
    userStartDate,
    scheduleNotification,
    requestNotificationPermission,
    getExerciseCount,
    updateExerciseCount,
    saveToCloud,
    loadFromCloud,
    syncWithCloud,
    startCloudListener
  } = progress;

  // Centralized stats computation (single pass over completions)
  const computedStats = useComputedStats(completions, settings, getDayNumber);

  // Cached user details for leaderboard
  const userDetailsCache = useUserDetailsCache(cloudSync);

  // Apply performance mode on document root
  useEffect(() => {
    document.documentElement.setAttribute('data-perf', settings.performanceMode);
  }, [settings.performanceMode]);

  // Reset sync state when user signs out or changes
  useEffect(() => {
    if (!googleAuth.isSignedIn) {
      setConflictCheckDone(false);
      setIsInitialSyncDone(false);
      setConflictData(null);
    }
  }, [googleAuth.isSignedIn, googleAuth.user?.uid]);

  // Request notification permission and schedule on first setup
  useEffect(() => {
    if (isSetup) {
      requestNotificationPermission();
      if (settings.notificationsEnabled) {
        scheduleNotification(settings);
      }
    }
  }, [isSetup, settings.notificationsEnabled]);

  // Refresh notification daily to keep day count fresh
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

  // Save to cloud only when an exercise completion status changes (not on count changes)
  useEffect(() => {
    if (googleAuth.isSignedIn && !googleAuth.loading && !conflictData && conflictCheckDone && isInitialSyncDone) {
      logger.debug('Auto-save triggered by completion change');
      const doSave = async () => {
        try {
          await saveToCloud();
          logger.success('Auto-save: Progression synchronisée');
        } catch (error) {
          logger.error('Auto-save failed:', error);
        }
      };
      const timer = setTimeout(doSave, 1000);
      return () => clearTimeout(timer);
    } else if (googleAuth.isSignedIn && !isInitialSyncDone && !googleAuth.loading) {
      logger.debug('Auto-save skipped: Initial sync still in progress');
    }
  }, [
    progress.lastCompletionChange,
    googleAuth.isSignedIn, googleAuth.loading, conflictData, conflictCheckDone, isInitialSyncDone, saveToCloud
  ]);

  // Sync settings with cloud on sign-in
  useEffect(() => {
    if (googleAuth.isSignedIn && !googleAuth.loading) {
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
        } catch (error) {
          logger.error('Settings sync error:', error);
        }
      };
      loadSettings();
    }
  }, [googleAuth.isSignedIn, googleAuth.loading]);

  // Sync routines and purchase history with cloud on sign-in
  useEffect(() => {
    if (googleAuth.isSignedIn && !googleAuth.loading) {
      const loadData = async () => {
        try {
          const cloudRoutines = await cloudSync.loadRoutinesFromCloud();
          if (cloudRoutines && Array.isArray(cloudRoutines)) {
            setRoutinesFromCloud(cloudRoutines);
          }
          const history = await cloudSync.loadPurchaseHistoryFromCloud();
          if (history && Array.isArray(history)) {
            setPurchaseHistory(history);
          }
        } catch (error) {
          logger.error('Data sync error:', error);
        }
      };
      loadData();
    }
  }, [googleAuth.isSignedIn, googleAuth.loading]);

  // Initialize purchases and check supporter status on sign-in
  useEffect(() => {
    if (googleAuth.isSignedIn && !googleAuth.loading) {
      const initAndCheck = async () => {
        try {
          await initPurchases(cloudSync.getCurrentUserId());
          const status = await checkSupporterStatus();
          setIsSupporter(status);
        } catch (error) {
          logger.error('Purchase init error:', error);
        }
      };
      initAndCheck();
    }
  }, [googleAuth.isSignedIn, googleAuth.loading]);

  // Auto-detect cloud data conflict on sign-in
  useEffect(() => {
    if (googleAuth.isSignedIn && !googleAuth.loading && isSetup && !conflictCheckDone) {
      const detectConflict = async () => {
        try {
          const cloudData = await cloudSync.loadFromCloud();
          if (cloudData && cloudData.completions) {
            const cloudKeys = Object.keys(cloudData.completions);
            const localKeys = Object.keys(completions);

            // Compare only isCompleted status per exercise (count is stripped in cloud)
            const hasConflict = cloudKeys.length > 0 && (
              cloudKeys.some(key => !completions[key]) ||
              localKeys.some(key => !cloudData.completions[key]) ||
              cloudKeys.some(key => {
                const cloudDay = cloudData.completions[key];
                const localDay = completions[key];
                if (!cloudDay || !localDay) return true;
                // Compare per exercise: only check isCompleted
                const allExIds = new Set([...Object.keys(cloudDay), ...Object.keys(localDay)]);
                for (const exId of allExIds) {
                  const cloudDone = cloudDay[exId]?.isCompleted || false;
                  const localDone = localDay[exId]?.isCompleted || false;
                  if (cloudDone !== localDone) return true;
                }
                return false;
              })
            );
            if (hasConflict) {
              setConflictData(cloudData);
            } else {
              setConflictCheckDone(true);
            }
          } else {
            setConflictCheckDone(true);
          }
        } catch (error) {
          logger.error('Conflict detection failed:', error);
          setConflictCheckDone(true);
        }
      };
      detectConflict();
    } else if (googleAuth.isSignedIn && !googleAuth.loading && !isSetup && !conflictCheckDone) {
      setConflictCheckDone(true);
    }
  }, [googleAuth.isSignedIn, googleAuth.loading, isSetup, conflictCheckDone, completions]);

  // Auto-save settings
  useEffect(() => {
    if (googleAuth.isSignedIn && !googleAuth.loading && isSetup) {
      const timer = setTimeout(() => {
        cloudSync.saveSettingsToCloud(settings);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [settings, googleAuth.isSignedIn, googleAuth.loading, isSetup]);

  // Auto-save routines
  useEffect(() => {
    if (googleAuth.isSignedIn && !googleAuth.loading && isSetup) {
      const timer = setTimeout(() => {
        cloudSync.saveRoutinesToCloud(routines);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [routines, googleAuth.isSignedIn, googleAuth.loading, isSetup]);

  // Auto-publish leaderboard when completions change (if opted in or in clan)
  useEffect(() => {
    if (!googleAuth.isSignedIn || googleAuth.loading || !isSetup) return;
    if (!isInitialSyncDone) return;

    const timer = setTimeout(async () => {
      try {
        // Find last active day from sorted dates
        let lastActiveDay = null;
        for (const dateStr of computedStats.sortedDates) {
          const day = completions[dateStr];
          if (day && EXERCISES.some(ex => day[ex.id]?.isCompleted)) {
            lastActiveDay = dateStr;
          }
        }

        const pseudo = settings.leaderboardPseudo || googleAuth.user?.displayName || 'Anonyme';
        const isPublic = !!settings.leaderboardEnabled;
        await cloudSync.publishToLeaderboard({ 
          pseudo, 
          totalReps: computedStats.globalTotalReps, 
          exerciseReps: computedStats.exerciseReps, 
          achievements: computedStats.badgeCount, 
          isPublic, 
          lastActiveDay,
          difficultyMultiplier: settings?.difficultyMultiplier,
          isSupporter
        });
      } catch (error) {
        logger.error('Leaderboard publish failed:', error);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [
    completions, settings.leaderboardEnabled, settings.leaderboardPseudo, settings.difficultyMultiplier,
    googleAuth.isSignedIn, googleAuth.loading, isSetup, isInitialSyncDone, computedStats, isSupporter
  ]);

  // ── Purchase handlers ──
  const handlePurchaseSupporter = async () => {
    const result = await purchaseSupporter();
    if (result.webOnly) {
      alert(t('supporter.androidOnly'));
      return;
    }
    if (result.isSupporter) {
      setIsSupporter(true);
    }
    if (result.success && result.product) {
      const newHistory = [...purchaseHistory, result.product];
      setPurchaseHistory(newHistory);
      cloudSync.savePurchaseHistoryToCloud(newHistory);
    }
  };

  const handleRestorePurchases = async () => {
    const result = await restorePurchases();
    if (result.webOnly) {
      alert(t('supporter.androidOnly'));
      return;
    }
    setIsSupporter(result.isSupporter);
  };

  const handleResolveConflict = async (action) => {
    try {
      if (action === 'restore') {
        await loadFromCloud();
      } else if (action === 'upload') {
        await saveToCloud();
      }
      setConflictData(null);
      setConflictCheckDone(true);
    } catch (error) {
      logger.error('Conflict resolution failed:', error);
    }
  };

  // Full sync on app startup once conflict check is resolved
  useEffect(() => {
    if (googleAuth.isSignedIn && !googleAuth.loading && conflictCheckDone && isSetup && !isInitialSyncDone) {
      const initialSync = async () => {
        try {
          await syncWithCloud();
          setIsInitialSyncDone(true);
          logger.success('Initial sync completed on app launch');
        } catch (error) {
          logger.error('Initial sync failed:', error);
          setIsInitialSyncDone(true); // allow saves even if sync fails
        }
      };
      initialSync();
    }
  }, [conflictCheckDone, googleAuth.isSignedIn, googleAuth.loading, isSetup, isInitialSyncDone]);

  // Real-time cloud sync listener
  useEffect(() => {
    if (googleAuth.isSignedIn && !googleAuth.loading && conflictCheckDone && isInitialSyncDone && !isSyncPaused && !conflictData) {
      logger.info('Starting real-time cloud listener');
      const unsubscribe = startCloudListener();
      return () => {
        logger.info('Stopping real-time cloud listener');
        if (unsubscribe) unsubscribe();
      };
    }
  }, [googleAuth.isSignedIn, googleAuth.loading, conflictCheckDone, isInitialSyncDone, isSyncPaused, conflictData, startCloudListener]);

  return (
    <Suspense fallback={
      <div style={{
        position: 'fixed', inset: 0, background: '#050505',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: '600'
      }}>
        {t('app.initializing')}
      </div>
    }>
      {!isSetup ? (
        <Onboarding onStart={startChallenge} />
      ) : (
        <Dashboard
          getDayNumber={getDayNumber}
          getTotalReps={getTotalReps}
          isDayDone={isDayDone}
          toggleCompletion={toggleCompletion}
          startDate={startDate}
          userStartDate={userStartDate}
          completions={completions}
          scheduleNotification={scheduleNotification}
          settings={settings}
          updateSettings={updateSettings}
          cloudAuth={googleAuth}
          cloudSync={{ saveToCloud, loadFromCloud, syncWithCloud, signIn: googleAuth.signIn, signOut: googleAuth.signOut, loadLeaderboard: () => cloudSync.loadLeaderboard(), loadUserDetails: (uid) => userDetailsCache.loadUserDetails(uid), getCurrentUserId: () => cloudSync.getCurrentUserId(), deleteAccount: () => cloudSync.deleteAccount() }}
          conflictData={conflictData}
          onResolveConflict={handleResolveConflict}
          getExerciseCount={getExerciseCount}
          updateExerciseCount={updateExerciseCount}
          getExerciseDone={progress.getExerciseDone}
          pauseCloudSync={() => setIsSyncPaused(true)}
          resumeCloudSync={() => setIsSyncPaused(false)}
          computedStats={computedStats}
          routines={routines}
          saveRoutine={saveRoutine}
          deleteRoutine={deleteRoutine}
          updateRoutine={updateRoutine}
          maxRoutines={maxRoutines}
          isSupporter={isSupporter}
          purchaseHistory={purchaseHistory}
          onPurchaseSupporter={handlePurchaseSupporter}
          onRestorePurchases={handleRestorePurchases}
        />
      )}
    </Suspense>
  );
}

export default App;
