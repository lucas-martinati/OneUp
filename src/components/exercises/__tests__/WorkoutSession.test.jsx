import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { WorkoutSession } from '../WorkoutSession';
import { useWorkoutSession } from '@hooks/useWorkoutSession';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  }
}));

// Mock the useWorkoutSession hook
vi.mock('@hooks/useWorkoutSession', () => ({
  useWorkoutSession: vi.fn(),
}));

// Capture the sessionType the done phase derives for the summary
vi.mock('../SessionSummary', () => ({
  SessionSummary: ({ sessionData }) => (
    <div data-testid="session-summary" data-type={sessionData?.type} />
  ),
}));

const defaultWsMock = {
  phase: 'config',
    queue: [],
    setQueue: vi.fn(),
    showSaveRoutine: false,
    setShowSaveRoutine: vi.fn(),
    routineName: '',
    setRoutineName: vi.fn(),
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

describe('WorkoutSession config phase titles', () => {
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
    const titleElement = getByText('common.edit');
    expect(titleElement).toBeTruthy();
    
    // Ensure hardcoded gradient styles are removed so it uses canonical panel-title class styles
    expect(titleElement.style.background).toBeFalsy();
    expect(titleElement.style.WebkitBackgroundClip).toBeFalsy();
  });
});

describe('WorkoutSession done phase session type', () => {
  const FULL_ORDER = ['cardio', 'bodyweight', 'weights', 'custom', 'cat_my'];
  const doneMock = (overrides = {}) => ({
    ...defaultWsMock,
    phase: 'done',
    queue: ['pushups'],
    exerciseInfo: [{ id: 'pushups', goal: 10, color: '#fff', icon: 'X', type: 'reps' }],
    sessionName: 'Session',
    fullCategoryOrder: FULL_ORDER,
    ...overrides,
  });

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('derives the session type from the user category slide (not the built-in order)', () => {
    vi.mocked(useWorkoutSession).mockReturnValue(doneMock({ activeSlide: 4 }));
    const { getByTestId } = render(<WorkoutSession onClose={vi.fn()} />);
    // CATEGORY_ORDER[4] is undefined → old code fell back to 'bodyweight'
    expect(getByTestId('session-summary').dataset.type).toBe('cat_my');
  });

  it('derives cardio for the cardio slide', () => {
    vi.mocked(useWorkoutSession).mockReturnValue(doneMock({ activeSlide: 0 }));
    const { getByTestId } = render(<WorkoutSession onClose={vi.fn()} />);
    expect(getByTestId('session-summary').dataset.type).toBe('cardio');
  });
});
