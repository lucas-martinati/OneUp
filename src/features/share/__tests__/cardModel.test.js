import { describe, it, expect } from 'vitest';
import {
  buildCardModel, resolveCardFormat, getExerciseDensity, CARD_WIDTH, CARD_FORMATS,
} from '../services/cardModel';
import { CATEGORIES } from '@config/categories';
import { EXERCISES } from '@config/exercises';
import { WEIGHT_EXERCISES } from '@config/weights';

const bw = EXERCISES[0];
const wt = WEIGHT_EXERCISES[0];
const getConfig = () => ({ difficulty: 1, weight: 50 });
const t = (k) => k;

describe('resolveCardFormat', () => {
  it('snaps to the smallest standard format that fits', () => {
    expect(resolveCardFormat(400)).toEqual({ key: '1:1', height: 540 });
    expect(resolveCardFormat(540)).toEqual({ key: '1:1', height: 540 });
    expect(resolveCardFormat(541)).toEqual({ key: '4:5', height: 675 });
    expect(resolveCardFormat(700)).toEqual({ key: '9:16', height: 960 });
  });

  it('grows freely beyond 9:16 without truncating', () => {
    expect(resolveCardFormat(1200)).toEqual({ key: '>9:16', height: 1200 });
  });

  it('exposes coherent geometry constants', () => {
    expect(CARD_WIDTH).toBe(540);
    // 1:1 and 9:16 heights must match the fixed width
    expect(CARD_FORMATS[0].height).toBe(CARD_WIDTH);
    expect(CARD_FORMATS[2].height).toBe(Math.round(CARD_WIDTH * 16 / 9));
  });
});

describe('getExerciseDensity', () => {
  it('keeps detailed rows up to 4 items', () => {
    expect(getExerciseDensity(0)).toBe('detailed');
    expect(getExerciseDensity(4)).toBe('detailed');
  });
  it('switches to a 2-column grid from 5 to 12 items', () => {
    expect(getExerciseDensity(5)).toBe('grid');
    expect(getExerciseDensity(12)).toBe('grid');
  });
  it('compresses to compact chips beyond 12 items', () => {
    expect(getExerciseDensity(13)).toBe('compact');
  });
});

describe('buildCardModel — session mode', () => {
  const sessionData = {
    name: 'Morning grind',
    date: '2026-04-10',
    duration: 1800,
    type: 'bodyweight',
    exercises: [
      { id: bw.id, reps: 50, difficulty: 1 },
      { id: wt.id, reps: 20, weight: 40 },
      { id: 'running', reps: 1 },
      { id: 'custom_abc', name: 'My move', reps: 10 },
    ],
  };

  it('sums reps and counts exercises', () => {
    const model = buildCardModel({
      mode: 'session', sessionData, options: { showWeights: true }, getConfig, t,
    });
    expect(model.isGlobal).toBe(false);
    expect(model.totalReps).toBe(81);
    expect(model.exerciseCount).toBe(4);
    expect(model.duration).toBe(1800);
    expect(model.density).toBe('detailed');
  });

  it('splits exercises into categories when showWeights is on', () => {
    const model = buildCardModel({
      mode: 'session', sessionData, options: { showWeights: true }, getConfig, t,
    });
    expect(model.showSections).toBe(true);
    const keys = model.categories.map(c => c.key);
    expect(keys).toContain(CATEGORIES.BODYWEIGHT);
    expect(keys).toContain(CATEGORIES.WEIGHTS);
    expect(keys).toContain(CATEGORIES.CARDIO);
    expect(keys).toContain(CATEGORIES.CUSTOM);
    const weights = model.categories.find(c => c.key === CATEGORIES.WEIGHTS);
    expect(weights.exercises).toHaveLength(1);
    expect(weights.exercises[0].id).toBe(wt.id);
  });

  it('keeps a single flat list when showWeights is off', () => {
    const model = buildCardModel({
      mode: 'session', sessionData, options: { showWeights: false }, getConfig, t,
    });
    expect(model.showSections).toBe(false);
    expect(model.allExercises).toHaveLength(4);
  });

  it('assigns exercises to user-created categories', () => {
    const model = buildCardModel({
      mode: 'session',
      sessionData: { ...sessionData, exercises: [{ id: bw.id, reps: 10 }, { id: 'custom_x', reps: 5 }] },
      options: { showWeights: true },
      customCategories: [{ id: 'cat_yoga', name: 'Yoga', color: '#123456' }],
      exercisesByUserCategory: { cat_yoga: [{ id: 'custom_x' }] },
      getConfig, t,
    });
    const yoga = model.categories.find(c => c.key === 'cat_yoga');
    expect(yoga).toBeTruthy();
    expect(yoga.label).toBe('Yoga');
    expect(yoga.exercises[0].id).toBe('custom_x');
  });

  it('defaults difficulty from getConfig when missing', () => {
    const model = buildCardModel({
      mode: 'session',
      sessionData: { ...sessionData, exercises: [{ id: bw.id, reps: 10 }] },
      options: {},
      getConfig: () => ({ difficulty: 0.8 }),
      t,
    });
    expect(model.allExercises[0].difficulty).toBeCloseTo(0.8);
  });

  it('never uses a pro theme without isPro', () => {
    const model = buildCardModel({
      mode: 'session', sessionData, options: { theme: 'ocean' }, isPro: false, getConfig, t,
    });
    expect(model.activeThemeKey).toBe('dark');
    const pro = buildCardModel({
      mode: 'session', sessionData, options: { theme: 'ocean' }, isPro: true, getConfig, t,
    });
    expect(pro.activeThemeKey).toBe('ocean');
  });
});

