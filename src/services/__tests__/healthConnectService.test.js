import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoisted so they exist when the singleton's constructor runs init() at import time.
const { platform, prefStore, health } = vi.hoisted(() => ({
  platform: { native: true },
  prefStore: {},
  health: {
    isHealthAvailable: vi.fn(() => Promise.resolve({ available: true })),
    // Android plugin returns a permission map object, not an array.
    checkHealthPermissions: vi.fn(() => Promise.resolve({ permissions: { READ_WORKOUTS: true, READ_DISTANCE: true, READ_ROUTE: true } })),
    requestHealthPermissions: vi.fn(() => Promise.resolve({ permissions: { READ_WORKOUTS: true, READ_DISTANCE: true, READ_ROUTE: true } })),
    queryWorkouts: vi.fn(() => Promise.resolve({ workouts: [] })),
    showHealthConnectInPlayStore: vi.fn(() => Promise.resolve()),
  },
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
vi.mock('capacitor-health', () => ({ Health: health }));
vi.mock('@utils/logger', () => ({
  createLogger: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() }),
}));

import { healthConnectService } from '../healthConnectService';

beforeEach(() => {
  vi.clearAllMocks();
  for (const k of Object.keys(prefStore)) delete prefStore[k];
  platform.native = true;
  healthConnectService.enabled = false;
  health.isHealthAvailable.mockResolvedValue({ available: true });
  health.checkHealthPermissions.mockResolvedValue({ permissions: { READ_WORKOUTS: true } });
  health.requestHealthPermissions.mockResolvedValue({ permissions: { READ_WORKOUTS: true } });
  health.queryWorkouts.mockResolvedValue({ workouts: [] });
});

describe('isAvailable', () => {
  it('is false on web', async () => {
    platform.native = false;
    expect(await healthConnectService.isAvailable()).toBe(false);
  });
  it('reflects the plugin availability on native', async () => {
    health.isHealthAvailable.mockResolvedValue({ available: false });
    expect(await healthConnectService.isAvailable()).toBe(false);
  });
});

describe('connect', () => {
  it('enables the source and dispatches an event when permission is granted', async () => {
    const spy = vi.fn();
    window.addEventListener('cardio-source-connected', spy);
    expect(await healthConnectService.connect()).toBe(true);
    expect(healthConnectService.enabled).toBe(true);
    expect(prefStore.health_connect_enabled).toBe('true');
    expect(spy).toHaveBeenCalled();
    window.removeEventListener('cardio-source-connected', spy);
  });

  it('does not enable when permission is denied', async () => {
    health.requestHealthPermissions.mockResolvedValue({ permissions: { READ_WORKOUTS: false } });
    expect(await healthConnectService.connect()).toBe(false);
    expect(healthConnectService.enabled).toBe(false);
  });

  it('accepts the array-of-objects permission shape (TS-typed fallback)', async () => {
    health.requestHealthPermissions.mockResolvedValue({ permissions: [{ READ_WORKOUTS: true }] });
    expect(await healthConnectService.connect()).toBe(true);
  });

  it('opens the Play Store when Health Connect is unavailable', async () => {
    health.isHealthAvailable.mockResolvedValue({ available: false });
    expect(await healthConnectService.connect()).toBe(false);
    expect(health.showHealthConnectInPlayStore).toHaveBeenCalled();
  });
});

describe('isAuthenticated', () => {
  it('is false while disabled even if permission is granted', async () => {
    healthConnectService.enabled = false;
    expect(await healthConnectService.isAuthenticated()).toBe(false);
    expect(health.checkHealthPermissions).not.toHaveBeenCalled();
  });
  it('is true when enabled and permission granted', async () => {
    healthConnectService.enabled = true;
    expect(await healthConnectService.isAuthenticated()).toBe(true);
  });
  it('is false when enabled but permission revoked at OS level', async () => {
    healthConnectService.enabled = true;
    health.checkHealthPermissions.mockResolvedValue({ permissions: { READ_WORKOUTS: false } });
    expect(await healthConnectService.isAuthenticated()).toBe(false);
  });
});

describe('getActivities', () => {
  it('returns [] when not authenticated', async () => {
    healthConnectService.enabled = false;
    expect(await healthConnectService.getActivities()).toEqual([]);
    expect(health.queryWorkouts).not.toHaveBeenCalled();
  });

  it('maps running/cycling workouts with route, derives duration, and filters others', async () => {
    healthConnectService.enabled = true;
    health.queryWorkouts.mockResolvedValue({
      workouts: [
        {
          id: 'uuid-1', workoutType: 'RUNNING',
          startDate: '2024-01-01T00:00:00Z', endDate: '2024-01-01T00:25:00Z',
          distance: 5000, calories: 300, sourceName: 'Watch',
          route: [{ timestamp: 't', lat: 48.86, lng: 2.33 }, { timestamp: 't2', lat: 48.87, lng: 2.34 }],
        },
        {
          id: 'uuid-2', workoutType: 'BIKING',
          startDate: '2024-01-02T00:00:00Z', endDate: '2024-01-02T01:00:00Z',
          distance: 20000, calories: 500, route: [],
        },
        {
          id: 'uuid-3', workoutType: 'SWIMMING_POOL',
          startDate: '2024-01-03T00:00:00Z', endDate: '2024-01-03T00:30:00Z',
          distance: 1000, calories: 200,
        },
      ],
    });

    const acts = await healthConnectService.getActivities(1700000000000);
    expect(acts).toHaveLength(2);

    expect(acts[0]).toMatchObject({ id: 'hc_uuid-1', source: 'health_connect', type: 'running', distance: 5000 });
    expect(acts[0].duration).toBe(1500); // 25 minutes
    expect(acts[0].gpsTrack).toEqual([{ lat: 48.86, lng: 2.33 }, { lat: 48.87, lng: 2.34 }]);
    expect(acts[0].averageSpeed).toBeCloseTo(5000 / 1500);

    expect(acts[1]).toMatchObject({ id: 'hc_uuid-2', type: 'cycling' });
    expect(acts[1].gpsTrack).toBeNull();

    // queried window starts at the provided timestamp
    const req = health.queryWorkouts.mock.calls[0][0];
    expect(req.startDate).toBe(new Date(1700000000000).toISOString());
    expect(req.includeRoute).toBe(true);
  });

  it('falls back to start time for the id when the workout has none', async () => {
    healthConnectService.enabled = true;
    const start = '2024-05-01T10:00:00Z';
    health.queryWorkouts.mockResolvedValue({
      workouts: [{ workoutType: 'RUNNING', startDate: start, endDate: '2024-05-01T10:30:00Z', distance: 3000, calories: 1 }],
    });
    const acts = await healthConnectService.getActivities();
    expect(acts[0].id).toBe(`hc_${new Date(start).getTime()}`);
  });

  it('returns [] on a query error', async () => {
    healthConnectService.enabled = true;
    health.queryWorkouts.mockRejectedValue(new Error('boom'));
    expect(await healthConnectService.getActivities()).toEqual([]);
  });
});

describe('disconnect', () => {
  it('disables the source and persists the flag', async () => {
    healthConnectService.enabled = true;
    await healthConnectService.disconnect();
    expect(healthConnectService.enabled).toBe(false);
    expect(prefStore.health_connect_enabled).toBe('false');
  });
});
