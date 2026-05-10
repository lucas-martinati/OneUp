import { createContext, useContext, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useRoutines } from '../hooks/useRoutines';
import { useCustomExercises } from '../hooks/useCustomExercises';
import { useCustomCategories } from '../hooks/useCustomCategories';
import { useExerciseWeights } from '../hooks/useExerciseWeights';
import { useProgressStore } from '../store/useProgressStore';
import { EXERCISES, EXERCISES_MAP, CARDIO_EXERCISES } from '../config/exercises';
import { WEIGHT_EXERCISES, WEIGHT_EXERCISES_MAP } from '../config/weights';

const ExercisesContext = createContext(null);
const EMPTY_ARRAY = [];

/**
 * Centralizes all exercise lists, routines, and custom categories.
 * Replaces the duplicated [...EXERCISES, ...WEIGHT_EXERCISES, ...customExercises]
 * pattern found in 5+ files.
 */
export function ExercisesProvider({ children }) {
  const auth = useAuth();
  const userId = auth.user?.uid;
  const deleteExerciseHistory = useProgressStore(s => s.deleteExerciseHistory);
  const saveToCloud = useProgressStore(s => s.saveToCloud);
  const routinesHook = useRoutines(userId);
  const customExercisesHook = useCustomExercises(userId);
  const customCategoriesHook = useCustomCategories(userId);
  const exerciseWeightsHook = useExerciseWeights(userId);
  const { routines, saveRoutine, deleteRoutine, updateRoutine, setRoutinesFromCloud, maxRoutines } = routinesHook;
  const { customExercises: _customExercises, deleteCustomExercise: rawDeleteCustomExercise } = customExercisesHook;
  const customExercises = _customExercises || EMPTY_ARRAY;
  const { customCategories, customCategoriesMap } = customCategoriesHook;

  // Centralized exercise maps — computed once, available everywhere
  const customExercisesMap = useMemo(() => {
    const map = {};
    customExercises.forEach(ex => { map[ex.id] = ex; });
    return map;
  }, [customExercises]);

  // Exercises scoped to the built-in "Custom" category (no categoryId or categoryId === 'custom')
  const defaultCustomExercises = useMemo(() =>
    customExercises.filter(ex => !ex.categoryId || ex.categoryId === 'custom'),
    [customExercises]
  );

  // Exercises grouped by user-created custom category
  const exercisesByUserCategory = useMemo(() => {
    const map = {};
    // Only map user-created categories (not the built-in 'custom' override)
    customCategories.filter(cat => cat.id !== 'custom').forEach(cat => { map[cat.id] = []; });
    
    customExercises.forEach(ex => {
      if (ex.categoryId && map[ex.categoryId]) {
        map[ex.categoryId].push(ex);
      }
    });
    return map;
  }, [customExercises, customCategories]);

  // Maps for exercises in each user-created category
  const exercisesMapByUserCategory = useMemo(() => {
    const maps = {};
    for (const [catId, exList] of Object.entries(exercisesByUserCategory)) {
      const m = {};
      exList.forEach(ex => { m[ex.id] = ex; });
      maps[catId] = m;
    }
    return maps;
  }, [exercisesByUserCategory]);

  const allExercises = useMemo(() => {
        return [...EXERCISES, ...WEIGHT_EXERCISES, ...customExercises];
    }, [customExercises]);

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
    custom: defaultCustomExercises,
    cardio: CARDIO_EXERCISES,
  }), [defaultCustomExercises]);

  // Wrapped deleteCustomExercise that also cleans up completions and routines
  const handleDeleteCustomExercise = useCallback(async (id) => {
    rawDeleteCustomExercise(id);

    // Erase from completion history
    deleteExerciseHistory(id);
    // Trigger cloud save after deletion
    saveToCloud().catch(() => {});

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
  }, [rawDeleteCustomExercise, deleteExerciseHistory, saveToCloud, routines, deleteRoutine, updateRoutine]);

  /**
   * Delete a user-created category with selective exercise handling.
   * @param {string} catId - Category ID to delete
   * @param {Object} exerciseMoves - Map of { exerciseId: targetCategoryId } for exercises to move
   * @param {string[]} exercisesToDelete - Array of exercise IDs to delete entirely
   */
  const handleDeleteCategory = useCallback((catId, exerciseMoves = {}, exercisesToDelete = []) => {
    // Move selected exercises to their chosen target categories
    for (const [exId, targetCatId] of Object.entries(exerciseMoves)) {
      customExercisesHook.updateCustomExercise(exId, { categoryId: targetCatId });
    }
    // Delete exercises the user chose not to keep
    exercisesToDelete.forEach(exId => {
      handleDeleteCustomExercise(exId);
    });
    // Remove the category itself
    customCategoriesHook.deleteCategory(catId);
  }, [customExercisesHook, customCategoriesHook, handleDeleteCustomExercise]);

  const wrappedCustomExercisesHook = useMemo(() => ({
    ...customExercisesHook,
    deleteCustomExercise: handleDeleteCustomExercise,
  }), [customExercisesHook, handleDeleteCustomExercise]);

  const wrappedCustomCategoriesHook = useMemo(() => ({
    ...customCategoriesHook,
    deleteCategory: handleDeleteCategory,
  }), [customCategoriesHook, handleDeleteCategory]);

  const value = useMemo(() => ({
    // Static exercise lists
    classicExercises: EXERCISES,
    classicExercisesMap: EXERCISES_MAP,
    weightExercises: WEIGHT_EXERCISES,
    weightExercisesMap: WEIGHT_EXERCISES_MAP,
    // Custom exercises
    customExercises,
    defaultCustomExercises,
    customExercisesMap,
    customExercisesHook: wrappedCustomExercisesHook,
    // Custom categories
    customCategories,
    customCategoriesMap,
    customCategoriesHook: wrappedCustomCategoriesHook,
    exercisesByUserCategory,
    exercisesMapByUserCategory,
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
    customExercises, defaultCustomExercises, customExercisesMap, wrappedCustomExercisesHook,
    customCategories, customCategoriesMap, wrappedCustomCategoriesHook,
    exercisesByUserCategory, exercisesMapByUserCategory,
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
