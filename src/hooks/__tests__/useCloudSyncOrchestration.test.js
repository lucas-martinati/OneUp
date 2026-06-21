import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const auth = { isSignedIn: true, loading: false, user: { uid: 'u1' } };
vi.mock('@contexts/AuthContext', () => ({ useAuth: () => auth }));

const resumeCloudSync = vi.fn();
vi.mock('@store/useCloudSyncStore', () => ({
  useCloudSyncStore: (s) => s({ resumeCloudSync }),
}));

const setCustomExercisesFromCloud = vi.fn();
const setCategoriesFromCloud = vi.fn();
const setRoutinesFromCloud = vi.fn();
vi.mock('@contexts/ExercisesContext', () => ({
  useExercises: () => ({
    customExercisesHook: { setCustomExercisesFromCloud },
    customCategoriesHook: { setCategoriesFromCloud },
    setRoutinesFromCloud,
  }),
}));

vi.mock('@hooks/useCloudAutoSave', () => ({ useCloudAutoSave: vi.fn() }));

const unsub = vi.fn();
vi.mock('@services/cloudSync', () => ({
  cloudSync: {
    saveRoutinesToCloud: vi.fn(),
    saveCustomExercisesToCloud: vi.fn(),
    saveCustomCategoriesToCloud: vi.fn(),
    listenToCustomExercisesFromCloud: vi.fn(() => unsub),
    listenToCustomCategoriesFromCloud: vi.fn(() => unsub),
    listenToRoutinesFromCloud: vi.fn(() => unsub),
  },
}));

import { cloudSync } from '@services/cloudSync';
import { useCloudAutoSave } from '@hooks/useCloudAutoSave';
import { useCloudSyncOrchestration } from '../useCloudSyncOrchestration';

beforeEach(() => {
  vi.clearAllMocks();
  auth.isSignedIn = true;
  auth.loading = false;
  auth.user = { uid: 'u1' };
});

describe('useCloudSyncOrchestration', () => {
  it('registers autosaves and realtime listeners when enabled and signed in', () => {
    const { result, unmount } = renderHook(() =>
      useCloudSyncOrchestration(true, [], [], [])
    );
    expect(useCloudAutoSave).toHaveBeenCalledTimes(3);
    expect(cloudSync.listenToCustomExercisesFromCloud).toHaveBeenCalledWith(setCustomExercisesFromCloud);
    expect(cloudSync.listenToRoutinesFromCloud).toHaveBeenCalledWith(setRoutinesFromCloud);
    expect(result.current.resumeCloudSync).toBe(resumeCloudSync);
    unmount();
    expect(unsub).toHaveBeenCalled();
  });

  it('does not attach listeners when signed out', () => {
    auth.isSignedIn = false;
    renderHook(() => useCloudSyncOrchestration(true, [], [], []));
    expect(cloudSync.listenToCustomExercisesFromCloud).not.toHaveBeenCalled();
  });

  it('does not attach listeners when disabled', () => {
    renderHook(() => useCloudSyncOrchestration(false, [], [], []));
    expect(cloudSync.listenToRoutinesFromCloud).not.toHaveBeenCalled();
  });
});
