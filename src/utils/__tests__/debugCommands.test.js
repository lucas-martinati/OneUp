import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const prefsStore = new Map();
vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn(async ({ key }) => ({ value: prefsStore.get(key) ?? null })),
    set: vi.fn(async ({ key, value }) => { prefsStore.set(key, value); }),
    remove: vi.fn(async ({ key }) => { prefsStore.delete(key); }),
  },
}));
vi.mock('@services/cloudSync', () => ({ cloudSync: { getCurrentUserId: vi.fn(() => null) } }));
vi.mock('@config/badgeDefinitions', () => ({
  BADGE_DEFINITIONS: [
    { id: 'first_blood', category: 'reps', secret: false },
    { id: 'secret_one', category: 'fun', secret: true },
  ],
  getBadgeById: (id) => {
    if (id === 'first_blood') return { id: 'first_blood', category: 'reps', secret: false };
    if (id === 'secret_one') return { id: 'secret_one', category: 'fun', secret: true };
    return undefined;
  },
}));
const openAchievements = vi.fn();
vi.mock('@store/useUIStore', () => ({ useUIStore: { getState: () => ({ openAchievements }) } }));
vi.mock('../../i18n', () => ({ default: { t: (k, fallback) => fallback } }));

import { cloudSync } from '@services/cloudSync';
import { installDebugCommands } from '@utils/debugCommands';

beforeEach(() => {
  vi.clearAllMocks();
  cloudSync.getCurrentUserId.mockReturnValue(null);
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'table').mockImplementation(() => {});
  localStorage.clear();
  prefsStore.clear();
  installDebugCommands();
});
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('debugCommands', () => {
  it('installs commands on the window with a lowercase alias', () => {
    expect(window.oneupDebug).toBeDefined();
    expect(window.oneupdebug).toBe(window.oneupDebug);
  });

  it('showData logs progress/history/settings (anonymous key)', async () => {
    prefsStore.set('pushup_challenge_data', JSON.stringify({ a: 1 }));
    await expect(window.oneupDebug.showData()).resolves.toBeUndefined();
  });

  it('showData falls back to legacy localStorage progress', async () => {
    localStorage.setItem('pushup_challenge_data', JSON.stringify({ a: 1 }));
    await expect(window.oneupDebug.showData()).resolves.toBeUndefined();
  });

  it('uses a uid-scoped key when signed in', async () => {
    cloudSync.getCurrentUserId.mockReturnValue('uid42');
    window.oneupDebug.resetHistory();
    prefsStore.set('pushup_challenge_data_uid42', '{}');
    await window.oneupDebug.resetAll();
    expect(prefsStore.has('pushup_challenge_data_uid42')).toBe(false);
  });

  it('resetHistory clears the unscoped history key even when signed in', () => {
    cloudSync.getCurrentUserId.mockReturnValue('uid42');
    localStorage.setItem('oneup_session_history', '[]');
    window.oneupDebug.resetHistory();
    expect(localStorage.getItem('oneup_session_history')).toBeNull();
  });

  it('listAchievements returns the badge ids', () => {
    expect(window.oneupDebug.listAchievements()).toEqual(['first_blood', 'secret_one']);
  });

  it('giveAchievement dispatches for a known badge', () => {
    const handler = vi.fn();
    window.addEventListener('show-achievement', handler);
    window.oneupDebug.giveAchievement('first_blood');
    expect(handler).toHaveBeenCalled();
    window.removeEventListener('show-achievement', handler);
  });

  it('giveAchievement warns for an unknown badge', () => {
    window.oneupDebug.giveAchievement('nope');
    expect(console.warn).toHaveBeenCalled();
  });

  it('showCustomAchievement dispatches a custom event', () => {
    const handler = vi.fn();
    window.addEventListener('show-achievement-custom', handler);
    window.oneupDebug.showCustomAchievement();
    expect(handler).toHaveBeenCalled();
    window.removeEventListener('show-achievement-custom', handler);
  });

  it('openAchievements forwards a valid badge and nulls an invalid one', () => {
    window.oneupDebug.openAchievements('first_blood');
    expect(openAchievements).toHaveBeenCalledWith('first_blood');
    window.oneupDebug.openAchievements('bad');
    expect(openAchievements).toHaveBeenLastCalledWith(null);
  });

  it('poke dispatches a debug poke event', () => {
    const handler = vi.fn();
    window.addEventListener('oneup-debug-poke', handler);
    window.oneupDebug.poke();
    expect(handler).toHaveBeenCalled();
    window.removeEventListener('oneup-debug-poke', handler);
  });

  it('resetExercises clears today completions stored in Preferences', async () => {
    const todayStr = new Date().toLocaleDateString('sv-SE');
    prefsStore.set('pushup_challenge_data', JSON.stringify({
      completions: { [todayStr]: { pushup: { isCompleted: true, count: 10 } } },
    }));
    await window.oneupDebug.resetExercises();
    const data = JSON.parse(prefsStore.get('pushup_challenge_data'));
    expect(data.completions[todayStr].pushup.isCompleted).toBe(false);
    expect(data.completions[todayStr].pushup.count).toBeUndefined();
  });

  it('resetExercises reads legacy localStorage data and writes back to Preferences', async () => {
    const todayStr = new Date().toLocaleDateString('sv-SE');
    localStorage.setItem('pushup_challenge_data', JSON.stringify({
      completions: { [todayStr]: { pushup: { isCompleted: true, count: 10 } } },
    }));
    await window.oneupDebug.resetExercises();
    const data = JSON.parse(prefsStore.get('pushup_challenge_data'));
    expect(data.completions[todayStr].pushup.isCompleted).toBe(false);
  });

  it('resetExercises is a no-op without stored data', async () => {
    await expect(window.oneupDebug.resetExercises()).resolves.toBeUndefined();
  });

  it('resetExercises handles malformed JSON', async () => {
    prefsStore.set('pushup_challenge_data', '{not json');
    await window.oneupDebug.resetExercises();
    expect(console.error).toHaveBeenCalled();
  });

  it('resetSettings and help do not throw', () => {
    expect(() => window.oneupDebug.resetSettings()).not.toThrow();
    expect(() => window.oneupDebug.help()).not.toThrow();
  });
});
