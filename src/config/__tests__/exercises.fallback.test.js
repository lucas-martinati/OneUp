import { describe, it, expect, vi } from 'vitest';

vi.mock('@shared/exerciseRules.js', () => ({
    EXERCISES: [
        { id: 'pushups', multiplier: 2.0 },
        // Leaving out squats to trigger fallback
    ],
    CARDIO_EXERCISES: [
        { id: 'running', multiplier: 2.0 },
        // Leaving out cycling to trigger fallback
    ],
    WEIGHT_EXERCISES: [
        { id: 'bench_press', multiplier: 2.0 },
    ],
    getDailyGoal: vi.fn(),
    getWeeklyGoalKm: vi.fn(),
    CARDIO_REPS_PER_KM: { running: 109, cycling: 65 },
}));

describe('exercises config fallbacks', () => {
    it('applies shared multiplier or fallback for EXERCISES', async () => {
        const { EXERCISES } = await import('../exercises.js');
        
        const pushups = EXERCISES.find(ex => ex.id === 'pushups');
        expect(pushups.multiplier).toBe(2.0); // from mock
        
        const squats = EXERCISES.find(ex => ex.id === 'squats');
        expect(squats.multiplier).toBe(1); // fallback
    });

    it('applies shared multiplier or fallback for CARDIO_EXERCISES', async () => {
        const { CARDIO_EXERCISES } = await import('../exercises.js');
        
        const running = CARDIO_EXERCISES.find(ex => ex.id === 'running');
        expect(running.multiplier).toBe(2.0); // from mock
        
        const cycling = CARDIO_EXERCISES.find(ex => ex.id === 'cycling');
        expect(cycling.multiplier).toBe(1); // fallback
    });
});
