// ══════════════════════════════════════════════════════════════════════════════
// OneUp — Realtime Database canonical structure (reference + pruning source)
//
// RTDB is schemaless: this file does NOT enforce anything at write time. It is
// the single source of truth describing the EXPECTED shape of the database, used
// as living documentation AND to drive the generic field-pruning utility
// (pruneStaleData in functions/index.js).
//
// Schema grammar (recursive):
//   LEAF            → a free-form value/subtree: STOP here, never prune below it.
//                     Use for app-managed/dynamic content (settings, arrays,
//                     per-day completions, gpsTrack…).
//   { $: <schema> } → a WILDCARD map: every dynamic child key (uid, date, id…)
//                     is valid and validated against <schema>.
//   { key: <schema> }→ a FIXED object: ONLY the listed keys are valid; any other
//                     key found in the DB is "stale" and pruned. Each known key
//                     descends into its <schema>.
//
// SAFETY: the pruner only deletes keys at FIXED-object levels. Anything marked
// LEAF (or under a wildcard whose value is LEAF) is never descended into, so
// free-form data can't be touched. Add a key here BEFORE the app starts writing
// it, otherwise the pruner would flag it as stale.
// ══════════════════════════════════════════════════════════════════════════════

export const LEAF = Symbol('leaf');

export const DB_SCHEMA = {
  // Minimal ranking payload downloaded in full by every client.
  leaderboard: {
    $: {
      pseudo: LEAF,
      photoURL: LEAF,
      totalReps: LEAF,
      weightsTotalReps: LEAF,
      exerciseReps: LEAF,      // exId -> reps (needed for per-exercise ranking tabs)
      lastActiveDay: LEAF,
      isPublic: LEAF,
      isPerfectToday: LEAF,
      shieldGreen: LEAF,
      shieldOrange: LEAF,
      shieldDate: LEAF,
      isPro: LEAF,
      isSupporter: LEAF,
      lastUpdated: LEAF,
    },
  },

  // Detail-view-only payload, written with `.set()` by the Cloud Functions.
  publicProfiles: {
    $: {
      exerciseWeights: LEAF,       // exId -> weight
      exerciseDifficulties: LEAF,  // exId -> difficulty (< 1.0 only)
      achievements: LEAF,          // unlocked badge count
      derivedStats: LEAF,          // streaks / per-exercise days / lastActiveDay
      lastUpdated: LEAF,
    },
  },

  clanCodes: { $: LEAF },          // code -> clanId

  clans: {
    $: {
      code: LEAF,
      name: LEAF,
      createdAt: LEAF,
      createdBy: LEAF,
      members: LEAF,               // uid -> role
    },
  },

  notifications: { $: LEAF },      // recipientUid -> { senderUid -> aggregated poke }

  users: {
    $: {
      profile: {
        displayName: LEAF,
        email: LEAF,
        lastSeen: LEAF,
        photoURL: LEAF,
      },
      purchase: {
        isPro: LEAF,
        isSupporter: LEAF,
        hadPro: LEAF,
      },
      settings: LEAF,              // app-managed settings object
      achievements: LEAF,          // achievementName -> bool
      clans: LEAF,                 // clanId -> role
      custom: LEAF,                // { exercises[], categories[] }
      exerciseWeights: LEAF,       // exId -> weight
      weightHistory: LEAF,         // exId -> { date -> weight }
      routines: LEAF,              // array
      programCompletions: LEAF,    // programId -> { ... }
      cardioSessions: LEAF,        // sessionId -> { …, gpsTrack[] }
      progress: {
        completions: LEAF,         // date -> { exId -> { count, isCompleted, … } }
        sessionHistory: LEAF,      // array
        startDate: LEAF,
        userStartDate: LEAF,
        isSetup: LEAF,
        hasShared: LEAF,
        lastSyncedAt: LEAF,
        lastCompletionChange: LEAF,
        // NB: legacy `cardio` is intentionally absent → pruned as stale.
      },
    },
  },
};
