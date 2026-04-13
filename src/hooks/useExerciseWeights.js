import { useState, useEffect, useCallback } from 'react';
import { WEIGHT_EXERCISES_MAP } from '../config/weights';
import { cloudSync } from '../services/cloudSync';
import { getLocalDateStr } from '../utils/dateUtils';

const STORAGE_KEY = 'oneup_exercise_weights';

/**
 * Hook to manage exercise weights (kg) per exercise.
 * - Persists locally in localStorage and syncs to Firebase.
 * - Falls back to the exercise's defaultWeight from config when no user value exists.
 */
export function useExerciseWeights() {
  const [weights, setWeights] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [cloudLoaded, setCloudLoaded] = useState(false);

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(weights));
  }, [weights]);

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
  }, []);

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

  /**
   * Set the weight for a specific exercise and persist to weight history.
   */
  const setWeight = useCallback((exerciseId, kg) => {
    const value = Math.max(0, Number(kg) || 0);
    setWeights(prev => ({ ...prev, [exerciseId]: value }));

    // Record in weight history for the chart
    const todayStr = getLocalDateStr(new Date());
    cloudSync.saveWeightEntry(exerciseId, todayStr, value).catch(() => {});
  }, []);

  return { weights, getWeight, setWeight };
}
