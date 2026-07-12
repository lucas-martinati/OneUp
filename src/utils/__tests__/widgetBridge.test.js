import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@utils/platform', () => ({ isAndroidPlatform: vi.fn(() => true) }));
vi.mock('../../i18n', () => ({
  default: { t: vi.fn((k, opts) => (opts?.returnObjects ? ['Mon'] : k)) },
}));

const refreshWidgets = vi.fn(() => Promise.resolve());
const registerPlugin = vi.fn(() => ({ refreshWidgets }));
vi.mock('@capacitor/core', () => ({ registerPlugin }));

const prefSet = vi.fn(() => Promise.resolve());
vi.mock('@capacitor/preferences', () => ({ Preferences: { set: prefSet } }));

import { isAndroidPlatform } from '@utils/platform';
import { updateWidgetData } from '@utils/widgetBridge';

beforeEach(() => {
  vi.clearAllMocks();
  isAndroidPlatform.mockReturnValue(true);
});

const stats = { displayStreak: 5, yesterdayStreak: 4, streakActive: true, todayDone: true };

describe('updateWidgetData', () => {
  it('returns early on non-android platforms', async () => {
    isAndroidPlatform.mockReturnValue(false);
    await updateWidgetData(stats, {});
    expect(prefSet).not.toHaveBeenCalled();
  });

  it('writes widget data and triggers a refresh on android', async () => {
    const today = new Date().toISOString().slice(0, 10);
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
});
