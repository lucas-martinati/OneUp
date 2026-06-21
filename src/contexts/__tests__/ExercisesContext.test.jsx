import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const storeValue = {
  customExercises: [
    { id: 'c1', name: 'Plank' },
    { id: 'c2', name: 'Burpee', categoryId: 'cat_a' },
    { id: 'c3', name: 'Lunge', categoryId: 'custom' },
  ],
  customCategories: [
    { id: 'custom', name: 'Custom' },
    { id: 'cat_a', name: 'Cat A' },
  ],
  customCategoriesMap: {},
  routines: [],
  exerciseWeights: {},
  getWeight: vi.fn(),
  setWeight: vi.fn(),
  saveCustomExercise: vi.fn(),
  updateCustomExercise: vi.fn(),
  deleteCustomExercise: vi.fn(),
  setCustomExercisesFromCloud: vi.fn(),
  maxCustomExercises: 10,
  addCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  moveCategory: vi.fn(),
  setCategoriesFromCloud: vi.fn(),
  maxCustomCategories: 5,
  saveRoutine: vi.fn(),
  deleteRoutine: vi.fn(),
  updateRoutine: vi.fn(),
  setRoutinesFromCloud: vi.fn(),
  maxRoutines: 3,
};
vi.mock('@store/useExercisesStore', () => ({ useExercisesStore: () => storeValue }));

import { useExercises, ExercisesProvider } from '../ExercisesContext';

beforeEach(() => vi.clearAllMocks());

describe('ExercisesProvider', () => {
  it('renders children unchanged (facade)', () => {
    expect(ExercisesProvider({ children: 'x' })).toBe('x');
  });
});

describe('useExercises', () => {
  it('builds the custom exercises map keyed by id', () => {
    const { result } = renderHook(() => useExercises());
    expect(result.current.customExercisesMap.c1.name).toBe('Plank');
    expect(Object.keys(result.current.customExercisesMap)).toHaveLength(3);
  });

  it('scopes default custom exercises to the built-in custom category', () => {
    const { result } = renderHook(() => useExercises());
    const ids = result.current.defaultCustomExercises.map(e => e.id);
    expect(ids).toContain('c1'); // no categoryId
    expect(ids).toContain('c3'); // categoryId === 'custom'
    expect(ids).not.toContain('c2'); // belongs to cat_a
  });

  it('groups exercises by user-created category, ignoring the built-in custom one', () => {
    const { result } = renderHook(() => useExercises());
    expect(result.current.exercisesByUserCategory.cat_a.map(e => e.id)).toEqual(['c2']);
    expect(result.current.exercisesByUserCategory.custom).toBeUndefined();
  });

  it('builds per-user-category maps', () => {
    const { result } = renderHook(() => useExercises());
    expect(result.current.exercisesMapByUserCategory.cat_a.c2.name).toBe('Burpee');
  });

  it('resolves exercises by id across all sources, returning null when unknown', () => {
    const { result } = renderHook(() => useExercises());
    expect(result.current.getExerciseById('c1').name).toBe('Plank');
    expect(result.current.getExerciseById('nope')).toBeNull();
  });

  it('exposes the category buckets and hooks', () => {
    const { result } = renderHook(() => useExercises());
    expect(result.current.exercisesByCategory.standard.length).toBeGreaterThan(0);
    expect(result.current.exercisesByCategory.cardio.length).toBeGreaterThan(0);
    expect(result.current.customExercisesHook.maxCustomExercises).toBe(10);
    expect(result.current.customCategoriesHook.maxCustomCategories).toBe(5);
    expect(result.current.maxRoutines).toBe(3);
  });
});
