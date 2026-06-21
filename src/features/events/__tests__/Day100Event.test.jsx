import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import { Day100EventManager } from '../Day100Event';
import { EXERCISES } from '@config/exercises';

const today = '2026-04-10';

const notPerfect = {
  getExerciseCount: () => 0,
  getConfig: () => ({ difficulty: 1 }),
  completions: {},
};
const perfect = {
  getExerciseCount: () => 99999,
  getConfig: () => ({ difficulty: 1 }),
  completions: { [today]: Object.fromEntries(EXERCISES.map(e => [e.id, { isCompleted: true }])) },
};

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

describe('Day100EventManager', () => {
  it('renders nothing when it is not day 100', () => {
    const { container } = render(<Day100EventManager dayNumber={42} today={today} {...notPerfect} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows the hack terminal modal on day 100 and reveals the dismiss button over time', () => {
    const { getByText } = render(<Day100EventManager dayNumber={100} today={today} {...notPerfect} />);
    act(() => { vi.advanceTimersByTime(8000); });
    const btn = getByText(/CORRIGER LES FAILLES/);
    expect(btn).toBeTruthy();
  });

  it('activates the hacked dashboard once the modal is dismissed', () => {
    const { getByText } = render(<Day100EventManager dayNumber={100} today={today} {...notPerfect} />);
    act(() => { vi.advanceTimersByTime(8000); });
    act(() => { getByText(/CORRIGER LES FAILLES/).click(); });
    act(() => { vi.advanceTimersByTime(600); });
    expect(root().classList.contains('day100-global')).toBe(true);
  });

  it('silently marks the day unhacked when it is already perfect before the modal', () => {
    render(<Day100EventManager dayNumber={100} today={today} {...perfect} />);
    act(() => { vi.advanceTimersByTime(50); });
    expect(localStorage.getItem('day100_unhacked')).toBe('1');
  });

  it('plays the unhack animation when the day becomes perfect after the hack is active', async () => {
    sessionStorage.setItem('day100_modal_shown', '1');
    const { rerender } = render(<Day100EventManager dayNumber={100} today={today} {...notPerfect} />);
    act(() => { vi.advanceTimersByTime(10); });
    expect(root().classList.contains('day100-global')).toBe(true);
    await act(async () => {
      rerender(<Day100EventManager dayNumber={100} today={today} {...perfect} />);
      await Promise.resolve(); // flush the queueMicrotask that shows the animation
    });
    // Drive the full multi-phase animation to completion → onComplete sets unhacked
    act(() => { vi.advanceTimersByTime(12000); });
    expect(localStorage.getItem('day100_unhacked')).toBe('1');
  });
});
