import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, waitFor, cleanup } from '@testing-library/react';

// ── Environment mocks ───────────────────────────────────────────────────

vi.mock('@capacitor/preferences', () => {
  const mem = new Map();
  return {
    Preferences: {
      get: vi.fn(async ({ key }) => ({ value: mem.has(key) ? mem.get(key) : null })),
      set: vi.fn(async ({ key, value }) => { mem.set(key, value); }),
      remove: vi.fn(async ({ key }) => { mem.delete(key); }),
      _mem: mem,
    },
  };
});

vi.mock('../../../services/firebase', () => ({
  serverTimestamp: vi.fn(() => '2026-06-11T12:00:00.000Z'),
}));

vi.mock('../../../services/userDataService', () => ({
  saveAchievementsToCloud: vi.fn(async () => {}),
  loadAchievementsFromCloud: vi.fn(async () => null),
}));

vi.mock('../../../services/cloudSync', () => ({
  cloudSync: {
    saveToCloud: vi.fn(async () => {}),
    loadFromCloud: vi.fn(async () => null),
    syncData: vi.fn(async (local) => local),
    listenToCloudChanges: vi.fn(() => () => {}),
    mergeData: vi.fn((local, cloud) => ({ ...local, ...cloud })),
    loadSettingsFromCloud: vi.fn(async () => null),
    listenToSettingsFromCloud: vi.fn(() => () => {}),
    saveSettingsToCloud: vi.fn(async () => {}),
    getUserClans: vi.fn(async () => []),
  },
}));

// Auth is driven per-test through this mutable holder
const authState = { value: { isSignedIn: false, loading: false, user: null } };
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => authState.value,
}));

vi.mock('../../../hooks/useNotificationManager', () => ({
  useNotificationManager: () => ({
    scheduleNotification: vi.fn(),
    requestNotificationPermission: vi.fn(),
  }),
}));

vi.mock('../../../hooks/useCloudAutoSave', () => ({
  useCloudAutoSave: vi.fn(),
}));

vi.mock('../../../utils/widgetBridge', () => ({
  updateWidgetData: vi.fn(),
}));

import { Preferences } from '@capacitor/preferences';
import { cloudSync } from '../../../services/cloudSync';
import { AppOrchestrator } from '../AppOrchestrator';
import { useProgressStore } from '../../../store/useProgressStore';
import { useCloudSyncStore } from '../../../store/useCloudSyncStore';
import { STORAGE_KEY_BASE } from '../../../hooks/useProgressStorage';

const currentYear = new Date().getFullYear();
const fixedStart = `${currentYear}-01-01`;

const guestData = {
  startDate: fixedStart,
  isSetup: true,
  completions: { [`${currentYear}-02-01`]: { pushups: { isCompleted: true, count: 30 } } },
};

const cloudData = {
  startDate: fixedStart,
  isSetup: true,
  completions: { [`${currentYear}-03-01`]: { squats: { isCompleted: true } } },
};

const renderOrchestrator = () => render(<AppOrchestrator computedStats={{}} />);

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  Preferences._mem.clear();
  localStorage.clear();
  useProgressStore.getState().reset();
  useCloudSyncStore.getState().resetSyncState();
  authState.value = { isSignedIn: false, loading: false, user: null };
});

// ── Scenarios ───────────────────────────────────────────────────────────

describe('AppOrchestrator — signed out', () => {
  it('initializes the store as guest and resets sync state', async () => {
    renderOrchestrator();
    await waitFor(() => {
      expect(useProgressStore.getState().isStoreInitialized).toBe(true);
    });
    expect(useProgressStore.getState()._userId).toBe(null);
    expect(useCloudSyncStore.getState().isInitialSyncDone).toBe(false);
    expect(cloudSync.loadFromCloud).not.toHaveBeenCalled();
  });
});

describe('AppOrchestrator — sign-in with no local data', () => {
  beforeEach(() => {
    authState.value = { isSignedIn: true, loading: false, user: { uid: 'u1' } };
  });

  it('restores cloud data when the cloud has some', async () => {
    cloudSync.loadFromCloud.mockResolvedValue(cloudData);

    renderOrchestrator();

    await waitFor(() => {
      expect(useCloudSyncStore.getState().isInitialSyncDone).toBe(true);
    });
    const progress = useProgressStore.getState();
    expect(progress.isSetup).toBe(true);
    expect(progress.completions[`${currentYear}-03-01`].squats.isCompleted).toBe(true);
    expect(useCloudSyncStore.getState().conflictData).toBe(null);
  });

  it('still starts the app when the cloud is empty', async () => {
    cloudSync.loadFromCloud.mockResolvedValue(null);

    renderOrchestrator();

    await waitFor(() => {
      expect(useCloudSyncStore.getState().isInitialSyncDone).toBe(true);
    });
    expect(useProgressStore.getState().isSetup).toBe(false);
    expect(useCloudSyncStore.getState().conflictData).toBe(null);
  });

  it('still starts the app when the cloud load fails (offline)', async () => {
    cloudSync.loadFromCloud.mockRejectedValue(new Error('network down'));

    renderOrchestrator();

    await waitFor(() => {
      expect(useCloudSyncStore.getState().isInitialSyncDone).toBe(true);
    });
    // Local data untouched, no conflict shown
    expect(useProgressStore.getState().isSetup).toBe(false);
    expect(useCloudSyncStore.getState().conflictData).toBe(null);
  });
});

