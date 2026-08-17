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
