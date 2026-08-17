import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCardio } from '../useCardio';
import { useAuth } from '@contexts/AuthContext';
import { useProgressStore } from '@store/useProgressStore';
import { useCloudSyncStore } from '@store/useCloudSyncStore';
import { useExerciseConfig } from '@hooks/useExerciseConfig';
import { loadCardioSessions, saveCardioSession } from '@services/cardioService';
import { getAllActivities } from '@services/cardioProviders';
import { evaluateCardioWeek, computeCardioCurrentStreak } from '@utils/cardioStreak';
import { getWeekBounds } from '@shared/dateUtils';

vi.mock('@contexts/AuthContext');
vi.mock('@store/useProgressStore');
vi.mock('@store/useCloudSyncStore');
vi.mock('@hooks/useExerciseConfig');
vi.mock('@services/cardioService', () => ({
    loadCardioSessions: vi.fn(),
    saveCardioSession: vi.fn(),
    getSortedCardioSessions: vi.fn((s) => s || [])
}));
vi.mock('@utils/cardioStreak', () => ({
    evaluateCardioWeek: vi.fn(() => ({ weekNum: 1, achieved: true })),
    computeCardioCurrentStreak: vi.fn(() => 3)
}));
vi.mock('@services/cardioProviders', () => ({
    getAllActivities: vi.fn()
}));
vi.mock('@shared/dateUtils', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        getLocalDateStr: vi.fn((date) => date.toISOString().split('T')[0]),
        getCurrentWeekNumber: vi.fn(() => 1),
        getWeekBounds: vi.fn(() => ({ start: 0, end: 9999999999999 })),
    };
});
vi.mock('@config/exercises', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        getWeeklyGoalKm: vi.fn(() => 5), // 5km goal
    };
});

