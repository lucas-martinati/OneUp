import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { EXERCISES } from '@config/exercises';
import { WEIGHT_EXERCISES } from '@config/weights';

const progressState = {
  getExerciseCount: vi.fn(() => 0),
  updateExerciseCount: vi.fn(),
  completions: {},
};
const statsState = { stats: { totalReps: 0 } };
const allEx = [...EXERCISES, ...WEIGHT_EXERCISES];
const allExMap = allEx.reduce((acc, ex) => { acc[ex.id] = ex; return acc; }, {});

const exCtx = {
  routines: [],
  saveRoutine: vi.fn(),
  deleteRoutine: vi.fn(),
  updateRoutine: vi.fn(),
  maxRoutines: 5,
  customExercises: [],
  customCategories: [],
  exercisesByUserCategory: {},
  defaultCustomExercises: [],
  allExercises: allEx,
  allExercisesMap: allExMap,
};
const sub = { isPro: true };
const storage = {
  isWorkoutSessionStarted: vi.fn(() => false),
  loadWorkoutSession: vi.fn(() => ({})),
  saveWorkoutSession: vi.fn(),
  clearWorkoutSession: vi.fn(),
};

vi.mock('@store/useProgressStore', () => ({ useProgressStore: (sel) => sel(progressState) }));
vi.mock('@store/useComputedStatsStore', () => ({ useComputedStatsStore: (sel) => sel(statsState) }));
vi.mock('@hooks/useExerciseConfig', () => ({ useExerciseConfig: () => ({ getConfig: () => ({ difficulty: 1, weight: null }) }) }));
vi.mock('./useExerciseConfig', () => ({ useExerciseConfig: () => ({ getConfig: () => ({ difficulty: 1, weight: null }) }) }));
vi.mock('@contexts/SubscriptionContext', () => ({ useSubscription: () => sub }));
vi.mock('@contexts/ExercisesContext', () => ({ useExercises: () => exCtx }));
vi.mock('@hooks/useBackHandler', () => ({ useBackHandler: vi.fn() }));
vi.mock('./useBackHandler', () => ({ useBackHandler: vi.fn() }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k) => k }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
  Trans: ({ children }) => children,
}));
vi.mock('@features/share/services/sessionHistoryService', () => ({ addSession: vi.fn((s) => ({ ...s, id: 'sess1' })) }));
vi.mock('@utils/sessionNameGenerator', () => ({ generateSessionName: vi.fn(() => 'Generated Session') }));
vi.mock('@utils/workoutSessionStorage', () => ({
  isWorkoutSessionStarted: (...a) => storage.isWorkoutSessionStarted(...a),
  loadWorkoutSession: (...a) => storage.loadWorkoutSession(...a),
  saveWorkoutSession: (...a) => storage.saveWorkoutSession(...a),
  clearWorkoutSession: (...a) => storage.clearWorkoutSession(...a),
}));

import { useWorkoutSession } from '../useWorkoutSession';
import { addSession } from '@features/share/services/sessionHistoryService';
import { isCustomExercise } from '@utils/exerciseLabel';

const bwId = EXERCISES[0].id;
const bwId2 = EXERCISES[1].id;
const weightId = WEIGHT_EXERCISES[0].id;

function setup(props = {}) {
  const onClose = vi.fn();
  const setSessionInProgress = vi.fn();
  const view = renderHook((p) => useWorkoutSession(p), {
    initialProps: { onClose, today: '2024-01-01', dayNumber: 1, activeSlide: 0, sessionMode: null, setSessionInProgress, ...props },
  });
  return { ...view, onClose, setSessionInProgress };
}

beforeEach(() => {
  vi.clearAllMocks();
  progressState.completions = {};
  progressState.getExerciseCount.mockReturnValue(0);
  exCtx.routines = [];
  sub.isPro = true;
  storage.isWorkoutSessionStarted.mockReturnValue(false);
  localStorage.clear();
});

