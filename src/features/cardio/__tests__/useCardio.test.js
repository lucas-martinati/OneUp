import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCardio } from '../useCardio';
import { useAuth } from '@contexts/AuthContext';
import { useProgressStore } from '@store/useProgressStore';
import { useCloudSyncStore } from '@store/useCloudSyncStore';
import { useExerciseConfig } from '@hooks/useExerciseConfig';
import { loadCardioSessions, saveCardioSession } from '@services/cardioService';
import { getAllActivities } from '@services/cardioProviders';
import { evaluateCardioWeek } from '@utils/cardioStreak';

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
    evaluateCardioWeek: vi.fn(() => ({ weekNum: 1, achieved: true }))
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
        // Provide at least one session so it doesn't return 0 early
        mockProgress.cardio = { sessions: [{ id: '1' }] };
        
        // weekOffset 0: achieved false (does not break)
        // weekOffset 1: achieved false (BREAKS)
        evaluateCardioWeek.mockImplementation((sessions, mode, weekOffset) => {
            if (weekOffset === 0) return { weekNum: 1, achieved: false };
            if (weekOffset === 1) return { weekNum: 1, achieved: false };
            return { weekNum: 0, achieved: false };
        });

        const { result } = renderHook(() => useCardio());
        expect(result.current.streak).toBe(0);
    });
});
