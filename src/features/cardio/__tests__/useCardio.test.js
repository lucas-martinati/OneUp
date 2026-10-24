import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCardio } from '../useCardio';
import { useAuth } from '@contexts/AuthContext';
import { useProgressStore } from '@store/useProgressStore';
import { useCloudSyncStore } from '@store/useCloudSyncStore';
import { loadCardioSessions, saveCardioSession } from '@services/cardioService';
import { getAllActivities } from '@services/cardioProviders';

vi.mock('@contexts/AuthContext');
vi.mock('@store/useProgressStore');
vi.mock('@store/useCloudSyncStore');
vi.mock('@services/cardioService', () => ({
    loadCardioSessions: vi.fn(), saveCardioSession: vi.fn(),
    getSortedCardioSessions: vi.fn(s => s || [])
}));
vi.mock('@services/cardioProviders', () => ({ getAllActivities: vi.fn() }));
const session = (id, distance, type = 'running', date = '2026-02-17') => ({ id, type, distance, startTime: new Date(`${date}T12:00:00`).getTime() });

describe('useCardio automatic weekly levels', () => {
    let auth, progress, sync;
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date('2026-02-19T12:00:00'));
        auth = { loading: false, isSignedIn: true };
        progress = { completions: {}, updateExerciseCount: vi.fn(), updateCardioSessions: vi.fn(), cardio: { sessions: [] }, startDate: '2026-01-01', isStoreInitialized: true };
        sync = { isInitialSyncDone: true };
        useAuth.mockReturnValue(auth);
        useProgressStore.mockImplementation(selector => selector(progress));
        useCloudSyncStore.mockImplementation(selector => selector(sync));
        loadCardioSessions.mockResolvedValue([]);
        getAllActivities.mockResolvedValue([]);
    });
    afterEach(() => vi.useRealTimers());

    it('shows the challenge week for today rather than the start of the calendar week', async () => {
        vi.setSystemTime(new Date('2026-10-24T12:00:00'));
        const { result } = renderHook(() => useCardio());
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.weekNumber).toBe(43);
    });
    it('merges and deduplicates provider sessions before saving new activities', async () => {
        loadCardioSessions.mockResolvedValue([session('a', 1000)]);
        getAllActivities.mockResolvedValue([session('a', 1000), session('b', 1000)]);
        const { result } = renderHook(() => useCardio());
        await waitFor(() => expect(result.current.allSessions).toHaveLength(2));
        expect(saveCardioSession).toHaveBeenCalledTimes(1);
        expect(saveCardioSession.mock.calls[0][0]).not.toHaveProperty('difficulty');
    });
    it('waits for auth and the initial cloud sync', () => {
        sync.isInitialSyncDone = false;
        renderHook(() => useCardio());
        expect(loadCardioSessions).not.toHaveBeenCalled();
        expect(progress.updateExerciseCount).not.toHaveBeenCalled();
    });
    it('records partial distances for both sports without switching tabs', async () => {
        loadCardioSessions.mockResolvedValue([session('a', 1800), session('b', 3000, 'cycling')]);
        renderHook(() => useCardio());
        await waitFor(() => expect(progress.updateExerciseCount).toHaveBeenCalledWith('2026-02-17', 'running', 1800, 3150));
        expect(progress.updateExerciseCount).toHaveBeenCalledWith('2026-02-17', 'cycling', 3000, 5250);
    });
    it('keeps sub-level volume and caps distance credit at the full weekly goal', async () => {
        loadCardioSessions.mockResolvedValue([session('a', 30), session('b', 20000, 'cycling')]);
        renderHook(() => useCardio());
        await waitFor(() => expect(progress.updateExerciseCount).toHaveBeenCalledWith('2026-02-17', 'running', 30, 3150));
        expect(progress.updateExerciseCount).toHaveBeenCalledWith('2026-02-17', 'cycling', 5250, 5250);
    });
    it('reduces the level when an activity is removed', async () => {
        progress.completions = { '2026-02-17': { running: { count: 3600, goal: 3600, level: 10, isCompleted: true } } };
        loadCardioSessions.mockResolvedValue([session('a', 1800)]);
        renderHook(() => useCardio());
        await waitFor(() => expect(progress.updateExerciseCount).toHaveBeenCalledWith('2026-02-17', 'running', 1800, 3600));
    });
    it('clears a tracked week after the last activity is deleted', async () => {
        progress.completions = { '2026-02-17': { running: { count: 3600, goal: 3600, level: 10, isCompleted: true } } };
        renderHook(() => useCardio());
        await waitFor(() => expect(progress.updateExerciseCount).toHaveBeenCalledWith('2026-02-17', 'running', 0, 3600));
    });
    it('preserves grandfathered validations without an available activity history', async () => {
        progress.completions = { '2026-02-17': { running: { count: 1800, goal: 1800, level: 10, isCompleted: true, legacyCardio: true } } };
        const { result } = renderHook(() => useCardio());
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(progress.updateExerciseCount).not.toHaveBeenCalled();
        expect(result.current.streak).toBe(1);
        expect(result.current.streakLevel).toBe(10);
    });
    it('does not erase tracked progress after an initial network error', async () => {
        progress.completions = { '2026-02-17': { running: { count: 3600, goal: 3600, level: 10, isCompleted: true } } };
        loadCardioSessions.mockRejectedValue(new Error('offline'));
        const { result } = renderHook(() => useCardio());
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(progress.updateExerciseCount).not.toHaveBeenCalled();
        expect(progress.updateCardioSessions).not.toHaveBeenCalled();
    });
    it('keeps previously loaded sessions when a refresh fails', async () => {
        loadCardioSessions.mockResolvedValue([session('a', 1800)]);
        const { result } = renderHook(() => useCardio());
        await waitFor(() => expect(result.current.allSessions).toHaveLength(1));
        progress.updateExerciseCount.mockClear();
        loadCardioSessions.mockRejectedValue(new Error('offline'));
        await act(() => result.current.refresh());
        expect(result.current.allSessions).toHaveLength(1);
        expect(progress.updateExerciseCount).not.toHaveBeenCalled();
    });
    it('switches the displayed sport without changing its target', async () => {
        const { result } = renderHook(() => useCardio());
        await waitFor(() => expect(result.current.loading).toBe(false));
        act(() => result.current.setActiveMode('cycling'));
        expect(result.current.weeklyGoal).toBe(5.25);
    });
    it('keeps local sessions for guests', async () => {
        auth.isSignedIn = false;
        progress.cardio.sessions = [session('a', 1800)];
        const { result } = renderHook(() => useCardio());
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.allSessions).toHaveLength(1);
        expect(loadCardioSessions).not.toHaveBeenCalled();
    });
    it('counts actual volume even before level one', async () => {
        progress.completions = { '2026-02-17': { running: { count: 300, goal: 3600, level: 0, isCompleted: false } } };
        const { result } = renderHook(() => useCardio());
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.totalReps).toBe(32);
    });
});
