/**
 * SINGLE SOURCE OF TRUTH for exercise configurations (id + multiplier) and getDailyGoal calculation.
 *
 * ES Module consumed by BOTH:
 *   • the client UI    — src/config/exercises.js & src/config/weights.js (bundled by Vite),
 *                        which attaches presentation metadata (icon/colour/…)
 *   • the Cloud Function — functions/index.js (via import), to compute leaderboard scores accurately.
 */

export const EXERCISES = [
  { id: 'pushups', multiplier: 1 },
  { id: 'squats', multiplier: 1 },
  { id: 'pullups', multiplier: 0.4 },
  { id: 'abs', multiplier: 1 },
  { id: 'jumpingjacks', multiplier: 1.5 },
  { id: 'lunges', multiplier: 1 },
  { id: 'burpees', multiplier: 0.5 },
  { id: 'planche', multiplier: 2 },
  { id: 'dips', multiplier: 1 },
  { id: 'mountain', multiplier: 2 },
];

export const WEIGHT_EXERCISES = [
  { id: 'biceps_curl', multiplier: 0.5 },
  { id: 'hammer_curl', multiplier: 0.5 },
  { id: 'bench_press', multiplier: 0.5 },
  { id: 'overhead_press', multiplier: 0.4 },
  { id: 'squat_weights', multiplier: 0.5 },
  { id: 'deadlift', multiplier: 0.4 },
  { id: 'barbell_row', multiplier: 0.5 },
];

export const CARDIO_EXERCISES = [
  { id: 'running' },
  { id: 'cycling' },
];

export const ALL_STANDARD_IDS = new Set(EXERCISES.map(e => e.id));
export const ALL_WEIGHT_IDS = new Set(WEIGHT_EXERCISES.map(e => e.id));
export const ALL_EXERCISE_IDS = new Set([
  ...EXERCISES.map(e => e.id),
  ...WEIGHT_EXERCISES.map(e => e.id),
  ...CARDIO_EXERCISES.map(e => e.id),
]);

export function getDailyGoal(exercise, dayNumber, userMultiplier = 1.0, isWeekly = false) {
  if (!exercise) return 1;
  if (isWeekly) {
    return Math.max(1, Math.ceil(dayNumber * 7));
  }
  const mult = exercise.multiplier !== undefined ? exercise.multiplier : 1;
  return Math.max(1, Math.ceil(dayNumber * mult * userMultiplier));
}
