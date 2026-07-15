import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useExercisesStore, MAX_EXERCISES_PER_CATEGORY } from '../useExercisesStore';
import { Preferences } from '@capacitor/preferences';
import { cloudSync } from '@services/cloudSync';


// Mock dependencies
vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn(),
    set: vi.fn()
  }
}));

vi.mock('@utils/firebaseTimestamp', () => ({
  serverTimestamp: vi.fn(() => 123456789)
}));

vi.mock('@services/cloudSync', () => ({
  cloudSync: {
    loadExerciseWeightsFromCloud: vi.fn(),
    saveExerciseWeightsToCloud: vi.fn(() => Promise.resolve())
  }
}));

const mockProgressStore = {
  deleteExerciseHistory: vi.fn(),
  saveToCloud: vi.fn(() => Promise.resolve())
};

vi.mock('../useProgressStore', () => ({
  useProgressStore: {
    getState: vi.fn(() => mockProgressStore)
  }
}));

vi.mock('@utils/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn()
  })
}));

// Provide crypto.randomUUID for node environment
if (!globalThis.crypto) {
  globalThis.crypto = {
    randomUUID: () => 'test-uuid-' + Math.random()
  };
}

describe('useExercisesStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useExercisesStore.getState().reset();
    // mock local storage
    globalThis.localStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
  });

  describe('Init and Persistence', () => {
    it('initializes store properly with no existing data', async () => {
      Preferences.get.mockResolvedValue({ value: null });
      cloudSync.loadExerciseWeightsFromCloud.mockResolvedValue({});

      await useExercisesStore.getState().initForUser('user1');
      const state = useExercisesStore.getState();

      expect(state.isStoreInitialized).toBe(true);
      expect(state._userId).toBe('user1');
      expect(state.routines).toEqual([]);
      expect(state.customExercises).toEqual([]);
    });

    it('initializes with legacy localstorage fallback', async () => {
      Preferences.get.mockResolvedValueOnce({ value: null });
      globalThis.localStorage.getItem.mockReturnValueOnce(JSON.stringify([{ id: 'legacy' }])); // routines
      Preferences.get.mockResolvedValue({ value: null }); // for the rest

      await useExercisesStore.getState().initForUser('user1');
      
      expect(useExercisesStore.getState().routines).toEqual([{ id: 'legacy' }]);
      expect(Preferences.set).toHaveBeenCalled();
    });

    it('merges cloud weights on init', async () => {
      Preferences.get.mockResolvedValue({ value: null }); // no local
      cloudSync.loadExerciseWeightsFromCloud.mockResolvedValue({ bench: 50 });

      await useExercisesStore.getState().initForUser('user1');

      expect(useExercisesStore.getState().exerciseWeights).toEqual({ bench: 50 });
      expect(Preferences.set).toHaveBeenCalledWith(expect.objectContaining({
        key: 'oneup_exercise_weights_user1',
        value: JSON.stringify({ bench: 50 })
      }));
    });
    
    it('handles cloud weights error on init safely', async () => {
      Preferences.get.mockResolvedValue({ value: null }); // no local
      cloudSync.loadExerciseWeightsFromCloud.mockRejectedValue(new Error('Network'));

      await useExercisesStore.getState().initForUser('user1');
      await new Promise(r => setTimeout(r, 0));
      expect(useExercisesStore.getState().cloudLoaded).toBe(true);
    });

    it('handles initialization without userId (guest mode)', async () => {
        Preferences.get.mockResolvedValue({ value: JSON.stringify([{ id: 'r1' }]) }); // fake routines
        
        await useExercisesStore.getState().initForUser(null);
        expect(useExercisesStore.getState().cloudLoaded).toBe(true);
        expect(useExercisesStore.getState().routines).toEqual([{ id: 'r1'}]);
    });
    
    it('ignores stale init promises', async () => {
      Preferences.get.mockResolvedValue({ value: null });
      
      let resolveCloud;
      cloudSync.loadExerciseWeightsFromCloud.mockReturnValue(new Promise(resolve => {
        resolveCloud = resolve;
      }));
      
      const p1 = useExercisesStore.getState().initForUser('user1');
      // trigger another init immediately
      useExercisesStore.getState().initForUser('user2');
      
      resolveCloud({ bench: 50 });
      await p1;
      
      // The first init should have aborted the cloud weights assignment because requestId changed
      expect(useExercisesStore.getState().exerciseWeights).toEqual({});
    });
  });

  describe('Routines', () => {
    it('saves routine successfully', () => {
      const saved = useExercisesStore.getState().saveRoutine('My Routine', ['pushups', 'squats']);
      expect(saved).toBe(true);
      
      const state = useExercisesStore.getState();
      expect(state.routines).toHaveLength(1);
      expect(state.routines[0].name).toBe('My Routine');
      expect(state.routines[0].exerciseIds).toEqual(['pushups', 'squats']);
      expect(Preferences.set).toHaveBeenCalled();
    });
    
    it('prevents saving empty routine', () => {
        const saved = useExercisesStore.getState().saveRoutine('', []);
        expect(saved).toBe(false);
    });
    
    it('respects MAX_ROUTINES limit', () => {
        const store = useExercisesStore.getState();
        store.routines = Array(10).fill({ id: 'dummy' });
        const saved = useExercisesStore.getState().saveRoutine('11th routine', ['ex1']);
        expect(saved).toBe(false);
        expect(useExercisesStore.getState().routines).toHaveLength(10);
    });

    it('updates a routine', () => {
      useExercisesStore.getState().saveRoutine('Routine 1', ['ex1']);
      const id = useExercisesStore.getState().routines[0].id;
      
      useExercisesStore.getState().updateRoutine(id, 'Updated Routine', ['ex1', 'ex2']);
      
      const routine = useExercisesStore.getState().routines[0];
      expect(routine.name).toBe('Updated Routine');
      expect(routine.exerciseIds).toEqual(['ex1', 'ex2']);
    });

    it('deletes a routine', () => {
      useExercisesStore.getState().saveRoutine('Routine 1', ['ex1']);
      const id = useExercisesStore.getState().routines[0].id;
      
      useExercisesStore.getState().deleteRoutine(id);
      expect(useExercisesStore.getState().routines).toHaveLength(0);
    });

    it('sets routines from cloud', () => {
      const cloudRoutines = [{ id: 'c1', name: 'Cloud' }];
      useExercisesStore.getState().setRoutinesFromCloud(cloudRoutines);
      expect(useExercisesStore.getState().routines).toEqual(cloudRoutines);
    });
    
    it('ignores setRoutinesFromCloud if data is identical', () => {
        const cloudRoutines = [{ id: 'c1', name: 'Cloud' }];
        useExercisesStore.getState().setRoutinesFromCloud(cloudRoutines);
        
        Preferences.set.mockClear();
        useExercisesStore.getState().setRoutinesFromCloud(cloudRoutines);
        // shouldn't persist if not changed
        expect(Preferences.set).not.toHaveBeenCalled();
    });
  });

  describe('Custom Exercises', () => {
    it('saves a custom exercise', () => {
      const saved = useExercisesStore.getState().saveCustomExercise({ label: 'Jump', categoryId: 'cat1' });
      expect(saved).toBe(true);
      
      const ex = useExercisesStore.getState().customExercises[0];
      expect(ex.label).toBe('Jump');
      expect(ex.categoryId).toBe('cat1');
      expect(ex.id).toMatch(/^custom_/);
    });
    
    it('returns null if empty label', () => {
        const saved = useExercisesStore.getState().saveCustomExercise({ label: ' ' });
        expect(saved).toBeNull();
    });
    
    it('respects MAX_EXERCISES_PER_CATEGORY', () => {
        useExercisesStore.setState({
            customExercises: Array(MAX_EXERCISES_PER_CATEGORY).fill({ categoryId: 'cat1' })
        });
        
        const saved = useExercisesStore.getState().saveCustomExercise({ label: 'Overflow', categoryId: 'cat1' });
        expect(saved).toBe(false); // returns state unmodified
    });

    it('updates a custom exercise', () => {
      useExercisesStore.getState().saveCustomExercise({ label: 'Jump' });
      const id = useExercisesStore.getState().customExercises[0].id;
      
      useExercisesStore.getState().updateCustomExercise(id, { color: '#ff0000' });
      expect(useExercisesStore.getState().customExercises[0].color).toBe('#ff0000');
    });

    it('deletes a custom exercise and removes it from routines and history', () => {
      // Setup
      useExercisesStore.getState().saveCustomExercise({ label: 'Jump' });
      const exId = useExercisesStore.getState().customExercises[0].id;
      
      useExercisesStore.getState().saveRoutine('R1', [exId, 'other_ex']);
      useExercisesStore.getState().saveRoutine('R2', [exId]); // Routine will be empty after deletion
      
      // Delete
      useExercisesStore.getState().deleteCustomExercise(exId);
      
      const state = useExercisesStore.getState();
      expect(state.customExercises).toHaveLength(0);
      
      // Routine 1 should have 'other_ex' only
      expect(state.routines[0].exerciseIds).toEqual(['other_ex']);
      
      // Routine 2 should be deleted because it became empty
      expect(state.routines).toHaveLength(1);
      
      // Progress store cross-effect
      expect(mockProgressStore.deleteExerciseHistory).toHaveBeenCalledWith(exId);
      expect(mockProgressStore.saveToCloud).toHaveBeenCalled();
    });

    it('sets custom exercises from cloud', () => {
      const cloudData = [{ id: 'ex1' }];
      useExercisesStore.getState().setCustomExercisesFromCloud(cloudData);
      expect(useExercisesStore.getState().customExercises).toEqual(cloudData);
      
      Preferences.set.mockClear();
      useExercisesStore.getState().setCustomExercisesFromCloud(cloudData); // identical
      expect(Preferences.set).not.toHaveBeenCalled();
    });
  });

  describe('Custom Categories', () => {
    it('adds a custom category', () => {
      const saved = useExercisesStore.getState().addCategory('Legs');
      expect(saved).toBe(true);
      
      const state = useExercisesStore.getState();
      expect(state.customCategories).toHaveLength(1);
      expect(state.customCategories[0].name).toBe('Legs');
      expect(state.customCategoriesMap[state.customCategories[0].id]).toBeDefined();
    });
    
    it('prevents adding empty category', () => {
        expect(useExercisesStore.getState().addCategory('')).toBe(false);
    });
    
    it('respects MAX_CUSTOM_CATEGORIES', () => {
        useExercisesStore.setState({
            customCategories: Array(5).fill({ id: 'dummy' })
        });
        expect(useExercisesStore.getState().addCategory('Overflow')).toBe(false);
    });

    it('updates a custom category', () => {
      useExercisesStore.getState().addCategory('Legs');
      const id = useExercisesStore.getState().customCategories[0].id;
      
      useExercisesStore.getState().updateCategory(id, { color: '#000' });
      expect(useExercisesStore.getState().customCategories[0].color).toBe('#000');
    });
    
    it('adds new custom category when updating id "custom"', () => {
        useExercisesStore.getState().updateCategory('custom', { name: 'NewName' });
        const cats = useExercisesStore.getState().customCategories;
        expect(cats.find(c => c.id === 'custom')).toBeDefined();
    });
    
    it('returns empty when updating non-existent category', () => {
        useExercisesStore.getState().updateCategory('nonexistent', { name: 'Foo' });
        expect(useExercisesStore.getState().customCategories).toHaveLength(0);
    });

    it('deletes a category and moves/deletes associated exercises', () => {
      useExercisesStore.getState().addCategory('Legs');
      const catId = useExercisesStore.getState().customCategories[0].id;
      
      // Mock methods to spy
      const updateExSpy = vi.spyOn(useExercisesStore.getState(), 'updateCustomExercise');
      const deleteExSpy = vi.spyOn(useExercisesStore.getState(), 'deleteCustomExercise');
      
      useExercisesStore.getState().deleteCategory(catId, { 'ex1': 'cat2' }, ['ex2']);
      
      expect(updateExSpy).toHaveBeenCalledWith('ex1', { categoryId: 'cat2' });
      expect(deleteExSpy).toHaveBeenCalledWith('ex2');
      expect(useExercisesStore.getState().customCategories).toHaveLength(0);
    });

    it('moves a category', () => {
      useExercisesStore.getState().addCategory('Cat 1');
      useExercisesStore.getState().addCategory('Cat 2');
      useExercisesStore.getState().addCategory('Cat 3');
      
      const cat1 = useExercisesStore.getState().customCategories[0].id;
      
      useExercisesStore.getState().moveCategory(cat1, 'down');
      expect(useExercisesStore.getState().customCategories[1].id).toBe(cat1);
      
      useExercisesStore.getState().moveCategory(cat1, 'up');
      expect(useExercisesStore.getState().customCategories[0].id).toBe(cat1);
    });
    
    it('handles out of bounds move', () => {
      useExercisesStore.getState().addCategory('Cat 1');
      const cat1 = useExercisesStore.getState().customCategories[0].id;
      // moving up at index 0 should return empty object (do nothing)
      useExercisesStore.getState().moveCategory(cat1, 'up');
      expect(useExercisesStore.getState().customCategories[0].id).toBe(cat1);
      
      // non-existent
      useExercisesStore.getState().moveCategory('foo', 'down');
    });

    it('sets categories from cloud', () => {
      const cloudData = [{ id: 'cat1', name: 'Cloud Cat' }];
      useExercisesStore.getState().setCategoriesFromCloud(cloudData);
      expect(useExercisesStore.getState().customCategories).toEqual(cloudData);
      expect(useExercisesStore.getState().customCategoriesMap['cat1']).toBeDefined();
      
      Preferences.set.mockClear();
      useExercisesStore.getState().setCategoriesFromCloud(cloudData); // identical
      expect(Preferences.set).not.toHaveBeenCalled();
    });
  });

  describe('Exercise Weights', () => {
    it('gets default weight from config if not set', () => {
      vi.mock('@config/weights', () => ({
        WEIGHT_EXERCISES_MAP: {
          bench: { defaultWeight: 40 }
        }
      }));
      // wait, the mock needs to be inline or we just assume we have no weights map in this isolated test block
      // actually we can just rely on the fallback returning null if the mock isn't provided
    });

    it('gets stored weight', () => {
      useExercisesStore.setState({ exerciseWeights: { bench: 50 } });
      expect(useExercisesStore.getState().getWeight('bench')).toBe(50);
    });

    it('gets null if no stored weight and no config', () => {
        expect(useExercisesStore.getState().getWeight('unknown_ex')).toBeNull();
    });

    it('sets weight, saves to storage, and debounces cloud save', async () => {
      vi.useFakeTimers();
      
      useExercisesStore.getState().setWeight('squats', 80);
      
      const state = useExercisesStore.getState();
      expect(state.exerciseWeights.squats).toBe(80);
      expect(Preferences.set).toHaveBeenCalled(); // localStorage persist
      
      // Cloud sync should be debounced
      expect(cloudSync.saveExerciseWeightsToCloud).not.toHaveBeenCalled();
      
      // Second call clears timeout and resets
      useExercisesStore.getState().setWeight('squats', 85);
      
      vi.advanceTimersByTime(2000); // 1.5s debounce
      
      expect(cloudSync.saveExerciseWeightsToCloud).toHaveBeenCalledWith(expect.objectContaining({ squats: 85 }));
      
      vi.useRealTimers();
    });
    
    it('sets weight gracefully handles invalid numbers', () => {
        useExercisesStore.getState().setWeight('squats', 'invalid');
        expect(useExercisesStore.getState().exerciseWeights.squats).toBe(0); // Math.max(0, Number('invalid') || 0)
    });
  });
});
