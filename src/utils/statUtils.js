import { getDailyGoal, isBodyweightExercise, isWeightExercise } from '@config/exercises';

import { getCurrentWeekNumber } from '@shared/dateUtils';

/**
 * Calculates total reps for a day across given exercises.
 * @param {Object} dayCompletions - Completions for a specific day
 * @param {number} dayNumber - Day number since start
 * @param {Array} exercises - List of exercises to sum up
 * @param {Function} getConfig - (exId, dateStr) => config
 * @param {string} dateStr - The date string
 * @param {string} startDate - The start date string (optional, needed for cardio)
 * @returns {number} Total reps
 */
export function calculateRepsForDay(dayCompletions, dayNumber, exercises, getConfig, dateStr, startDate = null) {
    if (!dayCompletions || !exercises) return 0;
    return exercises.reduce((sum, ex) => {
        const exData = dayCompletions[ex.id];
        if (!exData?.isCompleted) return sum;
        const exDiff = getConfig(ex.id, dateStr).difficulty;
        
        const isCardio = ex.id === 'running' || ex.id === 'cycling';
        const num = isCardio ? getCurrentWeekNumber(startDate || dateStr, new Date(dateStr)) : dayNumber;
        
        return sum + getDailyGoal(ex, num, exDiff, isCardio);
    }, 0);
}

/**
 * Checks if a set of exercises is "perfect" (all done).
 * @param {Object} dayCompletions - Completions for a specific day
 * @param {Array} exercises - List of exercises to check
 * @returns {boolean} True if all exercises are completed
 */
export function isPerfectDay(dayCompletions, exercises = []) {
    if (!dayCompletions || exercises.length === 0) return false;
    
    // Quick bailout: if they haven't completed enough exercises, it can't be perfect
    let completedCount = 0;
    for (const key in dayCompletions) {
        if (dayCompletions[key]?.isCompleted) completedCount++;
    }
    if (completedCount < exercises.length) return false;

    return exercises.every(ex => dayCompletions[ex.id]?.isCompleted);
}

/**
 * Indique si un jour a été "rattrapé" : tous les exercices complétés et datés
 * l'ont été en dehors de la fenêtre normale (avant -15h ou au-delà de +37h par
 * rapport au début du jour local), signe d'une complétion tardive/anticipée.
 * @param {Object} dayCompletions - Completions for a specific day
 * @param {string} dateString - The date string (YYYY-MM-DD)
 * @returns {boolean}
 */
export function isCaughtUpDay(dayCompletions, dateString) {
    const completedExs = Object.values(dayCompletions || {}).filter(ex => {
        if (!ex?.isCompleted || !ex?.timestamp) return false;
        if (typeof ex.timestamp === 'object') return false;
        const timeMs = typeof ex.timestamp === 'number' ? ex.timestamp : new Date(ex.timestamp).getTime();
        return !isNaN(timeMs);
    });
    return completedExs.length > 0 && completedExs.every(ex => {
        const tsMs = typeof ex.timestamp === 'number' ? ex.timestamp : new Date(ex.timestamp).getTime();
        const parts = dateString.split('-');
        if (parts.length !== 3) return false;
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const localDayStartUTC = Date.UTC(year, month, day);
        const diffHours = (tsMs - localDayStartUTC) / (1000 * 60 * 60);
        return diffHours < -15 || diffHours >= 37;
    });
}

/**
 * Global perfect day check (Standard OR Weights categories fully completed).
 */
export function isGlobalPerfectDay(dayCompletions, allExercises = []) {
    if (!dayCompletions) return false;

    let completedIds = 0;
    for (const key in dayCompletions) {
        if (dayCompletions[key]?.isCompleted) completedIds++;
    }
    if (completedIds === 0) return false;
    
    let standardTotal = 0;
    let weightsTotal = 0;
    let standardCompleted = 0;
    let weightsCompleted = 0;

    for (let i = 0; i < allExercises.length; i++) {
        const exId = allExercises[i].id;
        if (isBodyweightExercise(exId)) {
            standardTotal++;
            if (dayCompletions[exId]?.isCompleted) standardCompleted++;
        } else if (isWeightExercise(exId)) {
            weightsTotal++;
            if (dayCompletions[exId]?.isCompleted) weightsCompleted++;
        }
    }
    
    const isStandardPerfect = standardTotal > 0 && standardCompleted === standardTotal;
    const isWeightsPerfect = weightsTotal > 0 && weightsCompleted === weightsTotal;
    
    return isStandardPerfect || isWeightsPerfect;
}
