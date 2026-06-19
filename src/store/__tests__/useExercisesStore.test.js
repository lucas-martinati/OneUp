import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useExercisesStore, MAX_EXERCISES_PER_CATEGORY } from '../useExercisesStore';
import { Preferences } from '@capacitor/preferences';
import { cloudSync } from '../../services/cloudSync';

// Mock Preferences
vi.mock('@capacitor/preferences', () => {
  const mem = new Map();
  return {
    Preferences: {
      get: vi.fn(async ({ key }) => ({ value: mem.has(key) ? mem.get(key) : null })),
      set: vi.fn(async ({ key, value }) => { mem.set(key, value); }),
      remove: vi.fn(async ({ key }) => { mem.delete(key); }),
      _mem: mem,
    },
  };
});

// Mock cloudSync
vi.mock('../../services/cloudSync', () => ({
  cloudSync: {
    loadExerciseWeightsFromCloud: vi.fn(async () => null),
    saveExerciseWeightsToCloud: vi.fn(async () => {}),
  },
}));

// Mock useProgressStore
const deleteExerciseHistoryMock = vi.fn();
const saveToCloudMock = vi.fn(async () => ({ success: true }));

vi.mock('../useProgressStore', () => ({
  useProgressStore: {
    getState: () => ({
      deleteExerciseHistory: deleteExerciseHistoryMock,
      saveToCloud: saveToCloudMock,
    }),
  },
}));

// Mock firebaseTimestamp utils
vi.mock('../../utils/firebaseTimestamp', () => ({
  serverTimestamp: () => 'mock-server-timestamp',
}));

