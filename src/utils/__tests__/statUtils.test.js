import { describe, it, expect } from 'vitest';
import { calculateRepsForDay, isPerfectDay, isGlobalPerfectDay, isCaughtUpDay } from '../statUtils';
import { EXERCISES } from '../../config/exercises';
import { WEIGHT_EXERCISES } from '../../config/weights';

const getConfig = () => ({ difficulty: 1, weight: null });

// ── isPerfectDay ────────────────────────────────────────────────────────

describe('isPerfectDay', () => {
  const exercises = [{ id: 'a' }, { id: 'b' }];

  it('is true when every exercise is completed', () => {
    const day = { a: { isCompleted: true }, b: { isCompleted: true } };
    expect(isPerfectDay(day, exercises)).toBe(true);
  });

  it('is false when one exercise is missing', () => {
    const day = { a: { isCompleted: true } };
    expect(isPerfectDay(day, exercises)).toBe(false);
  });

  it('is false when one exercise is not completed', () => {
    const day = { a: { isCompleted: true }, b: { isCompleted: false } };
    expect(isPerfectDay(day, exercises)).toBe(false);
  });

  it('is false for empty inputs', () => {
    expect(isPerfectDay(null, exercises)).toBe(false);
    expect(isPerfectDay({}, [])).toBe(false);
  });
});

// ── isGlobalPerfectDay ──────────────────────────────────────────────────

describe('isGlobalPerfectDay', () => {
  it('is true when ALL bodyweight exercises are completed', () => {
    const day = Object.fromEntries(EXERCISES.map(e => [e.id, { isCompleted: true }]));
    expect(isGlobalPerfectDay(day, EXERCISES)).toBe(true);
  });

  it('is false when a single bodyweight exercise is missing', () => {
    const day = Object.fromEntries(EXERCISES.slice(1).map(e => [e.id, { isCompleted: true }]));
    expect(isGlobalPerfectDay(day, EXERCISES)).toBe(false);
  });

  it('is true when ALL weight exercises are completed (weights-only perfect)', () => {
    const day = Object.fromEntries(WEIGHT_EXERCISES.map(e => [e.id, { isCompleted: true }]));
    expect(isGlobalPerfectDay(day, WEIGHT_EXERCISES)).toBe(true);
  });

  it('is false with no completions', () => {
    expect(isGlobalPerfectDay(null, EXERCISES)).toBe(false);
    expect(isGlobalPerfectDay({}, EXERCISES)).toBe(false);
  });
});

// ── calculateRepsForDay ─────────────────────────────────────────────────

describe('calculateRepsForDay', () => {
  const exercises = [
    { id: 'pushups', multiplier: 1 },
    { id: 'squats', multiplier: 0.5 },
  ];

  it('sums the daily goal of each completed exercise', () => {
    const day = {
      pushups: { isCompleted: true },
      squats: { isCompleted: true },
    };
    // day 100: pushups goal 100, squats goal ceil(100*0.5)=50
    expect(calculateRepsForDay(day, 100, exercises, getConfig, '2026-06-10')).toBe(150);
  });

  it('ignores exercises that are not completed', () => {
    const day = { pushups: { isCompleted: true }, squats: { isCompleted: false } };
    expect(calculateRepsForDay(day, 100, exercises, getConfig, '2026-06-10')).toBe(100);
  });

  it('applies the per-exercise difficulty from getConfig', () => {
    const halved = () => ({ difficulty: 0.5, weight: null });
    const day = { pushups: { isCompleted: true } };
    expect(calculateRepsForDay(day, 100, [exercises[0]], halved, '2026-06-10')).toBe(50);
  });

  it('returns 0 for empty inputs', () => {
    expect(calculateRepsForDay(null, 100, exercises, getConfig, '2026-06-10')).toBe(0);
    expect(calculateRepsForDay({}, 100, null, getConfig, '2026-06-10')).toBe(0);
    expect(calculateRepsForDay({}, 100, exercises, getConfig, '2026-06-10')).toBe(0);
  });

  it('uses the weekly cardio goal for running/cycling (not the day number)', () => {
    // Branche cardio : l'objectif dépend du numéro de semaine, pas de dayNumber.
    // startDate === dateStr ⇒ semaine 1 ⇒ objectif hebdo = ceil(1 × 7) = 7,
    // indépendamment du dayNumber (99) passé.
    const day = { running: { isCompleted: true } };
    const reps = calculateRepsForDay(day, 99, [{ id: 'running' }], getConfig, '2026-06-01', '2026-06-01');
    expect(reps).toBe(7);
  });

  it('falls back to dateStr as start date for cardio when startDate is null', () => {
    const day = { cycling: { isCompleted: true } };
    // startDate non fourni ⇒ utilise dateStr ⇒ semaine 1 ⇒ 7.
    const reps = calculateRepsForDay(day, 5, [{ id: 'cycling' }], getConfig, '2026-06-01');
    expect(reps).toBe(7);
  });
});