describe('initial state', () => {
  it('starts in config phase with an empty queue', () => {
    const { result } = setup();
    expect(result.current.phase).toBe('config');
    expect(result.current.queue).toEqual([]);
    expect(result.current.isStarted).toBe(false);
  });

  it('restores a persisted running session', () => {
    storage.isWorkoutSessionStarted.mockReturnValue(true);
    storage.loadWorkoutSession.mockReturnValue({ queue: [bwId], currentIdx: 0, startTime: 123, name: 'Resumed', activeSlide: 0 });
    const { result } = setup({ sessionMode: 'running' });
    expect(result.current.phase).toBe('running');
    expect(result.current.queue).toEqual([bwId]);
    expect(result.current.sessionName).toBe('Resumed');
  });

  it('restores the inter-dashboard toggle of a mixed-category session', () => {
    storage.isWorkoutSessionStarted.mockReturnValue(true);
    // activeSlide 1 = bodyweight: the weighted exercise is outside the local category
    storage.loadWorkoutSession.mockReturnValue({ queue: [bwId, weightId], currentIdx: 0, startTime: 123, name: '', activeSlide: 1, showAll: true });
    const { result } = setup({ sessionMode: 'running', activeSlide: 1 });
    expect(result.current.showAll).toBe(true);
    // Every queued exercise stays reachable, not only the current category's
    expect(result.current.exerciseInfo.map(e => e.id)).toEqual(expect.arrayContaining([bwId, weightId]));
  });

  it('infers the toggle from the queue for sessions saved before showAll was persisted', () => {
    storage.isWorkoutSessionStarted.mockReturnValue(true);
    storage.loadWorkoutSession.mockReturnValue({ queue: [bwId, weightId], currentIdx: 0, startTime: 123, name: '', activeSlide: 1, showAll: null });
    const { result } = setup({ sessionMode: 'running', activeSlide: 1 });
    expect(result.current.showAll).toBe(true);
    expect(result.current.exerciseInfo.map(e => e.id)).toEqual(expect.arrayContaining([bwId, weightId]));
  });

  it('persists the inter-dashboard toggle while the session runs', () => {
    const { result } = setup({ activeSlide: 1 });
    act(() => result.current.setShowAll(true));
    act(() => { result.current.toggleExercise(bwId); result.current.toggleExercise(weightId); });
    act(() => result.current.startSession());
    expect(storage.saveWorkoutSession).toHaveBeenCalledWith(expect.objectContaining({ queue: [bwId, weightId], showAll: true }));
  });
});

describe('queue editing', () => {
  it('toggles a bodyweight exercise on and off', () => {
    const { result } = setup();
    act(() => result.current.toggleExercise(bwId));
    expect(result.current.queue).toEqual([bwId]);
    act(() => result.current.toggleExercise(bwId));
    expect(result.current.queue).toEqual([]);
  });

  it('blocks weighted exercises for non-pro users', () => {
    sub.isPro = false;
    const { result } = setup();
    act(() => result.current.toggleExercise(weightId));
    expect(result.current.queue).toEqual([]);
  });

  it('shuffles, moves and clears the queue', () => {
    const { result } = setup();
    act(() => { result.current.toggleExercise(bwId); result.current.toggleExercise(bwId2); });
    act(() => result.current.moveItem(0, 1));
    expect(result.current.queue).toEqual([bwId2, bwId]);
    act(() => result.current.moveItem(0, 5)); // out of range → no change
    expect(result.current.queue).toEqual([bwId2, bwId]);
    act(() => result.current.shuffleQueue());
    expect(result.current.queue).toHaveLength(2);
    act(() => result.current.clearQueue());
    expect(result.current.queue).toEqual([]);
  });
});

describe('start session', () => {
  it('does nothing with an empty queue', () => {
    const { result } = setup();
    act(() => result.current.startSession());
    expect(result.current.phase).toBe('config');
  });

  it('moves to the running phase with at least one not-done exercise', () => {
    const { result } = setup();
    act(() => result.current.toggleExercise(bwId));
    act(() => result.current.startSession());
    expect(result.current.phase).toBe('running');
    expect(result.current.currentExId).toBe(bwId);
  });
});

