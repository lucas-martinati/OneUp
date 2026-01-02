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
