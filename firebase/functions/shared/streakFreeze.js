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

/**
 * Walk consecutive days backward from an anchor, counting a current streak that
 * frozen days keep alive without incrementing. Stops at the first genuinely
 * missed (not done, not frozen) day.
 *
 * The date arithmetic is delegated to the caller so this stays agnostic of the
 * local-vs-UTC date conventions used on each side.
 *
 * @param {(offset:number)=>string} dateAt   - returns the YYYY-MM-DD string `offset` days before the anchor (offset 0 = the anchor itself)
 * @param {(dateStr:string)=>boolean} isDone - whether a day counts as completed
 * @param {(dateStr:string)=>boolean} isFrozen - whether a day is protected by a freeze
 * @param {number} [windowDays=365]           - how many days back to scan
 * @returns {number}
 */
export function walkStreak(dateAt, isDone, isFrozen, windowDays = 365) {
  let streak = 0;
  for (let i = 0; i < windowDays; i++) {
    const dateStr = dateAt(i);
    if (isDone(dateStr)) {
      streak++;
    } else if (isFrozen(dateStr)) {
      continue; // protected — neither breaks nor counts toward the streak
    } else {
      break;
    }
  }
  return streak;
}

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
