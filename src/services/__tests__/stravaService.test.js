import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoisted so they exist when the singleton's constructor runs init() at import
// time (which calls the mocked Preferences/Capacitor before module-level
// `const` declarations would otherwise be initialized).
const { platform, prefStore } = vi.hoisted(() => ({
  platform: { current: 'web', native: false },
  prefStore: {},
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: () => platform.current,
    isNativePlatform: () => platform.native,
  },
}));
vi.mock('@capacitor/browser', () => ({
  Browser: { open: vi.fn(() => Promise.resolve()), close: vi.fn(() => Promise.resolve()) },
}));
vi.mock('@capacitor/app', () => ({
  App: { addListener: vi.fn() },
}));
vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn(({ key }) => Promise.resolve({ value: prefStore[key] ?? null })),
    set: vi.fn(({ key, value }) => { prefStore[key] = value; return Promise.resolve(); }),
    remove: vi.fn(({ key }) => { delete prefStore[key]; return Promise.resolve(); }),
  },
}));
vi.mock('@utils/logger', () => ({
  createLogger: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() }),
}));

import { Browser } from '@capacitor/browser';
import { stravaService } from '../stravaService';

const futureToken = { access_token: 'a', refresh_token: 'r', expires_at: Date.now() / 1000 + 3600 };

beforeEach(() => {
  vi.clearAllMocks();
  for (const k of Object.keys(prefStore)) delete prefStore[k];
  stravaService.token = null;
  platform.current = 'web';
  platform.native = false;
  globalThis.fetch = vi.fn();
});

describe('isAuthenticated', () => {
  it('is false without a token', async () => {
    expect(await stravaService.isAuthenticated()).toBe(false);
  });

  it('is true with a non-expired token', async () => {
    stravaService.token = futureToken;
    expect(await stravaService.isAuthenticated()).toBe(true);
  });

  it('refreshes an expired token', async () => {
    stravaService.token = { ...futureToken, expires_at: Date.now() / 1000 - 10 };
    globalThis.fetch.mockResolvedValue({ json: () => Promise.resolve({ access_token: 'new', expires_at: Date.now() / 1000 + 3600 }) });
    expect(await stravaService.isAuthenticated()).toBe(true);
    expect(stravaService.token.access_token).toBe('new');
  });
});

describe('exchangeToken', () => {
  it('stores the token and dispatches an event on success', async () => {
    const spy = vi.fn();
    window.addEventListener('strava-connected', spy);
    globalThis.fetch.mockResolvedValue({ json: () => Promise.resolve({ access_token: 'x', expires_at: 1 }) });
    await stravaService.exchangeToken('code123');
    expect(stravaService.token.access_token).toBe('x');
    expect(prefStore.strava_token).toContain('x');
    expect(spy).toHaveBeenCalled();
    window.removeEventListener('strava-connected', spy);
  });

  it('does not store anything when the response has no access_token', async () => {
    globalThis.fetch.mockResolvedValue({ json: () => Promise.resolve({ errors: ['bad'] }) });
    await stravaService.exchangeToken('code');
    expect(stravaService.token).toBeNull();
  });

  it('swallows network errors', async () => {
    globalThis.fetch.mockRejectedValue(new Error('network'));
    await expect(stravaService.exchangeToken('c')).resolves.toBeUndefined();
  });
});

describe('refreshToken', () => {
  it('returns false without a refresh_token', async () => {
    stravaService.token = { access_token: 'a' };
    expect(await stravaService.refreshToken()).toBe(false);
  });

  it('returns true and merges the new token on success', async () => {
    stravaService.token = { refresh_token: 'r', access_token: 'old' };
    globalThis.fetch.mockResolvedValue({ json: () => Promise.resolve({ access_token: 'fresh' }) });
    expect(await stravaService.refreshToken()).toBe(true);
    expect(stravaService.token.access_token).toBe('fresh');
    expect(stravaService.token.refresh_token).toBe('r');
  });

  it('returns false on a failed refresh response', async () => {
    stravaService.token = { refresh_token: 'r' };
    globalThis.fetch.mockResolvedValue({ json: () => Promise.resolve({}) });
    expect(await stravaService.refreshToken()).toBe(false);
  });
});

describe('getActivities', () => {
  it('returns [] when not authenticated', async () => {
    expect(await stravaService.getActivities()).toEqual([]);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('maps Run/Ride activities, decodes polylines and filters out others', async () => {
    stravaService.token = futureToken;
    // "_p~iF~ps|U" decodes to a known coordinate (~38.5, -120.2)
    globalThis.fetch.mockResolvedValue({
      json: () => Promise.resolve([
        { id: 1, type: 'Run', distance: 5000, moving_time: 1500, start_date: '2024-01-01T00:00:00Z', name: 'Morning Run', map: { summary_polyline: '_p~iF~ps|U' }, total_elevation_gain: 10, average_speed: 3 },
        { id: 2, type: 'Ride', distance: 20000, moving_time: 3600, start_date: '2024-01-02T00:00:00Z', name: 'Ride', map: {} },
        { id: 3, type: 'Swim', distance: 1000, moving_time: 600, start_date: '2024-01-03T00:00:00Z', name: 'Swim', map: {} },
      ]),
    });
    const acts = await stravaService.getActivities(1700000000000);
    expect(acts).toHaveLength(2);
    expect(acts[0]).toMatchObject({ id: 'strava_1', source: 'strava', type: 'running' });
    expect(acts[0].gpsTrack[0]).toHaveProperty('lat');
    expect(acts[1].type).toBe('cycling');
    expect(acts[1].gpsTrack).toBeNull();
    // the `after` filter is included when a timestamp is given
    expect(globalThis.fetch.mock.calls[0][0]).toContain('after=');
  });

  it('returns [] on a fetch error', async () => {
    stravaService.token = futureToken;
    globalThis.fetch.mockRejectedValue(new Error('boom'));
    expect(await stravaService.getActivities()).toEqual([]);
  });
});

describe('connect / disconnect / handleCallback', () => {
  it('navigates the window on web connect', async () => {
    const assign = vi.fn();
    const original = window.location;
    delete window.location;
    window.location = { assign, origin: 'https://x.test', pathname: '/', search: '' };
    await stravaService.connect();
    expect(assign).toHaveBeenCalledWith(expect.stringContaining('strava.com/oauth'));
    window.location = original;
  });

  it('opens an in-app browser on native connect', async () => {
    platform.current = 'android';
    await stravaService.connect();
    expect(Browser.open).toHaveBeenCalledWith(expect.objectContaining({ url: expect.stringContaining('strava.com') }));
  });

  it('disconnect clears the token and stored preference', async () => {
    stravaService.token = futureToken;
    prefStore.strava_token = 'x';
    await stravaService.disconnect();
    expect(stravaService.token).toBeNull();
    expect(prefStore.strava_token).toBeUndefined();
  });

  it('handleCallback exchanges the code embedded in the deep link', async () => {
    const spy = vi.spyOn(stravaService, 'exchangeToken').mockResolvedValue();
    await stravaService.handleCallback('com.app://host/strava-auth?code=abc&state=1');
    expect(Browser.close).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith('abc');
    spy.mockRestore();
  });
});
