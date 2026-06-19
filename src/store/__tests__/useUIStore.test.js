import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../useUIStore';

const initialState = {
  modals: {},
  modalStack: [],
  openStoreDirectly: false,
  customExModalCatId: null,
  sessionInProgress: false,
  sessionMode: 'config',
};

beforeEach(() => {
  useUIStore.setState(initialState);
});

// ── Modal open/close ────────────────────────────────────────────────────

describe('openModal / closeModal', () => {
  it('opens a modal and pushes it onto the stack', () => {
    useUIStore.getState().openModal('stats');
    expect(useUIStore.getState().modals.stats).toBe(true);
    expect(useUIStore.getState().modalStack).toEqual(['stats']);
  });

  it('closes a modal and removes it from the stack', () => {
    useUIStore.getState().openModal('stats');
    useUIStore.getState().closeModal('stats');
    expect(useUIStore.getState().modals.stats).toBe(false);
    expect(useUIStore.getState().modalStack).toEqual([]);
  });

  it('keeps stack order for multiple modals (LIFO)', () => {
    const { openModal } = useUIStore.getState();
    openModal('stats');
    openModal('achievements');
    expect(useUIStore.getState().modalStack).toEqual(['stats', 'achievements']);
  });

  it('re-opening an already open modal moves it to the top of the stack', () => {
    const { openModal } = useUIStore.getState();
    openModal('stats');
    openModal('settings');
    openModal('stats');
    expect(useUIStore.getState().modalStack).toEqual(['settings', 'stats']);
  });

  it('closing a modal in the middle of the stack preserves the others', () => {
    const { openModal, closeModal } = useUIStore.getState();
    openModal('stats');
    openModal('settings');
    openModal('achievements');
    closeModal('settings');
    expect(useUIStore.getState().modalStack).toEqual(['stats', 'achievements']);
    expect(useUIStore.getState().modals.stats).toBe(true);
    expect(useUIStore.getState().modals.achievements).toBe(true);
  });
});

// ── closeTopModal (hardware back) ───────────────────────────────────────

describe('closeTopModal', () => {
  it('returns false when no modal is open', () => {
    expect(useUIStore.getState().closeTopModal()).toBe(false);
  });

  it('closes the most recently opened modal and returns true', () => {
    const { openModal } = useUIStore.getState();
    openModal('stats');
    openModal('settings');
    expect(useUIStore.getState().closeTopModal()).toBe(true);
    expect(useUIStore.getState().modals.settings).toBe(false);
    expect(useUIStore.getState().modals.stats).toBe(true);
    expect(useUIStore.getState().modalStack).toEqual(['stats']);
  });

  it('closes modals one by one in LIFO order', () => {
    const { openModal } = useUIStore.getState();
    openModal('calendar');
    openModal('stats');
    useUIStore.getState().closeTopModal();
    useUIStore.getState().closeTopModal();
    expect(useUIStore.getState().closeTopModal()).toBe(false);
    expect(useUIStore.getState().modalStack).toEqual([]);
  });
});

// ── Store (boutique) entry point ────────────────────────────────────────

describe('openStore / closeSettings', () => {
  it('openStore opens settings with openStoreDirectly flag', () => {
    useUIStore.getState().openStore();
    expect(useUIStore.getState().modals.settings).toBe(true);
    expect(useUIStore.getState().openStoreDirectly).toBe(true);
  });

  it('closeSettings resets the openStoreDirectly flag', () => {
    useUIStore.getState().openStore();
    useUIStore.getState().closeSettings();
    expect(useUIStore.getState().modals.settings).toBe(false);
    expect(useUIStore.getState().openStoreDirectly).toBe(false);
  });

  it('opening settings normally does not set openStoreDirectly', () => {
    useUIStore.getState().openModal('settings');
    expect(useUIStore.getState().openStoreDirectly).toBe(false);
  });
});

// ── Achievements modal deep-link ────────────────────────────────────────

describe('openAchievements / closeAchievements', () => {
  it('openAchievements sets highlightedBadgeId and opens modal', () => {
    useUIStore.getState().openAchievements('badge_1');
    expect(useUIStore.getState().modals.achievements).toBe(true);
    expect(useUIStore.getState().highlightedBadgeId).toBe('badge_1');
  });

  it('openAchievements defaults to null', () => {
    useUIStore.getState().openAchievements();
    expect(useUIStore.getState().highlightedBadgeId).toBeNull();
  });

  it('closeAchievements resets the highlightedBadgeId', () => {
    useUIStore.getState().openAchievements('badge_1');
    useUIStore.getState().closeAchievements();
    expect(useUIStore.getState().modals.achievements).toBe(false);
    expect(useUIStore.getState().highlightedBadgeId).toBeNull();
  });
});

// ── Custom exercises modal ──────────────────────────────────────────────

describe('openCustomExercises / closeCustomExercises', () => {
  it('opens with a target category id', () => {
    useUIStore.getState().openCustomExercises('cat_abc');
    expect(useUIStore.getState().modals.customExercises).toBe(true);
    expect(useUIStore.getState().customExModalCatId).toBe('cat_abc');
  });

  it('defaults to null category (built-in custom category)', () => {
    useUIStore.getState().openCustomExercises();
    expect(useUIStore.getState().customExModalCatId).toBe(null);
  });

  it('close resets the target category', () => {
    useUIStore.getState().openCustomExercises('cat_abc');
    useUIStore.getState().closeCustomExercises();
    expect(useUIStore.getState().modals.customExercises).toBe(false);
    expect(useUIStore.getState().customExModalCatId).toBe(null);
  });
});

// ── Workout session UI state ────────────────────────────────────────────

describe('session state', () => {
  it('openSession sets the mode and opens the session modal', () => {
    useUIStore.getState().openSession('running');
    expect(useUIStore.getState().sessionMode).toBe('running');
    expect(useUIStore.getState().modals.session).toBe(true);
    expect(useUIStore.getState().modalStack).toContain('session');
  });

  it('openSession in config mode', () => {
    useUIStore.getState().openSession('config');
    expect(useUIStore.getState().sessionMode).toBe('config');
  });

  it('setSessionInProgress toggles the flag', () => {
    useUIStore.getState().setSessionInProgress(true);
    expect(useUIStore.getState().sessionInProgress).toBe(true);
    useUIStore.getState().setSessionInProgress(false);
    expect(useUIStore.getState().sessionInProgress).toBe(false);
  });
});