describe('advanceToNext', () => {
  it('advances to the next not-done exercise', () => {
    const { result } = setup();
    act(() => { result.current.toggleExercise(bwId); result.current.toggleExercise(bwId2); });
    act(() => result.current.startSession());
    act(() => result.current.advanceToNext());
    expect(result.current.currentIdx).toBe(1);
  });

  it('completes the session and records it when all exercises are done', () => {
    const { result, rerender, setSessionInProgress } = setup();
    act(() => result.current.toggleExercise(bwId));
    act(() => result.current.startSession());
    // Mark the only exercise as completed, then re-render so exerciseInfo recomputes.
    progressState.completions = { '2024-01-01': { [bwId]: { isCompleted: true } } };
    rerender({ onClose: result.current.onClose, today: '2024-01-01', dayNumber: 1, activeSlide: 0, sessionMode: null, setSessionInProgress });
    act(() => result.current.advanceToNext());
    expect(addSession).toHaveBeenCalled();
    expect(result.current.savedSession).toMatchObject({ id: 'sess1' });
  });

  it('sets session type to weights', () => {
    const { result, rerender, setSessionInProgress } = setup({ activeSlide: 2 });
    act(() => result.current.toggleExercise(bwId));
    act(() => result.current.startSession());
    progressState.completions = { '2024-01-01': { [bwId]: { isCompleted: true } } };
    rerender({ onClose: result.current.onClose, today: '2024-01-01', dayNumber: 1, activeSlide: 2, sessionMode: null, setSessionInProgress });
    act(() => result.current.advanceToNext());
    expect(addSession).toHaveBeenCalledWith(expect.objectContaining({ type: 'weights' }));
  });

  it('sets session type to custom', () => {
    const { result, rerender, setSessionInProgress } = setup({ activeSlide: 3 });
    act(() => result.current.toggleExercise(bwId));
    act(() => result.current.startSession());
    progressState.completions = { '2024-01-01': { [bwId]: { isCompleted: true } } };
    rerender({ onClose: result.current.onClose, today: '2024-01-01', dayNumber: 1, activeSlide: 3, sessionMode: null, setSessionInProgress });
    act(() => result.current.advanceToNext());
    expect(addSession).toHaveBeenCalledWith(expect.objectContaining({ type: 'custom' }));
  });

  it('sets session type to user category', () => {
    exCtx.customCategories = [{ id: 'cat_my' }];
    const { result, rerender, setSessionInProgress } = setup({ activeSlide: 4 });
    act(() => result.current.toggleExercise(bwId));
    act(() => result.current.startSession());
    progressState.completions = { '2024-01-01': { [bwId]: { isCompleted: true } } };
    rerender({ onClose: result.current.onClose, today: '2024-01-01', dayNumber: 1, activeSlide: 4, sessionMode: null, setSessionInProgress });
    act(() => result.current.advanceToNext());
    expect(addSession).toHaveBeenCalledWith(expect.objectContaining({ type: 'cat_my' }));
    exCtx.customCategories = []; // reset
  });

  it('sets session type to cardio', () => {
    const { result, rerender, setSessionInProgress } = setup({ activeSlide: 0 });
    act(() => result.current.toggleExercise(bwId));
    act(() => result.current.startSession());
    progressState.completions = { '2024-01-01': { [bwId]: { isCompleted: true } } };
    rerender({ onClose: result.current.onClose, today: '2024-01-01', dayNumber: 1, activeSlide: 0, sessionMode: null, setSessionInProgress });
    act(() => result.current.advanceToNext());
    expect(addSession).toHaveBeenCalledWith(expect.objectContaining({ type: 'cardio' }));
  });

  it('uses routine name if session matches a routine exactly', () => {
    exCtx.routines = [{ id: 'r1', name: 'Matched Routine', exerciseIds: [bwId] }];
    const { result, rerender, setSessionInProgress } = setup();
    act(() => result.current.toggleExercise(bwId));
    act(() => result.current.startSession());
    progressState.completions = { '2024-01-01': { [bwId]: { isCompleted: true } } };
    rerender({ onClose: result.current.onClose, today: '2024-01-01', dayNumber: 1, activeSlide: 0, sessionMode: null, setSessionInProgress });
    act(() => result.current.advanceToNext());
    expect(addSession).toHaveBeenCalledWith(expect.objectContaining({ name: 'Matched Routine' }));
    exCtx.routines = [];
  });

  it('clears session if queue is emptied while running', () => {
    const { result } = setup();
    act(() => result.current.toggleExercise(bwId));
    act(() => result.current.startSession());
    expect(result.current.phase).toBe('running');
    act(() => result.current.toggleExercise(bwId)); // removes it from queue
    expect(result.current.queue).toHaveLength(0);
    expect(storage.clearWorkoutSession).toHaveBeenCalled();
  });
});

