import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@utils/platform', () => ({ isNativePlatform: vi.fn(() => false) }));

const nativePrefs = { get: vi.fn(() => Promise.resolve({ value: 'native' })), set: vi.fn(() => Promise.resolve()), remove: vi.fn(() => Promise.resolve()) };
vi.mock('@capacitor/preferences', () => ({ Preferences: nativePrefs }));

import { isNativePlatform } from '@utils/platform';
import { Preferences } from '@utils/preferences';

beforeEach(() => {
  vi.clearAllMocks();
  isNativePlatform.mockReturnValue(false);
  window.localStorage.clear();
});
afterEach(() => window.localStorage.clear());

describe('Preferences (web)', () => {
  it('round-trips through localStorage with the Capacitor prefix', async () => {
    await Preferences.set({ key: 'foo', value: 'bar' });
    expect(window.localStorage.getItem('CapacitorStorage.foo')).toBe('bar');
    expect(await Preferences.get({ key: 'foo' })).toEqual({ value: 'bar' });
  });

  it('returns null for a missing key', async () => {
    expect(await Preferences.get({ key: 'nope' })).toEqual({ value: null });
  });

  it('removes a key', async () => {
    await Preferences.set({ key: 'foo', value: 'bar' });
    await Preferences.remove({ key: 'foo' });
    expect(await Preferences.get({ key: 'foo' })).toEqual({ value: null });
  });
});

describe('Preferences (native)', () => {
  beforeEach(() => isNativePlatform.mockReturnValue(true));

  it('delegates get/set/remove to the native plugin', async () => {
    await Preferences.set({ key: 'k', value: 'v' });
    expect(nativePrefs.set).toHaveBeenCalledWith({ key: 'k', value: 'v' });
    await Preferences.get({ key: 'k' });
    expect(nativePrefs.get).toHaveBeenCalledWith({ key: 'k' });
    await Preferences.remove({ key: 'k' });
    expect(nativePrefs.remove).toHaveBeenCalledWith({ key: 'k' });
  });
});
