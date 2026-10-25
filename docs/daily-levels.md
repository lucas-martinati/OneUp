# Exercise levels

The domain rules live in `firebase/functions/shared/exerciseLevels.js`, consumed
by both the React client and Cloud Functions. No migration requires a server
bulk write or a reset of the challenge.

## Goals, volume and validation

- Daily bodyweight, weight, custom and timer exercises use ten levels.
- The full goal keeps the existing day-number × exercise-multiplier formula.
- Level N requires `ceil(fullGoal × N / 10)`. Small goals can have coincident
  thresholds: award the highest reached level (one rep at goal one is level 10).
- Reaching level one validates the exercise. Counting and timers continue up to
  the full goal; sessions auto-advance only on full completion.
- Exact recorded counts contribute volume even below level one.
- Perfect days require full completion, not merely reaching level one.
- Running and cycling use ten levels against the full weekly distance goal,
  with whole metres as the stored `count` and `goal`. The goal is based on the
  challenge week number at the start of the selected calendar week (Monday or
  Sunday), and is then snapshotted. Manual difficulty no longer sets new goals.
- One snapshot per sport/week records credited distance, capped at the full goal.
  Partial distance contributes equivalent reps through the shared conversion.
  Adding/removing activities updates both sports, including clearing an empty
  tracked week, only after a successful authoritative activity load.
- Cardio streaks measure consecutive weeks. Its attained level protects global
  days from the recorded validation date through the end of that calendar week,
  preserving the existing weekly cardio protection. Calendar and global streak
  use this same rule; days before the recorded date do not receive credit.

New daily entries retain `count`, `goal`, `level`, `isCompleted`, the sync
`timestamp`, completion `localHour`, and optional weight/historical difficulty.
`goal` is a snapshot, preventing future configuration changes from rewriting
past effort. `isCompleted` remains available to existing calendar, freeze and
achievement consumers and means level >= 1 for the new daily entries.

## Nested streaks

Each exercise and the global streak have ten independent current streaks and
records. The global level for a day is the maximum reached across exercises;
the exercise may differ on consecutive days. The main label shows the level-one
streak's length and the highest level maintained for that entire run.

For example: 200 days at level ten, then one day at level five, yields
201 days at level five. The level-ten record stays at 200; the next level-ten
day starts a new one-day level-ten streak. Improving today's count recalculates
all levels, so finishing level ten later that day can still preserve the run.

Today remains pending until any threshold is reached: partial reps below level
one do not prematurely remove yesterday's visible streak. A missed completed
calendar day breaks the streak. Global freeze days are transparent (preserve
all levels without adding days); they do not protect individual exercises.
Records are calculated over all available history, including previous years.
Future dates are excluded from streaks.

## Migration and synchronization

`progressVersion: 5` records the account's migration in both local storage and
cloud progress. `validateProgressData` upgrades data on local load, cloud load,
sync, import and realtime updates. New entry metadata survives sanitization.

For legacy entries:

1. A completed boolean becomes level ten, irrespective of its former difficulty.
2. Preserve an existing positive count; otherwise reconstruct the count using
   the exercise definition, challenge start date and saved historical difficulty
   (default 1). Boolean-only records cannot reveal the actual number performed:
   reconstructed counts are estimates of the historical goal.
3. Save the resulting full goal and level, retaining timestamps and weight.
4. Old completed cardio weeks also become level ten. Their historical distance
   is reconstructed from the saved difficulty, and `legacyCardio` protects these
   validations when the original activity history is unavailable. An explicit
   failed historical week is not upgraded from imported activities.
5. For unfinished daily entries with positive recorded counts, calculate the
   level against the full goal for that historical challenge day and exercise
   (including timers and custom exercises), independently of the old difficulty.
   Preserve any existing goal snapshot. Validate the entry when at least level
   one was reached, allowing the effort to count toward historical streaks.
   Counts below level one remain unvalidated with their volume intact. Empty
   days receive no invented effort. This also upgrades partial entries left by
   migration versions 1 and 2, without changing existing explicit levels.

