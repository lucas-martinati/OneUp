import { useCallback } from 'react';
import { useLocalStorageScoped } from './useLocalStorageScoped';

const STORAGE_KEY = 'oneup_settings';

const defaultSettings = {
  notificationsEnabled: false,
  soundsEnabled: true,
  notificationTime: { hour: 9, minute: 0 }, // Default 9:00 AM
  leaderboardEnabled: false,
  leaderboardPseudo: '',
  performanceMode: 'high', // 'low' | 'high'
  exerciseDifficulties: {},
  keepScreenOn: true
};

export function useSettings(userId) {
  const [settings, setSettings] = useLocalStorageScoped(
    STORAGE_KEY, userId, defaultSettings,
    (parsed) => {
      console.debug('[Settings] Loading from storage:', parsed);
      const cleaned = { ...parsed };
      delete cleaned.difficultyMultiplier;
      delete cleaned.difficultyHistory;
      delete cleaned.hasSharedFirstTime;
      delete cleaned.runningStreak;
      delete cleaned.cyclingStreak;
      delete cleaned.cardioTotalReps;
      delete cleaned.runningReps;
      delete cleaned.cyclingReps;
      return { ...defaultSettings, ...cleaned };
    }
  );

  const updateSettings = useCallback((update) => {
    setSettings(prev => {
      const next = typeof update === 'function' ? update(prev) : update;
      
      // Special handling for exerciseDifficulties to ensure we don't wipe them
      if (next.exerciseDifficulties && prev.exerciseDifficulties) {
        next.exerciseDifficulties = {
          ...prev.exerciseDifficulties,
          ...next.exerciseDifficulties
        };
      }
      
      return { ...prev, ...next };
    });
  }, [setSettings]);

  return { settings, updateSettings };
}
