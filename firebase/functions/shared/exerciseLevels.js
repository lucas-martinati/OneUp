/** Daily exercise levels. Shared by storage, the UI and Cloud Functions. */
import { EXERCISES, WEIGHT_EXERCISES, getDailyGoal, getWeeklyGoalKm } from './exerciseRules.js';
import { shiftDateStr, getCurrentWeekNumber, getWeekBounds, getLocalDateStr } from './dateUtils.js';

export const LEVEL_COUNT = 10;
export const PROGRESS_VERSION = 5;
const exercisesById = Object.fromEntries([...EXERCISES, ...WEIGHT_EXERCISES].map(ex => [ex.id, ex]));
const isDailyExercise = id => id !== 'running' && id !== 'cycling';

export function getLevelThreshold(goal, level) {
  return Math.max(1, Math.ceil(Math.max(1, goal) * level / LEVEL_COUNT));
}

/** Rounded thresholds may coincide on the first days: award the highest reached. */
export function getLevelForCount(count, goal) {
  if (!Number.isFinite(count) || count <= 0 || !Number.isFinite(goal) || goal <= 0) return 0;
  for (let level = LEVEL_COUNT; level >= 1; level--) {
    if (count >= getLevelThreshold(goal, level)) return level;
  }
  return 0;
}

/** Unmigrated boolean completions remain readable by both runtime versions. */
export function getEntryLevel(entry) {
  if (!entry) return 0;
  if (Number.isInteger(entry.level)) return Math.max(0, Math.min(LEVEL_COUNT, entry.level));
  return entry.isCompleted ? LEVEL_COUNT : 0;
}

export function isFullCompletion(entry) {
  return getEntryLevel(entry) === LEVEL_COUNT;
}

/** Highest level sustained for the displayed record; never infer missing history. */
export function getStreakRecordLevel(levels = [], record = 0) {
  return levels.reduce((best, row) => record > 0 && row.max === record ? Math.max(best, row.level) : best, 0);
}

export function getProgressGoal(exercise, dayNumber, entry) {
  return Number.isFinite(entry?.goal) && entry.goal > 0
    ? entry.goal : getDailyGoal(exercise, dayNumber);
}

/** Reps credited by the last attained level; raw progress stays in entry.count. */
export function getValidatedCount(entry, count, goal) {
  const level = Math.min(getEntryLevel(entry), getLevelForCount(count, goal));
  return level > 0 ? getLevelThreshold(goal, level) : 0;
}

/** Shared credited volume for panels, achievements and Firebase projections. */
export function getRecordedReps(entry, exercise, dayNumber, difficulty = 1) {
  if (!entry) return 0;
  const count = Number.isFinite(entry.count) ? Math.max(0, entry.count)
    : entry.isCompleted ? getDailyGoal(exercise, dayNumber, entry.difficulty ?? difficulty) : 0;
  if (!Number.isInteger(entry.level)) return count;
  const goal = Number.isFinite(entry.goal) && entry.goal > 0
    ? entry.goal : getDailyGoal(exercise, dayNumber, entry.difficulty ?? difficulty);
  return getValidatedCount(entry, count, goal);
}

/** Session snapshots without level/goal metadata retain their historical volume. */
export function getSessionExerciseReps(exercise) {
  const count = Math.max(0, exercise?.reps || 0);
  return Number.isInteger(exercise?.level) && Number.isFinite(exercise.goal) && exercise.goal > 0
    ? getValidatedCount(exercise, count, exercise.goal) : count;
}

/**
 * Idempotent account migration. Each entry carries a level so legacy entries
 * arriving later from another device can be upgraded without touching new data.
 * Past legacy validations stay level 10, even at a historical reduced goal.
 * Keep that historical goal as a snapshot to preserve the estimated volume.
 */
