import i18n from '../i18n';
import { EXERCISES } from '../config/exercises';
import { WEIGHT_EXERCISES } from '../config/weights';

const WEIGHT_ID_SET = new Set(WEIGHT_EXERCISES.map(e => e.id));
const BW_ID_SET = new Set(EXERCISES.map(e => e.id));

const DEFAULT_EXERCISE_COLOR = '#818cf8';

/**
 * Resolve the display name for an exercise.
 * Custom exercises (id starts with 'custom_') use their stored label.
 * Standard exercises use i18n translation.
 */
export function getExerciseLabel(ex) {
  if (!ex) return '';
  // Custom exercises: use label directly (no i18n)
  if (isCustomExercise(ex.id)) return ex.label || ex.id;
  // If label has uppercase/accented chars, it's a proper stored name
  if (ex.label && /[A-Z\u00C0-\u017F]/.test(ex.label)) return ex.label;
  // Standard: use i18n, fallback to label or id
  return i18n.t('exercises.' + ex.id, { defaultValue: ex.label || ex.id });
}

/**
 * Get the color of an exercise, with a fallback.
 * @param {Object} ex - Exercise object with optional color property
 * @param {string} [fallback=DEFAULT_EXERCISE_COLOR]
 * @returns {string} Hex color string
 */
export function getExerciseColor(ex, fallback = DEFAULT_EXERCISE_COLOR) {
  return ex?.color || fallback;
}

/**
 * Get the category of an exercise by its ID.
 * Returns 'bodyweight' | 'weights' | 'custom'
 */
export function getExerciseCategory(id) {
  if (WEIGHT_ID_SET.has(id)) return 'weights';
  if (BW_ID_SET.has(id)) return 'bodyweight';
  return 'custom';
}

/**
 * Check if an exercise ID is a custom exercise.
 * @param {string} id - Exercise ID
 * @returns {boolean}
 */
export function isCustomExercise(id) {
  return id?.startsWith('custom_');
}
