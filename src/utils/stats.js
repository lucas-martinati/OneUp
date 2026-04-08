/**
 * Shared statistics utilities for the OneUp app.
 */

/**
 * Sum the reps across an array of exercise objects.
 * @param {Array<{reps?: number}>} exercises
 * @returns {number}
 */
export function sumExerciseReps(exercises) {
  if (!Array.isArray(exercises)) return 0;
  return exercises.reduce((sum, ex) => sum + (ex.reps || 0), 0);
}