export function migrateLevelProgress(data, customExercises = []) {
  const catalog = { ...exercisesById, ...Object.fromEntries(customExercises.map(ex => [ex.id, ex])) };
  let changed = (data.progressVersion || 0) < PROGRESS_VERSION;
  const completions = {};
  const today = getLocalDateStr(new Date());
  for (const [date, day] of Object.entries(data.completions || {})) {
    const migrated = { ...day };
    const elapsed = Math.round((Date.parse(date) - Date.parse(data.startDate)) / 86400000) + 1;
    const dayNumber = Math.max(1, Number.isFinite(elapsed) ? elapsed : 1);
    for (const [id, original] of Object.entries(day || {})) {
      if (!original) continue;
      let entry = original;
      // Only the calendar day survives in old partial records. Use a deterministic
      // historical timestamp, explicitly estimated, never the migration date.
      const historicalTime = Date.parse(`${date}T12:00:00.000Z`);
      if (!entry.timestamp && (entry.isCompleted || entry.count > 0) &&
          (catalog[id] || !isDailyExercise(id)) && Number.isFinite(historicalTime)) {
        entry = { ...entry, timestamp: historicalTime, timestampEstimated: true };
        migrated[id] = entry;
        changed = true;
      }
      // Today's workout must remain playable up to the full target. Repair old
      // difficulty snapshots, including accounts already migrated to levels.
      const dailyExercise = isDailyExercise(id) ? catalog[id] : null;
      const fullGoal = dailyExercise ? getDailyGoal(dailyExercise, dayNumber) : 0;
      if (date === today && dailyExercise &&
          (!Number.isInteger(entry.level) || (Number.isFinite(entry.goal) && entry.goal < fullGoal))) {
        const count = Number.isFinite(entry.count) ? Math.max(0, entry.count)
          : entry.isCompleted ? getDailyGoal(dailyExercise, dayNumber, entry.difficulty ?? 1) : 0;
        const level = getLevelForCount(count, fullGoal);
        migrated[id] = { ...entry, count, goal: fullGoal, level, isCompleted: level > 0 };
        changed = true;
        continue;
      }
      if (Number.isInteger(entry.level)) continue;
      if (!isDailyExercise(id)) {
        if (!entry.isCompleted) continue;
        const goal = Math.max(1, Math.ceil(getWeeklyGoalKm(id, Math.max(1, getCurrentWeekNumber(data.startDate, date))) * (entry.difficulty ?? 1) * 1000));
        migrated[id] = { ...entry, count: goal, goal, level: LEVEL_COUNT, legacyCardio: true };
        changed = true;
        continue;
      }
      const exercise = catalog[id];
      // A deleted/unknown custom exercise cannot be reconstructed accurately.
      // Keep its legacy boolean; retry once its definition is available.
      if (!exercise) continue;
      if (!entry.isCompleted) {
        if (!Number.isFinite(entry.count) || entry.count <= 0) continue;
        // Partial legacy effort is measured against that day's full target,
        // independent of the former difficulty setting. Snapshot it once.
        const goal = getProgressGoal(exercise, dayNumber, entry);
        const level = getLevelForCount(entry.count, goal);
        migrated[id] = { ...entry, goal, level, isCompleted: level > 0 };
        changed = true;
        continue;
      }
      const goal = getDailyGoal(exercise, dayNumber, entry.difficulty ?? 1);
      const count = Number.isFinite(entry.count) && entry.count > 0 ? entry.count : goal;
      migrated[id] = { ...entry, count, goal: count, level: LEVEL_COUNT, isCompleted: true };
      changed = true;
    }
    completions[date] = migrated;
  }
  return changed ? { ...data, completions, progressVersion: Math.max(data.progressVersion || 0, PROGRESS_VERSION) } : data;
}

/** Cardio remains valid from its recorded day until the end of its calendar week. */
export function getDayLevel(completions, date, exerciseIds = null, weekStartDay = 'monday') {
  const allowed = exerciseIds ? (exerciseIds instanceof Set ? exerciseIds : new Set(exerciseIds)) : null;
  let level = Object.entries(completions[date] || {}).reduce((best, [id, entry]) =>
    !allowed || allowed.has(id) ? Math.max(best, getEntryLevel(entry)) : best, 0);
  const { start } = getWeekBounds(new Date(`${date}T12:00:00`), weekStartDay);
  for (let day = getLocalDateStr(new Date(start)); day < date; day = shiftDateStr(day, 1)) {
    for (const id of ['running', 'cycling']) {
      if (!allowed || allowed.has(id)) level = Math.max(level, getEntryLevel(completions[day]?.[id]));
    }
  }
  return level;
}