describe('AppOrchestrator — signed-in user with local data', () => {
  beforeEach(() => {
    authState.value = { isSignedIn: true, loading: false, user: { uid: 'u1' } };
    // User-scoped local data exists and is set up
    Preferences._mem.set(`${STORAGE_KEY_BASE}_u1`, JSON.stringify({
      startDate: fixedStart,
      isSetup: true,
      completions: { [`${currentYear}-04-01`]: { pushups: { isCompleted: true } } },
    }));
  });

  it('runs a full sync and starts the realtime listener', async () => {
    cloudSync.syncData.mockResolvedValue(cloudData);

    renderOrchestrator();

    await waitFor(() => {
      expect(useCloudSyncStore.getState().isInitialSyncDone).toBe(true);
    });
    expect(cloudSync.syncData).toHaveBeenCalled();
    await waitFor(() => {
      expect(cloudSync.listenToCloudChanges).toHaveBeenCalled();
    });
  });

  it('still starts when the initial sync fails (data stays local)', async () => {
    cloudSync.syncData.mockRejectedValue(new Error('offline'));

    renderOrchestrator();

    await waitFor(() => {
      expect(useCloudSyncStore.getState().isInitialSyncDone).toBe(true);
    });
    expect(useProgressStore.getState().completions[`${currentYear}-04-01`].pushups.isCompleted).toBe(true);
  });
});

describe('AppOrchestrator — guest data conflict on sign-in', () => {
  beforeEach(() => {
    authState.value = { isSignedIn: true, loading: false, user: { uid: 'u1' } };
    // Guest (unsuffixed) data with completions…
    Preferences._mem.set(STORAGE_KEY_BASE, JSON.stringify(guestData));
    // …and the signed-in user already has set-up local data
    Preferences._mem.set(`${STORAGE_KEY_BASE}_u1`, JSON.stringify({
      startDate: fixedStart,
      isSetup: true,
      completions: { [`${currentYear}-04-01`]: { pushups: { isCompleted: true } } },
    }));
  });

  it('surfaces the conflict overlay instead of overwriting anything', async () => {
    cloudSync.loadFromCloud.mockResolvedValue(cloudData);

    renderOrchestrator();

    await waitFor(() => {
      expect(useCloudSyncStore.getState().conflictData).not.toBe(null);
    });
    const conflict = useCloudSyncStore.getState().conflictData;
    expect(conflict.isAnonymousMerge).toBe(true);
    expect(conflict.completions[`${currentYear}-03-01`].squats.isCompleted).toBe(true);

    // No sync ran while the conflict is unresolved, and no listener either
    expect(cloudSync.syncData).not.toHaveBeenCalled();
    expect(cloudSync.listenToCloudChanges).not.toHaveBeenCalled();

    // Local user data is intact
    expect(useProgressStore.getState().completions[`${currentYear}-04-01`].pushups.isCompleted).toBe(true);
  });

  it('after resolving the conflict, sync resumes', async () => {
    cloudSync.loadFromCloud.mockResolvedValue(cloudData);
    // Realistic sync: the service merges local data with the cloud
    cloudSync.syncData.mockImplementation(async (local) => ({
      ...local,
      completions: { ...local.completions, ...cloudData.completions },
    }));

    renderOrchestrator();
    await waitFor(() => {
      expect(useCloudSyncStore.getState().conflictData).not.toBe(null);
    });

    // Simulate the user resolving the conflict (keep & merge local data)
    const progress = useProgressStore.getState();
    await useCloudSyncStore.getState().onResolveConflict('upload', {
      loadFromCloud: progress.loadFromCloud,
      syncWithCloud: progress.syncWithCloud,
      hasGuestData: progress.hasGuestData,
      clearAnonymousData: progress.clearAnonymousData,
      mergeWithAnonymousData: progress.mergeWithAnonymousData,
      updateSettings: vi.fn(),
    });

    expect(useCloudSyncStore.getState().conflictData).toBe(null);
    // Guest data was merged in, then wiped
    expect(useProgressStore.getState().completions[`${currentYear}-02-01`].pushups.count).toBe(30);
    expect(Preferences._mem.has(STORAGE_KEY_BASE)).toBe(false);
    // Listener starts once the conflict is gone
    await waitFor(() => {
      expect(cloudSync.listenToCloudChanges).toHaveBeenCalled();
    });
  });
});

describe('AppOrchestrator — sync pause', () => {
  it('does not start the realtime listener while sync is paused', async () => {
    authState.value = { isSignedIn: true, loading: false, user: { uid: 'u1' } };
    Preferences._mem.set(`${STORAGE_KEY_BASE}_u1`, JSON.stringify({
      startDate: fixedStart,
      isSetup: true,
      completions: { [`${currentYear}-04-01`]: { pushups: { isCompleted: true } } },
    }));
    useCloudSyncStore.getState().pauseCloudSync();

    renderOrchestrator();

    await waitFor(() => {
      expect(useCloudSyncStore.getState().isInitialSyncDone).toBe(true);
    });
    expect(cloudSync.listenToCloudChanges).not.toHaveBeenCalled();

    // Resuming starts it
    useCloudSyncStore.getState().resumeCloudSync();
    await waitFor(() => {
      expect(cloudSync.listenToCloudChanges).toHaveBeenCalled();
    });
  });
});
