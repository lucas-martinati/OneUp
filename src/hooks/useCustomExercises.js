import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'oneup_custom_exercises';
const MAX_CUSTOM_EXERCISES = 10;

/**
 * Hook for managing personal custom exercises (Pro feature).
 * Each exercise: { id, label, icon, color, gradient, multiplier }
 */
export function useCustomExercises() {
  const [customExercises, setCustomExercises] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customExercises));
  }, [customExercises]);

  const saveCustomExercise = useCallback((exerciseData) => {
    if (!exerciseData?.label?.trim()) return null;

    setCustomExercises((prev) => {
      if (prev.length >= MAX_CUSTOM_EXERCISES) return prev;
      
      const newExercise = {
        id: `custom_${crypto.randomUUID()}`,
        label: exerciseData.label.trim(),
        icon: exerciseData.icon || 'Star',
        color: exerciseData.color || '#8b5cf6',
        gradient: exerciseData.gradient || ['#7c3aed', '#8b5cf6'],
        multiplier: parseFloat(exerciseData.multiplier) || 1.0,
        createdAt: Date.now(),
      };
      return [...prev, newExercise];
    });
    return true;
  }, []);

  const updateCustomExercise = useCallback((id, updates) => {
    setCustomExercises((prev) =>
      prev.map((ex) => (ex.id === id ? { ...ex, ...updates } : ex))
    );
  }, []);

  const deleteCustomExercise = useCallback((id) => {
    setCustomExercises((prev) => prev.filter((ex) => ex.id !== id));
    // Note: Completions are not deleted so stats history is preserved even if the exercise is deleted,
    // though it won't be shown in the UI anymore.
  }, []);

  const setCustomExercisesFromCloud = useCallback((cloudData) => {
    if (Array.isArray(cloudData)) {
      setCustomExercises(cloudData);
    }
  }, []);

  return {
    customExercises,
    saveCustomExercise,
    updateCustomExercise,
    deleteCustomExercise,
    setCustomExercisesFromCloud,
    maxCustomExercises: MAX_CUSTOM_EXERCISES,
  };
}
