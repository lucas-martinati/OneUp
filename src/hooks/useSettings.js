import { useState, useEffect } from 'react';

const SETTINGS_KEY = 'oneup_settings';

const defaultSettings = {
  notificationsEnabled: false,
  soundsEnabled: true,
  notificationTime: { hour: 9, minute: 0 } // Default 9:00 AM
};

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return {
    settings,
    updateSettings
  };
}

