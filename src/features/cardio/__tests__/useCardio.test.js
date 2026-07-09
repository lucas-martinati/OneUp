import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const stores = {
  progress: { completions: {}, updateExerciseCount: vi.fn(), updateCardioSessions: vi.fn(), cardio: { sessions: {} }, startDate: '2024-01-01', isStoreInitialized: true },
  cloud: { isInitialSyncDone: true },
  auth: { loading: false, isSignedIn: true },
};

vi.mock('@services/cardioService', () => ({
  loadCardioSessions: vi.fn(() => Promise.resolve([])),
  saveCardioSession: vi.fn(() => Promise.resolve()),
}));
vi.mock('@services/stravaService', () => ({ stravaService: { getActivities: vi.fn(() => Promise.resolve([])) } }));
vi.mock('@contexts/AuthContext', () => ({ useAuth: () => stores.auth }));
vi.mock('@store/useProgressStore', () => ({ useProgressStore: (sel) => sel(stores.progress) }));
vi.mock('@store/useCloudSyncStore', () => ({ useCloudSyncStore: (sel) => sel(stores.cloud) }));
vi.mock('@hooks/useExerciseConfig', () => ({ useExerciseConfig: () => ({ getConfig: () => ({ difficulty: 1 }) }) }));

import { loadCardioSessions, saveCardioSession } from '@services/cardioService';
import { stravaService } from '@services/stravaService';
import { useCardio } from '../useCardio';

beforeEach(() => {
  vi.clearAllMocks();
  stores.progress.completions = {};
  stores.progress.cardio = { sessions: {} };
  stores.auth = { loading: false, isSignedIn: true };
  stores.cloud = { isInitialSyncDone: true };
  loadCardioSessions.mockResolvedValue([]);
  stravaService.getActivities.mockResolvedValue([]);
});

const runSession = (over = {}) => ({ id: 's1', type: 'running', distance: 5000, startTime: Date.now(), ...over });

describe('loading & fetching', () => {
  it('returns no sessions for guests', async () => {
    stores.auth = { loading: false, isSignedIn: false };
    const { result } = renderHook(() => useCardio());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.allSessions).toEqual([]);
  });

  it('loads Firebase sessions and merges new Strava activities', async () => {
    loadCardioSessions.mockResolvedValue([runSession({ id: 'fb1', distance: 3000 })]);
    stravaService.getActivities.mockResolvedValue([runSession({ id: 'strava_9', distance: 10000 })]);
    const { result } = renderHook(() => useCardio());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(result.current.allSessions.length).toBe(2));
    // new strava activity persisted
    expect(saveCardioSession).toHaveBeenCalled();
  });

  it('falls back to an empty list when the fetch throws', async () => {
    loadCardioSessions.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useCardio());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.allSessions).toEqual([]);
  });
});

describe('computations', () => {
  it('computes total reps from validated weeks only, capped at that week goal (not raw distance)', async () => {
    // Sessions logging way more than the goal must NOT inflate reps: only the
    // validated completions day counts, capped at week 1's goal.
    loadCardioSessions.mockResolvedValue([
      runSession({ id: 'r', type: 'running', distance: 40000 }),
      runSession({ id: 'c', type: 'cycling', distance: 200000 }),
    ]);
    stores.progress.completions = {
      '2024-01-01': {
        running: { isCompleted: true, count: 1 },
        cycling: { isCompleted: true, count: 1 },
      },
    };
    const { result } = renderHook(() => useCardio());
    await waitFor(() => expect(result.current.totalReps).toBeGreaterThan(0));
    // Week 1 goal: running 0.45km → floor(0.45*109)=49, cycling 0.75km → floor(0.75*65)=48 → 97
    expect(result.current.totalReps).toBe(97);
  });

  it('does not count reps for weeks that were never validated in completions', async () => {
    loadCardioSessions.mockResolvedValue([
      runSession({ id: 'r', type: 'running', distance: 40000 }),
    ]);
    const { result } = renderHook(() => useCardio());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.totalReps).toBe(0);
  });

  it('switches active mode and filters sessions', async () => {
    loadCardioSessions.mockResolvedValue([
      runSession({ id: 'r', type: 'running' }),
      runSession({ id: 'c', type: 'cycling' }),
    ]);
    const { result } = renderHook(() => useCardio());
    await waitFor(() => expect(result.current.allSessions.length).toBe(2));
    expect(result.current.activeMode).toBe('running');
    expect(result.current.sessions.every(s => s.type === 'running')).toBe(true);
    act(() => result.current.setActiveMode('cycling'));
    await waitFor(() => expect(result.current.sessions.every(s => s.type === 'cycling')).toBe(true));
  });

  it('exposes the current week number and a weekly goal', async () => {
    const { result } = renderHook(() => useCardio());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(typeof result.current.weekNumber).toBe('number');
    expect(result.current.weeklyGoal).toBeGreaterThan(0);
  });

  it('refresh re-fetches sessions', async () => {
    const { result } = renderHook(() => useCardio());
    await waitFor(() => expect(result.current.loading).toBe(false));
    loadCardioSessions.mockClear();
    await act(async () => { await result.current.refresh(); });
    expect(loadCardioSessions).toHaveBeenCalled();
  });
});
