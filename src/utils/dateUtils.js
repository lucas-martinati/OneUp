/**
 * Shared date utilities for the OneUp app.
 * Centralizes date formatting and streak calculation logic.
 */

export const MAX_STREAK_WINDOW = 365;

/**
 * Compute the current ISO week number relative to the challenge start date.
 * Week 1 = the first Monday-Sunday period that includes or follows startDate.
 */
export function getCurrentWeekNumber(startDate, targetDate = new Date()) {
    if (!startDate) return 1;
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    const diffMs = target.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.floor(diffDays / 7) + 1);
}

/**
 * Returns the ISO week boundaries (Monday 00:00 → Sunday 23:59) for a given date.
 */
export function getWeekBounds(date = new Date()) {
    const d = new Date(date);
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
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Calculate the current streak of consecutive days where the day is
 * globally "done" (any exercise completed), counting backwards from todayStr.
 * @param {Object} completions - { [dateStr]: { [exerciseId]: { isCompleted, ... } } }
 * @param {string} todayStr - Today's date as YYYY-MM-DD
 * @returns {number}
 */
export function calculateStreak(completions, todayStr) {
    let streak = 0;
    const todayDate = new Date(todayStr);
    for (let i = 0; i < MAX_STREAK_WINDOW; i++) {
        const checkDate = new Date(todayDate);
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = getLocalDateStr(checkDate);
        if (isDayDoneFromCompletions(completions, dateStr)) {
            streak++;
        } else {
            break;
        }
    }
    return streak;
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
    const todayDate = new Date(todayStr);
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
    const day = completions[dateStr];
    
    // 1. Direct completion on this day (Standard, Weights, Custom, or Cardio done TODAY)
    if (day && Object.values(day).some(ex => ex?.isCompleted === true)) {
        return true;
    }

    // 2. Week-wide completion for Cardio
    // If running or cycling was completed anytime between last Monday and dateStr, this day is "done"
    const { start } = getWeekBounds(new Date(dateStr));
    const monday = new Date(start);
    const current = new Date(dateStr);
    
    // Check each day from Monday to current
    let loop = new Date(monday);
    while (loop <= current) {
        const dStr = getLocalDateStr(loop);
        const dData = completions[dStr];
        if (dData && (dData.running?.isCompleted || dData.cycling?.isCompleted)) {
            return true;
        }
        loop.setDate(loop.getDate() + 1);
    }

    return false;
}

/**
 * Calculate the maximum streak of consecutive days where at least one exercise
 * was completed, looking back at the last 365 days.
 * @param {Object} completions
 * @returns {number}
 */
export function calculateMaxStreak(completions) {
    let max = 0;
    let temp = 0;
    const today = new Date();
    
    // We check last MAX_STREAK_WINDOW days to find the longest sequence
    for (let i = 0; i < MAX_STREAK_WINDOW; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = getLocalDateStr(d);
        
        if (isDayDoneFromCompletions(completions, dateStr)) {
            temp++;
            if (temp > max) max = temp;
        } else {
            temp = 0;
        }
    }
    return max;
}

// ── Time formatting ────────────────────────────────────────────────────

export function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

/**
 * Format duration in a human-readable format.
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration (e.g., "1h 30m", "45m", "30s")
 */
export function formatDuration(seconds) {
    if (!seconds || seconds <= 0) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
        return `${h}h ${m}m`;
    }
    if (m > 0) {
        return `${m}m`;
    }
    return `${s}s`;
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
