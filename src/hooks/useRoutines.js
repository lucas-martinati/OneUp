import { useCallback } from 'react';
import { useLocalStorageScoped } from './useLocalStorageScoped';

const STORAGE_KEY = 'oneup_routines';
const MAX_ROUTINES = 10;

/**
 * Hook for managing workout routines (CRUD + localStorage persistence).
 * 
 * Each routine: { id, name, exerciseIds[], createdAt }
 */
export function useRoutines(userId) {
  const [routines, setRoutines] = useLocalStorageScoped(STORAGE_KEY, userId, []);

  const saveRoutine = useCallback((name, exerciseIds) => {
    if (!name?.trim() || !exerciseIds?.length) return false;
    
    setRoutines(prev => {
      if (prev.length >= MAX_ROUTINES) return prev;
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          name: name.trim(),
          exerciseIds: [...exerciseIds],
          createdAt: Date.now(),
        }
      ];
    });
    return true;
  }, [setRoutines]);

  const deleteRoutine = useCallback((id) => {
    setRoutines(prev => prev.filter(r => r.id !== id));
  }, [setRoutines]);

  const updateRoutine = useCallback((id, name, exerciseIds) => {
    setRoutines(prev =>
      prev.map(r =>
        r.id === id
          ? { ...r, name: name.trim(), exerciseIds: [...exerciseIds] }
          : r
      )
    );
  }, [setRoutines]);

  /**
   * Replace all routines (used when loading from cloud).
   */
  const setRoutinesFromCloud = useCallback((cloudRoutines) => {
    if (Array.isArray(cloudRoutines)) {
      setRoutines(cloudRoutines);
    }
  }, [setRoutines]);

  return {
    routines,
    saveRoutine,
    deleteRoutine,
    updateRoutine,
    setRoutinesFromCloud,
    maxRoutines: MAX_ROUTINES,
  };
}
