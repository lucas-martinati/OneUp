import { create } from 'zustand';
import { Preferences } from '@capacitor/preferences';
import { serverTimestamp } from '@utils/firebaseTimestamp';
import { useProgressStore } from './useProgressStore';
import { WEIGHT_EXERCISES_MAP } from '@config/weights';
import { cloudSync } from '@services/cloudSync';
import { createLogger } from '@utils/logger';

const logger = createLogger('ExercisesStore');

const ROUTINES_KEY = 'oneup_routines';
const CUSTOM_EXERCISES_KEY = 'oneup_custom_exercises';
const CUSTOM_CATEGORIES_KEY = 'oneup_custom_categories';
const WEIGHTS_KEY = 'oneup_exercise_weights';

const MAX_ROUTINES = 10;
export const MAX_EXERCISES_PER_CATEGORY = 12;
const MAX_CUSTOM_CATEGORIES = 5;

async function loadFromStorage(baseKey, userId, defaultValue) {
  try {
    const key = userId ? `${baseKey}_${userId}` : baseKey;
    const { value: saved } = await Preferences.get({ key });
    if (!saved) {
      const legacySaved = localStorage.getItem(key);
      if (legacySaved) {
        await Preferences.set({ key, value: legacySaved });
        return JSON.parse(legacySaved);
      }
      return defaultValue;
    }
    return JSON.parse(saved);
  } catch (err) {
    logger.error(`Failed to load ${baseKey} from storage:`, err);
    return defaultValue;
  }
}

async function saveToStorage(baseKey, userId, state) {
  try {
    const key = userId ? `${baseKey}_${userId}` : baseKey;
    await Preferences.set({ key, value: JSON.stringify(state) });
  } catch (e) {
    logger.error(`Failed to save ${baseKey} to storage:`, e);
  }
}

function updateCategoriesMap(categories) {
  const map = {};
  categories.forEach(cat => { map[cat.id] = cat; });
  return map;
}

