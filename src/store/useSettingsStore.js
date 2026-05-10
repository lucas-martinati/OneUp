import { create } from 'zustand';
import { createLogger } from '../utils/logger';

const logger = createLogger('SettingsStore');

const defaultSettings = {
  notificationsEnabled: false,
  soundsEnabled: true,
  notificationTime: { hour: 9, minute: 0 },
  leaderboardEnabled: false,
  leaderboardPseudo: '',
  performanceMode: 'high',
  exerciseDifficulties: {},
  keepScreenOn: true,
};

/** Keys that were stored in older versions and should be stripped on load */
const LEGACY_KEYS = [
  'difficultyMultiplier', 'difficultyHistory', 'hasSharedFirstTime',
  'runningStreak', 'cyclingStreak', 'cardioTotalReps',
  'runningReps', 'cyclingReps',
];

/**
 * Clean legacy keys from loaded settings data.
 */
function cleanSettings(raw) {
  if (!raw || typeof raw !== 'object') return { ...defaultSettings };
  const cleaned = { ...raw };
  for (const key of LEGACY_KEYS) delete cleaned[key];
  return { ...defaultSettings, ...cleaned };
}

/**
 * Build the scoped localStorage key for settings.
 */
function getStorageKey(userId) {
  return userId ? `oneup_settings_${userId}` : 'oneup_settings';
}

/**
 * Load settings from localStorage for the given user.
 */
function loadFromStorage(userId) {
  try {
    const key = getStorageKey(userId);
    const saved = localStorage.getItem(key);
    if (!saved) return { ...defaultSettings };
    return cleanSettings(JSON.parse(saved));
  } catch {
    return { ...defaultSettings };
  }
}

/**
 * Persist settings to localStorage for the given user.
 */
function saveToStorage(userId, settings) {
  try {
    const key = getStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(settings));
  } catch (e) {
    logger.error('Failed to persist settings:', e);
  }
}

/**
 * Zustand store for user settings.
 *
 * Replaces the old useSettings hook + the settings slice of ProgressContext.
 * Supports UID-scoped localStorage persistence and cloud sync.
 */
export const useSettingsStore = create((set) => ({
  // ── State ────────────────────────────────────────────────────────────
  settings: { ...defaultSettings },
  _userId: null,
  /** True after the initial cloud settings load completes */
  settingsInitialSyncDone: false,

  // ── Actions ──────────────────────────────────────────────────────────

  /**
   * Initialise the store for a given user.
   * Loads from localStorage and resets the sync flag.
   */
  initForUser: (userId) => {
    const loaded = loadFromStorage(userId);
    set({ settings: loaded, _userId: userId, settingsInitialSyncDone: false });
  },

  /**
   * Reset to defaults (e.g. on sign-out).
   */
  reset: () => {
    set({ settings: { ...defaultSettings }, _userId: null, settingsInitialSyncDone: false });
  },

  /**
   * Update settings.
   * Accepts either a partial settings object or an updater function.
   * Automatically persists to localStorage.
   */
  updateSettings: (update) => {
    set((state) => {
      const prev = state.settings;
      const next = typeof update === 'function' ? update(prev) : update;

      // Merge exerciseDifficulties carefully to avoid wiping them
      if (next.exerciseDifficulties && prev.exerciseDifficulties) {
        next.exerciseDifficulties = {
          ...prev.exerciseDifficulties,
          ...next.exerciseDifficulties,
        };
      }

      const merged = { ...prev, ...next };
      saveToStorage(state._userId, merged);
      return { settings: merged };
    });
  },

  /**
   * Called after the initial cloud settings have been loaded/merged.
   */
  markSettingsSynced: () => set({ settingsInitialSyncDone: true }),

  /**
   * Apply cloud-loaded settings (merge with local).
   */
  applyCloudSettings: (cloudSettings) => {
    if (!cloudSettings) return;
    set((state) => {
      const prev = state.settings;
      const cleanedCloud = { ...cloudSettings };
      for (const key of LEGACY_KEYS) delete cleanedCloud[key];

      const safeSettings = {
        ...cleanedCloud,
        notificationTime: cloudSettings.notificationTime || { hour: 9, minute: 0 },
        exerciseDifficulties: {
          ...(prev.exerciseDifficulties || {}),
          ...(cloudSettings.exerciseDifficulties || {}),
        },
      };
      if (typeof safeSettings.notificationTime !== 'object') {
        safeSettings.notificationTime = { hour: 9, minute: 0 };
      }

      const merged = { ...prev, ...safeSettings };
      saveToStorage(state._userId, merged);
      return { settings: merged };
    });
  },
}));
