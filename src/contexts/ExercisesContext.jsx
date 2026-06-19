import { useMemo, useCallback } from 'react';
import { useExercisesStore } from '@store/useExercisesStore';
import { EXERCISES, EXERCISES_MAP, CARDIO_EXERCISES } from '@config/exercises';
import { WEIGHT_EXERCISES, WEIGHT_EXERCISES_MAP } from '@config/weights';

/**
 * Backward compatibility facade for the legacy ExercisesContext.
 * Adapts client components to the new Zustand useExercisesStore.
 */
export function ExercisesProvider({ children }) {
  return children;
}

export function useExercises() {
  const store = useExercisesStore();

  const customExercises = store.customExercises;
  const customCategories = store.customCategories;

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
    return { ...EXERCISES_MAP, ...WEIGHT_EXERCISES_MAP, ...customExercisesMap };
  }, [customExercisesMap]);

  const getExerciseById = useCallback(
    (id) => allExercisesMap[id] || null,
    [allExercisesMap]
  );

  // Exercices by category
  const exercisesByCategory = useMemo(() => ({
    standard: EXERCISES,
    weights: WEIGHT_EXERCISES,
    custom: defaultCustomExercises,
    cardio: CARDIO_EXERCISES,
  }), [defaultCustomExercises]);

  return {
    // Static exercise lists
    classicExercises: EXERCISES,
    classicExercisesMap: EXERCISES_MAP,
    weightExercises: WEIGHT_EXERCISES,
    weightExercisesMap: WEIGHT_EXERCISES_MAP,
    
    // Custom exercises
    customExercises,
    defaultCustomExercises,
    customExercisesMap,
    customExercisesHook: {
      customExercises,
      saveCustomExercise: store.saveCustomExercise,
      updateCustomExercise: store.updateCustomExercise,
      deleteCustomExercise: store.deleteCustomExercise,
      setCustomExercisesFromCloud: store.setCustomExercisesFromCloud,
      maxCustomExercises: store.maxCustomExercises,
    },
    
    // Custom categories
    customCategories,
    customCategoriesMap: store.customCategoriesMap,
    customCategoriesHook: {
      customCategories,
      customCategoriesMap: store.customCategoriesMap,
      addCategory: store.addCategory,
      updateCategory: store.updateCategory,
      deleteCategory: store.deleteCategory,
      moveCategory: store.moveCategory,
      setCategoriesFromCloud: store.setCategoriesFromCloud,
      maxCustomCategories: store.maxCustomCategories,
    },
    exercisesByUserCategory,
    exercisesMapByUserCategory,
    
    // Combined
    allExercises,
    allExercisesMap,
    getExerciseById,
    exercisesByCategory,
    
    // Routines
    routines: store.routines,
    saveRoutine: store.saveRoutine,
    deleteRoutine: store.deleteRoutine,
    updateRoutine: store.updateRoutine,
    setRoutinesFromCloud: store.setRoutinesFromCloud,
    maxRoutines: store.maxRoutines,
    
    // Exercise weights
    exerciseWeights: store.exerciseWeights,
    getWeight: store.getWeight,
    setWeight: store.setWeight,
  };
}
