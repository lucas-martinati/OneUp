import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import { Day200EventManager } from '../Day200Event';
import { EXERCISES } from '@config/exercises';

const today = '2026-07-19';

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

describe('Day200EventManager', () => {
  it('renders nothing when it is not day 200', () => {
    const { container } = render(<Day200EventManager dayNumber={150} today={today} {...notPerfect} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows the welcome postcard and reveals its dismiss button', () => {
    const { container } = render(<Day200EventManager dayNumber={200} today={today} {...notPerfect} />);
    act(() => { vi.advanceTimersByTime(10000); });
    expect(container.querySelector('button')).toBeTruthy();
  });

  it('enables the vacation theme after the welcome card is dismissed', () => {
    const { container } = render(<Day200EventManager dayNumber={200} today={today} {...notPerfect} />);
    act(() => { vi.advanceTimersByTime(10000); });
    act(() => { container.querySelector('button').click(); });
    act(() => { vi.advanceTimersByTime(500); });
    expect(root().classList.contains('day200-global')).toBe(true);
  });

  it('silently marks the sunset as seen when the day is already perfect', () => {
    render(<Day200EventManager dayNumber={200} today={today} {...perfect} />);
    act(() => { vi.advanceTimersByTime(50); });
    expect(localStorage.getItem('day200_sunset_seen')).toBe('1');
  });

  it('plays the sunset animation when the day becomes perfect after the welcome', async () => {
    sessionStorage.setItem('day200_welcome_shown', '1');
    const { rerender } = render(<Day200EventManager dayNumber={200} today={today} {...notPerfect} />);
    act(() => { vi.advanceTimersByTime(10); });
    expect(root().classList.contains('day200-global')).toBe(true);
    await act(async () => {
      rerender(<Day200EventManager dayNumber={200} today={today} {...perfect} />);
      await Promise.resolve();
    });
    act(() => { vi.advanceTimersByTime(12000); });
    expect(localStorage.getItem('day200_sunset_seen')).toBe('1');
  });
});
