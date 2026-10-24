import { afterEach, describe, expect, it, vi } from 'vitest';
import { computeAchievementStats } from '@shared/achievementStats.js';
import { isBadgeUnlocked } from '@shared/badgeRules.js';
import { migrateLevelProgress } from '@shared/exerciseLevels.js';
import { buildBadges } from '@components/feedback/buildBadges';

afterEach(() => vi.useRealTimers());
describe('level achievements', () => {
    it('counts attained levels, not reps or exercise units, and uses the best daily exercise for streaks', () => {
        vi.useFakeTimers(); vi.setSystemTime(new Date('2026-02-19T12:00:00Z'));
        const completions = Object.fromEntries(Array.from({ length: 7 }, (_, i) => [`2026-02-${13 + i}`, {
            [i % 2 ? 'pushups' : 'planche']: { count: i % 2 ? 1000 : 5, level: 5, isCompleted: true },
        }]));
        const stats = computeAchievementStats(completions, 99999);
        expect(stats).toMatchObject({ totalLevels: 35, highestLevel: 5, levelFiveStreak: 7 });
        expect(isBadgeUnlocked('level_five_week', stats)).toBe(true);
        expect(isBadgeUnlocked('level_100', stats)).toBe(false);
        expect(isBadgeUnlocked('level_ten', stats)).toBe(false);
        const badge = buildBadges({ badgeStats: stats, totalLevels: 9999 }).find(b => b.id === 'level_100');
        expect(badge).toMatchObject({ current: 35, goal: 100, unlocked: false, progress: 0.35 });
    });

    it('credits migrated partial days and keeps existing volume achievements', () => {
        const progress = migrateLevelProgress({ startDate: '2026-01-01', completions: {
            '2026-04-10': { pushups: { count: 50, isCompleted: false }, squats: { isCompleted: true } },
        } });
        const stats = computeAchievementStats(progress.completions, 500);
        expect(stats).toMatchObject({ totalLevels: 15, highestLevel: 10 });
        expect(isBadgeUnlocked('level_ten', stats)).toBe(true);
        expect(isBadgeUnlocked('rep_500', stats)).toBe(true);
        expect(isBadgeUnlocked('level_ten', stats, { level_ten: false })).toBe(false);
    });

    it('counts a cardio week once per sport and excludes future and zero levels', () => {
        vi.useFakeTimers(); vi.setSystemTime(new Date('2026-02-19T12:00:00Z'));
        const stats = computeAchievementStats({
            '2026-02-16': { running: { level: 3, isCompleted: true } },
            '2026-02-17': { running: { level: 7, isCompleted: true }, cycling: { level: 2, isCompleted: true } },
            '2026-02-19': { pushups: { level: 0, count: 1 }, unknown: { level: 10, isCompleted: true } },
            '2026-02-20': { pushups: { level: 10, isCompleted: true } },
        }, 0);
        expect(stats).toMatchObject({ totalLevels: 9, highestLevel: 7 });
    });
});
