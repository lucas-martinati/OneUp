import { 
    Target, Flame, Zap, Calendar, TrendingUp, Trophy, Medal, Gem, Rocket, 
    Star, Award, Crown, Activity, Sun, Moon, Users, Star as StarIcon,
    Ghost
} from 'lucide-react';

export function calculateAchievements(completions, exercises) {
    if (!exercises || exercises.length === 0) return 0;

    const totalDays = Object.keys(completions).filter(date => {
        const day = completions[date];
        return exercises.some(ex => day?.[ex.id]?.isCompleted);
    }).length;

    let maxStreak = 0, temp = 0;
    for (let i = 0; i < 365; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        const day = completions[dStr];
        if (exercises.some(ex => day?.[ex.id]?.isCompleted)) { temp++; if (temp > maxStreak) maxStreak = temp; }
        else temp = 0;
    }

    let totalReps = 0;
    const utcStart = Date.UTC(new Date().getFullYear(), 0, 1);
    for (const date in completions) {
        for (const exId in completions[date]) {
            if (completions[date][exId]?.isCompleted) {
                const ex = exercises.find(e => e.id === exId);
                if (ex) {
                    const d = new Date(date);
                    const dayNum = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - utcStart) / (1000 * 60 * 60 * 24)) + 1;
                    totalReps += Math.max(1, Math.ceil(dayNum * ex.multiplier));
                }
            }
        }
    }

    let perfectDays = 0;
    for (const date in completions) {
        const allDone = exercises.every(ex => completions[date]?.[ex.id]?.isCompleted);
        if (allDone) perfectDays++;
    }

    const allExercisesDone = exercises.every(ex => 
        Object.values(completions).some(day => day?.[ex.id]?.isCompleted)
    );

    // Count morning/afternoon/evening workouts
    let morningWorkouts = 0, afternoonWorkouts = 0, eveningWorkouts = 0;
    let weekdayWorkouts = 0, weekendWorkouts = 0;
    
    for (const date in completions) {
        const d = new Date(date);
        const dayOfWeek = d.getDay();
        
        if (dayOfWeek >= 1 && dayOfWeek <= 5) weekdayWorkouts++;
        if (dayOfWeek === 0 || dayOfWeek === 6) weekendWorkouts++;
        
        for (const exId in completions[date]) {
            const timeOfDay = completions[date][exId]?.timeOfDay;
            if (timeOfDay === 'morning' && morningWorkouts === 0) morningWorkouts++;
            if (timeOfDay === 'afternoon' && afternoonWorkouts === 0) afternoonWorkouts++;
            if (timeOfDay === 'evening' && eveningWorkouts === 0) eveningWorkouts++;
        }
    }

    let count = 0;
    
    // Streak
    if (totalDays >= 1) count++;
    if (maxStreak >= 3) count++;
    if (maxStreak >= 7) count++;
    if (maxStreak >= 14) count++;
    if (maxStreak >= 30) count++;
    if (maxStreak >= 60) count++;
    if (maxStreak >= 90) count++;
    if (maxStreak >= 180) count++;
    if (maxStreak >= 365) count++;
    
    // Quantity
    if (totalDays >= 10) count++;
    if (totalDays >= 50) count++;
    if (totalDays >= 100) count++;
    if (totalDays >= 200) count++;
    if (totalDays >= 500) count++;
    
    // Volume
    if (totalReps >= 500) count++;
    if (totalReps >= 1000) count++;
    if (totalReps >= 5000) count++;
    if (totalReps >= 10000) count++;
    if (totalReps >= 50000) count++;
    
    // Perfection
    if (perfectDays >= 1) count++;
    if (perfectDays >= 5) count++;
    if (perfectDays >= 10) count++;
    if (perfectDays >= 20) count++;
    
    // All exercises
    if (allExercisesDone) count++;
    
    // Weekday/Weekend
    if (weekdayWorkouts >= 25) count++;
    if (weekendWorkouts >= 25) count++;
    if (weekdayWorkouts >= 10 && weekendWorkouts >= 10) count++;
    
    // Schedule
    if (morningWorkouts >= 5) count++;
    if (afternoonWorkouts >= 5) count++;
    if (eveningWorkouts >= 5) count++;

    return count;
}
