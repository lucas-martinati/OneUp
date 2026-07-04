import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k) => k, i18n: { language: 'fr' } }),
  initReactI18next: { type: '3rdParty', init: () => {} },
  Trans: ({ i18nKey }) => i18nKey,
}));
vi.mock('@hooks/useExerciseConfig', () => ({
  useExerciseConfig: () => ({ getConfig: () => ({ difficulty: 1, weight: 50 }) }),
}));
vi.mock('@contexts/ExercisesContext', () => ({ useExercises: () => ({ customCategories: [], exercisesByUserCategory: {}, customExercises: [] }) }));

import { ShareCard } from '../ShareCard';
import { EXERCISES } from '@config/exercises';
import { WEIGHT_EXERCISES } from '@config/weights';

const bw = EXERCISES[0];
const wt = WEIGHT_EXERCISES[0];

const sessionData = {
  name: 'Morning grind',
  date: '2026-04-10',
  duration: 1800,
  type: 'bodyweight',
  exercises: [
    { id: bw.id, count: 50, difficulty: 1 },
    { id: wt.id, count: 20, weight: 40 },
    { id: 'running', count: 1 },
    { id: 'custom_abc', name: 'My move', count: 10 },
  ],
};

const stats = {
  totalReps: 1000, globalTotalReps: 5000, displayStreak: 7, maxStreak: 20,
  streakActive: true, totalDays: 30, firstActiveDate: '2026-01-01',
  exerciseReps: { [bw.id]: 500 },
  exerciseStats: [{ id: bw.id, totalReps: 500 }, { id: wt.id, totalReps: 200 }],
  customExercises: [{ id: 'custom_abc', name: 'My move' }],
};

beforeEach(() => { document.body.innerHTML = ''; });
afterEach(() => cleanup());

describe('ShareCard', () => {
  it('renders a session card with metrics shown', () => {
    const { container } = render(
      <ShareCard
        sessionData={sessionData}
        stats={stats}
        sessionHistory={[]}
        options={{ showDuration: true, showStreak: true, showVolume: true, showExercises: true, showWeights: true }}
        mode="session"
      />
    );
    expect(container.textContent).toContain('Morning grind');
  });

  it('renders a global card with daily exercises and pro theme', () => {
    const completions = {
      '2026-04-10': {
        [bw.id]: { isCompleted: true, count: 60 },
        [wt.id]: { isCompleted: true, count: 25, weight: 50 },
        running: { isCompleted: true },
      },
    };
    const { container } = render(
      <ShareCard
        sessionData={null}
        stats={stats}
        sessionHistory={[]}
        completions={completions}
        getDayNumber={() => 100}
        settings={{ startDate: '2026-01-01' }}
        options={{
          showDailyExercises: true, showWeights: true, showStreak: true, showVolume: true,
          theme: 'ocean', globalDate: '2026-04-10', statsCategories: ['bodyweight', 'weights', 'cardio', 'custom'],
        }}
        mode="global"
        isPro={true}
      />
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('renders a global card with session history and background image', () => {
    const { container } = render(
      <ShareCard
        sessionData={null}
        stats={stats}
        sessionHistory={[
          { name: 'S1', date: '2026-04-09', exercises: [{ id: bw.id, count: 30 }], duration: 600 },
        ]}
        completions={{}}
        getDayNumber={() => 50}
        options={{
          showSessionHistory: true, showStreak: true,
          backgroundImage: 'data:image/png;base64,xxx', bgPosX: 50, bgPosY: 50, bgSize: 'cover',
        }}
        mode="global"
        isPro={true}
      />
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('renders with minimal options without crashing', () => {
    const { container } = render(
      <ShareCard sessionData={{ exercises: [] }} stats={stats} sessionHistory={[]} options={{}} mode="session" />
    );
    expect(container.firstChild).toBeTruthy();
  });
});
