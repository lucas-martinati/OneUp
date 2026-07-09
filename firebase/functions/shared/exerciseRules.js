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

/**
 * Weekly cardio distance goal in METERS per activity type.
 * Running: +450 m/week cumulative
 * Cycling: +750 m/week cumulative
 */
const CARDIO_WEEKLY_INCREMENT_M = {
  running: 450,
  cycling: 750,
};

/**
 * Weekly goal for cardio (running/cycling), in km. Formula: weekNumber × increment.
 */
export function getWeeklyGoalKm(mode, weekNumber) {
  const incrementM = CARDIO_WEEKLY_INCREMENT_M[mode];
  if (!incrementM) return 0;
  return (weekNumber * incrementM) / 1000;
}

/**
 * Reps-per-km used to convert a validated cardio week's goal distance into
 * the same "reps" unit as every other exercise. Single source of truth so
 * the Cloud Function (leaderboard/public profile) and the client (personal
 * Stats page, dashboard) never drift apart on this conversion.
 *
 * Calibrated so a validated cardio week grows at roughly the same rate as the
 * app's mult=1 baseline exercise (pushups/squats: ~49 × weekNumber reps/week —
 * see EXERCISES above and getDailyGoal). Per-mode because running/cycling have
 * different weekly km increments (see CARDIO_WEEKLY_INCREMENT_M): a flat
 * per-km rate can't track both curves at once.
 *   running: 49 / 0.45 ≈ 108.9 → 109
 *   cycling: 49 / 0.75 ≈ 65.3  → 65
 * Residual vs the 49×weekNumber baseline stays under 2.5% from week 15 on.
 */
export const CARDIO_REPS_PER_KM = {
  running: 109,
  cycling: 65,
};
