import { useEffect } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useProgressContext } from '@contexts/ProgressContext';
import { useExercises } from '@contexts/ExercisesContext';
import { useCloudAutoSave } from '@hooks/useCloudAutoSave';
import { cloudSync } from '@services/cloudSync';

export function useCloudSyncOrchestration(enabled, routines, customExercises, customCategories) {
  const auth = useAuth();
  const { resumeCloudSync, setRoutinesFromCloud } = useProgressContext();
  const { customExercisesHook, customCategoriesHook } = useExercises();
  
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
    
    const loadData = async () => {
      try {
        const cloudRoutines = await cloudSync.loadRoutinesFromCloud();
        if (cloudRoutines && Array.isArray(cloudRoutines)) setRoutinesFromCloud(cloudRoutines);
        
        const cloudExercises = await cloudSync.loadCustomExercisesFromCloud();
        if (cloudExercises && Array.isArray(cloudExercises)) setCustomExercisesFromCloud(cloudExercises);

        const cloudCategories = await cloudSync.loadCustomCategoriesFromCloud();
        if (cloudCategories && Array.isArray(cloudCategories)) setCategoriesFromCloud(cloudCategories);
      } catch { /* silent */ }
    };
    loadData();
  }, [auth.isSignedIn, auth.loading, auth.user?.uid, setCustomExercisesFromCloud, setRoutinesFromCloud, setCategoriesFromCloud]);

  return { resumeCloudSync };
}