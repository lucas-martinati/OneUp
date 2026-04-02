import i18n from '../i18n';
import { EXERCISES } from '../config/exercises';
import { WEIGHT_EXERCISES } from '../config/weights';

const WEIGHT_ID_SET = new Set(WEIGHT_EXERCISES.map(e => e.id));
const BW_ID_SET = new Set(EXERCISES.map(e => e.id));

/**
 * Resolve the display name for an exercise.
 * Custom exercises (id starts with 'custom_') use their stored label.
 * Standard exercises use i18n translation.
 */
export function getExerciseLabel(ex) {
  if (!ex) return '';
  // Custom exercises: use label directly (no i18n)
  if (ex.id?.startsWith('custom_')) return ex.label || ex.id;
  // If label has uppercase/accented chars, it's a proper stored name
  if (ex.label && /[A-Z\u00C0-\u017F]/.test(ex.label)) return ex.label;
  // Standard: use i18n, fallback to label or id
  return i18n.t('exercises.' + ex.id, { defaultValue: ex.label || ex.id });
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
