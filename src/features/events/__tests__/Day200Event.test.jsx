import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import { Day200EventManager, SWEAT_GOAL } from '../Day200Event';
import { EventHud } from '../EventHud';
import { useEventHudStore } from '../eventHudStore';

const today = '2026-07-19';

// getExerciseCount renvoie `perEx` reps pour chaque exercice → total = perEx × nbExercices.
const ctx = (perEx) => ({
  getExerciseCount: () => perEx,
  getConfig: () => ({ difficulty: 1 }),
  completions: {},
});

// Le HUD (thermomètre) est publié dans le store et rendu par <EventHud/> (comme dans l'app).
const Harness = (props) => (
  <>
    <Day200EventManager {...props} />
    <EventHud placement="dashboard" />
  </>
);

beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = '<div id="root"></div>';
  sessionStorage.clear();
  localStorage.clear();
  useEventHudStore.setState({ hud: null });
});
afterEach(() => {
  cleanup();
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

const root = () => document.getElementById('root');
const dismissIntro = (getByText) => {
  act(() => { getByText(/faire tomber la pluie/i).click(); });
  act(() => { vi.advanceTimersByTime(500); });
};

describe('Day200EventManager', () => {
  it('renders nothing when it is not day 200', () => {
    const { container } = render(<Harness dayNumber={150} today={today} {...ctx(0)} />);
    expect(container.querySelector('.d200-thermo')).toBeNull();
  });

  it('shows the heatwave alert card with the sweat-challenge pretext', () => {
    const { getByText } = render(<Harness dayNumber={200} today={today} {...ctx(0)} />);
    expect(getByText(/Alerte Canicule/i)).toBeTruthy();
    expect(getByText(/faire tomber la pluie/i)).toBeTruthy();
  });

  it('enables the heatwave theme and shows the integrated thermometer once dismissed', () => {
    const { getByText } = render(<Harness dayNumber={200} today={today} {...ctx(0)} />);
    dismissIntro(getByText);
    expect(root().classList.contains('day200-global')).toBe(true);
    expect(getByText(new RegExp(`/${SWEAT_GOAL}`))).toBeTruthy();
  });

  it('does NOT complete while reps are below the sweat goal', () => {
    const { getByText } = render(<Harness dayNumber={200} today={today} {...ctx(1)} />);
    dismissIntro(getByText);
    act(() => { vi.advanceTimersByTime(2000); });
    expect(localStorage.getItem('day200_challenge_done')).toBeNull();
  });

  it('completes when the sweat goal is reached → storm reward then done', () => {
    const { getByText, rerender } = render(<Harness dayNumber={200} today={today} {...ctx(0)} />);
    dismissIntro(getByText);
    expect(localStorage.getItem('day200_challenge_done')).toBeNull();

    act(() => { rerender(<Harness dayNumber={200} today={today} {...ctx(99999)} />); });
    act(() => { vi.advanceTimersByTime(SWEAT_GOAL + 12000); });
    expect(localStorage.getItem('day200_challenge_done')).toBe('1');
  });
});
