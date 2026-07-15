import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSettingsStore } from '../useSettingsStore';

// Mock dependencies
vi.mock('@utils/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
  })
}));

describe('useSettingsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSettingsStore.getState().reset();
    
    // mock local storage
    const store = {};
    globalThis.localStorage = {
      getItem: vi.fn((key) => store[key] || null),
      setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
      removeItem: vi.fn((key) => { delete store[key]; }),
    };
  });

  describe('Initialization', () => {
    it('initializes for user with defaults if storage empty', () => {
      useSettingsStore.getState().initForUser('user1');
      const state = useSettingsStore.getState();
      expect(state._userId).toBe('user1');
      expect(state.settingsInitialSyncDone).toBe(false);
      expect(state.settings.notificationsEnabled).toBe(false); // default
    });

    it('initializes and strips legacy keys', () => {
      globalThis.localStorage.getItem.mockReturnValueOnce(JSON.stringify({
        soundsEnabled: false,
        difficultyHistory: [1, 2], // legacy key
        runningStreak: 5, // legacy key
      }));

      useSettingsStore.getState().initForUser('user2');
      const state = useSettingsStore.getState();
      
      expect(state.settings.soundsEnabled).toBe(false);
      expect(state.settings.difficultyHistory).toBeUndefined();
      expect(state.settings.runningStreak).toBeUndefined();
    });

    it('handles localStorage throw', () => {
      globalThis.localStorage.getItem.mockImplementationOnce(() => { throw new Error('foo'); });
      useSettingsStore.getState().initForUser('user3');
      expect(useSettingsStore.getState().settings.soundsEnabled).toBe(true); // default fallback
    });

    it('handles invalid JSON in localStorage', () => {
      globalThis.localStorage.getItem.mockReturnValueOnce('not json');
      useSettingsStore.getState().initForUser('user3');
      expect(useSettingsStore.getState().settings.soundsEnabled).toBe(true); // fallback to defaults via catch
    });
    
    it('handles non-object JSON in localStorage', () => {
      globalThis.localStorage.getItem.mockReturnValueOnce(JSON.stringify("string"));
      useSettingsStore.getState().initForUser('user3');
      expect(useSettingsStore.getState().settings.soundsEnabled).toBe(true); // fallback to defaults via cleanSettings early return
    });
  });

  describe('Updating Settings', () => {
    it('updates using object', () => {
      useSettingsStore.getState().initForUser('user1');
      useSettingsStore.getState().updateSettings({ soundsEnabled: false });
      
      const state = useSettingsStore.getState();
      expect(state.settings.soundsEnabled).toBe(false);
      expect(globalThis.localStorage.setItem).toHaveBeenCalledWith(
        'oneup_settings_user1',
        expect.stringContaining('"soundsEnabled":false')
      );
    });

    it('updates using function updater', () => {
      useSettingsStore.getState().initForUser(null); // anonymous user
      useSettingsStore.getState().updateSettings((prev) => ({ hapticsEnabled: !prev.hapticsEnabled }));
      
      const state = useSettingsStore.getState();
      expect(state.settings.hapticsEnabled).toBe(false); // default was true
      expect(globalThis.localStorage.setItem).toHaveBeenCalledWith(
        'oneup_settings', // no userId
        expect.stringContaining('"hapticsEnabled":false')
      );
    });

    it('merges nested exerciseDifficulties correctly', () => {
      useSettingsStore.getState().initForUser('user1');
      useSettingsStore.getState().updateSettings({ exerciseDifficulties: { bench: 1.5 } });
      useSettingsStore.getState().updateSettings({ exerciseDifficulties: { squats: 1.2 } });
      
      const state = useSettingsStore.getState();
      expect(state.settings.exerciseDifficulties).toEqual({ bench: 1.5, squats: 1.2 });
    });

    it('handles localStorage.setItem throw', () => {
      useSettingsStore.getState().initForUser('user1');
      globalThis.localStorage.setItem.mockImplementationOnce(() => { throw new Error('Disk full'); });
      
      // Should not crash
      expect(() => {
        useSettingsStore.getState().updateSettings({ soundsEnabled: false });
      }).not.toThrow();
    });
  });

  describe('Cloud Sync', () => {
    it('marks settings synced', () => {
      useSettingsStore.getState().markSettingsSynced();
      expect(useSettingsStore.getState().settingsInitialSyncDone).toBe(true);
    });

    it('applies cloud settings ignoring legacy and local-only keys', () => {
      useSettingsStore.getState().initForUser('user1');
      
      // Update a local-only key first
      useSettingsStore.getState().updateSettings({ performanceMode: 'low' });
      
      const cloudSettings = {
        soundsEnabled: false,
        performanceMode: 'high', // Should be ignored
        difficultyHistory: [1], // Legacy, should be ignored
        notificationTime: { hour: 10, minute: 30 },
        exerciseDifficulties: { bench: 2.0 }
      };

      useSettingsStore.getState().applyCloudSettings(cloudSettings);
      
      const state = useSettingsStore.getState();
      expect(state.settings.soundsEnabled).toBe(false);
      expect(state.settings.performanceMode).toBe('low'); // Retained local value
      expect(state.settings.difficultyHistory).toBeUndefined();
      expect(state.settings.notificationTime).toEqual({ hour: 10, minute: 30 });
      expect(state.settings.exerciseDifficulties).toEqual({ bench: 2.0 });
    });

    it('returns early if cloud settings is falsy', () => {
      const stateBefore = useSettingsStore.getState().settings;
      useSettingsStore.getState().applyCloudSettings(null);
      expect(useSettingsStore.getState().settings).toBe(stateBefore);
    });

    it('merges exercise difficulties with cloud settings', () => {
      useSettingsStore.getState().initForUser('user1');
      useSettingsStore.getState().updateSettings({ exerciseDifficulties: { pushups: 1.5 } });
      
      useSettingsStore.getState().applyCloudSettings({
        exerciseDifficulties: { squats: 2.0 }
      });
      
      expect(useSettingsStore.getState().settings.exerciseDifficulties).toEqual({ pushups: 1.5, squats: 2.0 });
    });

    it('handles malformed notificationTime in cloud', () => {
      useSettingsStore.getState().initForUser('user1');
      useSettingsStore.getState().applyCloudSettings({
        notificationTime: "invalid" // should fallback to { hour: 9, minute: 0 }
      });
      expect(useSettingsStore.getState().settings.notificationTime).toEqual({ hour: 9, minute: 0 });
    });

    it('no-ops if cloud settings match local (settingsEqual)', () => {
      useSettingsStore.getState().initForUser('user1');
      const baseState = useSettingsStore.getState().settings;
      
      globalThis.localStorage.setItem.mockClear();
      
      // Apply exact same settings
      useSettingsStore.getState().applyCloudSettings({ ...baseState });
      
      // Should not persist again or change state ref
      expect(globalThis.localStorage.setItem).not.toHaveBeenCalled();
      
      // Test nested equality
      useSettingsStore.getState().updateSettings({ exerciseDifficulties: { bench: 1.5 } });
      globalThis.localStorage.setItem.mockClear();
      
      useSettingsStore.getState().applyCloudSettings({ exerciseDifficulties: { bench: 1.5 } });
      expect(globalThis.localStorage.setItem).not.toHaveBeenCalled();
    });

    it('settingsEqual checks array and object mismatches', () => {
       useSettingsStore.getState().initForUser('user1');
       useSettingsStore.getState().updateSettings({ notificationTime: { hour: 8, minute: 0 } });
       
       globalThis.localStorage.setItem.mockClear();
       
       // Different nested object
       useSettingsStore.getState().applyCloudSettings({ notificationTime: { hour: 9, minute: 0 } });
       expect(globalThis.localStorage.setItem).toHaveBeenCalled();
       
       globalThis.localStorage.setItem.mockClear();
       
       // Different primitive
       useSettingsStore.getState().applyCloudSettings({ soundsEnabled: !useSettingsStore.getState().settings.soundsEnabled });
       expect(globalThis.localStorage.setItem).toHaveBeenCalled();
    });
  });
});