describe('buildCardModel — global mode', () => {
  const stats = {
    displayStreak: 7, maxStreak: 20, streakActive: true, totalDays: 30,
    firstActiveDate: '2026-01-01',
    exerciseReps: { running: 100, cycling: 50 },
    exerciseStats: [
      { id: bw.id, totalReps: 500 },
      { id: wt.id, totalReps: 200 },
    ],
  };

  it('filters top metrics by selected categories', () => {
    const model = buildCardModel({
      mode: 'global', stats,
      options: { statsCategories: [CATEGORIES.BODYWEIGHT] },
      getConfig, t,
    });
    expect(model.totalReps).toBe(500);
    expect(model.exerciseCount).toBe(1);
    // Chips shown because the selection is partial
    expect(model.categoryChips.map(c => c.key)).toEqual([CATEGORIES.BODYWEIGHT]);
  });

  it('adds cardio reps when cardio is selected', () => {
    const model = buildCardModel({
      mode: 'global', stats,
      options: { statsCategories: [CATEGORIES.BODYWEIGHT, CATEGORIES.CARDIO] },
      getConfig, t,
    });
    expect(model.totalReps).toBe(650);
  });

  it('shows no chips when every category is selected', () => {
    const model = buildCardModel({
      mode: 'global', stats, options: {}, getConfig, t,
    });
    expect(model.categoryChips).toEqual([]);
  });

  it('builds daily exercises from completions and goes gold on a perfect day', () => {
    const completions = {
      '2026-04-10': Object.fromEntries([
        ...EXERCISES.map(ex => [ex.id, { isCompleted: true, count: 60 }]),
        [wt.id, { isCompleted: true, count: 25, weight: 50 }],
      ]),
    };
    const model = buildCardModel({
      mode: 'global', stats, completions,
      getDayNumber: () => 100,
      settings: { startDate: '2026-01-01' },
      options: {
        showDailyExercises: true, globalDate: '2026-04-10',
        statsCategories: [CATEGORIES.BODYWEIGHT, CATEGORIES.WEIGHTS],
      },
      getConfig, t,
    });
    expect(model.activeThemeKey).toBe('gold');
    expect(model.filteredDailyExercises.length).toBe(EXERCISES.length + 1);
    expect(model.showDailySections).toBe(true);
    const bwCat = model.dailyCategories.find(c => c.key === CATEGORIES.BODYWEIGHT);
    expect(bwCat.isPerfect).toBe(true);
    expect(bwCat.exercises[0].reps).toBe(60);
  });

  it('stays on the user theme when the day is not perfect', () => {
    const completions = { '2026-04-10': { [bw.id]: { isCompleted: true, count: 10 } } };
    const model = buildCardModel({
      mode: 'global', stats, completions,
      getDayNumber: () => 10,
      options: { showDailyExercises: true, globalDate: '2026-04-10', theme: 'ocean' },
      isPro: true,
      getConfig, t,
    });
    expect(model.activeThemeKey).toBe('ocean');
    expect(model.filteredDailyExercises).toHaveLength(1);
  });

  it('drives density from the daily list in global mode', () => {
    const manyDone = Object.fromEntries(EXERCISES.map(ex => [ex.id, { isCompleted: true, count: 10 }]));
    const model = buildCardModel({
      mode: 'global', stats,
      completions: { '2026-04-10': manyDone },
      getDayNumber: () => 10,
      options: { showDailyExercises: true, globalDate: '2026-04-10' },
      getConfig, t,
    });
    expect(model.density).toBe(getExerciseDensity(model.filteredDailyExercises.length));
  });
});
