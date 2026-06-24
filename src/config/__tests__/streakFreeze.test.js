import { describe, it, expect } from 'vitest';
import {
    STREAK_FREEZE_LIMITS,
    getFreezeLimits,
    monthKey,
    applyMonthlyRefill,
    reconcileStreakFreezeState,
} from '@config/streakFreeze';
import { walkStreak, normalizeFrozenDays } from '@shared/streakFreeze.js';
import { calculateStreak } from '@utils/dateUtils';

const START = '2026-01-01';
const done = () => ({ pushups: { isCompleted: true } });

describe('monthKey', () => {
    it('extracts the YYYY-MM bucket', () => {
        expect(monthKey('2026-06-23')).toBe('2026-06');
    });
});

describe('getFreezeLimits', () => {
    it('returns the right tier limits', () => {
        expect(getFreezeLimits(false)).toEqual(STREAK_FREEZE_LIMITS.free);
        expect(getFreezeLimits(true)).toEqual(STREAK_FREEZE_LIMITS.pro);
    });
});

describe('applyMonthlyRefill', () => {
    it('grants a single welcome freeze on first init (no lastRefill)', () => {
        const r = applyMonthlyRefill({ count: 0, lastRefill: null }, false, '2026-06-23');
        expect(r).toEqual({ count: 1, lastRefill: '2026-06', changed: true });
    });

    it('grants only 1 on first init even for Pro (welcome freeze is tier-independent)', () => {
        const r = applyMonthlyRefill({ count: 0, lastRefill: null }, true, '2026-06-23');
        expect(r.count).toBe(1);
    });

    it('tops up by perMonth on a new month, capped at maxStock', () => {
        // free: perMonth 1, maxStock 2
        expect(applyMonthlyRefill({ count: 0, lastRefill: '2026-05' }, false, '2026-06-23').count).toBe(1);
        expect(applyMonthlyRefill({ count: 2, lastRefill: '2026-05' }, false, '2026-06-23').count).toBe(2);
    });

    it('does not stack skipped months', () => {
        const r = applyMonthlyRefill({ count: 0, lastRefill: '2026-01' }, false, '2026-06-23');
        expect(r.count).toBe(1); // single top-up, not five
    });

    it('grants more for Pro', () => {
        const r = applyMonthlyRefill({ count: 0, lastRefill: '2026-05' }, true, '2026-06-23');
        expect(r.count).toBe(3);
    });

    it('re-clamps to a lowered cap within the same month (Pro lost)', () => {
        const r = applyMonthlyRefill({ count: 5, lastRefill: '2026-06' }, false, '2026-06-23');
        expect(r.count).toBe(2); // free maxStock
        expect(r.changed).toBe(true);
    });

    it('is a no-op within the same month at a valid count', () => {
        const r = applyMonthlyRefill({ count: 1, lastRefill: '2026-06' }, false, '2026-06-23');
        expect(r).toEqual({ count: 1, lastRefill: '2026-06', changed: false });
    });
});

