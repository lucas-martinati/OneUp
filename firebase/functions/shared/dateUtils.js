/**
 * Shared date utilities for the OneUp app.
 * Centralizes date formatting and streak calculation logic.
 * This file is executed by both the Cloud Functions backend and the React frontend.
 */

/**
 * Walk consecutive days backward from an anchor, counting a current streak that
 * frozen days keep alive without incrementing. Stops at the first genuinely
 * missed (not done, not frozen) day.
 *
 * The date arithmetic is delegated to the caller so this stays agnostic of the
 * local-vs-UTC date conventions used on each side.
 *
 * @param {(offset:number)=>string} dateAt   - returns the YYYY-MM-DD string `offset` days before the anchor (offset 0 = the anchor itself)
 * @param {(dateStr:string)=>boolean} isDone - whether a day counts as completed
 * @param {(dateStr:string)=>boolean} isFrozen - whether a day is protected by a freeze
 * @param {number} [windowDays=365]           - how many days back to scan
 * @returns {number}
 */
export function walkStreak(dateAt, isDone, isFrozen, windowDays = MAX_STREAK_WINDOW) {
  let streak = 0;
  for (let i = 0; i < windowDays; i++) {
    const dateStr = dateAt(i);
    if (isDone(dateStr)) {
      streak++;
    } else if (isFrozen(dateStr)) {
      continue; // protected — neither breaks nor counts toward the streak
    } else {
      break;
    }
  }
  return streak;
}

export function shiftDateStr(dateStr, deltaDays) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + deltaDays);
  const pad = n => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function getWeekBoundsStr(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const day = date.getUTCDay();
  const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1);
  date.setUTCDate(diff);
  const pad = n => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/**
 * Returns true if ANY exercise is marked done for the given date.
 * Handles single day exercises and weekly cardio window.
 */
function isDayDone(completions, dateStr) {
  const dayData = completions?.[dateStr];
  if (dayData && typeof dayData === 'object' && Object.values(dayData).some(e => e?.isCompleted)) {
    return true;
  }
  
  const mondayStr = getWeekBoundsStr(dateStr);
  let currentStr = mondayStr;
  while (currentStr <= dateStr) {
    const dData = completions?.[currentStr];
    if (dData && (dData.running?.isCompleted || dData.cycling?.isCompleted)) {
      return true;
    }
    if (currentStr === dateStr) break;
    currentStr = shiftDateStr(currentStr, 1);
  }
  return false;
}

export const DAY_STATUS = {
  FUTURE: 0,
  PENDING: 1, // Today, not yet done
  MISSED: 2,  // Past, not done
  FROZEN: 3,  // Past, protected by freeze
  DONE: 4     // At least one exercise done (or perfectly done)
};

/**
 * Global helper to resolve a day's visual/logical status.
 * @param {string} dateStr - The date to check
 * @param {Object} completions - Raw completions object
 * @param {Object} frozenDays - Raw frozenDays object
 * @param {string} todayStr - The current local date string
 * @returns {number} DAY_STATUS enum
 */
export function getDayStatus(dateStr, completions, frozenDays, todayStr) {
  if (dateStr > todayStr) {
    return DAY_STATUS.FUTURE;
  }
  if (isDayDone(completions, dateStr)) {
    return DAY_STATUS.DONE;
  }
  if (dateStr === todayStr) {
    return DAY_STATUS.PENDING;
  }
  if (frozenDays && frozenDays[dateStr]) {
    return DAY_STATUS.FROZEN;
  }
  return DAY_STATUS.MISSED;
}

export const MAX_STREAK_WINDOW = 365;

/**
 * Safely parse a date string in YYYY-MM-DD format as local midnight.
 * If given a Date object, numeric timestamp, or falsy value, behaves robustly.
 * @param {any} dateStr
 * @returns {Date}
 */
export function parseLocalDate(dateStr) {
    if (!dateStr) return new Date();
    if (dateStr instanceof Date) return new Date(dateStr);
    if (typeof dateStr === 'number') return new Date(dateStr);
    if (typeof dateStr !== 'string') return new Date(dateStr);

    const parts = dateStr.split('-');
    if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // 0-indexed
        const day = parseInt(parts[2], 10);
        return new Date(year, month, day, 0, 0, 0, 0);
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Compute the current ISO week number relative to the challenge start date.
 * Week 1 = the first Monday-Sunday period that includes or follows startDate.
 */
export function getCurrentWeekNumber(startDate, targetDate = new Date()) {
    if (!startDate) return 1;
    const start = parseLocalDate(startDate);
    start.setHours(0, 0, 0, 0);
    const target = parseLocalDate(targetDate);
    target.setHours(0, 0, 0, 0);
    const diffMs = target.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.floor(diffDays / 7) + 1);
}

