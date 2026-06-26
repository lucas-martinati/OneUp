// ══════════════════════════════════════════════════════════════════════════════
// Streak Freeze — allocation rules & client-side reconciliation (auto-apply).
//
// A Streak Freeze protects the GLOBAL daily streak when a day is missed. Freezes
// refill monthly (more for Pro), are capped at a small stock, and are consumed
// AUTOMATICALLY: when the app reconciles, any gap of missed days ending
// yesterday is bridged with freezes — provided we hold enough to cover the WHOLE
// gap (a partial bridge can't save the streak, so we never waste freezes on it).
//
// The frozen-day SEMANTICS (how a freeze affects the streak walk) live in the
// shared module so client + server agree; see `@shared/streakFreeze.js`.
// ══════════════════════════════════════════════════════════════════════════════

import { getLocalDateStr, parseLocalDate, isDayDoneFromCompletions, MAX_STREAK_WINDOW } from '@utils/dateUtils';

/** Monthly allotment and maximum bankable stock, per tier. */
export const STREAK_FREEZE_LIMITS = Object.freeze({
  free: { perMonth: 1, maxStock: 2 },
  pro: { perMonth: 3, maxStock: 6 },
});

/** Limits for the given tier. */
export function getFreezeLimits(isPro) {
  return isPro ? STREAK_FREEZE_LIMITS.pro : STREAK_FREEZE_LIMITS.free;
}

/** 'YYYY-MM-DD' (or Date) → 'YYYY-MM' month bucket used for monthly refills. */
export function monthKey(dateInput) {
  return getLocalDateStr(dateInput).slice(0, 7);
}

function shiftDateStr(dateStr, deltaDays) {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + deltaDays);
  return getLocalDateStr(d);
}

/**
 * Apply the monthly refill to a freeze inventory.
 * No stacking of skipped months — a new month tops up by `perMonth` (capped).
 * @returns {{count:number, lastRefill:string, changed:boolean}}
 */
export function applyMonthlyRefill(streakFreezes, isPro, todayStr) {
  const limits = getFreezeLimits(isPro);
  const curMonth = monthKey(todayStr);
  const prevCount = Number.isFinite(streakFreezes?.count) ? streakFreezes.count : null;
  const lastRefill = streakFreezes?.lastRefill || null;

  let count;
  if (prevCount === null || !lastRefill) {
    // First-ever initialisation — grant a starter allotment.
    count = limits.perMonth;
  } else if (lastRefill !== curMonth) {
    // New month — top up, capped at the bankable maximum.
    count = Math.min(limits.maxStock, prevCount + limits.perMonth);
  } else {
    // Same month — only re-clamp in case the cap dropped (e.g. Pro expired).
    count = Math.min(prevCount, limits.maxStock);
  }

  const changed = count !== prevCount || lastRefill !== curMonth;
  return { count, lastRefill: curMonth, changed };
}

/**
 * Reconcile the streak-freeze state: monthly refill, then auto-consume freezes
 * to bridge the gap of missed days ending YESTERDAY (today is never frozen — the
 * day isn't over yet).
 *
 * Pure: returns the next state plus the list of days newly frozen this run.
 *
 * @param {Object}  args
 * @param {Object}  args.completions
 * @param {Object}  args.frozenDays      - { 'YYYY-MM-DD': true }
 * @param {Object}  args.streakFreezes   - { count, lastRefill }
 * @param {string}  args.startDate       - challenge start (don't freeze before it)
 * @param {boolean} args.isPro
 * @param {string}  args.todayStr        - 'YYYY-MM-DD'
 * @returns {{streakFreezes:{count:number,lastRefill:string}, frozenDays:Object, frozeDates:string[], changed:boolean}}
 */
export function reconcileStreakFreezeState({ completions, frozenDays, streakFreezes, startDate, isPro, todayStr }) {
  const refill = applyMonthlyRefill(streakFreezes, isPro, todayStr);
  let count = refill.count;

  // Prune frozen days older than the streak window: the streak walk never looks
  // past it, so these can't affect any streak — dropping them keeps the stored
  // set (and the cloud payload) bounded over years of use. Mirrors the server cap.
  const cutoff = shiftDateStr(todayStr, -MAX_STREAK_WINDOW);
  const nextFrozen = {};
  let prunedAny = false;
  for (const ds of Object.keys(frozenDays || {})) {
    if (ds >= cutoff) nextFrozen[ds] = true;
    else prunedAny = true;
  }
  const isDone = (ds) => isDayDoneFromCompletions(completions, ds);

  // Collect the run of consecutive missed days ending yesterday, stopping at the
  // first day that is still "live" (done or already frozen). `bridgeable` tells
  // us whether that live edge exists (i.e. there is a streak worth saving).
  const gap = [];
  let bridgeable = false;
  for (let i = 1; i < MAX_STREAK_WINDOW; i++) {
    const ds = shiftDateStr(todayStr, -i);
    if (startDate && ds < startDate) break;        // outside the challenge
    if (isDone(ds) || nextFrozen[ds]) { bridgeable = true; break; }
    gap.push(ds);
    if (gap.length > count) break;                 // gap already too big to bridge
  }

  const frozeDates = [];
  // Only spend freezes when we can cover the ENTIRE gap of an existing streak.
  if (bridgeable && gap.length > 0 && gap.length <= count) {
    for (const ds of gap) {
      nextFrozen[ds] = true;
      frozeDates.push(ds);
    }
    count -= gap.length;
  }

  const changed = refill.changed || frozeDates.length > 0 || prunedAny;
  return {
    streakFreezes: { count, lastRefill: refill.lastRefill },
    frozenDays: nextFrozen,
    frozeDates,
    changed,
  };
}
