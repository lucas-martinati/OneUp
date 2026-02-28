import { useEffect, useState, useRef } from 'react';
import { useProgress } from './hooks/useProgress';
import { useSettings } from './hooks/useSettings';
import { useGoogleAuth } from './hooks/useGoogleAuth';
import { cloudSync } from './services/cloudSync';
import { EXERCISES } from './config/exercises';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { createLogger } from './utils/logger';

const logger = createLogger('App');

function App() {
  const progress = useProgress();
  const { settings, updateSettings } = useSettings();
  const googleAuth = useGoogleAuth();
  const [conflictData, setConflictData] = useState(null);
  const [conflictCheckDone, setConflictCheckDone] = useState(false);
  const [isInitialSyncDone, setIsInitialSyncDone] = useState(false);
  const [isSyncPaused, setIsSyncPaused] = useState(false);

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
      // Build a fingerprint of only isCompleted values to detect real changes
      const fingerprint = JSON.stringify(
        Object.fromEntries(
          Object.entries(completions).map(([date, exs]) => [
            date,
            Object.fromEntries(
              Object.entries(exs || {}).map(([exId, data]) => [exId, !!data?.isCompleted])
            )
          ])
        )
      );
      const doSave = async () => {
        try {
          await saveToCloud();
          logger.success('Data saved to cloud');
        } catch (error) {
          logger.error('Auto-save failed:', error);
        }
      };
      const timer = setTimeout(doSave, 1000);
      return () => clearTimeout(timer);
    }
  }, [
    // Only re-run when isCompleted statuses actually change
    JSON.stringify(
      Object.fromEntries(
        Object.entries(completions).map(([date, exs]) => [
          date,
          Object.fromEntries(
            Object.entries(exs || {}).map(([exId, data]) => [exId, !!data?.isCompleted])
          )
        ])
      )
    ),
    googleAuth.isSignedIn, googleAuth.loading, conflictData, conflictCheckDone
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

  // Auto-publish leaderboard when completions change (if opted in)
  useEffect(() => {
    if (!googleAuth.isSignedIn || googleAuth.loading || !isSetup || !settings.leaderboardEnabled) return;
    if (!isInitialSyncDone) return;

    const timer = setTimeout(async () => {
      try {
        const utcStart = Date.UTC(new Date().getFullYear(), 0, 1);
        let totalReps = 0;
        const exerciseReps = {};

        EXERCISES.forEach(ex => {
          let exTotal = 0;
          Object.entries(completions).forEach(([dateStr, day]) => {
            if (day?.[ex.id]?.isCompleted) {
              const d = new Date(dateStr);
              const utcD = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
              const dayNum = Math.floor((utcD - utcStart) / (1000 * 60 * 60 * 24)) + 1;
              exTotal += Math.max(1, Math.ceil(dayNum * ex.multiplier));
            }
          });
          exerciseReps[ex.id] = exTotal;
          totalReps += exTotal;
        });

        const pseudo = settings.leaderboardPseudo || googleAuth.user?.displayName || 'Anonyme';
        await cloudSync.publishToLeaderboard({ pseudo, totalReps, exerciseReps });
      } catch (error) {
        logger.error('Leaderboard publish failed:', error);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [
    completions, settings.leaderboardEnabled, settings.leaderboardPseudo,
    googleAuth.isSignedIn, googleAuth.loading, isSetup
  ]);

  // Remove from leaderboard when user opts out
  useEffect(() => {
    if (googleAuth.isSignedIn && !googleAuth.loading && !settings.leaderboardEnabled) {
      cloudSync.removeFromLeaderboard();
    }
  }, [settings.leaderboardEnabled, googleAuth.isSignedIn, googleAuth.loading]);

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
    <>
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
          cloudSync={{ saveToCloud, loadFromCloud, syncWithCloud, signIn: googleAuth.signIn, signOut: googleAuth.signOut, loadLeaderboard: () => cloudSync.loadLeaderboard(), getCurrentUserId: () => cloudSync.getCurrentUserId() }}
          conflictData={conflictData}
          onResolveConflict={handleResolveConflict}
          getExerciseCount={getExerciseCount}
          updateExerciseCount={updateExerciseCount}
          getExerciseDone={progress.getExerciseDone}
          pauseCloudSync={() => setIsSyncPaused(true)}
          resumeCloudSync={() => setIsSyncPaused(false)}
        />
      )}
    </>
  );
}

export default App;
