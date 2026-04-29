import { getDailyGoal } from '../config/exercises';
import { EXERCISES } from '../config/exercises';
import { WEIGHT_EXERCISES } from '../config/weights';

import { getCurrentWeekNumber } from './dateUtils';

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
    return exercises.every(ex => dayCompletions[ex.id]?.isCompleted);
}

/**
 * Global perfect day check (Standard OR Weights categories fully completed).
 */
export function isGlobalPerfectDay(dayCompletions, allExercises = []) {
    if (!dayCompletions) return false;
    
    const standardExercises = allExercises.filter(ex => EXERCISES.some(e => e.id === ex.id));
    const weightsExercises = allExercises.filter(ex => WEIGHT_EXERCISES.some(e => e.id === ex.id));
    
    const isStandardPerfect = standardExercises.length > 0 && standardExercises.every(ex => dayCompletions[ex.id]?.isCompleted);
    const isWeightsPerfect = weightsExercises.length > 0 && weightsExercises.every(ex => dayCompletions[ex.id]?.isCompleted);
    
    return isStandardPerfect || isWeightsPerfect;
}
