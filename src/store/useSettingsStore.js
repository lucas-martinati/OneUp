import { create } from 'zustand';
import { Preferences } from '@capacitor/preferences';
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

/**
 * Auto-detect whether the user's country/locale starts the week on Sunday or Monday.
 * Countries like US, Canada, Brazil, Mexico, Japan, South Korea, etc. start on Sunday.
 * Most of Europe, UK, Australia, etc. use ISO Monday start.
 */
export const getAutoDetectedWeekStartDay = () => {
  if (typeof window === 'undefined') return 'monday';

  try {
    const localeStr = navigator.language || (navigator.languages && navigator.languages[0]) || '';

    // Modern Intl.Locale API check (if supported by JS engine)
    if (typeof Intl !== 'undefined' && Intl.Locale) {
      const loc = new Intl.Locale(localeStr);
      if (loc.weekInfo && loc.weekInfo.firstDay !== undefined) {
        // 7 = Sunday (JS Intl spec: 1=Mon, 7=Sun)
        return loc.weekInfo.firstDay === 7 ? 'sunday' : 'monday';
      }
    }

    // Country / region fallback check
    const parts = localeStr.split('-');
    const region = parts.length > 1 ? parts[parts.length - 1].toUpperCase() : '';

    const sundayRegions = new Set([
      'US', 'CA', 'BR', 'MX', 'JP', 'KR', 'TW', 'PH', 'IL', 'IN', 'SA', 'AE', 'HK', 'SG', 'CO', 'CL', 'PE', 'VE', 'ZA'
    ]);
    if (region && sundayRegions.has(region)) {
      return 'sunday';
    }

    // Timezone fallback check
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (
      tz.startsWith('America/New_York') ||
      tz.startsWith('America/Los_Angeles') ||
      tz.startsWith('America/Chicago') ||
      tz.startsWith('America/Denver') ||
      tz.startsWith('America/Sao_Paulo') ||
      tz.startsWith('Asia/Tokyo') ||
      tz.startsWith('Asia/Seoul')
    ) {
      return 'sunday';
    }
  } catch (error) {
    logger.error('Failed to auto-detect week start day:', error);
  }

  return 'monday';
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
  weekStartDay: getAutoDetectedWeekStartDay(),
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
 * Persist settings to localStorage and Preferences for the given user.
 */
function saveToStorage(userId, settings) {
  try {
    const key = getStorageKey(userId);
    const serialized = JSON.stringify(settings);
    try {
      localStorage.setItem(key, serialized);
    } catch {
      // Ignore localStorage errors (e.g. quota or private mode)
    }
    Preferences.set({ key, value: serialized }).catch((e) => {
      logger.error('Failed to persist settings in Preferences:', e);
    });
  } catch (e) {
    logger.error('Failed to persist settings:', e);
  }
}

/**
 * Zustand store for user settings.
 *
 * Replaces the old useSettings hook + the settings slice of ProgressContext.
 * Supports UID-scoped localStorage and Preferences persistence and cloud sync.
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
   * Loads synchronously from localStorage, syncs asynchronously from Preferences,
   * and resets the sync flag.
   */
  initForUser: (userId) => {
    const loaded = loadFromStorage(userId);
    set({ settings: loaded, _userId: userId, settingsInitialSyncDone: false });

    // Sync from Preferences in case localStorage was cleared
    const key = getStorageKey(userId);
    Preferences.get({ key })
      .then(({ value: prefSaved }) => {
        if (useSettingsStore.getState()._userId !== userId) return;
        if (prefSaved) {
          try {
            const prefParsed = cleanSettings(JSON.parse(prefSaved));
            if (!localStorage.getItem(key)) {
              set((state) => ({ settings: { ...state.settings, ...prefParsed } }));
              try {
                localStorage.setItem(key, JSON.stringify(prefParsed));
              } catch { /* ignore */ }
            }
          } catch { /* ignore parse error */ }
        }
      })
      .catch(() => {});
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
