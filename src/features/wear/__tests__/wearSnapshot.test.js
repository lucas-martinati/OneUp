import { describe, expect, it, vi } from 'vitest';
vi.mock('@utils/exerciseLabel', () => ({ getExerciseLabel: ex => ex.label || ex.id }));
import { buildWearSnapshot } from '../wearSnapshot';

function options() {
  return {
    progress: { _userId: 'a', isStoreInitialized: true, isSetup: true, getDayNumber: () => 50, completions: {}, wearReceipts: { watch: 2 } },
    exerciseStore: {
      _userId: 'a',
      isStoreInitialized: true,
      customExercises: [{ id: 'custom_a', label: 'Mobilité', multiplier: 1, categoryId: 'cat_mobility' }],
      customCategories: [{ id: 'cat_mobility', name: 'Mobilité' }],
      routines: [
        { id: 'r1', name: 'Haut du corps', exerciseIds: ['pushups', 'pullups', 'bench_press'] },
        { id: 'r2', name: 'Locked Only', exerciseIds: ['bench_press'] },
      ],
      getWeight: () => 12,
    },
    stats: { displayStreak: 12, isTodayCompleted: true, isTodayFrozen: false },
    settings: { appTheme: 'ocean' },
    isPro: false, scope: 'scope', t: key => key, language: 'fr', now: new Date(2026, 9, 29, 12),
  };
}
describe('phone-owned Wear catalog', () => {
  it('exports real goals, custom categories, routines, theme, strings, locks and weights', () => {
    const snapshot = buildWearSnapshot(options());
    expect(snapshot.exercises.find(ex => ex.id === 'squats').goal).toBe(50);
    expect(snapshot.exercises.find(ex => ex.id === 'pullups').goal).toBe(20);
    expect(snapshot.exercises.find(ex => ex.id === 'planche')).toMatchObject({ goal: 100, type: 'timer' });
    expect(snapshot.exercises.find(ex => ex.id === 'bench_press')).toMatchObject({ goal: 25, locked: true, weight: 12 });
    expect(snapshot.categories.find(cat => cat.id === 'cat_mobility')).toMatchObject({ name: 'Mobilité', locked: true });
    expect(snapshot.routines).toEqual([{ id: 'r1', name: 'Haut du corps', exerciseIds: ['pushups', 'pullups'] }]);
    expect(snapshot.theme).toMatchObject({ key: 'dark', accent: '#818cf8' });
    expect(snapshot.strings.myWorkout).toBe('wear.watch.myWorkout');
    expect(snapshot.streak).toBe(12);
    expect(snapshot.streakActive).toBe(true);
  });
  it('syncs the active Pro theme and unlocks weight exercises in routines when Pro', () => {
    const input = options();
    input.isPro = true;
    const snapshot = buildWearSnapshot(input);
    expect(snapshot.theme).toMatchObject({ key: 'ocean', accent: '#06b6d4' });
    expect(snapshot.routines).toHaveLength(2);
    expect(snapshot.routines[0].exerciseIds).toEqual(['pushups', 'pullups', 'bench_press']);
  });
  it('reuses a locked day goal and keeps receipts for acknowledgment', () => {
    const input = options(); input.progress.completions['2026-10-29'] = { pushups: { count: 5, goal: 20, level: 2 } };
    const snapshot = buildWearSnapshot(input);
    expect(snapshot.exercises.find(ex => ex.id === 'pushups')).toMatchObject({ count: 5, goal: 20 });
    expect(snapshot.receipts).toEqual({ watch: 2 });
    expect(snapshot.expiresAt).toBe(new Date(2026, 9, 30).getTime());
  });
  it('does not expose previous account exercises before all stores switch', () => {
    const input = options(); input.exerciseStore._userId = 'b';
    expect(buildWearSnapshot(input)).toMatchObject({ ready: false, exercises: [], categories: [], routines: [] });
    input.exerciseStore._userId = 'a'; input.userId = 'b';
    expect(buildWearSnapshot(input).ready).toBe(false);
  });
});
