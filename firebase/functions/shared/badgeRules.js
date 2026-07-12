/**
 * SINGLE SOURCE OF TRUTH for badge unlock logic (id + test).
 *
 * ES Module consumed by BOTH:
 *   • the client UI    — src/config/badgeDefinitions.js (bundled by Vite),
 *                        which attaches presentation metadata (icon/colour/…)
 *   • the Cloud Function — functions/index.js (via import), to publish the
 *                          real badge count to the leaderboard.
 *
 * Keep this file free of any import (no icons, no React) so both runtimes
 * can load it. Presentation (icons/colours/categories) lives in the client's
 * badgeDefinitions.js only — the server never needs it.
 */

export const BADGE_RULES = [
  // ── Streak ─────────────────────────────────────────────────────────
  { id: 'first_blood',          test: s => s.totalDays >= 1 },
  { id: 'consistent',           test: s => s.maxStreak >= 3 },
  { id: 'week_warrior',         test: s => s.maxStreak >= 7 },
  { id: 'two_weeks',            test: s => s.maxStreak >= 14 },
  { id: 'month_warrior',        test: s => s.maxStreak >= 30 },
  { id: 'two_months',           test: s => s.maxStreak >= 60 },
  { id: 'quarter_year',         test: s => s.maxStreak >= 90 },
  { id: 'half_year',            test: s => s.maxStreak >= 180 },
  { id: 'year_beast',           test: s => s.maxStreak >= 365 },

  // ── Quantity ───────────────────────────────────────────────────────
  { id: 'ten_sessions',         test: s => s.totalDays >= 10 },
  { id: 'fifty_sessions',       test: s => s.totalDays >= 50 },
  { id: 'hundred_sessions',     test: s => s.totalDays >= 100 },
  { id: 'two_hundred_sessions', test: s => s.totalDays >= 200 },
  { id: 'all_exercises',        test: s => s.hasCompletedAllExercisesOnce },

  // ── Volume ─────────────────────────────────────────────────────────
  { id: 'rep_500',              test: s => s.totalRepsAll >= 500 },
  { id: 'rep_1000',             test: s => s.totalRepsAll >= 1000 },
  { id: 'rep_5000',             test: s => s.totalRepsAll >= 5000 },
  { id: 'rep_10000',            test: s => s.totalRepsAll >= 10000 },
  { id: 'rep_50000',            test: s => s.totalRepsAll >= 50000 },

  // ── Perfection ─────────────────────────────────────────────────────
  { id: 'perfect_one',          test: s => s.perfectDays >= 1 },
  { id: 'perfect_five',         test: s => s.perfectDays >= 5 },
  { id: 'perfect_fifty',        test: s => s.perfectDays >= 50 },
  { id: 'perfect_hundred',      test: s => s.perfectDays >= 100 },

  // ── Schedule ───────────────────────────────────────────────────────
  { id: 'weekday_warrior',      test: s => s.weekdayWorkouts >= 25 },
  { id: 'weekend_warrior',      test: s => s.weekendWorkouts >= 25 },
  { id: 'balanced',             test: s => s.weekdayWorkouts >= 10 && s.weekendWorkouts >= 10 },
  { id: 'morning_5',            test: s => s.morningWorkouts >= 5 },
  { id: 'morning_10',           test: s => s.morningWorkouts >= 10 },
  { id: 'morning_25',           test: s => s.morningWorkouts >= 25 },
  { id: 'afternoon_5',          test: s => s.afternoonWorkouts >= 5 },
  { id: 'afternoon_10',         test: s => s.afternoonWorkouts >= 10 },
  { id: 'afternoon_25',         test: s => s.afternoonWorkouts >= 25 },
  { id: 'evening_5',            test: s => s.eveningWorkouts >= 5 },
  { id: 'evening_10',           test: s => s.eveningWorkouts >= 10 },
  { id: 'evening_25',           test: s => s.eveningWorkouts >= 25 },

  // ── Social (manual — unlocked only via the achievements node) ───────
  { id: 'first_share',          test: () => false },
  { id: 'white_hat',            test: () => false },

  // ── Secrets ────────────────────────────────────────────────────────
  { id: 'ghost',                test: s => s.ghostWorkout },
  { id: 'perfectionist',        test: s => s.perfectStreak >= 30 },
  { id: 'beast',                test: s => s.totalRepsAll >= 100000 },
];

export const BADGE_RULES_BY_ID = Object.fromEntries(BADGE_RULES.map(r => [r.id, r]));

/**
 * Whether a badge is unlocked. A manual override stored in the `achievements`
 * node (true/false) always wins over the computed test (used by first_share /
 * white_hat, and to let admins force a badge).
 */
export function isBadgeUnlocked(badgeId, stats, achievements = {}) {
  const val = achievements[badgeId];
  if (val === true || val === 'true') return true;
  if (val === false || val === 'false') return false;
  const rule = BADGE_RULES_BY_ID[badgeId];
  return rule ? rule.test(stats) : false;
}
