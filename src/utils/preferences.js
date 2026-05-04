import { isNativePlatform } from './platform';

const WEB_STORAGE_PREFIX = 'CapacitorStorage.';

let nativePreferencesPromise = null;

function getWebStorage() {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function webStorageKey(key) {
  return `${WEB_STORAGE_PREFIX}${key}`;
}

async function getNativePreferences() {
  if (!nativePreferencesPromise) {
    nativePreferencesPromise = import('@capacitor/preferences').then(({ Preferences }) => Preferences);
  }

  return nativePreferencesPromise;
}

export const Preferences = {
  async get({ key }) {
    if (isNativePlatform()) {
      const NativePreferences = await getNativePreferences();
      return NativePreferences.get({ key });
    }

    return { value: getWebStorage()?.getItem(webStorageKey(key)) ?? null };
  },

  async set({ key, value }) {
    if (isNativePlatform()) {
      const NativePreferences = await getNativePreferences();
      return NativePreferences.set({ key, value });
    }

    getWebStorage()?.setItem(webStorageKey(key), value);
    return undefined;
  },

  async remove({ key }) {
    if (isNativePlatform()) {
      const NativePreferences = await getNativePreferences();
      return NativePreferences.remove({ key });
    }

    getWebStorage()?.removeItem(webStorageKey(key));
    return undefined;
  },
};
