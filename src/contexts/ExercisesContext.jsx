import { createContext, useContext, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useRoutines } from '../hooks/useRoutines';
import { useCustomExercises } from '../hooks/useCustomExercises';
import { useExerciseWeights } from '../hooks/useExerciseWeights';
import { EXERCISES, EXERCISES_MAP } from '../config/exercises';
import { WEIGHT_EXERCISES, WEIGHT_EXERCISES_MAP } from '../config/weights';

const ExercisesContext = createContext(null);
const EMPTY_ARRAY = [];

/**
 * Centralizes all exercise lists and routines.
 * Replaces the duplicated [...EXERCISES, ...WEIGHT_EXERCISES, ...customExercises]
 * pattern found in 5+ files.
 */
export function ExercisesProvider({ children, onDeleteExerciseHistory, onSaveToCloud }) {
  const auth = useAuth();
  const userId = auth.user?.uid;
  const routinesHook = useRoutines(userId);
  const customExercisesHook = useCustomExercises(userId);
  const exerciseWeightsHook = useExerciseWeights(userId);
  const { routines, saveRoutine, deleteRoutine, updateRoutine, setRoutinesFromCloud, maxRoutines } = routinesHook;
  const { customExercises: _customExercises, deleteCustomExercise: rawDeleteCustomExercise } = customExercisesHook;
  const customExercises = _customExercises || EMPTY_ARRAY;

  // Centralized exercise maps — computed once, available everywhere
  const customExercisesMap = useMemo(() => {
    const map = {};
    customExercises.forEach(ex => { map[ex.id] = ex; });
    return map;
  }, [customExercises]);

  const allExercises = useMemo(
    () => [...EXERCISES, ...WEIGHT_EXERCISES, ...customExercises],
    [customExercises]
  );

  const allExercisesMap = useMemo(() => {
    const map = { ...EXERCISES_MAP, ...WEIGHT_EXERCISES_MAP, ...customExercisesMap };
    return map;
  }, [customExercisesMap]);

  const getExerciseById = useCallback(
    (id) => allExercisesMap[id] || null,
    [allExercisesMap]
  );

  // Exercices by category (for Stats filters, etc.)
  const exercisesByCategory = useMemo(() => ({
    standard: EXERCISES,
    weights: WEIGHT_EXERCISES,
    custom: customExercises,
  }), [customExercises]);

  // Wrapped deleteCustomExercise that also cleans up completions and routines
  const handleDeleteCustomExercise = useCallback(async (id) => {
    rawDeleteCustomExercise(id);

    // Erase from completion history
    if (onDeleteExerciseHistory) {
      const newState = onDeleteExerciseHistory(id);
      if (newState && onSaveToCloud) {
        await onSaveToCloud(newState);
      }
    }

    // Remove from all routines and delete routine if empty
    routines.forEach(r => {
      if (r.exerciseIds && r.exerciseIds.includes(id)) {
        const newExercises = r.exerciseIds.filter(ex => ex !== id);
        if (newExercises.length === 0) {
          deleteRoutine(r.id);
        } else {
          updateRoutine(r.id, r.name, newExercises);
        }
      }
    });
  }, [rawDeleteCustomExercise, onDeleteExerciseHistory, onSaveToCloud, routines, deleteRoutine, updateRoutine]);

  const wrappedCustomExercisesHook = useMemo(() => ({
    ...customExercisesHook,
    deleteCustomExercise: handleDeleteCustomExercise,
  }), [customExercisesHook, handleDeleteCustomExercise]);

  const value = useMemo(() => ({
    // Static exercise lists
    classicExercises: EXERCISES,
    classicExercisesMap: EXERCISES_MAP,
    weightExercises: WEIGHT_EXERCISES,
    weightExercisesMap: WEIGHT_EXERCISES_MAP,
    // Custom exercises
    customExercises,
    customExercisesMap,
    customExercisesHook: wrappedCustomExercisesHook,
    // Combined
    allExercises,
    allExercisesMap,
    getExerciseById,
    exercisesByCategory,
    // Routines
    routines,
    saveRoutine,
    deleteRoutine,
    updateRoutine,
    setRoutinesFromCloud,
    maxRoutines,
    // Exercise weights
    exerciseWeights: exerciseWeightsHook.weights,
    getWeight: exerciseWeightsHook.getWeight,
    setWeight: exerciseWeightsHook.setWeight,
  }), [
    customExercises, customExercisesMap, wrappedCustomExercisesHook,
    allExercises, allExercisesMap, getExerciseById, exercisesByCategory,
    routines, saveRoutine, deleteRoutine, updateRoutine, setRoutinesFromCloud, maxRoutines,
    exerciseWeightsHook.weights, exerciseWeightsHook.getWeight, exerciseWeightsHook.setWeight,
  ]);

  return (
    <ExercisesContext.Provider value={value}>
      {children}
    </ExercisesContext.Provider>
  );
}

export function useExercises() {
  const ctx = useContext(ExercisesContext);
  if (!ctx) throw new Error('useExercises must be used within <ExercisesProvider>');
  return ctx;
}
