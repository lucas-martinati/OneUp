import { useEffect, useCallback, useRef } from 'react';
import { cloudSync } from '../services/cloudSync';
import { serverTimestamp } from '../services/firebase';
import { STORAGE_KEY_BASE, validateProgressData } from './useProgressStorage';

export function useProgressSync(state, setState) {
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);
  const isSavingRef = useRef(false);

  const saveToCloud = useCallback(async () => {
    if (isSavingRef.current) return { success: false, error: 'Save in progress' };
    isSavingRef.current = true;
    try {
      await cloudSync.saveToCloud(stateRef.current);
      return { success: true };
    } catch (error) {
      console.error('Failed to save to cloud:', error);
      return { success: false, error: error.message };
    } finally {
      isSavingRef.current = false;
    }
  }, []);

  const loadFromCloud = useCallback(async () => {
    try {
      const cloudData = await cloudSync.loadFromCloud();
      if (cloudData) {
        setState(prev => {
          const validated = validateProgressData(cloudData);
          return {
            ...prev,
            startDate: validated.startDate,
            userStartDate: validated.userStartDate,
            completions: validated.completions || {},
            isSetup: validated.isSetup,
          };
        });
        return { success: true, data: cloudData };
      }
      return { success: false, error: 'No cloud data found' };
    } catch (error) {
      console.error('Failed to load from cloud:', error);
      return { success: false, error: error.message };
    }
  }, [setState]);

  const syncWithCloud = useCallback(async () => {
    try {
      const mergedData = await cloudSync.syncData(stateRef.current);
      if (mergedData) {
        setState(prev => {
          const validated = validateProgressData(mergedData);
          return {
            ...prev,
            ...validated,
            // Explicitly preserve local-only state that isn't in the progress node
            achievements: prev.achievements
          };
        });
      }
      return { success: true, data: mergedData };
    } catch (error) {
      console.error('Failed to sync with cloud:', error);
      return { success: false, error: error.message };
    }
  }, [setState]);

  /**
   * Merges data from the guest (anonymous) account into the current user's state.
   * Useful when a user performs exercises before signing in.
   */
  const mergeWithAnonymousData = useCallback(async () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BASE);
      if (!saved) return { success: false, error: 'No guest data found' };
      
      const guestData = JSON.parse(saved);
      const validated = validateProgressData(guestData);
      if (!validated) return { success: false, error: 'Invalid guest data' };

      setState(prev => {
        const merged = cloudSync.mergeData(prev, validated);
        return {
          ...prev,
          startDate: merged.startDate || prev.startDate,
          userStartDate: merged.userStartDate || prev.userStartDate,
          completions: merged.completions || prev.completions,
          isSetup: merged.isSetup || prev.isSetup,
          lastCompletionChange: serverTimestamp(),
        };
      });
      
      return { success: true };
    } catch (error) {
      console.error('Failed to merge guest data:', error);
      return { success: false, error: error.message };
    }
  }, [setState]);

  /** 
   * Clears the guest (anonymous) data from localStorage.
   * Should be called after a successful merge or when the user chooses to discard guest data.
   */
  const clearAnonymousData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_BASE);
  }, []);

  /**
   * Check if there is significant guest data (e.g. at least one completion).
   */
  const hasGuestData = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BASE);
      if (!saved) return false;
      const data = JSON.parse(saved);
      return data?.completions && Object.keys(data.completions).length > 0;
    } catch {
      return false;
    }
  }, []);

  /**
   * Start listening to real-time cloud changes (Firebase onValue).
   * When another device writes, this callback fires and merges the incoming data.
   * Returns an unsubscribe function.
   */
  const startCloudListener = useCallback(() => {
    return cloudSync.listenToCloudChanges((cloudData) => {
      if (!cloudData || !cloudData.completions) return;

      setState(prev => {
        const validated = validateProgressData(cloudData);
        // Only update if cloud data actually differs
        const cloudJSON = JSON.stringify(validated.completions);
        const localJSON = JSON.stringify(prev.completions);
        if (cloudJSON === localJSON) return prev;

        console.debug('[Real-time sync] Incoming cloud update applied');
        const merged = cloudSync.mergeData(prev, validated);

        // Important: we use the merged result which now contains the best
        // lastCompletionChange (either local placeholder or cloud timestamp).
        return {
          ...prev,
          startDate: merged.startDate || prev.startDate,
          userStartDate: merged.userStartDate || prev.userStartDate,
          completions: merged.completions || prev.completions,
          isSetup: merged.isSetup ?? prev.isSetup,
          lastCompletionChange: merged.lastCompletionChange,
        };
      });
    });
  }, [setState]);

  return {
    saveToCloud,
    loadFromCloud,
    syncWithCloud,
    mergeWithAnonymousData,
    clearAnonymousData,
    hasGuestData,
    startCloudListener
  };
}
