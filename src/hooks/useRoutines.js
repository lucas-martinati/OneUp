import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY_BASE = 'oneup_routines';
const MAX_ROUTINES = 10;

function getStorageKey(userId) {
  return userId ? `${STORAGE_KEY_BASE}_${userId}` : STORAGE_KEY_BASE;
}

function loadRoutinesFromStorage(storageKey) {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

/**
 * Hook for managing workout routines (CRUD + localStorage persistence).
 * 
 * Each routine: { id, name, exerciseIds[], createdAt }
 */
export function useRoutines(userId) {
  const storageKey = getStorageKey(userId);

  const [routines, setRoutines] = useState(() => loadRoutinesFromStorage(storageKey));

  // Reload when userId changes (account switch)
  const prevKeyRef = useRef(storageKey);
  useEffect(() => {
    if (prevKeyRef.current !== storageKey) {
      prevKeyRef.current = storageKey;
      if (userId) {
        if (!localStorage.getItem(storageKey)) {
          const legacyData = localStorage.getItem(STORAGE_KEY_BASE);
          if (legacyData) localStorage.setItem(storageKey, legacyData);
        }
        setRoutines(loadRoutinesFromStorage(storageKey));
      } else {
        setRoutines([]);
      }
    }
  }, [storageKey, userId]);

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(routines));
  }, [routines, storageKey]);

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
  }, []);

  const deleteRoutine = useCallback((id) => {
    setRoutines(prev => prev.filter(r => r.id !== id));
  }, []);

  const updateRoutine = useCallback((id, name, exerciseIds) => {
    setRoutines(prev =>
      prev.map(r =>
        r.id === id
          ? { ...r, name: name.trim(), exerciseIds: [...exerciseIds] }
          : r
      )
    );
  }, []);

  /**
   * Replace all routines (used when loading from cloud).
   */
  const setRoutinesFromCloud = useCallback((cloudRoutines) => {
    if (Array.isArray(cloudRoutines)) {
      setRoutines(cloudRoutines);
    }
  }, []);

  return {
    routines,
    saveRoutine,
    deleteRoutine,
    updateRoutine,
    setRoutinesFromCloud,
    maxRoutines: MAX_ROUTINES,
  };
}
