import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';

// ── ComputedStatsSynchronizer ──────────────────────────────────────────
const progressState = {
  completions: {
    '2026-01-01': { pushup: { isCompleted: true, difficulty: 1.5 } },
    '2026-01-02': { pushup: { isCompleted: true } }, // completed, no saved difficulty
  },
  getDayNumber: vi.fn(() => 1),
  hasShared: false,
  achievements: {},
  cardio: { sessions: { a: { type: 'running', distance: 5000 }, b: { type: 'cycling', distance: 10000 } } },
  userStartDate: '2026-01-01',
};
vi.mock('@store/useProgressStore', () => ({
  useProgressStore: (s) => s(progressState),
}));
vi.mock('@store/useSettingsStore', () => ({
  useSettingsStore: (s) => s({ settings: { exerciseDifficulties: { pushup: 2 } } }),
}));
vi.mock('@contexts/ExercisesContext', () => ({ useExercises: () => ({ customExercises: [] }) }));
const recompute = vi.fn();
vi.mock('@store/useComputedStatsStore', () => ({
  useComputedStatsStore: (s) => s({ recompute }),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k) => k }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));
vi.mock('@utils/icons', () => ({ RefreshCw: () => null, AlertTriangle: () => null }));

import { ComputedStatsSynchronizer } from '../ComputedStatsSynchronizer';
import { ErrorBoundary } from '../ErrorBoundary';
import { LoadingScreen } from '../LoadingScreen';

afterEach(() => cleanup());

describe('ComputedStatsSynchronizer', () => {
  beforeEach(() => recompute.mockClear());

  it('recomputes stats with derived cardio data on mount', () => {
    const { container } = render(<ComputedStatsSynchronizer />);
    expect(container.firstChild).toBeNull(); // invisible
    expect(recompute).toHaveBeenCalled();
    // Reps are now computed inside computeAllStats from completions (goal-based,
    // capped per validated week) — cardioData only needs to carry the raw
    // session list through for the weekly streak calculation.
    const cardioData = recompute.mock.calls[0][7];
    expect(cardioData.allSessions).toHaveLength(2);
  });

  it('builds a getConfig resolving difficulty across all branches', () => {
    let getConfig;
    recompute.mockImplementation((c, s, dn, ce, hs, ach, gc) => { getConfig = gc; });
    render(<ComputedStatsSynchronizer />);
    // completed day with a saved difficulty
    expect(getConfig('pushup', '2026-01-01')).toEqual({ difficulty: 1.5, weight: null });
    // completed day without a saved difficulty → defaults to 1.0
    expect(getConfig('pushup', '2026-01-02')).toEqual({ difficulty: 1.0, weight: null });
    // no date → uses the live preference
    expect(getConfig('pushup')).toEqual({ difficulty: 2, weight: null });
    // unknown exercise → default 1.0
    expect(getConfig('unknown')).toEqual({ difficulty: 1.0, weight: null });
  });
});

describe('ErrorBoundary', () => {
  const Boom = () => { throw new Error('kaboom'); };

  it('renders children when there is no error', () => {
    const { getByText } = render(<ErrorBoundary><span>ok</span></ErrorBoundary>);
    expect(getByText('ok')).toBeTruthy();
  });

  it('renders the fallback and the error message when a child throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { getByText } = render(<ErrorBoundary><Boom /></ErrorBoundary>);
    expect(getByText('Something went wrong')).toBeTruthy();
    expect(getByText('kaboom')).toBeTruthy();
    console.error.mockRestore();
  });
});

describe('LoadingScreen', () => {
  it('renders the initializing label', () => {
    const { getByText } = render(<LoadingScreen />);
    expect(getByText('app.initializing')).toBeTruthy();
  });
});
