import { renderHook } from '@testing-library/react';
import { useCloudSettingsSync } from '../useCloudSettingsSync';
import { useProgressStore } from '@store/useProgressStore';
import { useSettingsStore } from '@store/useSettingsStore';
import { cloudSync } from '@services/cloudSync';
import { useCloudAutoSave } from '../useCloudAutoSave';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@store/useProgressStore', () => ({
  useProgressStore: vi.fn(),
}));

vi.mock('@store/useSettingsStore', () => ({
  useSettingsStore: vi.fn(),
  LOCAL_ONLY_KEYS: ['hapticFeedback', 'theme'],
}));

vi.mock('@services/cloudSync', () => ({
  cloudSync: {
    listenToSettingsFromCloud: vi.fn(),
    saveSettingsToCloud: vi.fn(),
  },
}));

vi.mock('../useCloudAutoSave', () => ({
  useCloudAutoSave: vi.fn(),
}));

describe('useCloudSettingsSync', () => {
  let applyCloudSettingsMock;
  let markSettingsSyncedMock;

  beforeEach(() => {
    vi.useFakeTimers();
    applyCloudSettingsMock = vi.fn();
    markSettingsSyncedMock = vi.fn();

    useProgressStore.mockImplementation((selector) => {
      const str = selector.toString();
      if (str.includes('isStoreInitialized')) return true;
      if (str.includes('isSetup')) return true;
      return null;
    });

    useSettingsStore.mockImplementation((selector) => {
      const str = selector.toString();
      if (str.includes('settingsInitialSyncDone')) return true;
      if (str.includes('markSettingsSynced')) return markSettingsSyncedMock;
      if (str.includes('applyCloudSettings')) return applyCloudSettingsMock;
      if (str.includes('settings')) return { theme: 'dark', other: 'value' };
      return null;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('listens to settings from cloud when signed in', () => {
    let listenerCallback;
    cloudSync.listenToSettingsFromCloud.mockImplementation((cb) => {
      listenerCallback = cb;
      return vi.fn(); // unsubscribe
    });

    renderHook(() => useCloudSettingsSync({ isSignedIn: true, authConfirmed: true }));

    expect(cloudSync.listenToSettingsFromCloud).toHaveBeenCalled();
    
    // Simulate cloud update
    listenerCallback({ someCloudSetting: 'val' });
    expect(applyCloudSettingsMock).toHaveBeenCalledWith({ someCloudSetting: 'val' });
    
    // First snapshot triggers markSettingsSynced after timeout
    vi.runAllTimers();
    expect(markSettingsSyncedMock).toHaveBeenCalledTimes(1);

    // Second snapshot does not trigger markSettingsSynced again
    listenerCallback({ someCloudSetting: 'val2' });
    vi.runAllTimers();
    expect(markSettingsSyncedMock).toHaveBeenCalledTimes(1); // Still 1
  });

  it('marks settings synced if not signed in but auth confirmed', () => {
    renderHook(() => useCloudSettingsSync({ isSignedIn: false, authConfirmed: true }));
    vi.runAllTimers();
    expect(markSettingsSyncedMock).toHaveBeenCalledTimes(1);
  });

  it('invokes useCloudAutoSave with correctly stripped callback', () => {
    renderHook(() => useCloudSettingsSync({ isSignedIn: true, loading: false, authConfirmed: true }));
    
    expect(useCloudAutoSave).toHaveBeenCalled();
    const args = vi.mocked(useCloudAutoSave).mock.calls[0];
    const [enabled, , saveCallback, options] = args;

    expect(enabled).toBe(true);
    expect(options.delay).toBe(2000);

    // Call the save callback
    saveCallback({ theme: 'dark', hapticFeedback: true, validSetting: 'foo' });

    expect(cloudSync.saveSettingsToCloud).toHaveBeenCalledWith({ validSetting: 'foo' });
  });
});
