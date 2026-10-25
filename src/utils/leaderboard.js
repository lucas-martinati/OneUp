import { ALL_STANDARD_IDS, ALL_WEIGHT_IDS, CARDIO_EXERCISES } from '@shared/exerciseRules.js';

/**
 * Shield flags for leaderboard entries.
 *
 * Server-computed (immune to client clock manipulation): the server decides
 * whether an entry earned a green/orange shield on a given day; the client
 * only checks that the shield's date is today.
 *
 * @param {Object} entry Leaderboard entry (e.g. from loadLeaderboard).
 * @param {string} todayStr Today's date in the server's format (YYYY-MM-DD).
 * @returns {{ shieldFresh: boolean, showVerifiedShield: boolean, showSuspiciousShield: boolean }}
 */
export function getShieldFlags(entry, todayStr) {
    const shieldFresh = entry.shieldDate === todayStr;
    return {
        shieldFresh,
        showVerifiedShield: !!entry.shieldGreen && shieldFresh,
        showSuspiciousShield: !!entry.shieldOrange && shieldFresh,
    };
}

/** Reconstruct category totals consistently for the leaderboard and public profile.
 * Bodyweight includes running/cycling rep equivalents; weights stays separate.
 * Aggregate-only legacy entries remain readable until their next server update.
 */
export function getLeaderboardTotals(entry = {}) {
    const exerciseReps = entry.exerciseReps || {};
    const hasBreakdown = Object.keys(exerciseReps).length > 0;
    const sum = ids => [...ids].reduce((total, id) => total + (exerciseReps[id] || 0), 0);
    const bodyweightReps = hasBreakdown ? sum([...ALL_STANDARD_IDS, ...CARDIO_EXERCISES.map(ex => ex.id)]) : entry.totalReps || 0;
    const weightsReps = hasBreakdown ? sum(ALL_WEIGHT_IDS) : entry.weightsTotalReps || 0;
    return { bodyweightReps, weightsReps, totalReps: bodyweightReps + weightsReps };
}

export function getLeaderboardReps(entry, category) {
    const totals = getLeaderboardTotals(entry);
    if (category === 'global_combined') return totals.totalReps;
    if (category === 'bodyweight') return totals.bodyweightReps;
    if (category === 'weights') return totals.weightsReps;
    return entry.exerciseReps?.[category] || 0;
}
