import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({ name: 'app' })) }));
vi.mock('firebase/auth', () => ({ getAuth: vi.fn(() => ({ name: 'auth' })) }));
vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(() => ({ name: 'db' })),
  serverTimestamp: vi.fn(() => 'TS'),
}));
vi.mock('@utils/firebaseTimestamp', () => ({ setServerTimestampFn: vi.fn() }));

import { initializeApp } from 'firebase/app';

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});
afterEach(() => vi.unstubAllEnvs());

describe('firebase service', () => {
  it('skips initialization when the api key is missing', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', '');
    const mod = await import('../firebase');
    mod.initializeFirebase();
    expect(initializeApp).not.toHaveBeenCalled();
    expect(mod.getAuthInstance()).toBeUndefined();
    expect(mod.getDatabaseInstance()).toBeUndefined();
  });

  it('initializes once and exposes the auth + database instances', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'key-123');
    const mod = await import('../firebase');
    mod.initializeFirebase();
    mod.initializeFirebase(); // idempotent
    expect(initializeApp).toHaveBeenCalledTimes(1);
    expect(mod.getAuthInstance()).toEqual({ name: 'auth' });
    expect(mod.getDatabaseInstance()).toEqual({ name: 'db' });
  });

  it('swallows initialization errors', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'key-123');
    initializeApp.mockImplementationOnce(() => { throw new Error('boom'); });
    const mod = await import('../firebase');
    expect(() => mod.initializeFirebase()).not.toThrow();
    expect(mod.getAuthInstance()).toBeUndefined();
  });
});
