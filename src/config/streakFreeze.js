// ══════════════════════════════════════════════════════════════════════════════
// Streak Freeze — allocation rules & client-side reconciliation (auto-apply).
//
// A Streak Freeze protects the GLOBAL daily streak when a day is missed. Freezes
// refill monthly (more for Pro), are capped at a small stock, and are consumed
// AUTOMATICALLY by replaying each missed day in order, exactly as if the app had
// been opened every day:
//
//   • SEQUENTIAL, oldest→newest — one freeze protects one missed day; the moment
//     the stock runs out, that day breaks the streak and NO later day is frozen
//     (a post-break freeze can't revive a dead streak). Missing 2 days with 1
//     freeze protects the FIRST missed day and breaks on the second.
//   • NO RETROACTIVITY — the monthly refill is applied AFTER consumption, so a new
//     month's fresh allotment can never reach back to rescue days missed in a
//     previous month. Only days genuinely completed anchor a streak worth saving;
//     an already-frozen day alone never resurrects one.
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
    // First-ever initialisation — a single welcome freeze (NOT the full monthly
    // allotment), so a freshly created account never starts loaded. Monthly
    // refills top up by `perMonth` from there.
    count = Math.min(1, limits.maxStock);
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
 * Reconcile the streak-freeze state: auto-consume freezes to protect the run of
 * missed days ending YESTERDAY (today is never frozen — the day isn't over yet),
 * THEN apply the monthly refill.
 *
 * Consumption replays the gap oldest→newest, one freeze per missed day, and stops
 * the instant the stock is empty (that day breaks the streak; later days stay
 * unfrozen). The refill runs afterwards so a new month's allotment can never be
 * spent retroactively on days missed before it.
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
  // Freezes available to protect the gap are ONLY the ones already banked before
  // this run's monthly refill — the new-month allotment must never reach back to
  // rescue a previous month's misses. Clamp to the tier cap so a stale/inflated
  // stock can't over-spend either.
  const limits = getFreezeLimits(isPro);
  const prevCount = Number.isFinite(streakFreezes?.count) ? streakFreezes.count : 0;
  let available = Math.min(Math.max(prevCount, 0), limits.maxStock);

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

  // Walk back from yesterday collecting the run of consecutive UNPROTECTED missed
  // days. An already-frozen day is transparent (skip it, keep looking); only a
  // genuinely COMPLETED day anchors a real streak worth saving (`bridgeable`). A
  // lone frozen day therefore never resurrects a streak, and we never freeze days
  // before the challenge start.
  const gap = []; // built newest→oldest
  let bridgeable = false;
  for (let i = 1; i < MAX_STREAK_WINDOW; i++) {
    const ds = shiftDateStr(todayStr, -i);
    if (startDate && ds < startDate) break;        // outside the challenge — no anchor
    if (isDone(ds)) { bridgeable = true; break; }  // real streak anchor found
    if (nextFrozen[ds]) continue;                  // already protected — transparent
    gap.push(ds);
  }

  // Consume freezes sequentially from the OLDEST missed day forward. The first day
  // we can't cover breaks the streak, so we stop there and leave the rest unfrozen.
  const frozeDates = [];
  if (bridgeable) {
    for (let j = gap.length - 1; j >= 0 && available > 0; j--) {
      const ds = gap[j];
      nextFrozen[ds] = true;
      frozeDates.push(ds);
      available -= 1;
    }
  }

  // Now top up for the (possibly new) month from whatever survived consumption.
  const refill = applyMonthlyRefill({ count: available, lastRefill: streakFreezes?.lastRefill || null }, isPro, todayStr);

  const changed = refill.changed || frozeDates.length > 0 || prunedAny;
  return {
    streakFreezes: { count: refill.count, lastRefill: refill.lastRefill },
    frozenDays: nextFrozen,
    frozeDates,
    changed,
  };
}
