import { create } from 'zustand';
import { cloudSync } from '../services/cloudSync';
import { createLogger } from '../utils/logger';

const logger = createLogger('CloudSyncStore');

/**
 * Zustand store for cloud sync orchestration state.
 *
 * Manages sync flags, conflict resolution, pause/resume state,
 * clan data, and the conflict resolution action.
 */
export const useCloudSyncStore = create((set) => ({
  // ── Sync State ──────────────────────────────────────────────────────
  conflictData: null,
  conflictCheckDone: false,
  isInitialSyncDone: false,
  isSyncPaused: false,
  syncError: null,

  // ── Clan State ──────────────────────────────────────────────────────
  userClans: [],

  // ── Sync Actions ────────────────────────────────────────────────────

  setConflictData: (data) => set({ conflictData: data }),
  setConflictCheckDone: (val) => set({ conflictCheckDone: val }),
  setIsInitialSyncDone: (val) => set({ isInitialSyncDone: val }),
  setSyncError: (err) => set({ syncError: err }),

  pauseCloudSync: () => set({ isSyncPaused: true }),
  resumeCloudSync: () => set({ isSyncPaused: false }),

  /**
   * Reset all sync flags (e.g. on sign-out).
   */
  resetSyncState: () => set({
    conflictData: null,
    conflictCheckDone: false,
    isInitialSyncDone: false,
    isSyncPaused: false,
    syncError: null,
    userClans: [],
  }),

  // ── Clan Actions ────────────────────────────────────────────────────

  setUserClans: (clans) => set({ userClans: clans }),

  refreshUserClans: async () => {
    try {
      const clans = await cloudSync.getUserClans();
      set({ userClans: clans });
      return clans;
    } catch (e) {
      logger.error('Failed to refresh clans', e);
      return [];
    }
  },

  // ── Conflict Resolution ─────────────────────────────────────────────

  /**
   * Resolve a data conflict.
   * @param {'restore'|'upload'} action
   * @param {Object} deps - { loadFromCloud, syncWithCloud, hasGuestData, clearAnonymousData, mergeWithAnonymousData, updateSettings }
   */
  onResolveConflict: async (action, deps) => {
    const { loadFromCloud, syncWithCloud, hasGuestData, clearAnonymousData, mergeWithAnonymousData, updateSettings } = deps;
    try {
      const hasGuest = hasGuestData();
      if (action === 'restore') {
        if (hasGuest) {
          clearAnonymousData();
          localStorage.removeItem('oneup_settings');
          localStorage.removeItem('oneup_routines');
          localStorage.removeItem('oneup_custom_exercises');
        }
        await loadFromCloud();
      } else if (action === 'upload') {
        if (hasGuest) {
          const guestSettings = localStorage.getItem('oneup_settings');
          if (guestSettings) {
            try {
              const parsed = JSON.parse(guestSettings);
              if (parsed.exerciseDifficulties) {
                updateSettings(prev => ({
                  exerciseDifficulties: {
                    ...parsed.exerciseDifficulties,
                    ...(prev.exerciseDifficulties || {}),
                  },
                }));
              }
            } catch { /* ignore */ }
          }
          mergeWithAnonymousData();
          clearAnonymousData();
          localStorage.removeItem('oneup_settings');
        }
        await syncWithCloud();
      }
      set({ conflictData: null, conflictCheckDone: true });
    } catch (error) {
      logger.error('Conflict resolution failed:', error);
    }
  },
}));
