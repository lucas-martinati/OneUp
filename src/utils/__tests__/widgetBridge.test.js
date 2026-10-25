import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@utils/platform', () => ({ isAndroidPlatform: vi.fn(() => true) }));
vi.mock('../../i18n', () => ({
  default: { t: vi.fn((k, opts) => (opts?.returnObjects ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : k)) },
}));

const refreshWidgets = vi.fn(() => Promise.resolve());
const registerPlugin = vi.fn(() => ({ refreshWidgets }));
vi.mock('@capacitor/core', () => ({ registerPlugin }));

const prefSet = vi.fn(() => Promise.resolve());
vi.mock('@capacitor/preferences', () => ({ Preferences: { set: prefSet } }));

import { isAndroidPlatform } from '@utils/platform';
import { getLocalDateStr } from '@shared/dateUtils';
import i18n from '../../i18n';
let updateWidgetData;

beforeEach(async () => {
  vi.resetModules();
  ({ updateWidgetData } = await import('@utils/widgetBridge'));
  vi.clearAllMocks();
  isAndroidPlatform.mockReturnValue(true);
});

afterEach(() => { vi.useRealTimers(); });

const stats = { displayStreak: 5, yesterdayStreak: 4, streakActive: true, todayDone: true };

describe('updateWidgetData', () => {
  it('returns early on non-android platforms', async () => {
    isAndroidPlatform.mockReturnValue(false);
    await updateWidgetData(stats, {});
    expect(prefSet).not.toHaveBeenCalled();
  });

  it('writes widget data and triggers a refresh on android', async () => {
    const today = getLocalDateStr(new Date());
    await updateWidgetData(stats, { [today]: { pushup: { isCompleted: true } } });
    expect(registerPlugin).toHaveBeenCalledWith('WidgetBridge');
    expect(prefSet).toHaveBeenCalledWith(expect.objectContaining({ key: 'widget_data' }));
    const payload = JSON.parse(prefSet.mock.calls[0][0].value);
    expect(payload.streak).toBe(5);
    expect(payload.weekDays).toHaveLength(7);
    expect(payload.weekDays.some(Boolean)).toBe(true);
    expect(refreshWidgets).toHaveBeenCalled();
  });

  it('falls back to yesterdayStreak when displayStreak is 0', async () => {
    await updateWidgetData({ displayStreak: 0, yesterdayStreak: 3 }, {});
    const payload = JSON.parse(prefSet.mock.calls[0][0].value);
    expect(payload.streak).toBe(3);
  });

  it('swallows errors silently', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    prefSet.mockRejectedValueOnce(new Error('boom'));
    await expect(updateWidgetData(stats, {})).resolves.toBeUndefined();
    console.warn.mockRestore();
  });

  it('includes streakFrozen in the payload', async () => {
    await updateWidgetData({ ...stats, streakFrozen: true }, {});
    const payload = JSON.parse(prefSet.mock.calls[0][0].value);
    expect(payload.streakFrozen).toBe(true);
  });
  it('exports the streak level separately from its translated label', async () => {
    await updateWidgetData({ ...stats, streakLevel: 7 }, {});
    const payload = JSON.parse(prefSet.mock.calls[0][0].value);
    expect(payload.streakLevel).toBe(7);
    expect(payload.levelLabel).toBe('levels.short');
    expect(payload.streakLabel).toBe('widgets.streak');
    expect(payload.weekLevelLabels).toHaveLength(11);
  });

  it('keeps partial levels, legacy completions, frozen days and future days distinct', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 22, 12)); // Thursday
    await updateWidgetData(stats, {
      '2026-10-19': { pushups: { level: 3 } },
      '2026-10-20': { pushups: { isCompleted: true } },
      '2026-10-22': { pushups: { level: 7 }, squats: { level: 5 } },
      '2026-10-23': { pushups: { level: 10 } },
    }, { '2026-10-21': { consumedAt: 1 } });
    const payload = JSON.parse(prefSet.mock.calls[0][0].value);
    expect(payload.weekDays).toEqual([1, 1, 2, 1, 0, 0, 0]);
    expect(payload.weekLevels).toEqual([3, 10, 0, 7, 0, 0, 0]);
  });

  it('carries weekly cardio levels only through today', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 22, 12));
    await updateWidgetData(stats, { '2026-10-20': { running: { level: 4 } } });
    const payload = JSON.parse(prefSet.mock.calls[0][0].value);
    expect(payload.weekLevels).toEqual([0, 4, 4, 4, 0, 0, 0]);
  });

  it('aligns levels and indexes with a Sunday-start week', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 25, 12));
    await updateWidgetData(stats, {
      '2026-10-24': { running: { level: 10 } },
      '2026-10-25': { pushups: { level: 2 } },
    }, {}, 'sunday');
    const payload = JSON.parse(prefSet.mock.calls[0][0].value);
    expect(payload.weekStartDay).toBe('sunday');
    expect(payload.todayIndex).toBe(0);
    expect(payload.weekdayLabels).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    expect(payload.weekLevels).toEqual([2, 0, 0, 0, 0, 0, 0]);
  });

  it('skips identical visible content even when timestamps and other stats change', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 22, 12));
    await updateWidgetData(stats, {});
    vi.setSystemTime(new Date(2026, 9, 22, 13));
    await updateWidgetData({ ...stats, globalTotalReps: 100 }, {});
    expect(prefSet).toHaveBeenCalledTimes(1);
    expect(refreshWidgets).toHaveBeenCalledTimes(1);
  });

  it('deduplicates overlapping identical updates', async () => {
    await Promise.all([updateWidgetData(stats, {}), updateWidgetData(stats, {}), updateWidgetData(stats, {})]);
    expect(prefSet).toHaveBeenCalledTimes(1);
    expect(refreshWidgets).toHaveBeenCalledTimes(1);
  });

  it('serializes distinct updates in order', async () => {
    await Promise.all([updateWidgetData(stats, {}), updateWidgetData({ ...stats, displayStreak: 6 }, {})]);
    expect(prefSet.mock.calls.map(([call]) => JSON.parse(call.value).streak)).toEqual([5, 6]);
    expect(refreshWidgets).toHaveBeenCalledTimes(2);
  });

  it('retries an identical payload when the previous native refresh failed', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    refreshWidgets.mockRejectedValueOnce(new Error('refresh failed'));
    await updateWidgetData(stats, {});
    await updateWidgetData(stats, {});
    expect(prefSet).toHaveBeenCalledTimes(2);
    expect(refreshWidgets).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it('retries an identical payload when writing failed', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    prefSet.mockRejectedValueOnce(new Error('write failed'));
    await updateWidgetData(stats, {});
    await updateWidgetData(stats, {});
    expect(prefSet).toHaveBeenCalledTimes(2);
    expect(refreshWidgets).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('refreshes on a seven-day rollover even with identical visible data', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 22, 12));
    await updateWidgetData(stats, {});
    vi.setSystemTime(new Date(2026, 9, 29, 12));
    await updateWidgetData(stats, {});
    expect(prefSet).toHaveBeenCalledTimes(2);
    expect(JSON.parse(prefSet.mock.calls[1][0].value).updatedAt).toBe(Date.now());
  });

  it('refreshes when translations change', async () => {
    await updateWidgetData(stats, {});
    i18n.t.mockReturnValueOnce('Niveau');
    await updateWidgetData(stats, {});
    expect(prefSet).toHaveBeenCalledTimes(2);
  });

  it('refreshes when a daily level changes without changing the streak', async () => {
    const today = getLocalDateStr(new Date());
    await updateWidgetData(stats, { [today]: { pushups: { level: 3 } } });
    await updateWidgetData(stats, { [today]: { pushups: { level: 4 } } });
    expect(prefSet).toHaveBeenCalledTimes(2);
  });

  it('restores the prior payload after a different payload partially failed', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await updateWidgetData(stats, {});
    refreshWidgets.mockRejectedValueOnce(new Error('refresh failed'));
    await updateWidgetData({ ...stats, displayStreak: 6 }, {});
    await updateWidgetData(stats, {});
    expect(prefSet.mock.calls.map(([call]) => JSON.parse(call.value).streak)).toEqual([5, 6, 5]);
    warn.mockRestore();
  });

  it('refreshes when the timezone offset changes on the same local date', async () => {
    await updateWidgetData(stats, {});
    const offset = new Date().getTimezoneOffset();
    const timezone = vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(offset + 60);
    try {
      await updateWidgetData(stats, {});
      expect(prefSet).toHaveBeenCalledTimes(2);
    } finally {
      timezone.mockRestore();
    }
  });

  it('initializes the bridge before writing and retries if initialization throws', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    registerPlugin.mockImplementationOnce(() => { throw new Error('initialization failed'); });
    await updateWidgetData(stats, {});
    expect(prefSet).not.toHaveBeenCalled();
    expect(refreshWidgets).not.toHaveBeenCalled();
    await updateWidgetData(stats, {});
    expect(registerPlugin).toHaveBeenCalledTimes(2);
    expect(prefSet).toHaveBeenCalledTimes(1);
    expect(refreshWidgets).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

});