6. Entries with historical effort but no timestamp receive noon UTC on their
   original calendar date, marked `timestampEstimated: true`. Estimated times do
   not unlock time-of-day achievements. Existing timestamps remain unchanged.

Migration is idempotent: already versioned entries never get their counts or
goals reconstructed again. The per-entry level also lets older entries arriving
later from another device be upgraded despite the account version marker.
Unknown/deleted custom definitions keep their readable legacy boolean until a
definition is available; no multiplier is invented. The synchronizer completes
custom migrations when their definitions finish loading.

Guest import keeps the best attained level and greatest recorded volume with
coherent goal metadata. Ordinary cloud sync retains timestamp-based conflict
resolution, including intentional resets; volume edits receive fresh timestamps.
Object-key order from Firebase does not cause a spurious progress conflict.

## Release validation

Run `npm test`, `npm run lint`, `npm run build` and
`npx playwright test e2e/levels.spec.js`.

Release the updated Cloud Functions with the client: old functions infer full
goal volume from `isCompleted` and would overcount new partially validated days.
The database schema recognizes `progressVersion` and the small ranking streak
summary (`currentStreak`, `streakLevel`) so audit/prune jobs retain them. No production data or deployments are changed by the source update.

## Presentation

`LevelRing` uses ten separated, rounded SVG arcs and partial arc fill toward the
next threshold. Changes tween from the currently displayed value, including rapid
rep additions. The exercise panel celebrates increases with a short wave and
spark burst, never on reopening or resetting; reduced-motion preferences disable
these effects. It displays the reps or time to the next reachable level, accounting
for coincident rounded thresholds, and a maximum-level message at level ten.
`LevelProgress` divides the original bottom edge of each exercise tile into ten;
there is no extra bar underneath the counter, and the central home button keeps its original styling. Calendar cells show the best daily
level through a numbered rank emblem with ten illuminated segments, shared with
the home header and exercise streak badges. Profiles and ranking display the sustained streak level, and adjacent
levels with identical current/record values share one compact streak card.
Record badges use the highest level maintained for the entire record length;
missing record metadata is not replaced with an assumed level. Legacy workout
sessions without level metadata use level ten, while explicit zero levels remain
zero. Newly saved sessions retain the exact level and goal per exercise.

## Level achievements and public profiles

Five additional achievements reward reaching level ten, accumulating 100/500/1000
levels, and maintaining the global level-five streak for seven training days.
The shared achievement snapshot sums attained levels for each standard exercise
and date (not raw reps or seconds). Cardio uses the best snapshot per sport and
calendar week, counted once; carried-over protected days do not multiply points.
Zero levels and future dates earn nothing. Previous volume achievements and manual
overrides keep their rules, so the addition does not remove existing rewards.
Both badge progress and unlocks consume the same snapshot on client and server.

The leaderboard detail has an explicit level-journey section. The current user's
own detail can use local computed levels; other profiles use server-published
derived levels, with an explanatory fallback when absent. Deploying the updated
functions and syncing migrated progress is necessary to publish those levels.
The share preview and exported image both use the common SVG level emblem.
Shares, level history and widget accessibility labels use the same Lvl terminology. Android widgets display the streak level as a separate medal in both sizes; the large widget replaces daily dots with the earned daily level (0 for unvalidated/future days), preserving frozen-day snowflakes and highlighting today. Weekly cardio levels and the configured week start follow the shared level calculation. Run `node scripts/android/preview-widgets.mjs` to regenerate the illustrative preview and widget picker images. Level history uses steps and integer values, marks only value changes, and omits level zero and unvalidated days. Its badges show the last attained level, or nothing when no level has been attained.

## Partial sessions and profile details

Finishing a partial session requires confirmation and snapshots attained levels
without modifying daily progress. Zero-rep exercises remain at level zero.
The profile distinguishes today's attained level from the sustained streak and
its record, and separates bodyweight reps from weights reps (excluding cardio
equivalents from this combined volume). Membership badges open explanations;
stacked level emblems expand the per-level streak details.

Migration v5 recalculates the current day against its full target, preserving recorded reps and timestamps, and repairs reduced goal snapshots from earlier migrations. Past days retain their historical levels and goals.
