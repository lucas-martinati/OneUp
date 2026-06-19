import { BADGE_DEFINITIONS, getBadgeIconFromDef, isBadgeUnlocked } from '@config/badgeDefinitions';

// Visual-only progress metadata: [stat key, goal]. Lets locked numeric badges
// show how close they are. Unlock logic stays in badgeDefinitions (test()).
const PROGRESS_META = {
    first_blood: ['totalDays', 1],
    consistent: ['maxStreak', 3], week_warrior: ['maxStreak', 7], two_weeks: ['maxStreak', 14],
    month_warrior: ['maxStreak', 30], two_months: ['maxStreak', 60], quarter_year: ['maxStreak', 90],
    half_year: ['maxStreak', 180], year_beast: ['maxStreak', 365],
    ten_sessions: ['totalDays', 10], fifty_sessions: ['totalDays', 50], hundred_sessions: ['totalDays', 100],
    two_hundred_sessions: ['totalDays', 200], five_hundred_sessions: ['totalDays', 500],
    rep_500: ['totalRepsAll', 500], rep_1000: ['totalRepsAll', 1000], rep_5000: ['totalRepsAll', 5000],
    rep_10000: ['totalRepsAll', 10000], rep_50000: ['totalRepsAll', 50000],
    perfect_one: ['perfectDays', 1], perfect_five: ['perfectDays', 5], perfect_fifty: ['perfectDays', 50], perfect_hundred: ['perfectDays', 100],
    weekday_warrior: ['weekdayWorkouts', 25], weekend_warrior: ['weekendWorkouts', 25],
    morning_5: ['morningWorkouts', 5], morning_10: ['morningWorkouts', 10], morning_25: ['morningWorkouts', 25],
    afternoon_5: ['afternoonWorkouts', 5], afternoon_10: ['afternoonWorkouts', 10], afternoon_25: ['afternoonWorkouts', 25],
    evening_5: ['eveningWorkouts', 5], evening_10: ['eveningWorkouts', 10], evening_25: ['eveningWorkouts', 25],
};

/**
 * Build the enriched badge list (unlock state + progress + i18n keys) from a
 * computed-stats snapshot. Shared by the Achievements panel and the stats
 * achievements showcase so they stay perfectly in sync.
 *
 * @param {object} stats A computed stats object (must include `achievements`).
 * @returns {Array} enriched badge descriptors
 */
export function buildBadges(stats) {
    const achievements = stats?.achievements;
    return BADGE_DEFINITIONS.map(def => {
        const unlocked = isBadgeUnlocked(def.id, stats, achievements);
        const meta = PROGRESS_META[def.id];
        const current = meta ? (stats?.[meta[0]] || 0) : null;
        const goal = meta ? meta[1] : null;
        return {
            id: def.id,
            icon: getBadgeIconFromDef(def),
            color: def.color,
            category: def.category,
            secret: def.secret || false,
            titleKey: def.secret && !unlocked ? null : `achievements.badges.${def.id}.title`,
            descKey: def.secret && !unlocked ? null : `achievements.badges.${def.id}.desc`,
            unlocked,
            current,
            goal,
            progress: goal != null ? Math.min(current / goal, 1) : null,
        };
    });
}
