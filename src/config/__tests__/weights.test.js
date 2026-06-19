import { describe, it, expect, vi } from 'vitest';

// Mock the shared rules BEFORE importing the config
vi.mock('../../../functions/shared/exerciseRules.js', () => ({
    WEIGHT_EXERCISES: [
        { id: "biceps_curl", multiplier: 1.2 },
        // Intentionally leave out other exercises to test the fallback branch
    ]
}));

describe('weights config', () => {
    it('applies shared multiplier or fallback', async () => {
        const { WEIGHT_EXERCISES } = await import('../weights.js');
        
        const biceps = WEIGHT_EXERCISES.find(ex => ex.id === 'biceps_curl');
        expect(biceps.multiplier).toBeCloseTo(1.2);
        
        const missing = WEIGHT_EXERCISES.find(ex => ex.id === 'hammer_curl');
        // Falls back to 0.5 because it's missing in the mocked shared config
        expect(missing.multiplier).toBeCloseTo(0.5);
    });

    it('creates a map of exercises', async () => {
        const { WEIGHT_EXERCISES_MAP } = await import('../weights.js');
        expect(WEIGHT_EXERCISES_MAP['biceps_curl']).toBeDefined();
        expect(WEIGHT_EXERCISES_MAP['hammer_curl']).toBeDefined();
    });
});
