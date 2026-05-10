import { useMemo, useCallback } from 'react';
import { useProgressStore } from '../store/useProgressStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useExercises } from '../contexts/ExercisesContext';
import { useComputedStats } from './useComputedStats';

/**
 * Hook that computes stats by pulling all dependencies directly from Zustand stores.
 * Replaces the `computedStats` that was previously provided by ProgressContext.
 *
 * Usage:
 *   const computedStats = useComputedStatsFromStore();
 */
export function useComputedStatsFromStore() {
    const completions = useProgressStore(s => s.completions);
    const settings = useSettingsStore(s => s.settings);
    const getDayNumber = useProgressStore(s => s.getDayNumber);
    const hasShared = useProgressStore(s => s.hasShared);
    const achievements = useProgressStore(s => s.achievements);
    const cardio = useProgressStore(s => s.cardio);

    const { customExercises } = useExercises();

    // Derive cardioReps from cardio sessions
    const cardioReps = useMemo(() => {
        const sessions = Object.values(cardio?.sessions || {});
        const runningKm = sessions.filter(s => s.type === 'running').reduce((sum, s) => sum + (s.distance || 0), 0) / 1000;
        const cyclingKm = sessions.filter(s => s.type === 'cycling').reduce((sum, s) => sum + (s.distance || 0), 0) / 1000;
        return {
            running: Math.floor(runningKm * 15),
            cycling: Math.floor(cyclingKm * 15),
        };
    }, [cardio]);

    // Difficulty helper — mirrors the one from ProgressContext
    const getDifficulty = useCallback((exId, dateStr = null) => {
        if (dateStr && completions?.[dateStr]?.[exId]?.isCompleted) {
            const savedDiff = completions[dateStr][exId].difficulty;
            if (savedDiff !== undefined) return savedDiff;
            return 1.0;
        }
        const currentPrefs = settings?.exerciseDifficulties || {};
        if (currentPrefs[exId] !== undefined) {
            return currentPrefs[exId];
        }
        return 1.0;
    }, [completions, settings.exerciseDifficulties]);

    const getConfig = useCallback((exId, dateStr) => ({
        difficulty: getDifficulty(exId, dateStr),
        weight: null,
    }), [getDifficulty]);

    return useComputedStats(
        completions, settings, getDayNumber,
        customExercises, hasShared, achievements,
        getConfig, cardioReps
    );
}
