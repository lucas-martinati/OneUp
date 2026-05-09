import { sumExerciseReps } from './stats';

/**
 * Determine the time-of-day bucket from an ISO date string.
 * @param {string} dateStr - ISO 8601 date string
 * @returns {'morning'|'noon'|'evening'|'night'}
 */
function getTimeOfDay(dateStr) {
  try {
    const hour = new Date(dateStr).getHours();
    if (hour >= 5 && hour < 11) return 'morning';
    if (hour >= 11 && hour < 14) return 'noon';
    if (hour >= 14 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  } catch {
    return 'evening'; // safe default
  }
}

/**
 * Classify a session's intensity based on total reps and exercise count.
 * @param {number} totalReps
 * @param {number} exerciseCount
 * @returns {'light'|'moderate'|'intense'|'epic'}
 */
function getSessionIntensity(totalReps, exerciseCount) {
  if (totalReps <= 50 || exerciseCount <= 2) return 'light';
  if (totalReps <= 200 && exerciseCount <= 5) return 'moderate';
  if (totalReps <= 500) return 'intense';
  return 'epic';
}

/**
 * Simple deterministic hash from a string, used to pick a variant
 * without being truly random — same date always gives same name.
 * @param {string} str
 * @returns {number}
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Pick one item from an i18n array translation key using a deterministic seed.
 * Falls back to the first item if the key doesn't resolve to an array.
 * @param {Function} t - i18next translation function
 * @param {string} key - translation key that resolves to an array
 * @param {string} seed - seed for deterministic selection
 * @returns {string}
 */
function pickFromPool(t, key, seed) {
  const pool = t(key, { returnObjects: true });
  if (!Array.isArray(pool) || pool.length === 0) {
    return t(key); // fallback to plain string
  }
  const idx = simpleHash(seed) % pool.length;
  return pool[idx];
}

/**
 * Generate an automatic session name based on contextual factors.
 * @param {Function} t - i18next translation function
 * @param {Object} params
 * @param {string} params.date - ISO date of the session
 * @param {number} params.totalReps - total repetitions in the session
 * @param {number} params.exerciseCount - number of distinct exercises
 * @param {boolean} params.isPerfectDay - whether the user completed all exercises
 * @returns {string}
 */
export function generateSessionName(t, { date, totalReps = 0, exerciseCount = 0, isPerfectDay = false }) {
  const dateStr = date || new Date().toISOString();
  const seed = dateStr.slice(0, 10) + String(totalReps) + String(exerciseCount);

  if (isPerfectDay) {
    return pickFromPool(t, 'sessionNames.perfectDay', seed);
  }

  const timeOfDay = getTimeOfDay(dateStr);
  const intensity = getSessionIntensity(totalReps, exerciseCount);

  return pickFromPool(t, `sessionNames.${intensity}.${timeOfDay}`, seed);
}

/**
 * Generate a contextual share text for native sharing.
 * @param {Function} t - i18next translation function
 * @param {Object} params
 * @param {string} params.date - ISO date of the session
 * @param {number} params.totalReps - total repetitions
 * @param {number} params.exerciseCount - number of exercises
 * @param {boolean} params.isPerfectDay - perfect day status
 * @param {string} params.mode - 'session' | 'global'
 * @returns {string}
 */
function generateShareText(t, { date, totalReps = 0, exerciseCount = 0, isPerfectDay = false, mode = 'session' }) {
  const dateStr = date || new Date().toISOString();
  const seed = dateStr.slice(0, 10) + 'share' + String(totalReps);

  if (mode === 'global') {
    return pickFromPool(t, 'shareTexts.global', seed);
  }

  if (isPerfectDay) {
    return pickFromPool(t, 'shareTexts.perfectDay', seed);
  }

  const intensity = getSessionIntensity(totalReps, exerciseCount);
  return pickFromPool(t, `shareTexts.${intensity}`, seed);
}

/**
 * Convenience: generate share text directly from sessionData.
 * @param {Function} t - i18next translation function
 * @param {Object} sessionData - { date, exercises, ... }
 * @param {string} mode - 'session' | 'global'
 * @param {boolean} isPerfectDay
 * @returns {string}
 */
export function generateShareTextFromSession(t, sessionData, mode = 'session', isPerfectDay = false) {
  const exercises = sessionData?.exercises || [];
  const totalReps = sumExerciseReps(exercises);
  const exerciseCount = exercises.length;

  return generateShareText(t, {
    date: sessionData?.date,
    totalReps,
    exerciseCount,
    isPerfectDay,
    mode,
  });
}
