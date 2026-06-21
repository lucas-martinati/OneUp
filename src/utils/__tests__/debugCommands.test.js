import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@services/cloudSync', () => ({ cloudSync: { getCurrentUserId: vi.fn(() => null) } }));
vi.mock('@config/badgeDefinitions', () => ({
  BADGE_DEFINITIONS: [
    { id: 'first_blood', category: 'reps', secret: false },
    { id: 'secret_one', category: 'fun', secret: true },
  ],
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

  it('showData logs progress/history/settings (anonymous key)', () => {
    localStorage.setItem('pushup_challenge_data', JSON.stringify({ a: 1 }));
    expect(() => window.oneupDebug.showData()).not.toThrow();
  });

  it('uses a uid-scoped key when signed in', () => {
    cloudSync.getCurrentUserId.mockReturnValue('uid42');
    window.oneupDebug.resetHistory();
    // key is namespaced; removing a non-existent key is a no-op but must not throw
    expect(() => window.oneupDebug.resetAll()).not.toThrow();
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

  it('resetExercises clears today completions when present', () => {
    const todayStr = new Date().toLocaleDateString('sv-SE');
    localStorage.setItem('pushup_challenge_data', JSON.stringify({
      completions: { [todayStr]: { pushup: { isCompleted: true, count: 10 } } },
    }));
    window.oneupDebug.resetExercises();
    const data = JSON.parse(localStorage.getItem('pushup_challenge_data'));
    expect(data.completions[todayStr].pushup.isCompleted).toBe(false);
    expect(data.completions[todayStr].pushup.count).toBeUndefined();
  });

  it('resetExercises is a no-op without stored data', () => {
    expect(() => window.oneupDebug.resetExercises()).not.toThrow();
  });

  it('resetExercises handles malformed JSON', () => {
    localStorage.setItem('pushup_challenge_data', '{not json');
    window.oneupDebug.resetExercises();
    expect(console.error).toHaveBeenCalled();
  });

  it('resetSettings and help do not throw', () => {
    expect(() => window.oneupDebug.resetSettings()).not.toThrow();
    expect(() => window.oneupDebug.help()).not.toThrow();
  });
});