describe('reconcileStreakFreezeState — auto-freeze', () => {
    const base = { startDate: START, isPro: false, todayStr: '2026-06-23' };

    it('freezes a single missed day when a freeze is available', () => {
        const completions = { '2026-06-21': done() }; // 06-22 missed, 06-23 today
        const r = reconcileStreakFreezeState({
            ...base, completions,
            frozenDays: {}, streakFreezes: { count: 1, lastRefill: '2026-06' },
        });
        expect(r.frozeDates).toEqual(['2026-06-22']);
        expect(r.frozenDays['2026-06-22']).toBe(true);
        expect(r.streakFreezes.count).toBe(0);
        expect(r.changed).toBe(true);
    });

    it('does NOT waste a freeze when the gap is bigger than the stock', () => {
        const completions = { '2026-06-20': done() }; // 06-21 & 06-22 both missed
        const r = reconcileStreakFreezeState({
            ...base, completions,
            frozenDays: {}, streakFreezes: { count: 1, lastRefill: '2026-06' },
        });
        expect(r.frozeDates).toEqual([]);
        expect(r.streakFreezes.count).toBe(1);
        expect(r.changed).toBe(false);
    });

    it('bridges a 2-day gap when enough freezes are stocked', () => {
        const completions = { '2026-06-20': done() };
        const r = reconcileStreakFreezeState({
            ...base, completions,
            frozenDays: {}, streakFreezes: { count: 2, lastRefill: '2026-06' },
        });
        expect(r.frozeDates.sort()).toEqual(['2026-06-21', '2026-06-22']);
        expect(r.streakFreezes.count).toBe(0);
    });

    it('does nothing when there is no prior streak to protect', () => {
        const r = reconcileStreakFreezeState({
            ...base, completions: {},
            frozenDays: {}, streakFreezes: { count: 2, lastRefill: '2026-06' },
        });
        expect(r.frozeDates).toEqual([]);
    });

    it('does nothing when yesterday is already done', () => {
        const completions = { '2026-06-22': done() };
        const r = reconcileStreakFreezeState({
            ...base, completions,
            frozenDays: {}, streakFreezes: { count: 1, lastRefill: '2026-06' },
        });
        expect(r.frozeDates).toEqual([]);
        expect(r.streakFreezes.count).toBe(1);
    });

    it('never freezes days before the challenge start', () => {
        const r = reconcileStreakFreezeState({
            ...base, startDate: '2026-06-22', completions: {},
            frozenDays: {}, streakFreezes: { count: 2, lastRefill: '2026-06' },
        });
        expect(r.frozeDates).toEqual([]);
    });

    it('prunes frozen days older than the streak window', () => {
        const r = reconcileStreakFreezeState({
            ...base,
            completions: {},
            // 2024-01-01 is well over 365 days before 2026-06-23; 2026-06-01 is recent.
            frozenDays: { '2024-01-01': true, '2026-06-01': true },
            streakFreezes: { count: 1, lastRefill: '2026-06' },
        });
        expect(r.frozenDays['2024-01-01']).toBeUndefined();
        expect(r.frozenDays['2026-06-01']).toBe(true);
        expect(r.changed).toBe(true);
    });

    it('combines a monthly refill with an auto-freeze', () => {
        const completions = { '2026-06-21': done() };
        const r = reconcileStreakFreezeState({
            ...base, completions,
            frozenDays: {}, streakFreezes: { count: 1, lastRefill: '2026-05' },
        });
        // free refill 0→1 then 1→1+1=... wait: starts at 1, new month tops up to 2, then spends 1.
        expect(r.streakFreezes.lastRefill).toBe('2026-06');
        expect(r.frozeDates).toEqual(['2026-06-22']);
        expect(r.streakFreezes.count).toBe(1); // min(2, 1+1)=2, minus 1 spent
    });
});

describe('frozen days keep the streak alive', () => {
    it('calculateStreak treats a frozen day as transparent', () => {
        const completions = {
            '2026-06-23': done(),
            '2026-06-21': done(),
            '2026-06-20': done(),
            // 2026-06-22 missed but frozen
        };
        const frozen = { '2026-06-22': true };
        // Without the freeze the streak would stop at 06-23 (length 1).
        expect(calculateStreak(completions, '2026-06-23')).toBe(1);
        // With the freeze, 06-23 + (skip 06-22) + 06-21 + 06-20 = 3.
        expect(calculateStreak(completions, '2026-06-23', frozen)).toBe(3);
    });
});

describe('shared walkStreak', () => {
    it('skips frozen days without counting them', () => {
        const doneSet = new Set(['d0', 'd2', 'd3']);
        const frozenSet = new Set(['d1']);
        const n = walkStreak(
            (i) => `d${i}`,
            (ds) => doneSet.has(ds),
            (ds) => frozenSet.has(ds),
            10
        );
        expect(n).toBe(3); // d0 + (skip d1) + d2 + d3
    });

    it('breaks on a genuinely missed day', () => {
        const n = walkStreak((i) => `d${i}`, (ds) => ds === 'd0', () => false, 10);
        expect(n).toBe(1);
    });
});

describe('normalizeFrozenDays', () => {
    it('drops falsy values and tolerates null', () => {
        expect(normalizeFrozenDays(null)).toEqual({});
        expect(normalizeFrozenDays({ a: true, b: false, c: 1 })).toEqual({ a: true, c: true });
    });
});
