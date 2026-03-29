/**
 * Shared date utilities for the OneUp app.
 * Centralizes date formatting and streak calculation logic.
 */

export const MAX_STREAK_WINDOW = 365;

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
    if (!day) return false;
    return Object.values(day).some(ex => ex?.isCompleted === true);
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