describe('useCardio', () => {
    let mockAuth, mockProgress, mockCloudSync, mockExerciseConfig, mockUpdateExerciseCount, mockUpdateCardioSessions;

    beforeEach(() => {
        vi.clearAllMocks();

        mockAuth = { loading: false, isSignedIn: true };
        useAuth.mockReturnValue(mockAuth);

        mockUpdateExerciseCount = vi.fn();
        mockUpdateCardioSessions = vi.fn();

        mockProgress = {
            completions: {},
            updateExerciseCount: mockUpdateExerciseCount,
            updateCardioSessions: mockUpdateCardioSessions,
            cardio: { sessions: [] },
            startDate: '2024-01-01',
            isStoreInitialized: true
        };
        useProgressStore.mockImplementation((selector) => selector(mockProgress));

        mockCloudSync = { isInitialSyncDone: true };
        useCloudSyncStore.mockImplementation((selector) => selector(mockCloudSync));

        mockExerciseConfig = {
            getConfig: vi.fn(() => ({ difficulty: 1 }))
        };
        useExerciseConfig.mockReturnValue(mockExerciseConfig);

        loadCardioSessions.mockResolvedValue([]);
        getAllActivities.mockResolvedValue([]);
        evaluateCardioWeek.mockImplementation(() => ({ weekNum: 1, achieved: true }));
    });

    it('initializes and fetches sessions when ready', async () => {
        loadCardioSessions.mockResolvedValue([{ id: 'fb1', startTime: 1000, type: 'running', distance: 1000 }]);
        getAllActivities.mockResolvedValue([{ id: 'strava1', startTime: 2000, type: 'running', distance: 5000 }]);
        
        const { result } = renderHook(() => useCardio());
        
        // Let effects run
        await vi.waitFor(() => {
            expect(result.current.allSessions).toHaveLength(2);
        }, { timeout: 3000 });

        expect(result.current.loading).toBe(false);
        expect(saveCardioSession).toHaveBeenCalledTimes(1); // Saved new strava session
    });

    it('does not fetch if not ready', async () => {
        mockAuth.loading = true;
        renderHook(() => useCardio());
        expect(loadCardioSessions).not.toHaveBeenCalled();
    });

    it('computes reps from completions', () => {
        mockProgress.completions = {
            '2024-01-01': { running: { isCompleted: true, difficulty: 1 } },
            '2024-01-02': { cycling: { isCompleted: true, difficulty: 2 } }
        };
        
        const { result } = renderHook(() => useCardio());
        
        expect(result.current.totalReps).toBeGreaterThan(0);
    });

    it('computes streak correctly', async () => {
        // mock evaluateCardioWeek to return achieved
        // The real streak computation uses evaluateCardioWeek which uses weekOffset.
        const { result } = renderHook(() => useCardio());
        
        expect(typeof result.current.streak).toBe('number');
    });

    it('syncs sessions to completions when distance >= goal', async () => {
        // We mock sessions so it surpasses the 5km goal
        getAllActivities.mockResolvedValue([{ id: 's1', type: 'running', distance: 6000, startTime: 1000 }]);
        
        const { result } = renderHook(() => useCardio());
        
        await vi.waitFor(() => {
            expect(result.current.loading).toBe(false);
        }, { timeout: 3000 });

        // Effect should have called updateExerciseCount
        expect(mockUpdateExerciseCount).toHaveBeenCalled();
    });

    it('unmarks completion if distance < goal', async () => {
        mockProgress.completions = {
            '1970-01-01': { running: { isCompleted: true, difficulty: 1 } }
        };
        
        getAllActivities.mockResolvedValue([{ id: 's1', type: 'running', distance: 2000, startTime: 1000 }]); // Only 2km, goal is 5km
        
        renderHook(() => useCardio());
        
        await vi.waitFor(() => {
            // Need to wait until it unmarks
            expect(mockUpdateExerciseCount).toHaveBeenCalledWith('1970-01-01', 'running', 0, 1, null, 1);
        }, { timeout: 3000 });
    });

    it('handles invalidateCurrentWeek', () => {
        mockProgress.completions = {
            '1970-01-01': { running: { isCompleted: true, difficulty: 2 } }
        };
        const { result } = renderHook(() => useCardio());
        
        act(() => {
            result.current.invalidateCurrentWeek();
        });
        
        expect(mockUpdateExerciseCount).toHaveBeenCalledWith('1970-01-01', 'running', 0, 1, null, 1);
    });

    it('handles invalidateCurrentWeek for cycling', () => {
        mockProgress.completions = {
            '1970-01-01': { cycling: { isCompleted: true, difficulty: 2 } }
        };
        const { result } = renderHook(() => useCardio());
        
        act(() => {
            result.current.setActiveMode('cycling');
        });

        act(() => {
            result.current.invalidateCurrentWeek();
        });
        
        expect(mockUpdateExerciseCount).toHaveBeenCalledWith('1970-01-01', 'cycling', 0, 1, null, 1);
    });

    it('handles catch error during fetch', async () => {
        loadCardioSessions.mockRejectedValue(new Error('Network error'));
        const { result } = renderHook(() => useCardio());
        
        await vi.waitFor(() => {
            expect(result.current.loading).toBe(false);
        }, { timeout: 3000 });
        expect(result.current.allSessions).toEqual([]);
    });

    it('keeps previously loaded sessions when a later fetch fails', async () => {
        loadCardioSessions.mockResolvedValueOnce([{ id: 'fb1', startTime: 1000, type: 'running', distance: 5000 }]);
        const { result } = renderHook(() => useCardio());

        await vi.waitFor(() => {
            expect(result.current.allSessions).toHaveLength(1);
        }, { timeout: 3000 });

        loadCardioSessions.mockRejectedValueOnce(new Error('offline'));
        act(() => { result.current.refresh(); });

        await vi.waitFor(() => {
            expect(result.current.loading).toBe(false);
        }, { timeout: 3000 });
        // A transient fetch error must NOT wipe the previously loaded sessions
        expect(result.current.allSessions).toHaveLength(1);
    });

    it('unmarks stale completion when the last session of a week is deleted', async () => {
        // Each date maps to its own week start so weeks are distinguishable
        getWeekBounds.mockImplementation((date) => {
            const d = new Date(date);
            return { start: d.getTime(), end: d.getTime() + 6 * 24 * 3600 * 1000 };
        });

        // Week of Jan 8 previously completed, but its only session was deleted;
        // the current sessions only cover the week of Jan 15.
        mockProgress.completions = {
            '2024-01-08': { running: { isCompleted: true, difficulty: 1 } },
        };
        getAllActivities.mockResolvedValue([{ id: 's1', type: 'running', distance: 6000, startTime: Date.parse('2024-01-15T08:00:00') }]);

        renderHook(() => useCardio());

        await vi.waitFor(() => {
            expect(mockUpdateExerciseCount).toHaveBeenCalledWith('2024-01-08', 'running', 0, 1, null, 1);
        }, { timeout: 3000 });
    });

    it('unmarks all cardio completions when every session is deleted', async () => {
        mockProgress.completions = {
            '2024-01-08': { running: { isCompleted: true, difficulty: 1 } },
        };
        // No sessions at all — the ghost completion must be cleaned up
        renderHook(() => useCardio());

        await vi.waitFor(() => {
            expect(mockUpdateExerciseCount).toHaveBeenCalledWith('2024-01-08', 'running', 0, 1, null, 1);
        }, { timeout: 3000 });
    });

    it('switches active mode', () => {
        const { result } = renderHook(() => useCardio());
        act(() => {
            result.current.setActiveMode('cycling');
        });
        expect(result.current.activeMode).toBe('cycling');
    });

    it('sets empty sessions if not signed in', async () => {
        mockAuth.isSignedIn = false;
        // The hook requires isStoreInitialized for guests, which is true in mockProgress
        const { result } = renderHook(() => useCardio());
        
        await vi.waitFor(() => {
            expect(result.current.loading).toBe(false);
        });
        
        expect(result.current.allSessions).toEqual([]);
        expect(loadCardioSessions).not.toHaveBeenCalled();
    });

    it('breaks streak computation properly', () => {
        // Provide at least one session so the hook's memo doesn't short-circuit
        mockProgress.cardio = { sessions: [{ id: '1' }] };

        // The streak walk is delegated to the shared computeCardioCurrentStreak
        // (unit-tested in cardioStreak.test.js): a missed week yields 0.
        computeCardioCurrentStreak.mockReturnValue(0);

        const { result } = renderHook(() => useCardio());
        expect(result.current.streak).toBe(0);
    });
});
