import { useState, useEffect, useCallback } from 'react';
import { useLocalStorageScoped } from './useLocalStorageScoped';
import { WEIGHT_EXERCISES_MAP } from '../config/weights';
import { cloudSync } from '../services/cloudSync';

const STORAGE_KEY = 'oneup_exercise_weights';

/**
 * Hook to manage exercise weights (kg) per exercise.
 * - Persists locally in localStorage (scoped by UID) and syncs to Firebase.
 * - Falls back to the exercise's defaultWeight from config when no user value exists.
 */
export function useExerciseWeights(userId) {
  const [weights, setWeights] = useLocalStorageScoped(STORAGE_KEY, userId, {});
  const [cloudLoaded, setCloudLoaded] = useState(false);
  const [prevUserId, setPrevUserId] = useState(userId);

  // Reset when user changes to avoid cascading renders inside useEffect
  if (userId !== prevUserId) {
    setPrevUserId(userId);
    setCloudLoaded(false);
  }

  // Load from cloud on init (with cancellation to prevent stale writes on account switch)
  useEffect(() => {
    let cancelled = false;

    cloudSync.loadExerciseWeightsFromCloud()
      .then(cloudWeights => {
        if (cancelled) return;
        if (cloudWeights && typeof cloudWeights === 'object') {
          setWeights(prev => ({ ...cloudWeights, ...prev }));
        }
        setCloudLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setCloudLoaded(true);
      });

    return () => { cancelled = true; };
  }, [userId, setWeights]);

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
  }, [setWeights]);

  return { weights, getWeight, setWeight };
}
