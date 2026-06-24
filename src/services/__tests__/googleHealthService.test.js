import { describe, it, expect, vi, beforeEach } from 'vitest';

const { platform, prefStore } = vi.hoisted(() => ({
  platform: { native: false },
  prefStore: {},
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => platform.native },
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

import { googleHealthService } from '../googleHealthService';

const futureToken = { access_token: 'a', refresh_token: 'r', expires_at: Date.now() / 1000 + 3600 };

beforeEach(() => {
  vi.clearAllMocks();
  for (const k of Object.keys(prefStore)) delete prefStore[k];
  googleHealthService.token = null;
  platform.native = false;
  globalThis.fetch = vi.fn();
});

describe('isAvailable', () => {
  it('is false on native regardless of client id', () => {
    platform.native = true;
    expect(googleHealthService.isAvailable()).toBe(false);
  });
});

describe('isAuthenticated', () => {
  it('is false without a token', async () => {
    expect(await googleHealthService.isAuthenticated()).toBe(false);
  });
  it('is true with a non-expired token', async () => {
    googleHealthService.token = futureToken;
    expect(await googleHealthService.isAuthenticated()).toBe(true);
  });
  it('refreshes an expired token and keeps the existing refresh_token', async () => {
    googleHealthService.token = { ...futureToken, expires_at: Date.now() / 1000 - 10 };
    // Google refresh responses usually omit refresh_token.
    globalThis.fetch.mockResolvedValue({ json: () => Promise.resolve({ access_token: 'new', expires_in: 3600 }) });
    expect(await googleHealthService.isAuthenticated()).toBe(true);
    expect(googleHealthService.token.access_token).toBe('new');
    expect(googleHealthService.token.refresh_token).toBe('r');
    expect(globalThis.fetch.mock.calls[0][0]).toContain('/googleHealthRefreshToken');
    const body = JSON.parse(globalThis.fetch.mock.calls[0][1].body);
    expect(body).toEqual({ refresh_token: 'r' });
  });
});

describe('exchangeToken', () => {
  it('stores the token (with derived expires_at) and dispatches the shared event', async () => {
    const spy = vi.fn();
    window.addEventListener('cardio-source-connected', spy);
    globalThis.fetch.mockResolvedValue({ json: () => Promise.resolve({ access_token: 'x', refresh_token: 'y', expires_in: 3600 }) });
    await googleHealthService.exchangeToken('code123');
    expect(googleHealthService.token.access_token).toBe('x');
    expect(googleHealthService.token.expires_at).toBeGreaterThan(Date.now() / 1000);
    expect(prefStore.google_health_token).toContain('x');
    expect(spy).toHaveBeenCalled();
    expect(globalThis.fetch.mock.calls[0][0]).toContain('/googleHealthExchangeToken');
    const body = JSON.parse(globalThis.fetch.mock.calls[0][1].body);
    expect(body.code).toBe('code123');
    expect(body).toHaveProperty('redirect_uri');
    expect(body).not.toHaveProperty('client_secret');
    window.removeEventListener('cardio-source-connected', spy);
  });
});

describe('getActivities', () => {
  it('returns [] when not authenticated', async () => {
    expect(await googleHealthService.getActivities()).toEqual([]);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('maps exercise dataPoints (mm→m, "900s"→s) and filters out others', async () => {
    googleHealthService.token = futureToken;
    globalThis.fetch.mockResolvedValue({
      json: () => Promise.resolve({
        dataPoints: [
          {
            name: 'users/me/dataTypes/exercise/dataPoints/abc',
            exercise: {
              interval: { startTime: '2024-01-01T08:00:00Z', endTime: '2024-01-01T08:25:00Z' },
              exerciseType: 'RUNNING',
              metricsSummary: { distanceMillimiters: 5000000, caloriesKcal: 300 },
              displayName: 'Morning Run',
              activeDuration: '1500s',
            },
          },
          {
            name: 'users/me/dataTypes/exercise/dataPoints/def',
            exercise: {
              interval: { startTime: '2024-01-02T08:00:00Z', endTime: '2024-01-02T09:00:00Z' },
              exerciseType: 'BIKING',
              metricsSummary: { distanceMillimeters: 20000000 },
              displayName: 'Ride',
              activeDuration: '3600s',
            },
          },
          {
            name: 'users/me/dataTypes/exercise/dataPoints/ghi',
            exercise: {
              interval: { startTime: '2024-01-03T08:00:00Z', endTime: '2024-01-03T08:30:00Z' },
              exerciseType: 'SWIMMING',
              metricsSummary: { distanceMillimiters: 1000000 },
            },
          },
        ],
      }),
    });

    const acts = await googleHealthService.getActivities(1700000000000);
    expect(acts).toHaveLength(2);
    expect(acts[0]).toMatchObject({ id: 'gh_abc', source: 'google_health', type: 'running', distance: 5000, duration: 1500 });
    expect(acts[0].averageSpeed).toBeCloseTo(5000 / 1500);
    expect(acts[0].gpsTrack).toBeNull();
    expect(acts[1]).toMatchObject({ id: 'gh_def', type: 'cycling', distance: 20000, duration: 3600 });
    // queried with a startTime filter
    expect(decodeURIComponent(globalThis.fetch.mock.calls[0][0])).toContain('startTime >=');
  });

  it('returns [] on a fetch error', async () => {
    googleHealthService.token = futureToken;
    globalThis.fetch.mockRejectedValue(new Error('boom'));
    expect(await googleHealthService.getActivities()).toEqual([]);
  });
});

describe('disconnect', () => {
  it('clears the token and stored preference', async () => {
    googleHealthService.token = futureToken;
    prefStore.google_health_token = 'x';
    await googleHealthService.disconnect();
    expect(googleHealthService.token).toBeNull();
    expect(prefStore.google_health_token).toBeUndefined();
  });
});
