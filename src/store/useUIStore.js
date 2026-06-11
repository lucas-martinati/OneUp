import { create } from 'zustand';
import { isWorkoutSessionStarted } from '../utils/workoutSessionStorage';

/**
 * UI store — modal visibility and dashboard-level UI state.
 *
 * Modals are tracked in a LIFO stack so the hardware back button always
 * closes the most recently opened one. Any component can open/close a modal
 * directly from this store, without prop drilling through the Dashboard tree.
 *
 * Modal ids: 'calendar' | 'stats' | 'settings' | 'counter' | 'leaderboard' |
 * 'achievements' | 'session' | 'customExercises' | 'categoryManager' | 'admin'
 */
export const useUIStore = create((set, get) => ({
  // ── Modals ───────────────────────────────────────────────────────────
  modals: {},
  modalStack: [],

  openModal: (id) => set(s => ({
    modals: { ...s.modals, [id]: true },
    modalStack: [...s.modalStack.filter(m => m !== id), id],
  })),

  closeModal: (id) => set(s => ({
    modals: { ...s.modals, [id]: false },
    modalStack: s.modalStack.filter(m => m !== id),
  })),

  /** Closes the most recently opened modal. Returns true if one was closed. */
  closeTopModal: () => {
    const { modalStack, closeModal } = get();
    if (modalStack.length === 0) return false;
    closeModal(modalStack[modalStack.length - 1]);
    return true;
  },

  // ── Settings modal entry point ───────────────────────────────────────
  // The Pro store lives inside Settings; openStore lands directly on it.
  openStoreDirectly: false,
  openStore: () => {
    set({ openStoreDirectly: true });
    get().openModal('settings');
  },
  closeSettings: () => {
    get().closeModal('settings');
    set({ openStoreDirectly: false });
  },

  // ── Custom exercises modal target category ──────────────────────────
  // null targets the default "custom" category.
  customExModalCatId: null,
  openCustomExercises: (catId = null) => {
    set({ customExModalCatId: catId });
    get().openModal('customExercises');
  },
  closeCustomExercises: () => {
    get().closeModal('customExercises');
    set({ customExModalCatId: null });
  },

  // ── Workout session UI state ─────────────────────────────────────────
  sessionInProgress: isWorkoutSessionStarted(),
  setSessionInProgress: (value) => set({ sessionInProgress: value }),

  // 'config' opens the session builder, 'running' resumes the live session.
  sessionMode: 'config',
  openSession: (mode) => {
    set({ sessionMode: mode });
    get().openModal('session');
  },
}));