// ── isCaughtUpDay ───────────────────────────────────────────────────────

describe('isCaughtUpDay', () => {
  const HOUR = 3600 * 1000;
  const dayStr = '2026-06-10';
  const base = Date.UTC(2026, 5, 10); // minuit UTC du jour considéré

  it('is false for empty / null completions', () => {
    expect(isCaughtUpDay(null, dayStr)).toBe(false);
    expect(isCaughtUpDay({}, dayStr)).toBe(false);
  });

  it('is false when completed within the normal window', () => {
    const day = { pushups: { isCompleted: true, timestamp: base + 12 * HOUR } };
    expect(isCaughtUpDay(day, dayStr)).toBe(false);
  });

  it('is true when completed late (≥ +37h)', () => {
    const day = { pushups: { isCompleted: true, timestamp: base + 40 * HOUR } };
    expect(isCaughtUpDay(day, dayStr)).toBe(true);
  });

  it('is true when completed early (< -15h)', () => {
    const day = { pushups: { isCompleted: true, timestamp: base - 20 * HOUR } };
    expect(isCaughtUpDay(day, dayStr)).toBe(true);
  });

  it('respects the exact boundaries (+37h caught up, -15h not)', () => {
    expect(isCaughtUpDay({ a: { isCompleted: true, timestamp: base + 37 * HOUR } }, dayStr)).toBe(true);
    expect(isCaughtUpDay({ a: { isCompleted: true, timestamp: base + 36.9 * HOUR } }, dayStr)).toBe(false);
    expect(isCaughtUpDay({ a: { isCompleted: true, timestamp: base - 15 * HOUR } }, dayStr)).toBe(false);
    expect(isCaughtUpDay({ a: { isCompleted: true, timestamp: base - 16 * HOUR } }, dayStr)).toBe(true);
  });

  it('is false when at least one completed exercise is within the window', () => {
    const day = {
      a: { isCompleted: true, timestamp: base + 40 * HOUR }, // rattrapé
      b: { isCompleted: true, timestamp: base + 12 * HOUR }, // normal
    };
    expect(isCaughtUpDay(day, dayStr)).toBe(false);
  });

  it('ignores completed exercises without a timestamp', () => {
    const day = {
      a: { isCompleted: true }, // pas de timestamp → ignoré
      b: { isCompleted: true, timestamp: base + 40 * HOUR }, // rattrapé
    };
    expect(isCaughtUpDay(day, dayStr)).toBe(true);
  });

  it('ignores non-completed exercises', () => {
    const day = {
      a: { isCompleted: false, timestamp: base + 12 * HOUR }, // dans la fenêtre mais non complété
      b: { isCompleted: true, timestamp: base + 40 * HOUR }, // rattrapé
    };
    expect(isCaughtUpDay(day, dayStr)).toBe(true);
  });

  it('ignores object timestamps (e.g. Firestore Timestamp)', () => {
    const day = {
      a: { isCompleted: true, timestamp: { seconds: 123, nanoseconds: 0 } }, // ignoré
      b: { isCompleted: true, timestamp: base + 40 * HOUR },
    };
    expect(isCaughtUpDay(day, dayStr)).toBe(true);
    // Si le SEUL exercice complété a un timestamp objet → aucun candidat → false.
    expect(isCaughtUpDay({ a: { isCompleted: true, timestamp: { seconds: 123 } } }, dayStr)).toBe(false);
  });

  it('accepts ISO string timestamps', () => {
    const iso = new Date(base + 40 * HOUR).toISOString();
    expect(isCaughtUpDay({ a: { isCompleted: true, timestamp: iso } }, dayStr)).toBe(true);
  });

  it('ignores invalid (NaN) string timestamps', () => {
    const day = { a: { isCompleted: true, timestamp: 'pas-une-date' } };
    expect(isCaughtUpDay(day, dayStr)).toBe(false);
  });

  it('is false when the date string is malformed', () => {
    const day = { a: { isCompleted: true, timestamp: base + 40 * HOUR } };
    expect(isCaughtUpDay(day, 'date-invalide')).toBe(false);
  });
});
