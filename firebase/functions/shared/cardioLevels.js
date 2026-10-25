import { getWeeklyGoalKm, CARDIO_REPS_PER_KM } from './exerciseRules.js';
import { getWeekBounds, getLocalDateStr, getCurrentWeekNumber, shiftDateStr } from './dateUtils.js';
import { computeLevelStreaks, getEntryLevel, getLevelForCount, getValidatedCount } from './exerciseLevels.js';

const CARDIO_MODES = ['running', 'cycling'];

export function getCardioGoal(mode, startDate, date, entry, weekStartDay = 'monday') {
  if (Number.isFinite(entry?.goal) && entry.goal > 0) return entry.goal;
  const { start } = getWeekBounds(date, weekStartDay);
  const targetDate = entry?.isCompleted ? date : new Date(start);
  const difficulty = entry?.isCompleted ? (entry.difficulty ?? 1) : 1;
  return Math.max(1, Math.ceil(getWeeklyGoalKm(mode, Math.max(1, getCurrentWeekNumber(startDate, targetDate))) * difficulty * 1000));
}

export function getCardioReps(entry, mode, weekNumber) {
  if (Number.isInteger(entry?.level) && Number.isFinite(entry.count)) {
    const goal = Number.isFinite(entry.goal) && entry.goal > 0
      ? entry.goal : Math.max(1, Math.ceil(getWeeklyGoalKm(mode, weekNumber) * (entry.difficulty ?? 1) * 1000));
    const distance = getValidatedCount(entry, Math.max(0, entry.count), goal);
    return Math.floor(distance / 1000 * CARDIO_REPS_PER_KM[mode]);
  }
  return entry?.isCompleted ? Math.floor(getWeeklyGoalKm(mode, weekNumber) * (entry.difficulty ?? 1) * CARDIO_REPS_PER_KM[mode]) : 0;
}

export function getCardioWeekEntry(completions, mode, date, weekStartDay = 'monday') {
  const { start, end } = getWeekBounds(date, weekStartDay);
  for (const [dateStr, day] of Object.entries(completions)) {
    const time = new Date(`${dateStr}T12:00:00`).getTime();
    if (time >= start && time <= end && day?.[mode]) return { ...day[mode], dateStr };
  }
  return null;
}

/** A single volume snapshot per sport/week, in whole metres. Historical validations are protected. */
export function getCardioLevelUpdates(sessions, completions, startDate, weekStartDay = 'monday') {
  const groups = new Map();
  for (const session of sessions) {
    if (!CARDIO_MODES.includes(session.type) || !Number.isFinite(session.startTime)) continue;
    const date = getLocalDateStr(new Date(session.startTime));
    if (date < startDate) continue;
    const { start } = getWeekBounds(new Date(session.startTime), weekStartDay);
    const key = `${session.type}:${start}`;
    const group = groups.get(key) || { mode: session.type, date, distance: 0 };
    group.distance += Number.isFinite(session.distance) ? Math.max(0, session.distance) : 0;
    group.date = group.date < date ? group.date : date;
    groups.set(key, group);
  }
  // Keep empty tracked weeks so deletion of the final activity clears its level.
  for (const [date, day] of Object.entries(completions)) {
    for (const mode of CARDIO_MODES) {
      const entry = day?.[mode];
      if (!entry || !Number.isInteger(entry.level) || entry.legacyCardio) continue;
      const { start } = getWeekBounds(new Date(`${date}T12:00:00`), weekStartDay);
      const key = `${mode}:${start}`;
      if (!groups.has(key)) groups.set(key, { mode, date, distance: 0 });
    }
  }
  const updates = [];
  for (const { mode, date, distance } of groups.values()) {
    const entry = getCardioWeekEntry(completions, mode, date, weekStartDay);
    if (entry?.legacyCardio || (entry?.isCompleted && !Number.isInteger(entry.level))) continue;
    if (entry && !Number.isInteger(entry.level)) {
      const { end } = getWeekBounds(date, weekStartDay);
      if (getLocalDateStr(new Date(end)) < getLocalDateStr(new Date())) continue;
    }
    const goal = getCardioGoal(mode, startDate, date, entry, weekStartDay);
    const count = Math.min(goal, Math.floor(distance));
    const level = getLevelForCount(count, goal);
    if (entry?.count === count && entry?.level === level) continue;
    updates.push({ date: entry?.dateStr || date, mode, count, goal });
  }
  return updates;
}

/** Reuse the nested-streak algorithm with one synthetic day per calendar week. */
export function computeCardioLevelStreaks(completions, mode, startDate, today, weekStartDay = 'monday') {
  const weekKey = date => {
    const { start } = getWeekBounds(new Date(`${date}T12:00:00`), weekStartDay);
    // UTC calendar ordinals avoid DST weeks containing 167 or 169 hours.
    return Math.floor(Date.parse(getLocalDateStr(new Date(start))) / 604800000);
  };
  const weeks = {};
  const exerciseId = mode || 'cardio';
  for (const [date, day] of Object.entries(completions)) {
    if (date > today || (startDate && date < startDate)) continue;
    const entry = mode ? day?.[mode] : CARDIO_MODES.reduce((best, id) => getEntryLevel(day?.[id]) > getEntryLevel(best) ? day[id] : best, null);
    if (!entry) continue;
    const key = shiftDateStr('2000-01-01', weekKey(date));
    if (!weeks[key] || getEntryLevel(entry) > getEntryLevel(weeks[key][exerciseId])) weeks[key] = { [exerciseId]: entry };
  }
  const anchor = shiftDateStr('2000-01-01', weekKey(today));
  return { ...computeLevelStreaks(weeks, anchor, { exerciseId }), active: getEntryLevel(weeks[anchor]?.[exerciseId]) > 0 };
}
