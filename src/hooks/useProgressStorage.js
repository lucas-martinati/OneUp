export const STORAGE_KEY_BASE = 'pushup_challenge_data';

/** Default empty state for signed-out or new users */
export function getDefaultState() {
  const currentYear = new Date().getFullYear();
  return {
    startDate: `${currentYear}-01-01`,
    userStartDate: `${currentYear}-01-01`,
    completions: {},
    isSetup: false,
    achievements: {},
    cardio: {},
    // Streak Freeze: days protected from breaking the streak, + the freeze
    // inventory. `lastRefill: null` makes the first reconcile grant the starter
    // allotment. See src/config/streakFreeze.js.
    frozenDays: {},
    streakFreezes: { count: 0, lastRefill: null },
  };
}

/** Sanitize a persisted frozenDays map into `{ 'YYYY-MM-DD': true }`. */
function validateFrozenDays(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out = {};
  for (const [dateStr, val] of Object.entries(raw)) {
    if (val) out[dateStr] = true;
  }
  return out;
}

/** Sanitize a persisted streak-freeze inventory. */
function validateStreakFreezes(raw) {
  if (!raw || typeof raw !== 'object') return { count: 0, lastRefill: null };
  return {
    count: Number.isFinite(raw.count) ? Math.max(0, raw.count) : 0,
    lastRefill: typeof raw.lastRefill === 'string' ? raw.lastRefill : null,
  };
}

/**
 * Migrate legacy flat completions entry to the new per-exercise structure.
 */
function migrateLegacyEntry(entry) {
  const hasExerciseEntry = Object.values(entry).some(
    val => val && typeof val === 'object' && !Array.isArray(val) &&
      ('isCompleted' in val || 'done' in val || 'count' in val)
  );

  if (!hasExerciseEntry) {
    const migrated = {};
    if (entry.done !== undefined || entry.pushupCount !== undefined || entry.isCompleted !== undefined) {
      migrated.pushups = {
        isCompleted: entry.isCompleted || entry.done || false,
        timestamp: entry.timestamp || null,
        timeOfDay: entry.timeOfDay || null,
        ...(entry.pushupCount !== undefined ? { count: entry.pushupCount } : {}),
        ...(entry.count !== undefined ? { count: entry.count } : {}),
        ...(entry.difficulty !== undefined ? { difficulty: entry.difficulty } : {})
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
        ...(Number.isInteger(val.localHour) ? { localHour: val.localHour } : {}),
        ...(val.count !== undefined ? { count: val.count } : {}),
        ...(val.weight !== undefined ? { weight: val.weight } : {}),
        ...(val.difficulty !== undefined ? { difficulty: val.difficulty } : {})
      };
    }
  }
  return migrated;
}

/**
 * Validate and sanitize progress data loaded from localStorage.
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
    achievements: (() => {
      let ach = typeof data.achievements === 'object' && data.achievements !== null ? data.achievements : {};
      if (typeof data.manualBadges === 'object' && data.manualBadges !== null) {
        ach = { ...data.manualBadges, ...ach };
      }
      if (data.hasShared === true) ach.first_share = true;
      return ach;
    })(),
    lastCompletionChange: data.lastCompletionChange || null,
    cardio: data.cardio || {},
    frozenDays: validateFrozenDays(data.frozenDays),
    streakFreezes: validateStreakFreezes(data.streakFreezes),
  };
}

/** Custom parser for progress data */
export function parseProgressData(parsed) {
  const validated = validateProgressData(parsed);
  if (!validated) return null;

  const currentYear = new Date().getFullYear();
  const fixedStartDate = `${currentYear}-01-01`;
  const lastChange = parsed?.lastCompletionChange || null;

  if (validated.startDate !== fixedStartDate) {
    return {
      ...getDefaultState(),
      achievements: validated.achievements ?? {},
      lastCompletionChange: lastChange
    };
  }

  return { 
    ...validated, 
    lastCompletionChange: lastChange, 
    achievements: validated.achievements ?? {} 
  };
}
