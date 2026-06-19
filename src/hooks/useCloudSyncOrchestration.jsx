import { useEffect } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useCloudSyncStore } from '@store/useCloudSyncStore';
import { useExercises } from '@contexts/ExercisesContext';
import { useCloudAutoSave } from '@hooks/useCloudAutoSave';
import { cloudSync } from '@services/cloudSync';

export function useCloudSyncOrchestration(enabled, routines, customExercises, customCategories) {
  const auth = useAuth();
  const resumeCloudSync = useCloudSyncStore(s => s.resumeCloudSync);
  const { customExercisesHook, customCategoriesHook, setRoutinesFromCloud } = useExercises();
  
  const { setCustomExercisesFromCloud } = customExercisesHook;
  const { setCategoriesFromCloud } = customCategoriesHook;

  useCloudAutoSave(
    enabled,
    routines,
    cloudSync.saveRoutinesToCloud,
    { delay: 2000 }
  );

  useCloudAutoSave(
    enabled,
    customExercises,
    cloudSync.saveCustomExercisesToCloud,
    { delay: 2000 }
  );

  useCloudAutoSave(
    enabled,
    customCategories,
    cloudSync.saveCustomCategoriesToCloud,
    { delay: 2000 }
  );

  useEffect(() => {
    if (!auth.isSignedIn || auth.loading || !auth.user?.uid) return;
    
    let unsubExercises = null;
    let unsubCategories = null;
    let unsubRoutines = null;

    // Setup realtime listeners
    if (enabled) {
      if (cloudSync.listenToCustomExercisesFromCloud) {
        unsubExercises = cloudSync.listenToCustomExercisesFromCloud(setCustomExercisesFromCloud);
      }
      if (cloudSync.listenToCustomCategoriesFromCloud) {
        unsubCategories = cloudSync.listenToCustomCategoriesFromCloud(setCategoriesFromCloud);
      }
      if (cloudSync.listenToRoutinesFromCloud) {
        unsubRoutines = cloudSync.listenToRoutinesFromCloud(setRoutinesFromCloud);
      }
    }

    return () => {
      if (unsubExercises) unsubExercises();
      if (unsubCategories) unsubCategories();
      if (unsubRoutines) unsubRoutines();
    };
  }, [auth.isSignedIn, auth.loading, auth.user?.uid, enabled, setCustomExercisesFromCloud, setRoutinesFromCloud, setCategoriesFromCloud]);

  return { resumeCloudSync };
}