describe('useExercisesStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Preferences._mem.clear();
    localStorage.clear();
    useExercisesStore.getState().reset();

    // Mock global crypto.randomUUID
    if (typeof globalThis.crypto === 'undefined') {
      globalThis.crypto = {};
    }
    let uuidCounter = 0;
    globalThis.crypto.randomUUID = () => `mock-uuid-${++uuidCounter}`;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('initializes default empty lists when no stored data', async () => {
      await useExercisesStore.getState().initForUser('user1');
      const state = useExercisesStore.getState();

      expect(state.isStoreInitialized).toBe(true);
      expect(state._userId).toBe('user1');
      expect(state.routines).toEqual([]);
      expect(state.customExercises).toEqual([]);
      expect(state.customCategories).toEqual([]);
      expect(state.exerciseWeights).toEqual({});
    });

    it('loads existing data from Capacitor Preferences', async () => {
      Preferences._mem.set('oneup_routines_user1', JSON.stringify([{ id: 'r1', name: 'Routine 1', exerciseIds: [] }]));
      Preferences._mem.set('oneup_custom_exercises_user1', JSON.stringify([{ id: 'ex1', label: 'Exercise 1' }]));
      Preferences._mem.set('oneup_custom_categories_user1', JSON.stringify([{ id: 'cat1', name: 'Cat 1' }]));
      Preferences._mem.set('oneup_exercise_weights_user1', JSON.stringify({ ex1: 20 }));

      await useExercisesStore.getState().initForUser('user1');
      const state = useExercisesStore.getState();

      expect(state.routines).toHaveLength(1);
      expect(state.routines[0].name).toBe('Routine 1');
      expect(state.customExercises).toHaveLength(1);
      expect(state.customExercises[0].label).toBe('Exercise 1');
      expect(state.customCategories).toHaveLength(1);
      expect(state.customCategories[0].name).toBe('Cat 1');
      expect(state.exerciseWeights).toEqual({ ex1: 20 });
    });

    it('loads exercise weights from cloud and merges them', async () => {
      cloudSync.loadExerciseWeightsFromCloud.mockResolvedValueOnce({ ex1: 30, ex2: 40 });
      Preferences._mem.set('oneup_exercise_weights_user1', JSON.stringify({ ex1: 20 }));

      await useExercisesStore.getState().initForUser('user1');
      
      // Let the promise resolve
      await new Promise((resolve) => setTimeout(resolve, 0));

      const state = useExercisesStore.getState();
      // Local weights take priority or merge
      expect(state.exerciseWeights).toEqual({ ex1: 20, ex2: 40 });
      expect(state.cloudLoaded).toBe(true);
    });
  });

  describe('reset', () => {
    it('clears user data and resets state', async () => {
      Preferences._mem.set('oneup_routines_user1', JSON.stringify([{ id: 'r1', name: 'Routine 1' }]));
      await useExercisesStore.getState().initForUser('user1');
      
      useExercisesStore.getState().reset();
      const state = useExercisesStore.getState();

      expect(state.isStoreInitialized).toBe(false);
      expect(state._userId).toBeNull();
      expect(state.routines).toEqual([]);
    });
  });

  describe('routines CRUD', () => {
    beforeEach(async () => {
      await useExercisesStore.getState().initForUser('user1');
    });

    it('saves a new routine', () => {
      const success = useExercisesStore.getState().saveRoutine('My Routine', ['ex1', 'ex2']);
      expect(success).toBe(true);

      const state = useExercisesStore.getState();
      expect(state.routines).toHaveLength(1);
      expect(state.routines[0]).toEqual({
        id: 'mock-uuid-1',
        name: 'My Routine',
        exerciseIds: ['ex1', 'ex2'],
        createdAt: 'mock-server-timestamp',
      });
      // Verifies storage sync
      expect(Preferences._mem.get('oneup_routines_user1')).toBeDefined();
    });

    it('updates an existing routine', () => {
      useExercisesStore.getState().saveRoutine('My Routine', ['ex1', 'ex2']);
      useExercisesStore.getState().updateRoutine('mock-uuid-1', 'Updated Routine', ['ex3']);

      const state = useExercisesStore.getState();
      expect(state.routines[0].name).toBe('Updated Routine');
      expect(state.routines[0].exerciseIds).toEqual(['ex3']);
    });

    it('deletes a routine', () => {
      useExercisesStore.getState().saveRoutine('My Routine', ['ex1', 'ex2']);
      useExercisesStore.getState().deleteRoutine('mock-uuid-1');

      const state = useExercisesStore.getState();
      expect(state.routines).toHaveLength(0);
    });

    it('refuses to save a routine with an empty name or no exercises', () => {
      expect(useExercisesStore.getState().saveRoutine('', ['ex1'])).toBe(false);
      expect(useExercisesStore.getState().saveRoutine('  ', ['ex1'])).toBe(false);
      expect(useExercisesStore.getState().saveRoutine('Name', [])).toBe(false);
      expect(useExercisesStore.getState().routines).toHaveLength(0);
    });

    it('sets routines from cloud properly', () => {
      useExercisesStore.getState().saveRoutine('Local', ['ex1']);
      
      const cloudRoutines = [{ id: 'cloud1', name: 'Cloud', exerciseIds: ['ex2'] }];
      useExercisesStore.getState().setRoutinesFromCloud(cloudRoutines);
      
      expect(useExercisesStore.getState().routines).toEqual(cloudRoutines);
      
      // Setting exact same routines should not trigger state change (optimization)
      const prevState = useExercisesStore.getState().routines;
      useExercisesStore.getState().setRoutinesFromCloud([{ id: 'cloud1', name: 'Cloud', exerciseIds: ['ex2'] }]);
      expect(useExercisesStore.getState().routines).toBe(prevState); // exact same reference
    });
  });

  describe('custom exercises CRUD', () => {
    beforeEach(async () => {
      await useExercisesStore.getState().initForUser('user1');
    });

    it('saves a custom exercise', () => {
      const success = useExercisesStore.getState().saveCustomExercise({
        label: 'My Custom Exercise',
        categoryId: 'custom',
      });
      expect(success).toBe(true);

      const state = useExercisesStore.getState();
      expect(state.customExercises).toHaveLength(1);
      expect(state.customExercises[0]).toEqual({
        id: 'custom_mock-uuid-1',
        label: 'My Custom Exercise',
        icon: 'Star',
        color: '#8b5cf6',
        type: 'counter',
        gradient: ['#7c3aed', '#8b5cf6'],
        multiplier: 1.0,
        categoryId: 'custom',
        createdAt: 'mock-server-timestamp',
      });
    });

    it('limits exercises per category to MAX_EXERCISES_PER_CATEGORY', () => {
      for (let i = 0; i < MAX_EXERCISES_PER_CATEGORY; i++) {
        const res = useExercisesStore.getState().saveCustomExercise({ label: `Ex ${i}`, categoryId: 'custom' });
        expect(res).toBe(true);
      }
      
      // 13th exercise should fail
      const result = useExercisesStore.getState().saveCustomExercise({ label: 'Overflow', categoryId: 'custom' });
      expect(result).toBe(false);
      expect(useExercisesStore.getState().customExercises).toHaveLength(MAX_EXERCISES_PER_CATEGORY);
    });

    it('updates a custom exercise', () => {
      useExercisesStore.getState().saveCustomExercise({ label: 'My Custom Exercise' });
      useExercisesStore.getState().updateCustomExercise('custom_mock-uuid-1', { label: 'Updated Exercise Name' });

      expect(useExercisesStore.getState().customExercises[0].label).toBe('Updated Exercise Name');
    });

    it('deletes a custom exercise, updating routines and clearing history', () => {
      // 1. Create a routine containing the exercise
      useExercisesStore.getState().saveRoutine('Routine with Custom', ['custom_mock-uuid-2', 'other_ex']);
      useExercisesStore.getState().saveCustomExercise({ label: 'My Custom Exercise' });

      // 2. Delete the exercise
      useExercisesStore.getState().deleteCustomExercise('custom_mock-uuid-2');

      // 3. Verify deleted from customExercises list
      expect(useExercisesStore.getState().customExercises).toHaveLength(0);

      // 4. Verify useProgressStore was called to clear history
      expect(deleteExerciseHistoryMock).toHaveBeenCalledWith('custom_mock-uuid-2');
      expect(saveToCloudMock).toHaveBeenCalled();

      // 5. Verify exercise removed from routine
      expect(useExercisesStore.getState().routines[0].exerciseIds).toEqual(['other_ex']);
    });

    it('deletes routine if the deleted custom exercise was the only one in it', () => {
      useExercisesStore.getState().saveRoutine('Routine', ['custom_mock-uuid-2']);
      useExercisesStore.getState().saveCustomExercise({ label: 'My Custom Exercise' });
      
      useExercisesStore.getState().deleteCustomExercise('custom_mock-uuid-2');
      
      // Routine should be deleted entirely because it's now empty
      expect(useExercisesStore.getState().routines).toHaveLength(0);
    });

    it('sets custom exercises from cloud properly', () => {
      const cloudData = [{ id: 'cloud_ex', label: 'Cloud Ex' }];
      useExercisesStore.getState().setCustomExercisesFromCloud(cloudData);
      
      expect(useExercisesStore.getState().customExercises).toEqual(cloudData);
    });
  });

  describe('custom categories CRUD', () => {
    beforeEach(async () => {
      await useExercisesStore.getState().initForUser('user1');
    });

    it('adds a custom category', () => {
      const result = useExercisesStore.getState().addCategory('Yoga', '#ff00ff');
      expect(result).toBe(true);

      const state = useExercisesStore.getState();
      expect(state.customCategories).toHaveLength(1);
      expect(state.customCategories[0].name).toBe('Yoga');
      expect(state.customCategoriesMap[state.customCategories[0].id]).toBeDefined();
    });

    it('deletes a category, handles exercises target moving / deletion', () => {
      useExercisesStore.getState().addCategory('Yoga');
      const catId = useExercisesStore.getState().customCategories[0].id;
      
      // Save an exercise under this category
      useExercisesStore.getState().saveCustomExercise({ label: 'Pose 1', categoryId: catId });
      const exId = useExercisesStore.getState().customExercises[0].id;

      // Delete the category, moving exercise exId to target category 'custom'
      useExercisesStore.getState().deleteCategory(catId, { [exId]: 'custom' }, []);

      expect(useExercisesStore.getState().customCategories).toHaveLength(0);
      expect(useExercisesStore.getState().customExercises[0].categoryId).toBe('custom');
    });

    it('updates a custom category', () => {
      useExercisesStore.getState().addCategory('Yoga', '#ff00ff');
      const catId = useExercisesStore.getState().customCategories[0].id;
      
      useExercisesStore.getState().updateCategory(catId, { name: 'Pilates' });
      
      expect(useExercisesStore.getState().customCategories[0].name).toBe('Pilates');
    });

    it('moves a custom category up and down', () => {
      useExercisesStore.getState().addCategory('Cat1');
      useExercisesStore.getState().addCategory('Cat2');
      useExercisesStore.getState().addCategory('Cat3');
      
      const cats = useExercisesStore.getState().customCategories;
      const cat2Id = cats[1].id;
      
      // Move Cat2 up
      useExercisesStore.getState().moveCategory(cat2Id, 'up');
      expect(useExercisesStore.getState().customCategories[0].name).toBe('Cat2');
      expect(useExercisesStore.getState().customCategories[1].name).toBe('Cat1');
      
      // Move Cat2 down
      useExercisesStore.getState().moveCategory(cat2Id, 'down');
      expect(useExercisesStore.getState().customCategories[0].name).toBe('Cat1');
      expect(useExercisesStore.getState().customCategories[1].name).toBe('Cat2');
    });

    it('sets categories from cloud', () => {
      const cloudData = [{ id: 'c1', name: 'Cloud Cat' }];
      useExercisesStore.getState().setCategoriesFromCloud(cloudData);
      expect(useExercisesStore.getState().customCategories).toEqual(cloudData);
      expect(useExercisesStore.getState().customCategoriesMap['c1']).toBeDefined();
    });

    it('moveCategory handles invalid id and out of bounds', () => {
      useExercisesStore.getState().addCategory('Cat1');
      const cats = useExercisesStore.getState().customCategories;
      const cat1Id = cats[0].id;

      // Invalid ID
      useExercisesStore.getState().moveCategory('nonexistent', 'up');
      
      // Out of bounds (up when already at top)
      useExercisesStore.getState().moveCategory(cat1Id, 'up');

      // Out of bounds (down when already at bottom)
      useExercisesStore.getState().moveCategory(cat1Id, 'down');
      
      // Still only 1 category
      expect(useExercisesStore.getState().customCategories).toHaveLength(1);
    });

    it('setCategoriesFromCloud handles non-arrays and exact matches', () => {
      const cloudData = [{ id: 'c1', name: 'Cloud Cat' }];
      useExercisesStore.getState().setCategoriesFromCloud(cloudData);
      
      // Exact match
      const prevState = useExercisesStore.getState().customCategories;
      useExercisesStore.getState().setCategoriesFromCloud(cloudData);
      expect(useExercisesStore.getState().customCategories).toBe(prevState);

      // Non-array
      useExercisesStore.getState().setCategoriesFromCloud(null);
      expect(useExercisesStore.getState().customCategories).toBe(prevState);
    });
  });

  describe('exercise weights', () => {
    beforeEach(async () => {
      await useExercisesStore.getState().initForUser('user1');
    });

    it('gets the weight (either user-defined, config default, or null)', () => {
      // For pushups (standard bodyweight), getWeight returns null (or config default)
      expect(useExercisesStore.getState().getWeight('pushups')).toBeNull();

      // Set weight and get it back
      useExercisesStore.getState().setWeight('pushups', 15.5);
      expect(useExercisesStore.getState().getWeight('pushups')).toBe(15.5);
    });

    it('sets weight and triggers cloud save with debounce', () => {
      vi.useFakeTimers();
      useExercisesStore.getState().setWeight('bench', 60);

      expect(useExercisesStore.getState().exerciseWeights['bench']).toBe(60);
      expect(cloudSync.saveExerciseWeightsToCloud).not.toHaveBeenCalled();

      // Advance timers by 1500ms
      vi.advanceTimersByTime(1500);
      expect(cloudSync.saveExerciseWeightsToCloud).toHaveBeenCalledWith({ bench: 60 });
      vi.useRealTimers();
    });

    it('clamps negative weight to 0', () => {
      useExercisesStore.getState().setWeight('bench', -10);
      expect(useExercisesStore.getState().exerciseWeights['bench']).toBe(0);
    });

    it('setWeight cloud sync catches errors', async () => {
      vi.useFakeTimers();
      cloudSync.saveExerciseWeightsToCloud.mockRejectedValueOnce(new Error('Network error'));
      useExercisesStore.getState().setWeight('bench', 60);
      vi.advanceTimersByTime(1500);
      await new Promise(r => queueMicrotask(r)); // wait for promise rejection
      vi.useRealTimers();
      // Should not throw, error is caught implicitly.
      expect(useExercisesStore.getState().exerciseWeights['bench']).toBe(60);
    });
  });

  describe('error handling / edge cases', () => {
    it('loadFromStorage handles Preferences.get error', async () => {
      Preferences.get.mockRejectedValueOnce(new Error('PrefError'));
      await useExercisesStore.getState().initForUser(null);
      expect(useExercisesStore.getState().routines).toEqual([]); // defaultValue
    });

    it('loadFromStorage migrates legacy localStorage', async () => {
      localStorage.setItem('oneup_routines', JSON.stringify([{ id: 'legacy' }]));
      await useExercisesStore.getState().initForUser(null);
      expect(useExercisesStore.getState().routines[0].id).toBe('legacy');
    });

    it('saveToStorage handles Preferences.set error', () => {
      Preferences.set.mockRejectedValueOnce(new Error('SetError'));
      useExercisesStore.getState()._persistRoutines(); // does not throw
    });

    it('initForUser handles cloud load error', async () => {
      cloudSync.loadExerciseWeightsFromCloud.mockRejectedValueOnce(new Error('CloudError'));
      await useExercisesStore.getState().initForUser('uid3');
      await new Promise(r => setTimeout(r, 0));
      expect(useExercisesStore.getState().cloudLoaded).toBe(true);
    });

    it('updateCategory handles "custom" id fallback and invalid ids', () => {
      useExercisesStore.getState().updateCategory('custom', { name: 'Custom' });
      const state = useExercisesStore.getState();
      expect(state.customCategoriesMap['custom']).toBeDefined();
      
      // Test invalid ID returns empty state change (line 295)
      useExercisesStore.getState().updateCategory('nonexistent', { name: 'Nope' });
    });

    it('deleteCategory deletes exercises', () => {
      useExercisesStore.getState().saveCustomExercise({ label: 'To delete' });
      const exId = useExercisesStore.getState().customExercises[0].id;
      useExercisesStore.getState().addCategory('CatToDelete');
      const catId = useExercisesStore.getState().customCategories[0].id;

      useExercisesStore.getState().deleteCategory(catId, {}, [exId]);
      expect(useExercisesStore.getState().customExercises.length).toBe(0);
    });
  });
});
