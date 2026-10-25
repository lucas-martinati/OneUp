import { describe, it, expect } from 'vitest';
import { computeCardioLevelStreaks, getCardioLevelUpdates, getCardioGoal, getCardioReps } from '@shared/cardioLevels.js';
import { computeLevelStreaks, getDayLevel, migrateLevelProgress } from '@shared/exerciseLevels.js';
const entry = level => ({ level, isCompleted: level > 0, count: level * 100, goal: 1000 });
const session = (date, distance, type = 'running') => ({ type, distance, startTime: new Date(`${date}T12:00:00`).getTime() });

describe('weekly cardio level streaks', () => {
    const completions = {
        '2026-02-03': { running: entry(10) },
        '2026-02-10': { running: entry(10) },
        '2026-02-17': { running: entry(5) },
    };
    it('counts weeks, drops to the sustained level and retains higher records', () => {
        const result = computeCardioLevelStreaks(completions, 'running', '2026-01-01', '2026-02-19');
        expect(result.streak).toBe(3);
        expect(result.level).toBe(5);
        expect(result.levels[9]).toEqual({ level: 10, current: 0, max: 2 });
    });
    it('leaves the current week pending then breaks after a missed complete week', () => {
        expect(computeCardioLevelStreaks(completions, 'running', '2026-01-01', '2026-02-25').streak).toBe(3);
        expect(computeCardioLevelStreaks(completions, 'running', '2026-01-01', '2026-03-02').streak).toBe(0);
    });
    it('excludes future and pre-challenge entries', () => {
        expect(computeCardioLevelStreaks(completions, 'running', '2026-02-10', '2026-02-16').streak).toBe(1);
    });
    it('does not double-count multiple validations within one week', () => {
        const history = { ...completions, '2026-02-19': { running: entry(10) } };
        expect(computeCardioLevelStreaks(history, 'running', null, '2026-02-19').streak).toBe(3);
    });
    it('respects Sunday and Monday calendar boundaries', () => {
        const history = { '2026-02-07': { running: entry(10) }, '2026-02-08': { running: entry(5) } };
        expect(computeCardioLevelStreaks(history, 'running', null, '2026-02-08', 'sunday').streak).toBe(2);
        expect(computeCardioLevelStreaks(history, 'running', null, '2026-02-08', 'monday').streak).toBe(1);
    });
    it('keeps continuity over DST changes', () => {
        const history = { '2026-03-24': { running: entry(10) }, '2026-03-31': { running: entry(10) } };
        expect(computeCardioLevelStreaks(history, 'running', null, '2026-04-02').streak).toBe(2);
    });
    it('carries the best cardio level through the week for the global day streak', () => {
        const history = { '2026-02-17': { running: entry(5) }, '2026-02-18': { pushups: entry(10) } };
        expect(getDayLevel(history, '2026-02-16')).toBe(0);
        expect(getDayLevel(history, '2026-02-18')).toBe(10);
        expect(getDayLevel(history, '2026-02-22')).toBe(5);
        expect(getDayLevel(history, '2026-02-23')).toBe(0);
        expect(computeLevelStreaks(history, '2026-02-22')).toMatchObject({ streak: 6, level: 5 });
        expect(getDayLevel(history, '2026-02-22', ['pushups'])).toBe(0);
    });
});

describe('cardio snapshots and migration', () => {
    it('sums distance once per sport/week and snapshots the full target', () => {
        const result = getCardioLevelUpdates([session('2026-02-17', 900), session('2026-02-19', 900), session('2026-02-18', 3000, 'cycling')], {}, '2026-01-01');
        expect(result).toEqual([{ date: '2026-02-17', mode: 'running', count: 1800, goal: 3150 }, { date: '2026-02-18', mode: 'cycling', count: 3000, goal: 5250 }]);
    });
    it('ignores invalid distances, unsupported activities and pre-challenge dates', () => {
        const result = getCardioLevelUpdates([session('2025-12-30', 1000), session('2026-02-18', -1), session('2026-02-18', 3000, 'walking')], {}, '2026-01-01');
        expect(result).toEqual([{ date: '2026-02-18', mode: 'running', count: 0, goal: 3150 }]);
    });
    it('is idempotent and retains the original snapshot date', () => {
        const history = { '2026-02-17': { running: { count: 1800, goal: 3600, level: 5, isCompleted: true } } };
        expect(getCardioLevelUpdates([session('2026-02-19', 1800)], history, '2026-01-01')).toEqual([]);
        expect(getCardioLevelUpdates([session('2026-02-19', 900)], history, '2026-01-01')[0]).toEqual({ date: '2026-02-17', mode: 'running', count: 900, goal: 3600 });
    });
    it('clears empty tracked weeks for both sports', () => {
        const history = { '2026-02-17': { running: entry(5), cycling: entry(2) } };
        expect(getCardioLevelUpdates([], history, '2026-01-01')).toHaveLength(2);
        expect(getCardioLevelUpdates([], history, '2026-01-01').every(update => update.count === 0)).toBe(true);
    });
    it('keeps old validations at level 10 and preserves their historical volume', () => {
        const old = { startDate: '2026-01-01', completions: { '2026-02-17': { running: { isCompleted: true, difficulty: 0.5 }, cycling: { isCompleted: false } } } };
        const migrated = migrateLevelProgress(old);
        const run = migrated.completions['2026-02-17'].running;
        expect(run).toMatchObject({ level: 10, count: 1575, goal: 1575, legacyCardio: true });
        expect(getCardioReps(run, 'running', 7)).toBe(getCardioReps(old.completions['2026-02-17'].running, 'running', 7));
        expect(migrated.completions['2026-02-17'].cycling).toEqual({ isCompleted: false });
        expect(migrateLevelProgress(migrated)).toBe(migrated);
        expect(getCardioLevelUpdates([], migrated.completions, old.startDate)).toEqual([]);
    });
    it('does not retroactively validate a failed legacy week from imported activities', () => {
        const history = { '2020-02-18': { running: { isCompleted: false } } };
        expect(getCardioLevelUpdates([session('2020-02-18', 1000)], history, '2020-01-01')).toEqual([]);
    });
    it('excludes sub-level distance from credited reps and preserves goal snapshots', () => {
        expect(getCardioReps({ level: 0, count: 300, isCompleted: false }, 'running', 8)).toBe(0);
        expect(getCardioGoal('running', '2026-01-01', '2026-02-19', { goal: 2000 })).toBe(2000);
        expect(getCardioGoal('running', '2026-01-01', '2026-02-19')).toBe(3150);
    });
});
