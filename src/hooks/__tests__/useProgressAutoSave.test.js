import { renderHook } from '@testing-library/react';
import { useProgressAutoSave } from '../useProgressAutoSave';
import { useProgressStore } from '@store/useProgressStore';
import { useCloudSyncStore } from '@store/useCloudSyncStore';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@store/useProgressStore', () => ({
  useProgressStore: vi.fn(),
}));

vi.mock('@store/useCloudSyncStore', () => ({
  useCloudSyncStore: vi.fn(),
}));

describe('useProgressAutoSave', () => {
  let saveToCloudMock;
  let syncWithCloudMock;
  let setSyncErrorMock;

  beforeEach(() => {
    vi.useFakeTimers();
    saveToCloudMock = vi.fn().mockResolvedValue();
    syncWithCloudMock = vi.fn().mockResolvedValue();
    setSyncErrorMock = vi.fn();

    useProgressStore.mockImplementation((selector) => {
      const str = selector.toString();
      if (str.includes('lastCompletionChange')) return 'timestamp1';
      if (str.includes('saveToCloud')) return saveToCloudMock;
      if (str.includes('syncWithCloud')) return syncWithCloudMock;
      return null;
    });

    useCloudSyncStore.mockImplementation((selector) => {
      const str = selector.toString();
      if (str.includes('conflictData')) return null;
      if (str.includes('conflictCheckDone')) return true;
      if (str.includes('isInitialSyncDone')) return true;
      if (str.includes('setSyncError')) return setSyncErrorMock;
      return null;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('triggers debounced saveToCloud on completion change and clears error on success', async () => {
    const auth = { isSignedIn: true, loading: false };
    renderHook(() => useProgressAutoSave(auth));
    
    vi.advanceTimersByTime(400);
    await vi.runAllTimersAsync();

    expect(saveToCloudMock).toHaveBeenCalledTimes(1);
    expect(setSyncErrorMock).toHaveBeenCalledWith(null);
  });

  it('sets syncError when saveToCloud fails', async () => {
    saveToCloudMock.mockRejectedValueOnce(new Error('Save Error'));
    const auth = { isSignedIn: true, loading: false };
    renderHook(() => useProgressAutoSave(auth));
    
    vi.advanceTimersByTime(400);
    await vi.runAllTimersAsync();

    expect(setSyncErrorMock).toHaveBeenCalledWith('Save Error');
  });

  it('forces saveToCloud when visibility changes to hidden', async () => {
    const auth = { isSignedIn: true, loading: false };
    renderHook(() => useProgressAutoSave(auth));

    // Wait past the debounce to isolate the test
    vi.advanceTimersByTime(400);
    await vi.runAllTimersAsync();
    saveToCloudMock.mockClear();

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    });

    document.dispatchEvent(new Event('visibilitychange'));
    await vi.runAllTimersAsync();

    expect(saveToCloudMock).toHaveBeenCalledTimes(1);
    
    // reset visibilityState
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
  });

  it('forces syncWithCloud when online event triggers', async () => {
    const auth = { isSignedIn: true, loading: false };
    renderHook(() => useProgressAutoSave(auth));

    window.dispatchEvent(new Event('online'));
    await vi.runAllTimersAsync();

    expect(syncWithCloudMock).toHaveBeenCalledTimes(1);
  });
});
