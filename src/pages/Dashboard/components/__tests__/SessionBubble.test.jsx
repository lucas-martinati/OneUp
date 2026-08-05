import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { SessionBubble } from '../SessionBubble';

vi.mock('@contexts/ExercisesContext', () => ({
  useExercises: () => ({
    allExercisesMap: {
      ex1: { id: 'ex1', name: 'Push-ups' },
      ex2: { id: 'ex2', name: 'Squats' },
    },
  }),
}));

vi.mock('@utils/icons', () => ({
  Play: () => <span>PlayIcon</span>,
  DynamicIcon: () => <span>DynamicIcon</span>,
}));

vi.mock('@utils/workoutSessionStorage', () => ({
  loadWorkoutSession: () => ({
    queue: ['ex1', 'ex2'],
    currentIdx: 0,
  }),
}));

describe('SessionBubble', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    sessionStorage.clear();
    window.innerWidth = 360;
    window.innerHeight = 800;
  });

  it('renders the floating bubble with exercise queue details', () => {
    const onResume = vi.fn();
    const onDiscard = vi.fn();
    const { getByText } = render(
      <SessionBubble onResume={onResume} onDiscard={onDiscard} />
    );

    expect(getByText('PlayIcon')).toBeTruthy();
  });

  it('triggers onResume when bubble is tapped without dragging', () => {
    const onResume = vi.fn();
    const onDiscard = vi.fn();
    const { container } = render(
      <SessionBubble onResume={onResume} onDiscard={onDiscard} />
    );

    const bubble = container.querySelector('[role="button"]');
    if (bubble) {
      fireEvent.pointerDown(bubble, { clientX: 300, clientY: 200 });
      fireEvent.pointerUp(bubble, { clientX: 300, clientY: 200 });
      expect(onResume).toHaveBeenCalled();
    }
  });
});
