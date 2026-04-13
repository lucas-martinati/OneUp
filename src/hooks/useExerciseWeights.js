import { useState, useEffect, useCallback, useRef } from 'react';
import { WEIGHT_EXERCISES_MAP } from '../config/weights';
import { cloudSync } from '../services/cloudSync';

const STORAGE_KEY_BASE = 'oneup_exercise_weights';

function getStorageKey(userId) {
  return userId ? `${STORAGE_KEY_BASE}_${userId}` : STORAGE_KEY_BASE;
}

function loadFromStorage(storageKey) {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

/**
 * Hook to manage exercise weights (kg) per exercise.
 * - Persists locally in localStorage and syncs to Firebase.
 * - Falls back to the exercise's defaultWeight from config when no user value exists.
 */
export function useExerciseWeights(userId) {
  const storageKey = getStorageKey(userId);

  const [weights, setWeights] = useState(() => loadFromStorage(storageKey));

  const [cloudLoaded, setCloudLoaded] = useState(false);

  // Reload when userId changes (account switch)
  const prevKeyRef = useRef(storageKey);
  useEffect(() => {
    if (prevKeyRef.current !== storageKey) {
      prevKeyRef.current = storageKey;
      setCloudLoaded(false);
      if (userId) {
        if (!localStorage.getItem(storageKey)) {
          const legacyData = localStorage.getItem(STORAGE_KEY_BASE);
          if (legacyData) localStorage.setItem(storageKey, legacyData);
        }
        setWeights(loadFromStorage(storageKey));
      } else {
        setWeights({});
      }
    }
  }, [storageKey, userId]);

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(weights));
  }, [weights, storageKey]);

  // Load from cloud on init
  useEffect(() => {
    cloudSync.loadExerciseWeightsFromCloud()
      .then(cloudWeights => {
        if (cloudWeights && typeof cloudWeights === 'object') {
          setWeights(prev => ({ ...cloudWeights, ...prev }));
        }
        setCloudLoaded(true);
      })
      .catch(() => { setCloudLoaded(true); });
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps -- reload from cloud on account switch

  // Save to cloud when weights change (debounced, after initial cloud load)
  useEffect(() => {
    if (!cloudLoaded) return;
    if (Object.keys(weights).length === 0) return;

    const timer = setTimeout(() => {
      cloudSync.saveExerciseWeightsToCloud(weights).catch(() => {});
    }, 1500);

    return () => clearTimeout(timer);
  }, [weights, cloudLoaded]);

  /**
   * Get the weight for a specific exercise (user value or defaultWeight fallback).
   */
  const getWeight = useCallback((exerciseId) => {
    if (weights[exerciseId] !== undefined) return weights[exerciseId];
    const config = WEIGHT_EXERCISES_MAP[exerciseId];
    return config?.defaultWeight ?? null;
  }, [weights]);

  const setWeight = useCallback((exerciseId, kg) => {
    const value = Math.max(0, Number(kg) || 0);
    setWeights(prev => ({ ...prev, [exerciseId]: value }));
  }, []);

  return { weights, getWeight, setWeight };
}