describe('routines', () => {
  it('saves a new routine when a name and queue are present', () => {
    const { result } = setup();
    act(() => result.current.toggleExercise(bwId));
    act(() => result.current.setRoutineName('Leg day'));
    act(() => result.current.handleSaveRoutine());
    expect(exCtx.saveRoutine).toHaveBeenCalledWith('Leg day', [bwId]);
  });

  it('updates an existing routine when editing', () => {
    const { result } = setup();
    act(() => result.current.editRoutine({ id: 'r1', name: 'Old', exerciseIds: [bwId] }));
    expect(result.current.showSaveRoutine).toBe(true);
    expect(result.current.routineName).toBe('Old');
    act(() => result.current.handleSaveRoutine());
    expect(exCtx.updateRoutine).toHaveBeenCalledWith('r1', 'Old', [bwId]);
  });

  it('loads a routine, filtering out unavailable exercises', () => {
    const { result } = setup();
    act(() => result.current.loadRoutine({ name: 'My routine', exerciseIds: [bwId, 'nonexistent'] }));
    expect(result.current.queue).toEqual([bwId]);
    expect(result.current.sessionName).toBe('My routine');
  });
});

describe('drag & drop', () => {
  it('reorders via drag start/over/end', () => {
    const { result } = setup();
    act(() => { result.current.toggleExercise(bwId); result.current.toggleExercise(bwId2); });
    act(() => result.current.handleDragStart(0));
    act(() => result.current.handleDragOver(1));
    act(() => result.current.handleDragEnd());
    expect(result.current.queue).toEqual([bwId2, bwId]);
  });

  it('handles touch drag lifecycle without throwing', () => {
    const { result } = setup();
    act(() => { result.current.toggleExercise(bwId); result.current.toggleExercise(bwId2); });
    act(() => result.current.handleTouchStart({ touches: [{ clientY: 10 }] }, 0));
    
    // Simulate itemRef
    result.current.queueListRef.current = true;
    result.current.itemRefs.current[0] = { getBoundingClientRect: () => ({ top: 0, bottom: 20 }) };
    result.current.itemRefs.current[1] = { getBoundingClientRect: () => ({ top: 40, bottom: 60 }) };

    act(() => result.current.handleTouchMove({ touches: [{ clientY: 50 }] })); // Over index 1
    act(() => result.current.handleTouchEnd());
    expect(result.current.queue).toEqual([bwId2, bwId]);
  });
});

import { useBackHandler } from '@hooks/useBackHandler';

