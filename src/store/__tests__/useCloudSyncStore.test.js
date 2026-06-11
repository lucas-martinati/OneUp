import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../services/cloudSync', () => ({
  cloudSync: {
    getUserClans: vi.fn(async () => []),
  },
}));

import { cloudSync } from '../../services/cloudSync';
import { useCloudSyncStore } from '../useCloudSyncStore';

const makeDeps = (overrides = {}) => ({
  loadFromCloud: vi.fn(async () => ({ success: true })),
  syncWithCloud: vi.fn(async () => ({ success: true })),
  hasGuestData: vi.fn(async () => false),
  clearAnonymousData: vi.fn(async () => {}),
  mergeWithAnonymousData: vi.fn(async () => ({ success: true })),
  updateSettings: vi.fn(),
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  useCloudSyncStore.getState().resetSyncState();
});

// ── Flags ───────────────────────────────────────────────────────────────

describe('sync flags', () => {
  it('pause/resume toggles isSyncPaused', () => {
    useCloudSyncStore.getState().pauseCloudSync();
    expect(useCloudSyncStore.getState().isSyncPaused).toBe(true);
    useCloudSyncStore.getState().resumeCloudSync();
    expect(useCloudSyncStore.getState().isSyncPaused).toBe(false);
  });

  it('resetSyncState clears everything (sign-out)', () => {
    useCloudSyncStore.setState({
      conflictData: { foo: 1 },
      conflictCheckDone: true,
      isInitialSyncDone: true,
      isSyncPaused: true,
      syncError: 'err',
      userClans: [{ id: 'c1' }],
    });
    useCloudSyncStore.getState().resetSyncState();
    const s = useCloudSyncStore.getState();
    expect(s.conflictData).toBe(null);
    expect(s.conflictCheckDone).toBe(false);
    expect(s.isInitialSyncDone).toBe(false);
    expect(s.isSyncPaused).toBe(false);
    expect(s.syncError).toBe(null);
    expect(s.userClans).toEqual([]);
  });
});

// ── Clans ───────────────────────────────────────────────────────────────

describe('refreshUserClans', () => {
  it('stores the fetched clans', async () => {
    cloudSync.getUserClans.mockResolvedValueOnce([{ id: 'clan1' }]);
    const clans = await useCloudSyncStore.getState().refreshUserClans();
    expect(clans).toEqual([{ id: 'clan1' }]);
    expect(useCloudSyncStore.getState().userClans).toEqual([{ id: 'clan1' }]);
  });

  it('returns [] and keeps state on failure', async () => {
    cloudSync.getUserClans.mockRejectedValueOnce(new Error('network'));
    const clans = await useCloudSyncStore.getState().refreshUserClans();
    expect(clans).toEqual([]);
  });
});

// ── Conflict resolution ─────────────────────────────────────────────────

describe("onResolveConflict('restore') — keep the cloud", () => {
  it('without guest data: just reloads from the cloud', async () => {
    const deps = makeDeps();
    useCloudSyncStore.setState({ conflictData: { some: 'conflict' } });

    await useCloudSyncStore.getState().onResolveConflict('restore', deps);

    expect(deps.clearAnonymousData).not.toHaveBeenCalled();
    expect(deps.loadFromCloud).toHaveBeenCalled();
    expect(useCloudSyncStore.getState().conflictData).toBe(null);
    expect(useCloudSyncStore.getState().conflictCheckDone).toBe(true);
  });

  it('with guest data: wipes guest data and local guest settings first', async () => {
    const deps = makeDeps({ hasGuestData: vi.fn(async () => true) });
    localStorage.setItem('oneup_settings', '{"a":1}');
    localStorage.setItem('oneup_routines', '[]');
    localStorage.setItem('oneup_custom_exercises', '[]');

    await useCloudSyncStore.getState().onResolveConflict('restore', deps);

    expect(deps.clearAnonymousData).toHaveBeenCalled();
    expect(localStorage.getItem('oneup_settings')).toBe(null);
    expect(localStorage.getItem('oneup_routines')).toBe(null);
    expect(localStorage.getItem('oneup_custom_exercises')).toBe(null);
    expect(deps.loadFromCloud).toHaveBeenCalled();
  });
});

describe("onResolveConflict('upload') — keep local/guest data", () => {
  it('without guest data: just syncs with the cloud', async () => {
    const deps = makeDeps();
    await useCloudSyncStore.getState().onResolveConflict('upload', deps);
    expect(deps.mergeWithAnonymousData).not.toHaveBeenCalled();
    expect(deps.syncWithCloud).toHaveBeenCalled();
    expect(useCloudSyncStore.getState().conflictCheckDone).toBe(true);
  });

  it('with guest data: merges it, clears it, then syncs', async () => {
    const calls = [];
    const deps = makeDeps({
      hasGuestData: vi.fn(async () => true),
      mergeWithAnonymousData: vi.fn(async () => { calls.push('merge'); return { success: true }; }),
      clearAnonymousData: vi.fn(async () => { calls.push('clear'); }),
      syncWithCloud: vi.fn(async () => { calls.push('sync'); return { success: true }; }),
    });

    await useCloudSyncStore.getState().onResolveConflict('upload', deps);

    // Merge MUST happen before the guest data is cleared, sync comes last
    expect(calls).toEqual(['merge', 'clear', 'sync']);
  });

  it('carries guest exercise difficulties into settings (without overriding user prefs)', async () => {
    const deps = makeDeps({ hasGuestData: vi.fn(async () => true) });
    localStorage.setItem('oneup_settings', JSON.stringify({
      exerciseDifficulties: { pushups: 0.5, squats: 0.8 },
    }));

    await useCloudSyncStore.getState().onResolveConflict('upload', deps);

    expect(deps.updateSettings).toHaveBeenCalled();
    const updater = deps.updateSettings.mock.calls[0][0];
    // Existing user difficulties win over guest ones
    const next = updater({ exerciseDifficulties: { pushups: 1.0 } });
    expect(next.exerciseDifficulties).toEqual({ pushups: 1.0, squats: 0.8 });
    expect(localStorage.getItem('oneup_settings')).toBe(null);
  });

  it('ignores corrupted guest settings without crashing', async () => {
    const deps = makeDeps({ hasGuestData: vi.fn(async () => true) });
    localStorage.setItem('oneup_settings', '{broken json');
    await useCloudSyncStore.getState().onResolveConflict('upload', deps);
    expect(deps.syncWithCloud).toHaveBeenCalled();
    expect(useCloudSyncStore.getState().conflictCheckDone).toBe(true);
  });
});

describe('onResolveConflict — failure', () => {
  it('keeps the conflict open when resolution fails (user can retry)', async () => {
    const deps = makeDeps({ loadFromCloud: vi.fn(async () => { throw new Error('offline'); }) });
    useCloudSyncStore.setState({ conflictData: { some: 'conflict' }, conflictCheckDone: false });

    await useCloudSyncStore.getState().onResolveConflict('restore', deps);

    expect(useCloudSyncStore.getState().conflictData).toEqual({ some: 'conflict' });
    expect(useCloudSyncStore.getState().conflictCheckDone).toBe(false);
  });
});
