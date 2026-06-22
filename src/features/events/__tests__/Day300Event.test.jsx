import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import { Day300EventManager, REP_GOAL } from '../Day300Event';

const today = '2026-04-10';

// getExerciseCount renvoie `perEx` reps pour chaque exercice → total = perEx × nbExercices.
const ctx = (perEx) => ({
  getExerciseCount: () => perEx,
  getConfig: () => ({ difficulty: 1 }),
  completions: {},
});

beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = '<div id="root"></div>';
  sessionStorage.clear();
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

const root = () => document.getElementById('root');
const dismissIntro = (getByText) => {
  act(() => { getByText(/Lancer l'ascension/).click(); });
  act(() => { vi.advanceTimersByTime(500); });
};

describe('Day300EventManager', () => {
  it('renders nothing when it is not day 300', () => {
    const { container } = render(<Day300EventManager dayNumber={42} today={today} {...ctx(0)} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows the cosmic challenge splash on day 300', () => {
    const { getByText } = render(<Day300EventManager dayNumber={300} today={today} {...ctx(0)} />);
    expect(getByText(/répétitions à conquérir/)).toBeTruthy();
    expect(getByText(/Lancer l'ascension/)).toBeTruthy();
  });

  it('activates the cosmic dashboard and shows the rocket gauge once the splash is dismissed', () => {
    const { getByText } = render(<Day300EventManager dayNumber={300} today={today} {...ctx(0)} />);
    dismissIntro(getByText);
    expect(root().classList.contains('day300-global')).toBe(true);
    // Jauge présente, à 0 / REP_GOAL
    expect(getByText(new RegExp(`/${REP_GOAL}`))).toBeTruthy();
  });

  it('does NOT complete while reps are below the goal', () => {
    const { getByText } = render(<Day300EventManager dayNumber={300} today={today} {...ctx(1)} />);
    dismissIntro(getByText);
    act(() => { vi.advanceTimersByTime(2000); });
    expect(localStorage.getItem('day300_challenge_done')).toBeNull();
  });

  it('completes when the rep goal is reached → reward then done', () => {
    const { getByText, rerender } = render(
      <Day300EventManager dayNumber={300} today={today} {...ctx(0)} />
    );
    dismissIntro(getByText);
    expect(localStorage.getItem('day300_challenge_done')).toBeNull();

    // L'utilisateur enchaîne assez de reps pour dépasser l'objectif.
    act(() => {
      rerender(<Day300EventManager dayNumber={300} today={today} {...ctx(99999)} />);
    });
    // L'animation de récompense se joue jusqu'au bout → onComplete marque l'event fini.
    act(() => { vi.advanceTimersByTime(REP_GOAL + 12000); });
    expect(localStorage.getItem('day300_challenge_done')).toBe('1');
  });
});
