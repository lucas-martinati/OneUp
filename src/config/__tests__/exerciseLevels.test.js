import { describe, it, expect } from 'vitest';
import { getLevelForCount, getLevelThreshold, computeLevelStreaks, migrateLevelProgress, getRecordedReps, getStreakRecordLevel } from '@shared/exerciseLevels.js';

const entry = level => ({ level, count: level * 10, goal: 100, isCompleted: level > 0 });

describe('daily exercise levels', () => {
    it('labels records with the highest level sustained for their full length', () => {
        const levels = [{ level: 1, max: 200 }, { level: 2, max: 200 }, { level: 3, max: 150 }];
        expect(getStreakRecordLevel(levels, 200)).toBe(2);
        expect(getStreakRecordLevel(levels, 0)).toBe(0);
        expect(getStreakRecordLevel(undefined, 200)).toBe(0);
    });
    it('awards only reached thresholds, including coincident rounded thresholds', () => {
        expect(getLevelForCount(9, 100)).toBe(0);
        expect(getLevelForCount(10, 100)).toBe(1);
        expect(getLevelForCount(53, 100)).toBe(5);
        expect(getLevelForCount(100, 100)).toBe(10);
        expect(getLevelForCount(1, 1)).toBe(10);
        expect(getLevelForCount(1, 3)).toBe(3);
        expect(getLevelThreshold(3, 4)).toBe(2);
        expect(getLevelForCount(NaN, 100)).toBe(0);
    });

    it('uses the best exercise each day, with independent records and recovery', () => {
        const completions = {
            '2026-01-01': { pushups: entry(10) },
            '2026-01-02': { squats: entry(10) },
            '2026-01-03': { pullups: entry(5) },
            '2026-01-04': { pushups: entry(10) },
        };
        const result = computeLevelStreaks(completions, '2026-01-04');
        expect(result.streak).toBe(4);
        expect(result.level).toBe(5);
        expect(result.levels[9]).toEqual({ level: 10, current: 1, max: 2 });
        expect(computeLevelStreaks(completions, '2026-01-04', { exerciseId: 'pushups' }).streak).toBe(1);
        expect(computeLevelStreaks(completions, '2026-01-05').streak).toBe(4);
        expect(computeLevelStreaks(completions, '2026-01-06').streak).toBe(0);
    });

    it('lets a higher level reached later today restore the ongoing streak', () => {
        const completions = { '2026-01-01': { pushups: entry(10) }, '2026-01-02': { squats: entry(5) } };
        expect(computeLevelStreaks(completions, '2026-01-02').level).toBe(5);
        completions['2026-01-02'].squats = entry(10);
        expect(computeLevelStreaks(completions, '2026-01-02').level).toBe(10);
    });

    it('keeps global freezes transparent but does not apply them to exercises', () => {
        const completions = { '2026-01-01': { pushups: entry(10) }, '2026-01-03': { pushups: entry(5) } };
        const frozenDays = { '2026-01-02': true };
        expect(computeLevelStreaks(completions, '2026-01-03', { frozenDays }).streak).toBe(2);
        expect(computeLevelStreaks(completions, '2026-01-03', { exerciseId: 'pushups', frozenDays }).streak).toBe(1);
        expect(computeLevelStreaks(completions, '2026-01-03').streak).toBe(1);
    });

    it('filters unknown exercises and future entries, and retains records beyond a year', () => {
        const completions = { '2025-01-01': { pushups: entry(10) }, '2026-01-02': { hidden: entry(10) }, '2027-01-01': { pushups: entry(10) } };
        const result = computeLevelStreaks(completions, '2026-01-02', { exerciseIds: ['pushups'] });
        expect(result.streak).toBe(0);
        expect(result.levels[9].max).toBe(1);
    });
});

