/** Idempotent administrative projection rebuild. No private-history writes. */
export async function rebuildMissingPublicLevels({ profiles, apply = false, readProgress, recompute }) {
  const missing = Object.entries(profiles).filter(([, profile]) => !Array.isArray(profile.derivedStats?.levelStreaks));
  if (!apply) return { pending: missing.length, dryRun: true };
  let updated = 0;
  let skipped = 0;
  // Bound each invocation; subsequent calls resume with remaining profiles.
  for (const [uid] of missing.slice(0, 100)) {
    const progress = await readProgress(uid);
    if (!progress?.startDate) { skipped++; continue; }
    await recompute(uid, progress);
    updated++;
  }
  return { updated, skipped, remaining: Math.max(0, missing.length - updated - skipped) };
}
