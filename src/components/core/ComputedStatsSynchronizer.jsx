import { useEffect, useCallback } from 'react';
import { useProgressStore } from '@store/useProgressStore';
import { useSettingsStore } from '@store/useSettingsStore';
import { useExercises } from '@contexts/ExercisesContext';
import { useComputedStatsStore } from '@store/useComputedStatsStore';

/**
 * Invisible component that synchronizes computed stats into the Zustand store.
 * Place this ONCE at the top of the React tree (e.g. in App.jsx).
 * 
 * It watches all inputs (completions, settings, exercises, etc.) and
 * recomputes stats when any input changes. All other components read
 * from useComputedStatsStore instead of calling computeAllStats themselves.
 */
export function ComputedStatsSynchronizer() {
    const completions = useProgressStore(s => s.completions);
    // Subscribe only to the settings used by stats — avoids a full stats recompute on every unrelated
    // settings change (sound toggle, leaderboard pseudo keystrokes, …).
    const weekStartDay = useSettingsStore(s => s.settings.weekStartDay) || 'monday';
    const exerciseDifficulties = useSettingsStore(s => s.settings.exerciseDifficulties);
    const getDayNumber = useProgressStore(s => s.getDayNumber);
    const hasShared = useProgressStore(s => s.hasShared);
    const achievements = useProgressStore(s => s.achievements);
    const frozenDays = useProgressStore(s => s.frozenDays);

    const { customExercises } = useExercises();
    const migrateLevels = useProgressStore(s => s.migrateLevels);
    useEffect(() => { migrateLevels(customExercises); }, [customExercises, completions, migrateLevels]);
    const recompute = useComputedStatsStore(s => s.recompute);

    // Difficulty helper
    const getDifficulty = useCallback((exId, dateStr = null) => {
        if (dateStr && completions?.[dateStr]?.[exId]?.isCompleted) {
            const savedDiff = completions[dateStr][exId].difficulty;
            if (savedDiff !== undefined) return savedDiff;
            return 1.0;
        }
        const currentPrefs = exerciseDifficulties || {};
        if (currentPrefs[exId] !== undefined) {
            return currentPrefs[exId];
        }
        return 1.0;
    }, [completions, exerciseDifficulties]);

    const getConfig = useCallback((exId, dateStr) => ({
        difficulty: getDifficulty(exId, dateStr),
        weight: null,
    }), [getDifficulty]);

    const userStartDate = useProgressStore(s => s.userStartDate);

    // Recompute whenever any input changes
    useEffect(() => {
        recompute(
            completions, { exerciseDifficulties, weekStartDay }, getDayNumber,
            customExercises, hasShared, achievements,
            getConfig, userStartDate, frozenDays
        );
    }, [completions, exerciseDifficulties, weekStartDay, getDayNumber, customExercises, hasShared, achievements, getConfig, userStartDate, frozenDays, recompute]);

    return null; // Invisible component
}
