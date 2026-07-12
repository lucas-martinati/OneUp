import { useEffect } from 'react';
import { useSettingsStore } from '@store/useSettingsStore';

/**
 * Hook to track and sync the device's current timezone to the user's settings.
 * This ensures that if a user travels, their new timezone is reflected in the backend
 * to correctly boundary their days for things like Streak Freeze reconciliation.
 */
export function useTimezoneTracker() {
  const updateSettings = useSettingsStore(state => state.updateSettings);
  const storedTimezone = useSettingsStore(state => state.settings?.timezone);

  useEffect(() => {
    try {
      const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // If the device timezone differs from what we have in the store, update it.
      if (deviceTimezone && deviceTimezone !== storedTimezone) {
        updateSettings({ timezone: deviceTimezone });
      }
    } catch (e) {
      // Intl API might fail on very old browsers, safely ignore
      console.warn("Could not determine device timezone:", e);
    }
  }, [storedTimezone, updateSettings]);
}