/**
 * Returns the ISO week boundaries (Monday 00:00 → Sunday 23:59) for a given date.
 */
export function getWeekBounds(date = new Date()) {
    const d = parseLocalDate(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(d.getFullYear(), d.getMonth(), diff);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { start: monday.getTime(), end: sunday.getTime() };
}

/**
 * Format a Date object as YYYY-MM-DD in local time.
 * @param {Date} d
 * @returns {string}
 */
export function getLocalDateStr(d) {
    const dObj = parseLocalDate(d);
    const year = dObj.getFullYear();
    const month = String(dObj.getMonth() + 1).padStart(2, '0');
    const day = String(dObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Calculate the current streak of consecutive days where the day is
 * globally "done" (any exercise completed), counting backwards from todayStr.
 * @param {Object} completions - { [dateStr]: { [exerciseId]: { isCompleted, ... } } }
 * @param {string} todayStr - Today's date as YYYY-MM-DD
 * @param {Object} [frozenDays] - { [dateStr]: true } days protected by a Streak Freeze
 * @returns {number}
 */
export function calculateStreak(completions, todayStr, frozenDays = {}) {
    const todayDate = parseLocalDate(todayStr);
    const dateAt = (offset) => {
        const checkDate = new Date(todayDate);
        checkDate.setDate(checkDate.getDate() - offset);
        return getLocalDateStr(checkDate);
    };
    return walkStreak(
        dateAt,
        (dateStr) => isDayDone(completions, dateStr),
        (dateStr) => !!frozenDays[dateStr],
        MAX_STREAK_WINDOW
    );
}

/**
 * Calculate the streak of consecutive days where a SPECIFIC exercise is done,
 * counting backwards from todayStr.
 * @param {Object} completions - { [dateStr]: { [exerciseId]: { isCompleted, ... } } }
 * @param {string} todayStr - Today's date as YYYY-MM-DD
 * @param {string} exerciseId - e.g. 'pushups'
 * @returns {number}
 */
export function calculateExerciseStreak(completions, todayStr, exerciseId) {
    let streak = 0;
    const todayDate = parseLocalDate(todayStr);
    for (let i = 0; i < MAX_STREAK_WINDOW; i++) {
        const checkDate = new Date(todayDate);
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = getLocalDateStr(checkDate);
        if (completions[dateStr]?.[exerciseId]?.isCompleted) {
            streak++;
        } else {
            break;
        }
    }
    return streak;
}

/**
 * Returns true if ANY exercise is marked done for the given date.
 * @param {Object} completions
 * @param {string} dateStr
 * @returns {boolean}
 */
export function isDayDoneFromCompletions(completions, dateStr) {
    return isDayDone(completions, dateStr);
}

/**
 * Calculate the maximum streak of consecutive days where at least one exercise
 * was completed, looking back at the last 365 days.
 * @param {Object} completions
 * @param {Object} [frozenDays] - { [dateStr]: true } days protected by a Streak Freeze
 * @returns {number}
 */
export function calculateMaxStreak(completions, frozenDays = {}) {
    let max = 0;
    let temp = 0;
    const today = new Date();

    // We check last MAX_STREAK_WINDOW days to find the longest sequence
    for (let i = 0; i < MAX_STREAK_WINDOW; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = getLocalDateStr(d);

        if (isDayDone(completions, dateStr)) {
            temp++;
            if (temp > max) max = temp;
        } else if (frozenDays[dateStr]) {
            // Protected day — keep the run alive without counting it.
        } else {
            temp = 0;
        }
    }
    return max;
}

/**
 * Safely parse a timestamp that could be a number (ms), ISO string, 
 * or a Firebase serverTimestamp placeholder ({.sv: 'timestamp'}).
 * Returns a valid Date object.
 * @param {any} ts
 * @returns {Date}
 */
export function parseTimestamp(ts) {
    if (!ts) return new Date();
    // Handle Firebase serverTimestamp placeholder
    if (typeof ts === 'object' && ts['.sv']) return new Date();
    // Handle potential invalid formats
    const date = new Date(ts);
    return isNaN(date.getTime()) ? new Date() : date;
}