export const useExercisesStore = create((set, get) => ({
  // ── State ────────────────────────────────────────────────────────────
  _userId: null,
  routines: [],
  customExercises: [],
  customCategories: [],
  customCategoriesMap: {},
  exerciseWeights: {},
  isStoreInitialized: false,
  cloudLoaded: false,
  _weightCloudTimer: null,
  _initRequestId: null,

  // ── Initialisation & Reset ───────────────────────────────────────────

  initForUser: async (userId) => {
    const requestId = Symbol('init');
    set({ isStoreInitialized: false, cloudLoaded: false, _initRequestId: requestId });
    const [routines, customExercises, customCategories, exerciseWeights] = await Promise.all([
      loadFromStorage(ROUTINES_KEY, userId, []),
      loadFromStorage(CUSTOM_EXERCISES_KEY, userId, []),
      loadFromStorage(CUSTOM_CATEGORIES_KEY, userId, []),
      loadFromStorage(WEIGHTS_KEY, userId, {}),
    ]);

    if (get()._initRequestId !== requestId) return;

    set({
      _userId: userId,
      routines,
      customExercises,
      customCategories,
      customCategoriesMap: updateCategoriesMap(customCategories),
      exerciseWeights,
      isStoreInitialized: true,
    });

    // Load weights from cloud
    if (userId) {
      cloudSync.loadExerciseWeightsFromCloud()
        .then(cloudWeights => {
          if (get()._initRequestId !== requestId) return;

          if (cloudWeights && typeof cloudWeights === 'object') {
            const mergedWeights = { ...cloudWeights, ...get().exerciseWeights };
            set({ exerciseWeights: mergedWeights, cloudLoaded: true });
            saveToStorage(WEIGHTS_KEY, userId, mergedWeights);
          } else {
            set({ cloudLoaded: true });
          }
        })
        .catch(() => {
          if (get()._initRequestId !== requestId) return;
          set({ cloudLoaded: true });
        });
    } else {
      set({ cloudLoaded: true });
    }
  },

  reset: () => {
    if (get()._weightCloudTimer) clearTimeout(get()._weightCloudTimer);
    set({
      _userId: null,
      routines: [],
      customExercises: [],
      customCategories: [],
      customCategoriesMap: {},
      exerciseWeights: {},
      isStoreInitialized: false,
      cloudLoaded: false,
      _weightCloudTimer: null,
      _initRequestId: null,
    });
  },

  // ── Persistence Helpers ─────────────────────────────────────────────

  _persistRoutines: () => saveToStorage(ROUTINES_KEY, get()._userId, get().routines),
  _persistCustomExercises: () => saveToStorage(CUSTOM_EXERCISES_KEY, get()._userId, get().customExercises),
  _persistCustomCategories: () => saveToStorage(CUSTOM_CATEGORIES_KEY, get()._userId, get().customCategories),
  _persistExerciseWeights: () => saveToStorage(WEIGHTS_KEY, get()._userId, get().exerciseWeights),

  // ── Routines CRUD ───────────────────────────────────────────────────

  saveRoutine: (name, exerciseIds) => {
    if (!name?.trim() || !exerciseIds?.length) return false;
    let saved = false;
    set((state) => {
      if (state.routines.length >= MAX_ROUTINES) return state;
      saved = true;
      return {
        routines: [
          ...state.routines,
          {
            id: crypto.randomUUID(),
            name: name.trim(),
            exerciseIds: [...exerciseIds],
            createdAt: serverTimestamp(),
          }
        ]
      };
    });
    if (saved) get()._persistRoutines();
    return saved;
  },

  deleteRoutine: (id) => {
    set((state) => ({
      routines: state.routines.filter(r => r.id !== id)
    }));
    get()._persistRoutines();
  },

  updateRoutine: (id, name, exerciseIds) => {
    set((state) => ({
      routines: state.routines.map(r =>
        r.id === id
          ? { ...r, name: name.trim(), exerciseIds: [...exerciseIds] }
          : r
      )
    }));
    get()._persistRoutines();
  },

  setRoutinesFromCloud: (cloudRoutines) => {
    if (Array.isArray(cloudRoutines)) {
      set((state) => {
        if (JSON.stringify(state.routines) === JSON.stringify(cloudRoutines)) return state;
        return { routines: cloudRoutines };
      });
      get()._persistRoutines();
    }
  },

  // ── Custom Exercises CRUD ───────────────────────────────────────────

  saveCustomExercise: (exerciseData) => {
    if (!exerciseData?.label?.trim()) return null;
    let saved = false;
    set((state) => {
      const catId = exerciseData.categoryId || 'custom';
      const countInCategory = state.customExercises.filter(ex => (ex.categoryId || 'custom') === catId).length;
      if (countInCategory >= MAX_EXERCISES_PER_CATEGORY) return state;
      
      const newExercise = {
        id: `custom_${crypto.randomUUID()}`,
        label: exerciseData.label.trim(),
        icon: exerciseData.icon || 'Star',
        color: exerciseData.color || '#8b5cf6',
        type: exerciseData.type || 'counter',
        gradient: exerciseData.gradient || ['#7c3aed', '#8b5cf6'],
        multiplier: parseFloat(exerciseData.multiplier) || 1.0,
        categoryId: exerciseData.categoryId || 'custom',
        createdAt: serverTimestamp(),
      };
      saved = true;
      return { customExercises: [...state.customExercises, newExercise] };
    });
    if (saved) get()._persistCustomExercises();
    return saved;
  },

  updateCustomExercise: (id, updates) => {
    set((state) => ({
      customExercises: state.customExercises.map(ex => (ex.id === id ? { ...ex, ...updates } : ex))
    }));
    get()._persistCustomExercises();
  },

  deleteCustomExercise: (id) => {
    set((state) => ({
      customExercises: state.customExercises.filter(ex => ex.id !== id)
    }));
    get()._persistCustomExercises();

    // Cross-store side effect: keep progress history consistent when an exercise is removed
    const progressStore = useProgressStore.getState();
    progressStore.deleteExerciseHistory(id);
    progressStore.saveToCloud().catch(() => {});

    // Remove from routines
    const routines = get().routines;
    let changed = false;
    const nextRoutines = routines.map(r => {
      if (!r.exerciseIds || !r.exerciseIds.includes(id)) return r;
      changed = true;
      const newExercises = r.exerciseIds.filter(ex => ex !== id);
      if (newExercises.length === 0) return null;
      return { ...r, exerciseIds: newExercises };
    }).filter(Boolean);

    if (changed) {
      set({ routines: nextRoutines });
      get()._persistRoutines();
    }
  },

  setCustomExercisesFromCloud: (cloudData) => {
    if (Array.isArray(cloudData)) {
      set((state) => {
        if (JSON.stringify(state.customExercises) === JSON.stringify(cloudData)) return state;
        return { customExercises: cloudData };
      });
      get()._persistCustomExercises();
    }
  },

  // ── Custom Categories CRUD ──────────────────────────────────────────

  addCategory: (name, color) => {
    if (!name?.trim()) return false;
    let saved = false;
    set((state) => {
      const userCats = state.customCategories.filter(c => c.id !== 'custom');
      if (userCats.length >= MAX_CUSTOM_CATEGORIES) return state;
      saved = true;
      const nextCategories = [...state.customCategories, {
        id: `cat_${crypto.randomUUID()}`,
        name: name.trim(),
        color: color || '#8b5cf6',
        createdAt: Date.now(),
      }];
      return {
        customCategories: nextCategories,
        customCategoriesMap: updateCategoriesMap(nextCategories)
      };
    });
    if (saved) get()._persistCustomCategories();
    return saved;
  },

  updateCategory: (id, updates) => {
    set((state) => {
      const exists = state.customCategories.some(cat => cat.id === id);
      let nextCategories;
      if (exists) {
        nextCategories = state.customCategories.map(cat => (cat.id === id ? { ...cat, ...updates } : cat));
      } else if (id === 'custom') {
        nextCategories = [...state.customCategories, { id, ...updates, createdAt: Date.now() }];
      } else {
        return {};
      }
      return {
        customCategories: nextCategories,
        customCategoriesMap: updateCategoriesMap(nextCategories)
      };
    });
    get()._persistCustomCategories();
  },

  deleteCategory: (id, exerciseMoves = {}, exercisesToDelete = []) => {
    // Move selected exercises
    for (const [exId, targetCatId] of Object.entries(exerciseMoves)) {
      get().updateCustomExercise(exId, { categoryId: targetCatId });
    }
    // Delete exercises
    exercisesToDelete.forEach(exId => {
      get().deleteCustomExercise(exId);
    });
    // Remove category
    set((state) => {
      const nextCategories = state.customCategories.filter(cat => cat.id !== id);
      return {
        customCategories: nextCategories,
        customCategoriesMap: updateCategoriesMap(nextCategories)
      };
    });
    get()._persistCustomCategories();
  },

  moveCategory: (id, direction) => {
    set((state) => {
      const index = state.customCategories.findIndex(c => c.id === id);
      if (index === -1) return {};
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= state.customCategories.length) return {};
      
      const newArr = [...state.customCategories];
      const [moved] = newArr.splice(index, 1);
      newArr.splice(newIndex, 0, moved);
      return {
        customCategories: newArr,
        customCategoriesMap: updateCategoriesMap(newArr)
      };
    });
    get()._persistCustomCategories();
  },

  setCategoriesFromCloud: (cloudData) => {
    if (Array.isArray(cloudData)) {
      set((state) => {
        if (JSON.stringify(state.customCategories) === JSON.stringify(cloudData)) return state;
        return {
          customCategories: cloudData,
          customCategoriesMap: updateCategoriesMap(cloudData)
        };
      });
      get()._persistCustomCategories();
    }
  },

  // ── Exercise Weights Actions ────────────────────────────────────────

  getWeight: (exerciseId) => {
    const { exerciseWeights } = get();
    if (exerciseWeights[exerciseId] !== undefined) return exerciseWeights[exerciseId];
    const config = WEIGHT_EXERCISES_MAP[exerciseId];
    return config?.defaultWeight ?? null;
  },

  setWeight: (exerciseId, kg) => {
    const value = Math.max(0, Number(kg) || 0);
    set((state) => ({
      exerciseWeights: { ...state.exerciseWeights, [exerciseId]: value }
    }));
    get()._persistExerciseWeights();

    // Debounced save to cloud
    if (get()._weightCloudTimer) clearTimeout(get()._weightCloudTimer);
    const timer = setTimeout(() => {
      cloudSync.saveExerciseWeightsToCloud(get().exerciseWeights).catch(() => {});
    }, 1500);
    set({ _weightCloudTimer: timer });
  },

  maxRoutines: MAX_ROUTINES,
  maxCustomExercises: MAX_EXERCISES_PER_CATEGORY,
  maxCustomCategories: MAX_CUSTOM_CATEGORIES,
}));
