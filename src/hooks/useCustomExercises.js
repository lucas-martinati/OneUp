import { useCallback } from 'react';
import { useLocalStorageScoped } from './useLocalStorageScoped';
import { serverTimestamp } from '../services/firebase';

const STORAGE_KEY = 'oneup_custom_exercises';

/**
 * Maximum number of custom exercises allowed PER CATEGORY.
 * Change this value to adjust the limit for all categories.
 */
export const MAX_EXERCISES_PER_CATEGORY = 12;

/**
 * Hook for managing personal custom exercises (Pro feature).
 * Each exercise: { id, label, icon, color, gradient, multiplier }
 */
export function useCustomExercises(userId) {
  const [customExercises, setCustomExercises] = useLocalStorageScoped(STORAGE_KEY, userId, []);

  const saveCustomExercise = useCallback((exerciseData) => {
    if (!exerciseData?.label?.trim()) return null;

    setCustomExercises((prev) => {
      const catId = exerciseData.categoryId || 'custom';
      const countInCategory = prev.filter(ex => (ex.categoryId || 'custom') === catId).length;
      if (countInCategory >= MAX_EXERCISES_PER_CATEGORY) return prev;
      
      const newExercise = {
        id: `custom_${crypto.randomUUID()}`,
        label: exerciseData.label.trim(),
        icon: exerciseData.icon || 'Star',
        color: exerciseData.color || '#8b5cf6',
        type: exerciseData.type || 'counter',
        gradient: exerciseData.gradient || ['#7c3aed', '#8b5cf6'],
        multiplier: parseFloat(exerciseData.multiplier) || 1.0,
        categoryId: exerciseData.categoryId || 'custom',
        createdAt: serverTimestamp(),
      };
      return [...prev, newExercise];
    });
    return true;
  }, [setCustomExercises]);

  const updateCustomExercise = useCallback((id, updates) => {
    setCustomExercises((prev) =>
      prev.map((ex) => (ex.id === id ? { ...ex, ...updates } : ex))
    );
  }, [setCustomExercises]);

  const deleteCustomExercise = useCallback((id) => {
    setCustomExercises((prev) => prev.filter((ex) => ex.id !== id));
    // Note: Completions are not deleted so stats history is preserved even if the exercise is deleted,
    // though it won't be shown in the UI anymore.
  }, [setCustomExercises]);

  const setCustomExercisesFromCloud = useCallback((cloudData) => {
    if (Array.isArray(cloudData)) {
      setCustomExercises(prev => {
        if (JSON.stringify(prev) === JSON.stringify(cloudData)) return prev;
        return cloudData;
      });
    }
  }, [setCustomExercises]);

  return {
    customExercises,
    saveCustomExercise,
    updateCustomExercise,
    deleteCustomExercise,
    setCustomExercisesFromCloud,
    maxCustomExercises: MAX_EXERCISES_PER_CATEGORY,
  };
}
