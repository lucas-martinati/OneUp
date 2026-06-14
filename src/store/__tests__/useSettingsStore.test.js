import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '../useSettingsStore';

const KEY = 'oneup_settings';
const scopedKey = (uid) => `oneup_settings_${uid}`;

beforeEach(() => {
  localStorage.clear();
  useSettingsStore.getState().reset();
});

describe('initForUser', () => {
  it('loads defaults when nothing is stored', () => {
    useSettingsStore.getState().initForUser(null);
    const { settings, _userId, settingsInitialSyncDone } = useSettingsStore.getState();
    expect(settings.soundsEnabled).toBe(true);
    expect(settings.keepScreenOn).toBe(true);
    expect(settings.notificationsEnabled).toBe(false);
    expect(_userId).toBe(null);
    expect(settingsInitialSyncDone).toBe(false);
  });

  it('loads persisted settings for a scoped user', () => {
    localStorage.setItem(scopedKey('u1'), JSON.stringify({ soundsEnabled: false, leaderboardPseudo: 'Bob' }));
    useSettingsStore.getState().initForUser('u1');
    const { settings } = useSettingsStore.getState();
    expect(settings.soundsEnabled).toBe(false);
    expect(settings.leaderboardPseudo).toBe('Bob');
    // merged with defaults
    expect(settings.keepScreenOn).toBe(true);
  });

  it('strips legacy keys on load', () => {
    localStorage.setItem(KEY, JSON.stringify({
      soundsEnabled: true,
      difficultyMultiplier: 2,
      runningReps: 999,
      cardioTotalReps: 50,
    }));
    useSettingsStore.getState().initForUser(null);
    const { settings } = useSettingsStore.getState();
    expect(settings.difficultyMultiplier).toBeUndefined();
    expect(settings.runningReps).toBeUndefined();
    expect(settings.cardioTotalReps).toBeUndefined();
  });

  it('falls back to defaults when stored JSON is corrupt', () => {
    localStorage.setItem(KEY, '{ not valid json');
    useSettingsStore.getState().initForUser(null);
    expect(useSettingsStore.getState().settings.soundsEnabled).toBe(true);
  });
});

describe('updateSettings', () => {
  it('merges a partial object and persists it', () => {
    useSettingsStore.getState().initForUser('u1');
    useSettingsStore.getState().updateSettings({ soundsEnabled: false });
    expect(useSettingsStore.getState().settings.soundsEnabled).toBe(false);
    const persisted = JSON.parse(localStorage.getItem(scopedKey('u1')));
    expect(persisted.soundsEnabled).toBe(false);
  });

  it('accepts an updater function', () => {
    useSettingsStore.getState().updateSettings((prev) => ({ leaderboardPseudo: prev.leaderboardPseudo + 'X' }));
    expect(useSettingsStore.getState().settings.leaderboardPseudo).toBe('X');
  });

  it('deep-merges exerciseDifficulties instead of replacing them', () => {
    useSettingsStore.getState().updateSettings({ exerciseDifficulties: { pushups: 1.5 } });
    useSettingsStore.getState().updateSettings({ exerciseDifficulties: { squats: 0.5 } });
    expect(useSettingsStore.getState().settings.exerciseDifficulties).toEqual({
      pushups: 1.5,
      squats: 0.5,
    });
  });

  it('does not mutate the caller-provided update object', () => {
    useSettingsStore.getState().updateSettings({ exerciseDifficulties: { pushups: 1.5 } });
    const update = { exerciseDifficulties: { squats: 0.5 } };
    useSettingsStore.getState().updateSettings(update);
    expect(update.exerciseDifficulties).toEqual({ squats: 0.5 }); // untouched
  });
});

describe('applyCloudSettings', () => {
  it('ignores a null payload', () => {
    const before = useSettingsStore.getState().settings;
    useSettingsStore.getState().applyCloudSettings(null);
    expect(useSettingsStore.getState().settings).toBe(before);
  });

  it('merges cloud settings, strips legacy keys and persists', () => {
    useSettingsStore.getState().initForUser('u1');
    useSettingsStore.getState().applyCloudSettings({
      soundsEnabled: false,
      runningStreak: 7, // legacy → stripped
      notificationTime: { hour: 7, minute: 30 },
    });
    const { settings } = useSettingsStore.getState();
    expect(settings.soundsEnabled).toBe(false);
    expect(settings.runningStreak).toBeUndefined();
    expect(settings.notificationTime).toEqual({ hour: 7, minute: 30 });
    expect(JSON.parse(localStorage.getItem(scopedKey('u1'))).soundsEnabled).toBe(false);
  });

  it('repairs a missing or non-object notificationTime to the 9:00 default', () => {
    useSettingsStore.getState().applyCloudSettings({ notificationTime: 'garbage' });
    expect(useSettingsStore.getState().settings.notificationTime).toEqual({ hour: 9, minute: 0 });

    useSettingsStore.getState().applyCloudSettings({ soundsEnabled: true });
    expect(useSettingsStore.getState().settings.notificationTime).toEqual({ hour: 9, minute: 0 });
  });

  it('unions cloud and local exerciseDifficulties', () => {
    useSettingsStore.getState().updateSettings({ exerciseDifficulties: { pushups: 1.5 } });
    useSettingsStore.getState().applyCloudSettings({ exerciseDifficulties: { squats: 2 } });
    expect(useSettingsStore.getState().settings.exerciseDifficulties).toEqual({
      pushups: 1.5,
      squats: 2,
    });
  });
});

describe('sync flag + reset', () => {
  it('markSettingsSynced flips the flag', () => {
    expect(useSettingsStore.getState().settingsInitialSyncDone).toBe(false);
    useSettingsStore.getState().markSettingsSynced();
    expect(useSettingsStore.getState().settingsInitialSyncDone).toBe(true);
  });

  it('reset restores defaults and clears the user', () => {
    useSettingsStore.getState().initForUser('u1');
    useSettingsStore.getState().updateSettings({ soundsEnabled: false });
    useSettingsStore.getState().reset();
    const s = useSettingsStore.getState();
    expect(s.settings.soundsEnabled).toBe(true);
    expect(s._userId).toBe(null);
    expect(s.settingsInitialSyncDone).toBe(false);
  });
});
