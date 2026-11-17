import { describe, expect, it, vi } from 'vitest';
vi.mock('@utils/exerciseLabel', () => ({ getExerciseLabel: ex => ex.label || ex.id }));
import { buildWearSnapshot } from '../wearSnapshot';

function options() {
  return {
    progress: { _userId: 'a', isStoreInitialized: true, isSetup: true, getDayNumber: () => 50, completions: {}, wearReceipts: { watch: 2 } },
    exerciseStore: { _userId: 'a', isStoreInitialized: true, customExercises: [{ id: 'custom_a', label: 'Mobilité', multiplier: 1, categoryId: 'cat_mobility' }], customCategories: [{ id: 'cat_mobility', name: 'Mobilité' }], getWeight: () => 12 },
    stats: { displayStreak: 12 }, isPro: false, scope: 'scope', t: key => key, language: 'fr', now: new Date(2026, 9, 29, 12),
  };
}
describe('phone-owned Wear catalog', () => {
  it('exports real goals, custom categories, locks and weights', () => {
    const snapshot = buildWearSnapshot(options());
    expect(snapshot.exercises.find(ex => ex.id === 'squats').goal).toBe(50);
    expect(snapshot.exercises.find(ex => ex.id === 'pullups').goal).toBe(20);
    expect(snapshot.exercises.find(ex => ex.id === 'planche')).toMatchObject({ goal: 100, type: 'timer' });
    expect(snapshot.exercises.find(ex => ex.id === 'bench_press')).toMatchObject({ goal: 25, locked: true, weight: 12 });
    expect(snapshot.categories.find(cat => cat.id === 'cat_mobility')).toMatchObject({ name: 'Mobilité', locked: true });
    expect(snapshot.streak).toBe(12);
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
    expect(buildWearSnapshot(input)).toMatchObject({ ready: false, exercises: [], categories: [] });
    input.exerciseStore._userId = 'a'; input.userId = 'b';
    expect(buildWearSnapshot(input).ready).toBe(false);
  });
});