describe('level migration', () => {
    it('upgrades booleans to level 10 with historical goals, without mutating input', () => {
        const legacy = { startDate: '2026-01-01', completions: {
            '2026-04-10': { pushups: { isCompleted: true, difficulty: 0.5, timestamp: 123 }, squats: { isCompleted: false }, running: { isCompleted: true } },
        } };
        const migrated = migrateLevelProgress(legacy);
        expect(migrated.progressVersion).toBe(4);
        expect(migrated.completions['2026-04-10'].pushups).toMatchObject({ level: 10, count: 50, goal: 50, difficulty: 0.5, timestamp: 123 });
        expect(migrated.completions['2026-04-10'].squats.level).toBeUndefined();
        expect(migrated.completions['2026-04-10'].running).toMatchObject({ isCompleted: true, level: 10, legacyCardio: true });
        expect(legacy.completions['2026-04-10'].pushups.level).toBeUndefined();
        expect(migrateLevelProgress(migrated)).toBe(migrated);
    });

    it('keeps partial volume and upgrades legacy data arriving later from another device', () => {
        const state = { progressVersion: 1, startDate: '2026-01-01', completions: {
            '2026-04-10': { pushups: { isCompleted: false, count: 7 }, squats: entry(5), abs: { isCompleted: false, count: 50 } },
            '2026-04-11': { pushups: { isCompleted: true } },
        } };
        const migrated = migrateLevelProgress(state);
        expect(migrated.completions['2026-04-10'].pushups).toMatchObject({ count: 7, isCompleted: false });
        expect(migrated.completions['2026-04-10'].pushups).toMatchObject({ level: 0, goal: 100 });
        expect(migrated.completions['2026-04-10'].squats).toMatchObject(entry(5));
        expect(migrated.completions['2026-04-10'].abs).toMatchObject({ isCompleted: true, count: 50, level: 5, goal: 100 });
        expect(migrated.completions['2026-04-11'].pushups.level).toBe(10);
        expect(getRecordedReps(migrated.completions['2026-04-10'].pushups, { multiplier: 1 }, 100)).toBe(7);
        expect(migrateLevelProgress(migrated)).toBe(migrated);
    });

    it('credits partial legacy days using their historical full goal, even for already upgraded accounts', () => {
        const state = { progressVersion: 2, startDate: '2025-12-31', completions: {
            '2026-04-09': { pushups: { isCompleted: false, count: 40, difficulty: 0.5, timestamp: 123, weight: 12 }, planche: { count: 100 } },
            '2026-04-10': { pushups: { isCompleted: false, count: 40 }, squats: { count: 11 }, abs: { count: 200 } },
        } };
        const migrated = migrateLevelProgress(state);
        expect(migrated.progressVersion).toBe(4);
        expect(migrated.completions['2026-04-09'].pushups).toEqual({ isCompleted: true, count: 40, goal: 100, level: 4, difficulty: 0.5, timestamp: 123, weight: 12 });
        expect(migrated.completions['2026-04-09'].planche).toMatchObject({ goal: 200, level: 5, count: 100 });
        expect(migrated.completions['2026-04-10'].pushups).toMatchObject({ goal: 101, level: 3 });
        expect(migrated.completions['2026-04-10'].squats).toMatchObject({ goal: 101, level: 1 });
        expect(migrated.completions['2026-04-10'].abs).toMatchObject({ goal: 101, count: 200, level: 10 });
        expect(computeLevelStreaks(migrated.completions, '2026-04-10', { exerciseId: 'pushups' })).toMatchObject({ streak: 2, level: 3 });
        expect(state.completions['2026-04-09'].pushups.isCompleted).toBe(false);
        expect(migrateLevelProgress(migrated)).toBe(migrated);
    });

    it('preserves modern entries and empty days, and defers unknown partial exercises', () => {
        const current = { isCompleted: false, count: 2, level: 0, goal: 100, timestamp: 1775822400000 };
        const state = { startDate: '2026-01-01', completions: { '2026-04-10': {
            pushups: current, squats: { isCompleted: false }, abs: { count: 0 },
            custom: { isCompleted: false, count: 40 }, running: { isCompleted: false },
        } } };
        const first = migrateLevelProgress(state);
        expect(first.completions['2026-04-10']).toEqual(state.completions['2026-04-10']);
        const migrated = migrateLevelProgress(first, [{ id: 'custom', multiplier: 2 }]);
        expect(migrated.completions['2026-04-10'].custom).toMatchObject({ count: 40, goal: 200, level: 2, isCompleted: true });
        expect(migrateLevelProgress(migrated)).toBe(migrated);
    });

    it('waits for custom definitions rather than inventing historical reps', () => {
        const state = { startDate: '2026-01-01', completions: { '2026-04-10': { custom: { isCompleted: true } } } };
        const first = migrateLevelProgress(state);
        expect(first.completions['2026-04-10'].custom.level).toBeUndefined();
        const migrated = migrateLevelProgress(first, [{ id: 'custom', multiplier: 2 }]);
        expect(migrated.completions['2026-04-10'].custom).toMatchObject({ level: 10, count: 200, goal: 200 });
    });
});

describe('guest level metadata', () => {
    it('keeps a historical full validation coherent when the other side has more partial volume', async () => {
        const { mergeLevelMetadata } = await import('@shared/exerciseLevels.js');
        const full = { count: 20, goal: 20, level: 10, isCompleted: true };
        const partial = { count: 50, goal: 100, level: 5, isCompleted: true };
        expect(mergeLevelMetadata(full, partial, 50)).toEqual({ goal: 50, level: 10 });
    });
});
