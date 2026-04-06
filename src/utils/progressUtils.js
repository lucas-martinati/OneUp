import { EXERCISES } from '../config/exercises';

/**
 * Migrate legacy flat completions entry to the new per-exercise structure.
 * Old format 1: completions[dateStr] = { done, pushupCount, timestamp, timeOfDay }
 * Old format 2: completions[dateStr][exerciseId] = { count, done, timestamp, timeOfDay }
 * New: completions[dateStr][exerciseId] = { isCompleted, timestamp, timeOfDay }
 */
export function migrateLegacyEntry(entry) {
  const exerciseIds = EXERCISES.map(e => e.id);
  const hasExerciseKey = exerciseIds.some(id => id in entry);

  if (!hasExerciseKey) {
    const migrated = {};
    if (entry.done !== undefined || entry.pushupCount !== undefined || entry.isCompleted !== undefined) {
      migrated.pushups = {
        isCompleted: entry.isCompleted || entry.done || false,
        timestamp: entry.timestamp || null,
        timeOfDay: entry.timeOfDay || null,
      };
    }
    return migrated;
  }

  const migrated = {};
  for (const [key, val] of Object.entries(entry)) {
    if (val && typeof val === 'object') {
      migrated[key] = {
        isCompleted: val.isCompleted !== undefined ? val.isCompleted : (val.done || false),
        timestamp: val.timestamp || null,
        timeOfDay: val.timeOfDay || null,
      };
    }
  }
  return migrated;
}

/**
 * Validate and sanitize progress data loaded from localStorage.
 * Protects against corrupted or partial data, and migrates legacy entries.
 */
export function validateProgressData(data) {
  if (!data || typeof data !== 'object') return null;

  const rawCompletions =
    data.completions && typeof data.completions === 'object' && !Array.isArray(data.completions)
      ? data.completions
      : {};

  const completions = {};
  for (const [dateStr, entry] of Object.entries(rawCompletions)) {
    if (entry && typeof entry === 'object') {
      completions[dateStr] = migrateLegacyEntry(entry);
    }
  }

  return {
    startDate: typeof data.startDate === 'string' ? data.startDate : `${new Date().getFullYear()}-01-01`,
    userStartDate:
      typeof data.userStartDate === 'string'
        ? data.userStartDate
        : data.startDate || `${new Date().getFullYear()}-01-01`,
    completions,
    isSetup: typeof data.isSetup === 'boolean' ? data.isSetup : false,
    hasShared: typeof data.hasShared === 'boolean' ? data.hasShared : false,
    manualBadges: typeof data.manualBadges === 'object' && data.manualBadges !== null ? data.manualBadges : {},
  };
}

/** Build a "day done" object for all exercises (used in backfill) */
export function makeAllDone(selectedExercises = null) {
  const entry = {};
  const now = new Date().toISOString();
  const exercisesToComplete = selectedExercises
    ? EXERCISES.filter(ex => selectedExercises.includes(ex.id))
    : EXERCISES;

  for (const ex of exercisesToComplete) {
    entry[ex.id] = { isCompleted: true, timestamp: now, timeOfDay: null };
  }
  return entry;
}
