import { 
    Target, Flame, Zap, Calendar, TrendingUp, Trophy, Medal, Gem, Rocket, 
    Star, Award, Crown, Activity, Sun, Moon, Users, Star as StarIcon,
    Ghost
} from 'lucide-react';
import { isDayDoneFromCompletions, getLocalDateStr } from './dateUtils';

export function calculateAchievements(completions, exercises) {
    if (!exercises || exercises.length === 0) return 0;

    // Total days - using isDayDoneFromCompletions like Achievements.jsx
    let totalDays = 0;
    for (const date in completions) {
        if (isDayDoneFromCompletions(completions, date)) totalDays++;
    }

    // Max streak - using getLocalDateStr like Achievements.jsx
    let maxStreak = 0, temp = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        if (isDayDoneFromCompletions(completions, getLocalDateStr(d))) {
            temp++;
            if (temp > maxStreak) maxStreak = temp;
        } else {
            temp = 0;
        }
    }

    // Total reps - using same formula as Achievements.jsx
    let totalReps = 0;
    for (const date in completions) {
        for (const exId in completions[date]) {
            if (completions[date][exId]?.isCompleted) {
                const ex = exercises.find(e => e.id === exId);
                if (ex) {
                    const d = new Date(date);
                    const utcStart = Date.UTC(d.getFullYear(), 0, 1);
                    const utcCurrent = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
                    const dayNum = Math.floor((utcCurrent - utcStart) / (1000 * 60 * 60 * 24)) + 1;
                    totalReps += Math.max(1, Math.ceil(dayNum * ex.multiplier));
                }
            }
        }
    }

    // Perfect days - using same formula as Achievements.jsx
    let perfectDays = 0;
    for (const date in completions) {
        const dayCompletions = completions[date];
        const allDone = exercises?.every(ex => dayCompletions?.[ex.id]?.isCompleted) ?? false;
        if (allDone) perfectDays++;
    }

    // All exercises done at least once - using same formula as Achievements.jsx
    let completedIds = new Set();
    for (const date in completions) {
        for (const exId in completions[date]) {
            if (completions[date][exId]?.isCompleted) {
                completedIds.add(exId);
            }
        }
    }
    const hasCompletedAllExercisesOnce = exercises?.every(ex => completedIds.has(ex.id)) ?? false;

    // Weekday workouts - using isDayDoneFromCompletions like Achievements.jsx
    let weekdayWorkouts = 0;
    for (const date in completions) {
        const d = new Date(date);
        const dayOfWeek = d.getDay();
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            if (isDayDoneFromCompletions(completions, date)) weekdayWorkouts++;
        }
    }

    // Weekend workouts - using isDayDoneFromCompletions like Achievements.jsx
    let weekendWorkouts = 0;
    for (const date in completions) {
        const d = new Date(date);
        const dayOfWeek = d.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            if (isDayDoneFromCompletions(completions, date)) weekendWorkouts++;
        }
    }

    // Morning workouts - counting dates like Achievements.jsx
    let morningWorkouts = 0;
    for (const date in completions) {
        for (const exId in completions[date]) {
            if (completions[date][exId]?.timeOfDay === 'morning') {
                morningWorkouts++;
                break;
            }
        }
    }

    // Afternoon workouts
    let afternoonWorkouts = 0;
    for (const date in completions) {
        for (const exId in completions[date]) {
            if (completions[date][exId]?.timeOfDay === 'afternoon') {
                afternoonWorkouts++;
                break;
            }
        }
    }

    // Evening workouts
    let eveningWorkouts = 0;
    for (const date in completions) {
        for (const exId in completions[date]) {
            if (completions[date][exId]?.timeOfDay === 'evening') {
                eveningWorkouts++;
                break;
            }
        }
    }

    let count = 0;
    
    // Streak - exactly matching Achievements.jsx
    // Note: first badge uses totalDays >= 1 (Premier Pas)
    if (totalDays >= 1) count++;
    if (maxStreak >= 3) count++;
    if (maxStreak >= 7) count++;
    if (maxStreak >= 14) count++;
    if (maxStreak >= 30) count++;
    if (maxStreak >= 60) count++;
    if (maxStreak >= 90) count++;
    if (maxStreak >= 180) count++;
    if (maxStreak >= 365) count++;
    
    // Quantity - exactly matching Achievements.jsx
    if (totalDays >= 10) count++;
    if (totalDays >= 50) count++;
    if (totalDays >= 100) count++;
    if (totalDays >= 200) count++;
    if (totalDays >= 500) count++;
    
    // Volume - exactly matching Achievements.jsx
    if (totalReps >= 500) count++;
    if (totalReps >= 1000) count++;
    if (totalReps >= 5000) count++;
    if (totalReps >= 10000) count++;
    if (totalReps >= 50000) count++;
    
    // Perfection - exactly matching Achievements.jsx (1, 5, 50, 100, 200)
    if (perfectDays >= 1) count++;
    if (perfectDays >= 5) count++;
    if (perfectDays >= 50) count++;
    if (perfectDays >= 100) count++;
    if (perfectDays >= 200) count++;
    
    // All exercises
    if (hasCompletedAllExercisesOnce) count++;
    
    // Weekday/Weekend - exactly matching Achievements.jsx
    if (weekdayWorkouts >= 25) count++;
    if (weekendWorkouts >= 25) count++;
    if (weekdayWorkouts >= 10 && weekendWorkouts >= 10) count++;
    
    // Schedule - exactly matching Achievements.jsx (9 badges: 5/10/25 for each time)
    if (morningWorkouts >= 5) count++;
    if (morningWorkouts >= 10) count++;
    if (morningWorkouts >= 25) count++;
    if (afternoonWorkouts >= 5) count++;
    if (afternoonWorkouts >= 10) count++;
    if (afternoonWorkouts >= 25) count++;
    if (eveningWorkouts >= 5) count++;
    if (eveningWorkouts >= 10) count++;
    if (eveningWorkouts >= 25) count++;
    
    // Secrets
    // Ghost - workout between 3h and 4h
    let ghostWorkout = false;
    for (const date in completions) {
        for (const exId in completions[date]) {
            const timestamp = completions[date][exId]?.timestamp;
            if (timestamp) {
                const hour = new Date(timestamp).getHours();
                if (hour >= 3 && hour < 4) {
                    ghostWorkout = true;
                    break;
                }
            }
        }
        if (ghostWorkout) break;
    }
    if (ghostWorkout) count++;
    
    // Perfectionist - 30 consecutive perfect days
    let perfectStreak = 0, maxPerfectStreak = 0;
    for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayCompletions = completions[dateStr];
        const isPerfect = exercises?.every(ex => dayCompletions?.[ex.id]?.isCompleted) ?? false;
        if (isPerfect) {
            perfectStreak++;
            if (perfectStreak > maxPerfectStreak) maxPerfectStreak = perfectStreak;
        } else {
            perfectStreak = 0;
        }
    }
    if (maxPerfectStreak >= 30) count++;
    
    // Beast - 100000 total reps
    if (totalReps >= 100000) count++;

    return count;
}
