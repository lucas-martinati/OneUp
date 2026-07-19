import { create } from 'zustand';
import { createLogger } from '@utils/logger';

const logger = createLogger('SettingsStore');

const getOptimalPerformanceMode = () => {
  if (typeof window === 'undefined') return 'high';
  const isAndroid = /Android/i.test(navigator.userAgent);
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const deviceMemory = navigator.deviceMemory || 4;
  
  // Auto-detect lower-end devices to save them from expensive backdrop-filters
  if (isAndroid && (deviceMemory <= 4 || hardwareConcurrency <= 4)) return 'low';
  if (hardwareConcurrency <= 2) return 'low';
  
  return 'high';
};

const defaultSettings = {
  notificationsEnabled: false,
  soundsEnabled: true,
  hapticsEnabled: true,
  notificationTime: { hour: 9, minute: 0 },
  leaderboardEnabled: false,
  leaderboardPseudo: '',
  performanceMode: getOptimalPerformanceMode(),
  hasAutoDetectedPerf: true,
  exerciseDifficulties: {},
  keepScreenOn: true,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
};

/** Keys that were stored in older versions and should be stripped on load */
const LEGACY_KEYS = [
  'difficultyMultiplier', 'difficultyHistory', 'hasSharedFirstTime',
  'runningStreak', 'cyclingStreak', 'cardioTotalReps',
  'runningReps', 'cyclingReps',
];

/**
 * Keys that live only on the current device and must never be synced to or
 * from the cloud (graphics/performance mode and keep-screen-on depend on the
 * device, not the account).
 */
export const LOCAL_ONLY_KEYS = ['performanceMode', 'keepScreenOn'];

/**
 * Shallow-ish equality for two settings objects (nested objects compared by
 * JSON). Used to avoid re-rendering / re-saving when a cloud snapshot echoes
 * back values we already hold.
 */
function settingsEqual(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const av = a[k];
    const bv = b[k];
    if (av && typeof av === 'object') {
      if (JSON.stringify(av) !== JSON.stringify(bv)) return false;
    } else if (av !== bv) return false;
  }
  return true;
}

/**
 * Clean legacy keys from loaded settings data.
 */
function cleanSettings(raw) {
  if (!raw || typeof raw !== 'object') return { ...defaultSettings };
  const cleaned = { ...raw };
  for (const key of LEGACY_KEYS) delete cleaned[key];
  
  // Force a one-time auto-detection for existing users who upgrade to this version
  if (!cleaned.hasAutoDetectedPerf) {
    cleaned.performanceMode = getOptimalPerformanceMode();
    cleaned.hasAutoDetectedPerf = true;
  }
  
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

      const merged = { ...prev, ...next };
      // Merge exerciseDifficulties carefully to avoid wiping them
      // (without mutating `next`, which belongs to the caller)
      if (next.exerciseDifficulties && prev.exerciseDifficulties) {
        merged.exerciseDifficulties = {
          ...prev.exerciseDifficulties,
          ...next.exerciseDifficulties,
        };
      }
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
      // Device-local settings are never taken from the cloud.
      for (const key of LOCAL_ONLY_KEYS) delete cleanedCloud[key];

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
      // No-op when the cloud snapshot matches what we already have. This keeps
      // a live cloud listener from echoing our own auto-saves back into an
      // endless save loop, and avoids needless re-renders.
      if (settingsEqual(prev, merged)) return {};
      saveToStorage(state._userId, merged);
      return { settings: merged };
    });
  },
}));
