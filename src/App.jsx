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

  // Destructure progress for easier access
  const {
    startDate,
    completions,
    startChallenge,
    toggleCompletion,
    getDayNumber,
    getTotalPushups,
    isSetup,
    userStartDate,
    scheduleNotification,
    requestNotificationPermission,
    saveToCloud,
    loadFromCloud,
    syncWithCloud
  } = progress;

  // Request notification permission and schedule on first setup
  useEffect(() => {
    if (isSetup) {
      // Request permissions if needed
      requestNotificationPermission();

      // Schedule notification based on current settings
      if (settings.notificationsEnabled) {
        scheduleNotification(settings);
      }
    }
  }, [isSetup, settings.notificationsEnabled]);

  // Refresh notification daily to update pushup count
  useEffect(() => {
    if (isSetup && settings.notificationsEnabled) {
      // Update notification every time app opens to keep count fresh
      scheduleNotification(settings);

      // Also update at midnight to ensure accurate count for tomorrow
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 30, 0); // 30 seconds after midnight

      const timeUntilMidnight = tomorrow.getTime() - now.getTime();

      const midnightTimer = setTimeout(() => {
        scheduleNotification(settings);
      }, timeUntilMidnight);

      return () => clearTimeout(midnightTimer);
    }
  }, [isSetup, settings.notificationsEnabled, settings.notificationTime]);

  // Auto-sync when signed in and data changes (paused during conflict and until initial check done)
  useEffect(() => {
    if (googleAuth.isSignedIn && !googleAuth.loading && !conflictData && conflictCheckDone) {
      const syncData = async () => {
        try {
          await saveToCloud();
          logger.success('Data auto-saved to cloud');
        } catch (error) {
          logger.error('Auto-save failed:', error);
        }
      };

      // Debounce the sync to avoid too many calls
      const timer = setTimeout(syncData, 2000);
      return () => clearTimeout(timer);
    }
  }, [completions, googleAuth.isSignedIn, googleAuth.loading, conflictData]);

  // Sync settings with cloud
  useEffect(() => {
    if (googleAuth.isSignedIn && !googleAuth.loading) {
      // 1. Load settings from cloud on auth
      const loadSettings = async () => {
        try {
          const cloudSettings = await cloudSync.loadSettingsFromCloud();
          if (cloudSettings) {
            console.log('Synced settings from cloud:', cloudSettings);

            // Validate and sanitize settings before applying
            const safeSettings = {
              ...cloudSettings,
              // Ensure notificationTime exists and is valid if we have settings
              notificationTime: cloudSettings.notificationTime || { hour: 9, minute: 0 }
            };

            // Fix potential string/broken values from old syncs
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
  }, [googleAuth.isSignedIn, googleAuth.loading]); // Intentionally run once on load/auth

  // Auto-detect cloud data conflict on sign-in
  useEffect(() => {
    if (googleAuth.isSignedIn && !googleAuth.loading && isSetup) {
      const detectConflict = async () => {
        try {
          const cloudData = await cloudSync.loadFromCloud();

          if (cloudData && cloudData.completions) {
            // Check if cloud data differs from local data
            const cloudKeys = Object.keys(cloudData.completions);
            const localKeys = Object.keys(completions);

            // Simple conflict detection: cloud has data and it's different
            const hasConflict = cloudKeys.length > 0 && (
              cloudKeys.length !== localKeys.length ||
              cloudKeys.some(key => !completions[key])
            );

            if (hasConflict) {
              setConflictData(cloudData);
            } else {
              // No conflict, safe to start auto-sync
              setConflictCheckDone(true);
            }
          } else {
            // No cloud data, safe to start auto-sync
            setConflictCheckDone(true);
          }
        } catch (error) {
          logger.error('Conflict detection failed:', error);
          // On error, allow auto-sync to prevent blocking
          setConflictCheckDone(true);
        }
      };
      detectConflict();
    } else if (googleAuth.isSignedIn && !googleAuth.loading && !isSetup) {
      // If no setup needed (fresh start), mark conflict check as done
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

  // Handle conflict resolution
  const handleResolveConflict = async (action) => {
    try {
      if (action === 'restore') {
        // Restore: Load cloud data to local (overwrite local)
        await loadFromCloud();
      } else if (action === 'upload') {
        // Upload: Save local data to cloud (overwrite cloud)
        await saveToCloud();
      }
      // Clear conflict after resolution and enable auto-sync
      setConflictData(null);
      setConflictCheckDone(true);
    } catch (error) {
      logger.error('Conflict resolution failed:', error);
    }
  };

  return (
    <>
      {!isSetup ? (
        <Onboarding onStart={startChallenge} />
      ) : (
        <Dashboard
          getDayNumber={getDayNumber}
          getTotalPushups={getTotalPushups}
          toggleCompletion={toggleCompletion}
          startDate={startDate} // Math anchor (Jan 1)
          userStartDate={userStartDate} // Interaction anchor (User Choice)
          completions={completions}
          scheduleNotification={scheduleNotification}
          settings={settings}
          updateSettings={updateSettings}
          cloudAuth={googleAuth}
          cloudSync={{ saveToCloud, loadFromCloud, syncWithCloud, signIn: googleAuth.signIn, signOut: googleAuth.signOut }}
          conflictData={conflictData}
          onResolveConflict={handleResolveConflict}
        />
      )}
    </>
  );
}

export default App;
