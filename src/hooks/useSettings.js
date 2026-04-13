import { useState, useEffect, useCallback, useRef } from 'react';

const SETTINGS_KEY_BASE = 'oneup_settings';

function getStorageKey(userId) {
  return userId ? `${SETTINGS_KEY_BASE}_${userId}` : SETTINGS_KEY_BASE;
}

const defaultSettings = {
  notificationsEnabled: false,
  soundsEnabled: true,
  notificationTime: { hour: 9, minute: 0 }, // Default 9:00 AM
  leaderboardEnabled: false,
  leaderboardPseudo: '',
  difficultyMultiplier: 1.0,
  performanceMode: 'high' // 'low' | 'high'
};

function loadSettingsFromStorage(storageKey) {
  const saved = localStorage.getItem(storageKey);
  if (saved) {
    try {
      return { ...defaultSettings, ...JSON.parse(saved) };
    } catch {
      return defaultSettings;
    }
  }
  return defaultSettings;
}

export function useSettings(userId) {
  const storageKey = getStorageKey(userId);

  const [settings, setSettings] = useState(() => loadSettingsFromStorage(storageKey));

  // Reload when userId changes (account switch)
  const prevKeyRef = useRef(storageKey);
  useEffect(() => {
    if (prevKeyRef.current !== storageKey) {
      prevKeyRef.current = storageKey;
      if (userId) {
        // Migrate legacy data if UID-scoped key doesn't exist yet
        if (!localStorage.getItem(storageKey)) {
          const legacyData = localStorage.getItem(SETTINGS_KEY_BASE);
          if (legacyData) {
            localStorage.setItem(storageKey, legacyData);
          }
        }
        setSettings(loadSettingsFromStorage(storageKey));
      } else {
        setSettings(defaultSettings);
      }
    }
  }, [storageKey, userId]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(settings));
  }, [settings, storageKey]);

  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  return {
    settings,
    updateSettings
  };
}
