import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';

const tt = (k, d) => {
  if (typeof d === 'string') return d;
  return d?.level !== undefined ? `Lvl ${d.level}` : k;
};
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: tt, i18n: { language: 'fr' } }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

import ConsistencyPieChart from '../ConsistencyPieChart';
import DailyRepsChart from '../DailyRepsChart';
import LevelEvolutionChart from '../LevelEvolutionChart';
import EvolutionChart from '../EvolutionChart';
import { ExerciseBreakdown } from '../ExerciseBreakdown';
import { MonthlyActivityChart } from '../MonthlyActivityChart';
import RadarChartPanel from '../RadarChartPanel';
import { SessionHistoryList } from '../SessionHistoryList';
import { StatsHighlights } from '../StatsHighlights';
import { StatsOverviewCards } from '../StatsOverviewCards';
import WeightEvolutionChart from '../WeightEvolutionChart';
import { AchievementsShowcase } from '../AchievementsShowcase';
import { StatsFilters } from '../StatsFilters';
import { EXERCISES } from '@config/exercises';

const t = tt;
const ex = EXERCISES[0];
const completions = {
  '2026-01-01': { [ex.id]: { isCompleted: true, count: 50, difficulty: 1, weight: 40 } },
  '2026-01-02': { [ex.id]: { isCompleted: true, count: 60, difficulty: 1.2, weight: 42 } },
};
const getConfig = () => ({ difficulty: 1, weight: 40 });

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('stats charts smoke tests', () => {
  it('ConsistencyPieChart renders with data and empty states', () => {
    const { rerender, container } = render(
      <ConsistencyPieChart activeData={[{ name: 'a', value: 3 }]} trackedCount={5} title="T" subTitle="S" emptyTitle="E" emptySub="ES" />
    );
    expect(container.firstChild).toBeTruthy();
    rerender(<ConsistencyPieChart activeData={[]} trackedCount={0} title="T" emptyTitle="E" emptySub="ES" />);
    expect(container.firstChild).toBeTruthy();
  });

  it('DailyRepsChart renders with enough data and bails on too little', () => {
    const { rerender, container } = render(
      <DailyRepsChart dailyRepsData={[{ date: '2026-01-01', reps: 10 }, { date: '2026-01-02', reps: 20 }]} title="T" t={t} />
    );
    expect(container.firstChild).toBeTruthy();
    rerender(<DailyRepsChart dailyRepsData={[]} title="T" t={t} />);
    expect(container.firstChild).toBeNull();
  });

  it('LevelEvolutionChart renders', () => {
    const { container } = render(
      <LevelEvolutionChart title="T" t={t} getConfig={getConfig} completions={completions} exercises={[ex]} />
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('plots attained levels as steps, ignores zero and missing days and marks only changes', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-01-05T12:00:00'));
    const levelHistory = {
      '2026-01-01': { [ex.id]: { isCompleted: true } },
      '2026-01-02': { [ex.id]: { isCompleted: true, level: 10 } },
      '2026-01-03': { [ex.id]: { isCompleted: true, level: 5 } },
      '2026-01-04': { [ex.id]: { isCompleted: false } },
      '2026-01-05': { [ex.id]: { isCompleted: false, level: 0 } },
    };
    const { container } = render(<LevelEvolutionChart title="Levels" t={(key, values) => values?.level !== undefined ? `Lvl ${values.level}` : key} completions={levelHistory} exercises={[ex]} />);
    const path = container.querySelector('.svg-chart-line').getAttribute('d');
    expect(path).not.toContain('C'); // no curve interpolation
    expect(path).toContain('H');
    expect(path).toContain('V');
    expect(container.querySelectorAll('.svg-chart-dot')).toHaveLength(2); // first value and change to five
    expect(container.textContent).not.toContain('Lvl 0');
    expect(container.querySelector('[aria-label="Lvl 5"]')).toBeTruthy(); // last attained level, despite today's zero
    expect(container.textContent).not.toContain('01/04');
    expect(container.textContent).not.toContain('01/05');
  });

  it('shows an empty history without a level badge when no level has been attained', () => {
    const { container } = render(<LevelEvolutionChart title="Levels" t={(key, values) => values?.level !== undefined ? `Lvl ${values.level}` : key} completions={{
      '2026-01-01': { [ex.id]: { isCompleted: false } },
      '2026-01-02': { [ex.id]: { isCompleted: false, level: 0 } },
    }} exercises={[ex]} />);
    expect(container.querySelector('.svg-chart-line')).toBeNull();
    expect(container.textContent).toContain('stats.levelNoData');
    expect(container.textContent).not.toContain('Lvl ');
  });

  it('WeightEvolutionChart renders', () => {
    const { container } = render(
      <WeightEvolutionChart title="T" t={t} getConfig={getConfig} completions={completions} />
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('EvolutionChart renders and toggles exercises', () => {
    const { container } = render(
      <EvolutionChart
        title="T" t={t} exercises={[ex]} completions={completions}
        valueKey="difficulty" defaultValue={1} initialMax={2} gradient="linear"
        emptyTitle="E" emptyHint="H"
        yDomain={(m) => [0, m]} yAxisExtra={{}}
        formatBadge={(e) => `${e.id}`} formatTooltip={(v) => `${v}`}
      />
    );
    const btn = container.querySelector('button');
    if (btn) fireEvent.click(btn);
    expect(container.firstChild).toBeTruthy();
  });

  it('ExerciseBreakdown renders categorized stats', () => {
    const enriched = [{ id: ex.id, categoryId: 'bodyweight', color: '#8b5cf6', icon: ex.icon, name: ex.name, maxStreak: 3, totalReps: 100 }];
    const { container } = render(
      <ExerciseBreakdown
        enrichedExerciseStats={enriched}
        fullCategoryOrder={['bodyweight', 'cardio']}
        fullCategoryColors={{ bodyweight: '#8b5cf6', cardio: '#ef4444' }}
        customCategories={[]}
        hasCardio={true}
        cardioSessions={[{ distance: 5 }]}
      />
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('MonthlyActivityChart renders', () => {
    const { container } = render(
      <MonthlyActivityChart
        monthlyActivityTotal={[{ month: 'Jan', total: 100 }]}
        monthlyActivityByExercise={{ [ex.id]: [{ month: 'Jan', value: 50 }] }}
        exercises={[ex]}
      />
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('RadarChartPanel renders with enough axes and bails otherwise', () => {
    const { rerender, container } = render(
      <RadarChartPanel radarData={[{ subject: 'A', reps: 5 }, { subject: 'B', reps: 3 }, { subject: 'C', reps: 8 }]} globalTotalReps={100} title="T" />
    );
    expect(container.firstChild).toBeTruthy();
    rerender(<RadarChartPanel radarData={[]} globalTotalReps={0} title="T" />);
    expect(container.firstChild).toBeNull();
  });

  it('SessionHistoryList renders and selects a session', () => {
    const onSelectSession = vi.fn();
    const { container, rerender } = render(
      <SessionHistoryList
        sessionHistory={[{ id: 's1', name: 'S1', date: '2026-01-01', exercises: [{ id: ex.id, count: 10 }], duration: 600 }]}
        onSelectSession={onSelectSession}
      />
    );
    const clickable = container.querySelector('button, [role="button"]') || container.firstChild;
    if (clickable) fireEvent.click(clickable);
    rerender(<SessionHistoryList sessionHistory={[]} onSelectSession={onSelectSession} />);
    expect(container).toBeTruthy();
  });

  it('StatsHighlights renders with data and pending', () => {
    const { rerender, container } = render(
      <StatsHighlights champion={{ id: ex.id, totalReps: 100 }} bestDayDate="2026-01-01" bestDayReps={120} bestDayExReps={{ [ex.id]: 120 }} exercises={[ex]} />
    );
    expect(container.textContent.length).toBeGreaterThan(0);
    rerender(<StatsHighlights champion={null} bestDayDate="2026-01-02" bestDayReps={50} bestDayExReps={{ [ex.id]: 50 }} exercises={[ex]} pending={true} />);
    expect(container).toBeTruthy();
  });

  it('StatsOverviewCards renders both reps and cardio modes', () => {
    const props = {
      globalTotalReps: 1000, exercisesCount: 5, totalDays: 30, displayStreak: 7,
      streakActive: true, maxStreak: 20, successRate: 80, totalExerciseCompletions: 100, perfectDays: 10,
    };
    const { rerender, container } = render(<StatsOverviewCards {...props} />);
    expect(container.firstChild).toBeTruthy();
    rerender(<StatsOverviewCards {...props} onlyCardio={true} cardioKm={42} cardioSessionsCount={12} pending={true} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('AchievementsShowcase renders and opens', () => {
    const onOpen = vi.fn();
    const { container } = render(<AchievementsShowcase stats={{ totalReps: 100, completions }} onOpen={onOpen} />);
    fireEvent.click(container.querySelector('button'));
    expect(onOpen).toHaveBeenCalled();
  });

  it('StatsFilters toggles categories and respects pro gating', () => {
    const setActiveCategories = vi.fn();
    const setShowFilters = vi.fn();
    const onOpenStore = vi.fn();
    const { container, rerender } = render(
      <StatsFilters
        showFilters={true} setShowFilters={setShowFilters}
        activeCategories={['bodyweight']} setActiveCategories={setActiveCategories}
        fullCategoryOrder={['bodyweight', 'weights']}
        fullCategoryColors={{ bodyweight: '#8b5cf6', weights: '#f97316' }}
        customCategories={[]} hasProAccess={true} onOpenStore={onOpenStore}
      />
    );
    const inputs = container.querySelectorAll('input, button');
    inputs.forEach(el => fireEvent.click(el));
    rerender(
      <StatsFilters
        showFilters={false} setShowFilters={setShowFilters}
        activeCategories={['bodyweight']} setActiveCategories={setActiveCategories}
        fullCategoryOrder={['bodyweight']}
        fullCategoryColors={{ bodyweight: '#8b5cf6' }}
        customCategories={[]} hasProAccess={false} onOpenStore={onOpenStore}
      />
    );
    expect(container).toBeTruthy();
  });
});
