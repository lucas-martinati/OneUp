import { useCallback } from 'react';
import { useProgressStore } from '@store/useProgressStore';
import { useSettingsStore } from '@store/useSettingsStore';
import { useExercises } from '@contexts/ExercisesContext';

/**
 * Unifies the configuration aspects of exercises (difficulty and weight).
 * Internally delegates reading from and writing to stores (for difficulty)
 * and ExercisesContext (for weight). Also pulls historical data from completions
 * if an exercise was finished on a specific date.
 */
export function useExerciseConfig() {
  const completions = useProgressStore(s => s.completions);
  const settings = useSettingsStore(s => s.settings);
  const updateSettings = useSettingsStore(s => s.updateSettings);
  const { getWeight: getGlobalWeight, setWeight } = useExercises();

  // Inline getDifficulty (previously from ProgressContext)
  const getGlobalDifficulty = useCallback((exId, dateStr = null) => {
    if (dateStr && completions?.[dateStr]?.[exId]?.isCompleted) {
      const savedDiff = completions[dateStr][exId].difficulty;
      if (savedDiff !== undefined) return savedDiff;
      return 1.0;
    }
    const currentPrefs = settings?.exerciseDifficulties || {};
    if (currentPrefs[exId] !== undefined) return currentPrefs[exId];
    return 1.0;
  }, [completions, settings?.exerciseDifficulties]);

  const updateDifficulty = useCallback((exId, value) => {
    updateSettings(prev => ({
      exerciseDifficulties: {
        ...(prev.exerciseDifficulties || {}),
        [exId]: value,
      },
    }));
  }, [updateSettings]);

  /**
   * Retrieves the combined config (weight and difficulty) for a given exercise.
   * If dateStr is provided and the exercise was completed that day, it prioritizes
   * the saved historical weight and difficulty.
   */
  const getConfig = useCallback((exId, dateStr = null) => {
    if (!exId) return { difficulty: 1.0, weight: null };
    // If completed on the specific date, use the saved info first
    if (dateStr && completions?.[dateStr]?.[exId]?.isCompleted) {
      const pastData = completions[dateStr][exId];

      let difficulty = 1.0;
      if (pastData.difficulty !== undefined) {
        difficulty = pastData.difficulty;
      } else if (getGlobalDifficulty) {
        difficulty = getGlobalDifficulty(exId);
      }

      let weight = null;
      if (pastData.weight !== undefined) {
        weight = pastData.weight;
      } else if (getGlobalWeight) {
        weight = getGlobalWeight(exId);
      }

      return { weight, difficulty };
    }

    // Current/future workouts use real-time settings
    return {
      difficulty: getGlobalDifficulty ? getGlobalDifficulty(exId) : 1.0,
      weight: getGlobalWeight ? getGlobalWeight(exId) : null,
    };
  }, [completions, getGlobalDifficulty, getGlobalWeight]);

  /**
   * Updates one or both config parameters for an exercise globally.
   */
  const updateConfig = useCallback((exId, { weight, difficulty } = {}) => {
    if (weight !== undefined && setWeight) {
      setWeight(exId, weight);
    }
    if (difficulty !== undefined && updateDifficulty) {
      updateDifficulty(exId, difficulty);
    }
  }, [setWeight, updateDifficulty]);

  return { getConfig, updateConfig };
}
