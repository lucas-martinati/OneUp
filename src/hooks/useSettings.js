import { useCallback } from 'react';
import { useLocalStorageScoped } from './useLocalStorageScoped';

const STORAGE_KEY = 'oneup_settings';

const defaultSettings = {
  notificationsEnabled: false,
  soundsEnabled: true,
  notificationTime: { hour: 9, minute: 0 }, // Default 9:00 AM
  leaderboardEnabled: false,
  leaderboardPseudo: '',
  difficultyMultiplier: 1.0,
  performanceMode: 'high' // 'low' | 'high'
};

export function useSettings(userId) {
  const [settings, setSettings] = useLocalStorageScoped(
    STORAGE_KEY, userId, defaultSettings,
    (parsed) => ({ ...defaultSettings, ...parsed })
  );

  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, [setSettings]);

  return { settings, updateSettings };
}
