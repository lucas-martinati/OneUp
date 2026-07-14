import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const ho = vi.hoisted(() => ({
  native: false,
  loginConfig: null,
  googleLoginHandler: vi.fn(),
  prefStore: {},
  googleAuthApi: { initialize: vi.fn(), signIn: vi.fn(), signOut: vi.fn(() => Promise.resolve()) },
}));

vi.mock('@react-oauth/google', () => ({
  useGoogleLogin: (cfg) => { ho.loginConfig = cfg; return ho.googleLoginHandler; },
}));
vi.mock('@utils/platform', () => ({ isNativePlatform: () => ho.native }));
vi.mock('@utils/logger', () => ({ createLogger: () => ({ info: vi.fn(), success: vi.fn(), error: vi.fn(), warn: vi.fn() }) }));
vi.mock('@utils/preferences', () => ({
  Preferences: { get: vi.fn(({ key }) => Promise.resolve({ value: ho.prefStore[key] ?? null })) },
}));
vi.mock('@services/cloudSync', () => ({
  cloudSync: {
    ensureInitialized: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
    signInWithGoogle: vi.fn(() => Promise.resolve()),
    signInWithGoogleWeb: vi.fn(() => Promise.resolve()),
    signOut: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('@capacitor/core', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    registerPlugin: (name, config) => {
      if (name === 'GoogleAuth') return ho.googleAuthApi;
      return actual.registerPlugin(name, config);
    }
  };
});

vi.mock('@codetrix-studio/capacitor-google-auth', () => ({
  GoogleAuth: ho.googleAuthApi
}));

import { cloudSync } from '@services/cloudSync';
import { useGoogleAuth } from '../useGoogleAuth';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

beforeEach(() => {
  vi.clearAllMocks();

  ho.native = false;
  ho.prefStore = {};
  globalThis.fetch = vi.fn(() => Promise.resolve({ json: () => Promise.resolve({ email: 'a@b.c' }) }));
});

describe('mount / auth bootstrap', () => {
  it('resolves to a definitive signed-out state for new visitors', async () => {
    const { result } = renderHook(() => useGoogleAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isSignedIn).toBe(false);
    expect(result.current.authConfirmed).toBe(true);
    expect(cloudSync.subscribe).toHaveBeenCalled();
  });

  it('optimistically boots a previously signed-in user from cache', async () => {
    ho.prefStore = { user_signed_in: 'true', user_id: 'u1', user_profile: JSON.stringify({ displayName: 'Alice' }) };
    const { result } = renderHook(() => useGoogleAuth());
    await waitFor(() => expect(result.current.isSignedIn).toBe(true));
    expect(cloudSync.ensureInitialized).toHaveBeenCalled();
    expect(result.current.user).toMatchObject({ uid: 'u1', displayName: 'Alice' });
    expect(result.current.authConfirmed).toBe(false); // still waiting on Firebase
  });

  it('updates state when the cloudSync subscription fires', async () => {
    let emit;
    cloudSync.subscribe.mockImplementation((cb) => { emit = cb; return vi.fn(); });
    const { result } = renderHook(() => useGoogleAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => emit({ isSignedIn: true, user: { uid: 'live' } }));
    expect(result.current.isSignedIn).toBe(true);
    expect(result.current.authConfirmed).toBe(true);
  });
});

describe('web sign-in flow', () => {
  it('signs in via Firebase after GIS success', async () => {
    renderHook(() => useGoogleAuth());
    await act(async () => { await ho.loginConfig.onSuccess({ access_token: 'tok' }); });
    expect(globalThis.fetch).toHaveBeenCalled();
    expect(cloudSync.signInWithGoogleWeb).toHaveBeenCalledWith('tok', { email: 'a@b.c' });
  });

  it('records an error when GIS reports a failure', async () => {
    const { result } = renderHook(() => useGoogleAuth());
    act(() => ho.loginConfig.onError(new Error('denied')));
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.syncStatus).toBe('error');
  });

  it('records an error when the Firebase web sign-in throws', async () => {
    cloudSync.signInWithGoogleWeb.mockRejectedValueOnce(new Error('fb down'));
    const { result } = renderHook(() => useGoogleAuth());
    await act(async () => { await ho.loginConfig.onSuccess({ access_token: 'tok' }); });
    await waitFor(() => expect(result.current.error).toBe('fb down'));
  });

  it('signIn triggers firebase boot and the GIS handler', async () => {
    ho.googleLoginHandler = vi.fn();
    const { result } = renderHook(() => useGoogleAuth());
    await act(async () => { await result.current.signIn(); });
    expect(cloudSync.ensureInitialized).toHaveBeenCalled();
  });

  it('signIn logs error if webSignInHandler is not initialized on web', async () => {
    ho.googleLoginHandler = null;
    const { result } = renderHook(() => useGoogleAuth());
    await act(async () => { await result.current.signIn(); });
    expect(result.current.error).toBe('Web sign-in not available');
    expect(result.current.syncStatus).toBe('error');
    ho.googleLoginHandler = vi.fn();
  });
});

describe('sign-out (web path)', () => {
  it('signs out of Firebase and resets to a confirmed signed-out state', async () => {
    const { result } = renderHook(() => useGoogleAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.signOut(); });
    expect(cloudSync.signOut).toHaveBeenCalled();
    expect(result.current.isSignedIn).toBe(false);
    expect(result.current.authConfirmed).toBe(true);
  });

  it('records and rethrows sign-out errors', async () => {
    const { result } = renderHook(() => useGoogleAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    cloudSync.signOut.mockRejectedValueOnce(new Error('net'));
    let thrown;
    await act(async () => { await result.current.signOut().catch((e) => { thrown = e; }); });
    expect(thrown).toEqual(new Error('net'));
    expect(result.current.error).toBe('net');
  });
});

describe('native sign-in / sign-out', () => {
  it('signs in natively via Capacitor', async () => {
    ho.native = true;
    GoogleAuth.signIn.mockResolvedValue({ authentication: { idToken: 'nat_tok' }, email: 'nat@nat.com' });
    const { result } = renderHook(() => useGoogleAuth());
    await act(async () => { await result.current.signIn(); });
    expect(cloudSync.signInWithGoogle).toHaveBeenCalledWith('nat_tok');
  });

  it('handles native sign-in error', async () => {
    ho.native = true;
    GoogleAuth.signIn.mockRejectedValue(new Error('nat err'));
    const { result } = renderHook(() => useGoogleAuth());
    
    let thrown;
    await act(async () => { await result.current.signIn().catch(e => { thrown = e; }) });
    expect(thrown).toBeDefined();
    expect(result.current.error).toBe('nat err');
  });

  it('signs out natively', async () => {
    ho.native = true;
    const { result } = renderHook(() => useGoogleAuth());
    await act(async () => { await result.current.signOut(); });
    expect(GoogleAuth.signOut).toHaveBeenCalled();
    expect(cloudSync.signOut).toHaveBeenCalled();
  });
});

describe('updateSyncStatus', () => {
  it('updates the sync status field', async () => {
    const { result } = renderHook(() => useGoogleAuth());
    act(() => result.current.updateSyncStatus('synced'));
    expect(result.current.syncStatus).toBe('synced');
    expect(result.current.refresh()).toBeUndefined();
  });
});
