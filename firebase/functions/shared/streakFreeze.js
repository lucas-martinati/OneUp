// ══════════════════════════════════════════════════════════════════════════════
// OneUp — Streak Freeze semantics (SINGLE SOURCE OF TRUTH, client + server)
//
// A "frozen" day is a MISSED day that a Streak Freeze protects. In the streak
// walk it is TRANSPARENT: it neither breaks the streak nor counts toward it.
// The day is simply skipped, so the streak before and after the gap stays linked.
//
// This module is imported BOTH by the client (src/**, via the `@shared` alias)
// AND by the Cloud Functions (firebase/functions/index.js), so the streak number
// shown locally and the one published to the leaderboard can never diverge.
// Keep it dependency-free (no Node/browser/DOM APIs).
// ══════════════════════════════════════════════════════════════════════════════

import { MAX_STREAK_WINDOW, shiftDateStr } from './dateUtils.js';



/**
 * Normalise a persisted frozenDays value into a plain lookup object.
 * Accepts the canonical `{ 'YYYY-MM-DD': true }` map and is tolerant of `null`.
 * @param {Object|null|undefined} frozenDays
 * @returns {Object<string, boolean>}
 */
export function normalizeFrozenDays(frozenDays) {
  if (!frozenDays || typeof frozenDays !== 'object') return {};
  const out = {};
  for (const [dateStr, val] of Object.entries(frozenDays)) {
    if (val) out[dateStr] = true;
  }
  return out;
}

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
  if (typeof dateInput === 'string') return dateInput.slice(0, 7);
  const pad = n => String(n).padStart(2, '0');
  return `${dateInput.getFullYear()}-${pad(dateInput.getMonth() + 1)}`;
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
 * @param {Object}  args.frozenDays      - { 'YYYY-MM-DD': true }
 * @param {Object}  args.streakFreezes   - { count, lastRefill }
 * @param {string}  args.startDate       - challenge start (don't freeze before it)
 * @param {boolean} args.isPro
 * @param {string}  args.todayStr        - 'YYYY-MM-DD'
 * @param {Function} args.isDayDone      - (dateStr) => boolean
 * @returns {{streakFreezes:{count:number,lastRefill:string}, frozenDays:Object, frozeDates:string[], changed:boolean}}
 */
export function reconcileStreakFreezeState({ frozenDays, streakFreezes, startDate, isPro, todayStr, isDayDone }) {
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
    if (isDayDone(ds)) { bridgeable = true; break; }  // real streak anchor found
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