/** Cache daily levels only for the lifetime of one stats computation. */
export function createDayLevelLookup(completions, exerciseIds = null, weekStartDay = 'monday') {
  const allowed = exerciseIds ? new Set(exerciseIds) : null;
  const cache = new Map();
  return date => {
    if (!cache.has(date)) cache.set(date, getDayLevel(completions, date, allowed, weekStartDay));
    return cache.get(date);
  };
}

/**
 * Ten nested streaks, measured over the full available history. Frozen days
 * protect only the global streak and never increment it. A pending today uses
 * yesterday; once any level is reached today, higher levels end immediately.
 */
export function computeLevelStreaks(completions, today, { exerciseId = null, exerciseIds = null, frozenDays = {}, startDate = null, weekStartDay = 'monday', dayLevelAt = null, includeYesterday = false } = {}) {
  const levelAt = exerciseId ? date => getEntryLevel(completions[date]?.[exerciseId])
    : dayLevelAt || createDayLevelLookup(completions, exerciseIds, weekStartDay);
  const protectedDay = date => !exerciseId && !!frozenDays[date];
  const current = Array(LEVEL_COUNT).fill(0);
  const records = Array(LEVEL_COUNT).fill(0);
  const dateSet = new Set([...Object.keys(completions), ...(!exerciseId ? Object.keys(frozenDays) : [])]);
  if (!exerciseId) {
    for (const [date, day] of Object.entries(completions)) {
      if (!['running', 'cycling'].some(id => getEntryLevel(day?.[id]) > 0 && (!exerciseIds || exerciseIds.includes(id)))) continue;
      const { end } = getWeekBounds(new Date(`${date}T12:00:00`), weekStartDay);
      const last = getLocalDateStr(new Date(end));
      for (let next = date; next <= last && next <= today; next = shiftDateStr(next, 1)) dateSet.add(next);
    }
  }
  const dates = [...dateSet]
    .filter(date => date <= today && (!startDate || date >= startDate)
      && (date !== today || levelAt(today) > 0 || protectedDay(today))).sort();
  let previous = null;
  const yesterday = includeYesterday ? shiftDateStr(today, -1) : null;
  const yesterdayAnchor = includeYesterday
    ? (levelAt(yesterday) > 0 || protectedDay(yesterday) ? yesterday : shiftDateStr(yesterday, -1)) : null;
  let yesterdayStreak = 0;
  for (const date of dates) {
    if (previous && shiftDateStr(previous, 1) !== date) current.fill(0);
    const dailyLevel = levelAt(date);
    for (let i = 0; i < LEVEL_COUNT; i++) {
      if (dailyLevel > i) current[i]++;
      else if (!protectedDay(date) || dailyLevel > 0) current[i] = 0;
      records[i] = Math.max(records[i], current[i]);
    }
    // Capture yesterday before today's completion can reset higher levels.
    if (date === yesterdayAnchor) yesterdayStreak = current[0];
    previous = date;
  }
  const anchor = levelAt(today) > 0 || protectedDay(today) ? today : shiftDateStr(today, -1);
  if (previous !== anchor) current.fill(0);
  const streak = current[0];
  const level = streak > 0 ? current.lastIndexOf(streak) + 1 : 0;
  return {
    streak, level,
    ...(includeYesterday ? { yesterdayStreak } : {}),
    levels: current.map((days, i) => ({ level: i + 1, current: days, max: records[i] })),
  };
}

/** Preserve the best attained level when importing overlapping guest history. */
export function mergeLevelMetadata(left, right, count) {
  if (!Number.isInteger(left.level) && !Number.isInteger(right.level)) return {};
  let primary = left;
  if (getEntryLevel(right) > getEntryLevel(left)
      || (getEntryLevel(right) === getEntryLevel(left) && (right.count || 0) > (left.count || 0))) primary = right;
  if (!Number.isFinite(primary.goal) || primary.goal <= 0) return {};
  const goal = Math.max(primary.goal, count);
  return { goal, level: getLevelForCount(count, goal), ...((left.legacyCardio || right.legacyCardio) ? { legacyCardio: true } : {}) };
}
