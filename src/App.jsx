import { useEffect } from 'react';
import { useProgress } from './hooks/useProgress';
import { useSettings } from './hooks/useSettings';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';

function App() {
  const { startDate, completions, startChallenge, toggleCompletion, getDayNumber, getTotalPushups, isSetup, userStartDate, scheduleNotification, requestNotificationPermission } = useProgress();
  const { settings } = useSettings();

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
        />
      )}
    </>
  );
}

export default App;
