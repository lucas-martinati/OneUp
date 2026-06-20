import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { WorkoutSession } from '../WorkoutSession';
import { useWorkoutSession } from '@hooks/useWorkoutSession';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

// Mock the useWorkoutSession hook
vi.mock('@hooks/useWorkoutSession', () => ({
  useWorkoutSession: vi.fn(),
}));

describe('WorkoutSession config phase titles', () => {
  const defaultWsMock = {
    phase: 'config',
    queue: [],
    setQueue: vi.fn(),
    showSaveRoutine: false,
    setShowSaveRoutine: vi.fn(),
    routineName: '',
    setRoutineName: vi.fn(),
    showRoutineList: false,
    setShowRoutineList: vi.fn(),
    confirmDeleteId: null,
    setConfirmDeleteId: vi.fn(),
    dragIdx: null,
    dragOverIdx: null,
    queueListRef: { current: null },
    itemRefs: { current: {} },
    sessionDuration: 0,
    savedSession: null,
    sessionName: '',
    hasAnimatedFirstPanel: false,
    showAll: false,
    setShowAll: vi.fn(),
    t: (key) => key,
    computedStats: {},
    isPro: false,
    fullCategoryOrder: [],
    fullCategoryColors: {},
    routines: [],
    deleteRoutine: vi.fn(),
    maxRoutines: 5,
    customCategories: [],
    localExercises: [],
    exerciseInfo: [],
    allExercises: [],
    canMixDashboards: false,
    currentEx: null,
    currentExId: null,
    currentGoal: 0,
    currentCount: 0,
    currentDone: false,
    currentDifficulty: 1.0,
    hasNextAvailableExercise: false,
    updateExerciseCount: vi.fn(),
    getConfig: vi.fn(),
    toggleExercise: vi.fn(),
    shuffleQueue: vi.fn(),
    startSession: vi.fn(),
    loadRoutine: vi.fn(),
    handleSaveRoutine: vi.fn(),
    editRoutine: vi.fn(),
    advanceToNext: vi.fn(),
    moveItem: vi.fn(),
    clearQueue: vi.fn(),
    handleDragStart: vi.fn(),
    handleDragOver: vi.fn(),
    handleDragEnd: vi.fn(),
    handleTouchStart: vi.fn(),
    handleTouchMove: vi.fn(),
    handleTouchEnd: vi.fn(),
    today: '2026-06-20',
    dayNumber: 1,
    activeSlide: 0,
    onClose: vi.fn(),
    isStarted: false,
  };

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders "dashboard.session" title when the workout session has not started', () => {
    vi.mocked(useWorkoutSession).mockReturnValue({
      ...defaultWsMock,
      isStarted: false,
    });

    const { getByText } = render(<WorkoutSession onClose={vi.fn()} />);
    const titleElement = getByText('dashboard.session');
    expect(titleElement).toBeTruthy();
    
    // Ensure hardcoded gradient styles are removed so it uses canonical panel-title class styles
    expect(titleElement.style.background).toBeFalsy();
    expect(titleElement.style.WebkitBackgroundClip).toBeFalsy();
  });

  it('renders "dashboard.editSession" title when the workout session is already started', () => {
    vi.mocked(useWorkoutSession).mockReturnValue({
      ...defaultWsMock,
      isStarted: true,
    });

    const { getByText } = render(<WorkoutSession onClose={vi.fn()} />);
    const titleElement = getByText('dashboard.editSession');
    expect(titleElement).toBeTruthy();
    
    // Ensure hardcoded gradient styles are removed so it uses canonical panel-title class styles
    expect(titleElement.style.background).toBeFalsy();
    expect(titleElement.style.WebkitBackgroundClip).toBeFalsy();
  });
});
