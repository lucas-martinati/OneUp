import { useEffect, useState } from 'react';
import { useProgress } from './hooks/useProgress';
import { useSettings } from './hooks/useSettings';
import { useGoogleAuth } from './hooks/useGoogleAuth';
import { cloudSync } from './services/cloudSync';
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

  // Auto-save to cloud when data changes (upload only — no loop risk)
  useEffect(() => {
    if (googleAuth.isSignedIn && !googleAuth.loading && !conflictData && conflictCheckDone) {
      const doSave = async () => {
        try {
          await saveToCloud();
          logger.success('Data saved to cloud');
        } catch (error) {
          logger.error('Auto-save failed:', error);
        }
      };
      const timer = setTimeout(doSave, 500);
      return () => clearTimeout(timer);
    }
  }, [completions, googleAuth.isSignedIn, googleAuth.loading, conflictData]);

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
    if (googleAuth.isSignedIn && !googleAuth.loading && isSetup) {
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
    } else if (googleAuth.isSignedIn && !googleAuth.loading && !isSetup) {
      setConflictCheckDone(true);
    }
  }, [googleAuth.isSignedIn, googleAuth.loading, isSetup]);

  // Auto-save settings
  useEffect(() => {
    if (googleAuth.isSignedIn && !googleAuth.loading && isSetup) {
      const timer = setTimeout(() => {
        cloudSync.saveSettingsToCloud(settings);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [settings, googleAuth.isSignedIn, googleAuth.loading, isSetup]);

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
    if (googleAuth.isSignedIn && !googleAuth.loading && conflictCheckDone && isSetup) {
      const initialSync = async () => {
        try {
          await syncWithCloud();
          logger.success('Initial sync completed on app launch');
        } catch (error) {
          logger.error('Initial sync failed:', error);
        }
      };
      initialSync();
    }
  }, [conflictCheckDone, googleAuth.isSignedIn, googleAuth.loading, isSetup]);

  // Real-time listener: receive live updates from other devices
  useEffect(() => {
    if (googleAuth.isSignedIn && !googleAuth.loading && conflictCheckDone && isSetup) {
      const unsubscribe = startCloudListener();
      logger.info('Real-time cloud listener started');
      return () => {
        if (unsubscribe) {
          unsubscribe();
          logger.info('Real-time cloud listener stopped');
        }
      };
    }
  }, [googleAuth.isSignedIn, googleAuth.loading, conflictCheckDone, isSetup, startCloudListener]);

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
          cloudSync={{ saveToCloud, loadFromCloud, syncWithCloud, signIn: googleAuth.signIn, signOut: googleAuth.signOut }}
          conflictData={conflictData}
          onResolveConflict={handleResolveConflict}
          getExerciseCount={getExerciseCount}
          updateExerciseCount={updateExerciseCount}
          getExerciseDone={progress.getExerciseDone}
        />
      )}
    </>
  );
}

export default App;
