import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import { Day300EventManager, VALIDATE_GOAL } from '../Day300Event';
import { EventHud } from '../EventHud';
import { EXERCISES } from '@config/exercises';

const today = '2026-04-10';
const dayNumber = 300;

const ctxWith = (n) => {
  const ids = EXERCISES.map(e => e.id);
  const completions = {};
  completions[today] = {};
  ids.slice(0, n).forEach(id => {
    completions[today][id] = { isCompleted: true };
  });
  return {
    getConfig: () => ({ difficulty: 1 }),
    getExerciseCount: () => 0,
    completions,
  };
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

function clickAndWait(btn) {
  act(() => { btn.click(); });
  act(() => { vi.advanceTimersByTime(500); });
}

function findAndDismiss(getByText) {
  clickAndWait(getByText(/Lancer l'ascension/));
}

function renderApp(eventProps) {
  return render(
    <>
      <Day300EventManager {...eventProps} />
      <EventHud placement="dashboard" />
    </>
  );
}

describe('Day300EventManager', () => {
  it('renders nothing when it is not day 300', () => {
    const { container } = renderApp({ dayNumber: 42, today, ...ctxWith(0) });
    expect(container.textContent).toBe('');
  });

  it('shows the intro splash with the exercise challenge', () => {
    renderApp({ dayNumber, today, ...ctxWith(0) });
    expect(document.body.textContent).toContain(`${VALIDATE_GOAL} exercices à valider`);
    expect(document.body.textContent).toContain("Lancer l'ascension");
  });

  it('activates the cosmic dashboard and shows the constellation once dismissed', () => {
    const { getByText } = renderApp({ dayNumber, today, ...ctxWith(0) });
    findAndDismiss(getByText);
    expect(root().classList.contains('day300-global')).toBe(true);
    const hudEl = document.querySelector('.d300-constellation-count');
    expect(hudEl?.textContent).toMatch(new RegExp(`^0/${VALIDATE_GOAL}`));
  });

  it('does NOT complete while fewer than VALIDATE_GOAL exercises are validated', () => {
    const { getByText } = renderApp({ dayNumber, today, ...ctxWith(VALIDATE_GOAL - 1) });
    findAndDismiss(getByText);
    act(() => { vi.advanceTimersByTime(2000); });
    const hudEl = document.querySelector('.d300-constellation-count');
    expect(hudEl?.textContent).toMatch(new RegExp(`^${VALIDATE_GOAL - 1}/${VALIDATE_GOAL}`));
    expect(localStorage.getItem('day300_challenge_done')).toBeNull();
  });

  it('completes once enough exercises are validated → reward then done', () => {
    const { getByText } = renderApp({ dayNumber, today, ...ctxWith(VALIDATE_GOAL) });
    findAndDismiss(getByText);
    act(() => { vi.advanceTimersByTime(12000); });
    expect(localStorage.getItem('day300_challenge_done')).toBe('1');
  });
});