describe('additional coverage', () => {
  it('handles useBackHandler edge cases', () => {
    const { result } = setup();
    
    const getBackFn = () => {
      const calls = vi.mocked(useBackHandler).mock.calls;
      return calls[calls.length - 1][0];
    };
    
    // showSaveRoutine
    act(() => result.current.setShowSaveRoutine(true));
    expect(result.current.showSaveRoutine).toBe(true);
    // call back
    act(() => { getBackFn()(); });
    expect(result.current.showSaveRoutine).toBe(false);

    // confirmDeleteId
    act(() => result.current.setConfirmDeleteId('r1'));
    act(() => { getBackFn()(); });
    expect(result.current.confirmDeleteId).toBeNull();

    // running phase
    act(() => result.current.toggleExercise(bwId));
    act(() => result.current.startSession());
    act(() => { getBackFn()(); });
    expect(result.current.phase).toBe('config');
    
    // default
    act(() => { getBackFn()(); });
    // Should call onClose
  });

  it('handles filteredQueue returning empty in startSession', () => {
    const { result, rerender, onClose, setSessionInProgress } = setup();
    act(() => result.current.toggleExercise(bwId));
    // Simulate exercise done
    progressState.completions = { '2024-01-01': { [bwId]: { isCompleted: true } } };
    rerender({ onClose, today: '2024-01-01', dayNumber: 1, activeSlide: 0, sessionMode: null, setSessionInProgress });
    
    act(() => result.current.startSession());
    expect(result.current.phase).toBe('config'); // Didn't start
  });

  it('handles invalid exercise id in toggleExercise and loadRoutine', () => {
    const { result } = setup();
    act(() => result.current.loadRoutine({ name: 'r', exerciseIds: ['invalid'] }));
    expect(result.current.queue).toEqual([]);
  });

  it('identifies custom exercises and categories', () => {
    exCtx.defaultCustomExercises = [{ id: 'cust1', name: 'Cust1' }, { id: 'cust2', name: 'Cust2' }];
    exCtx.exercisesByUserCategory = { 'cat1': [{ id: 'cust1' }] };
    exCtx.allExercisesMap['cust1'] = { id: 'cust1', name: 'Cust1' };
    exCtx.allExercisesMap['cust2'] = { id: 'cust2', name: 'Cust2' };
    const { result } = setup();
    act(() => result.current.loadRoutine({ name: 'r', exerciseIds: ['cust1', 'cust2'] }));
    expect(result.current.queue).toEqual(['cust1', 'cust2']);
  });

  it('loadRoutine blocks weight and custom exercises for non-pro', () => {
    sub.isPro = false;
    exCtx.defaultCustomExercises = [{ id: 'custom_1', name: 'Cust1' }];
    exCtx.allExercisesMap['custom_1'] = { id: 'custom_1', name: 'Cust1' };
    const { result } = setup();
    console.log('Test setup: isPro=', sub.isPro);
    console.log('isCustom 1:', isCustomExercise('custom_1'));
    act(() => result.current.loadRoutine({ name: 'r', exerciseIds: [bwId, weightId, 'custom_1'] }));
    expect(result.current.queue).toEqual([bwId]);
  });

  it('loadRoutine updates oneup_share_options and catches localStorage errors', () => {
    const { result } = setup();
    localStorage.setItem('oneup_share_options', JSON.stringify({ showWeights: false }));
    act(() => result.current.loadRoutine({ name: 'r', exerciseIds: [bwId, weightId] })); // 2 categories
    expect(JSON.parse(localStorage.getItem('oneup_share_options')).showWeights).toBe(true);

    localStorage.setItem('oneup_share_options', '{bad');
    act(() => result.current.loadRoutine({ name: 'r2', exerciseIds: [bwId, weightId] }));
    // catches and ignores
  });

  it('handleSaveRoutine returns early on empty name or queue', () => {
    const { result } = setup();
    act(() => result.current.setRoutineName('   '));
    act(() => result.current.handleSaveRoutine());
    expect(exCtx.saveRoutine).not.toHaveBeenCalled();

    act(() => result.current.setRoutineName('valid'));
    act(() => result.current.handleSaveRoutine()); // queue is empty
    expect(exCtx.saveRoutine).not.toHaveBeenCalled();
  });

  it('editRoutine handles missing exercise', () => {
    const { result } = setup();
    act(() => result.current.editRoutine({ id: 'r1', name: 'n', exerciseIds: ['missing'] }));
    expect(result.current.queue).toEqual([]);
  });

  it('moveItem, handleDragOver, handleDragEnd and handleTouchMove edge cases', () => {
    const { result } = setup();
    act(() => { result.current.toggleExercise(bwId); result.current.toggleExercise(bwId2); });
    
    // moveItem toIdx < 0
    act(() => result.current.moveItem(0, -1));
    expect(result.current.queue).toEqual([bwId, bwId2]);

    // handleDragOver with null or same
    act(() => result.current.handleDragOver(0)); // dragIdx is null
    act(() => result.current.handleDragStart(0));
    act(() => result.current.handleDragOver(0)); // dragIdx === idx

    // handleDragEnd without overIdx
    act(() => result.current.handleDragEnd()); // dragOverIdx is null
    expect(result.current.queue).toEqual([bwId, bwId2]);

    // handleTouchMove with null touchStartIdx
    act(() => result.current.handleTouchMove({ touches: [{ clientY: 50 }] }));
  });
});
