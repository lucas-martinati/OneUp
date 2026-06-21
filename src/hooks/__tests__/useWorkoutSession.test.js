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
    expect(result.current.phase).toBe('done');
    expect(addSession).toHaveBeenCalled();
    expect(result.current.savedSession).toMatchObject({ id: 'sess1' });
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
    expect(result.current.showRoutineList).toBe(false);
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
    act(() => result.current.handleTouchMove({ touches: [{ clientY: 50 }] }));
    act(() => result.current.handleTouchEnd());
    expect(result.current.queue).toHaveLength(2);
  });
});
