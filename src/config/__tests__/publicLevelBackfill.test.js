import { describe, it, expect, vi } from 'vitest';
import { rebuildMissingPublicLevels } from '../../../firebase/functions/publicLevelBackfill.js';

describe('public level release backfill', () => {
  it('previews missing public projections without reading or writing private progress', async () => {
    const readProgress = vi.fn();
    const recompute = vi.fn();
    const profiles = { old: {}, current: { derivedStats: { levelStreaks: [{ level: 1, current: 0 }] } } };
    expect(await rebuildMissingPublicLevels({ profiles, readProgress, recompute })).toEqual({ pending: 1, dryRun: true });
    expect(readProgress).not.toHaveBeenCalled();
    expect(recompute).not.toHaveBeenCalled();
  });

  it('rebuilds existing histories once and skips profiles with no challenge', async () => {
    const progress = Object.freeze({ startDate: '2026-01-01', completions: Object.freeze({}) });
    const profiles = { old: {}, empty: {}, current: { derivedStats: { levelStreaks: [{}] } } };
    const readProgress = vi.fn(uid => uid === 'old' ? progress : null);
    const recompute = vi.fn(async uid => { profiles[uid] = { derivedStats: { levelStreaks: [{}] } }; });
    const args = { profiles, readProgress, recompute, apply: true };
    expect(await rebuildMissingPublicLevels(args)).toEqual({ updated: 1, skipped: 1, remaining: 0 });
    expect(recompute).toHaveBeenCalledWith('old', progress);
    expect(await rebuildMissingPublicLevels(args)).toEqual({ updated: 0, skipped: 1, remaining: 0 });
    expect(recompute).toHaveBeenCalledTimes(1);
    expect(readProgress).not.toHaveBeenCalledWith('current');
  });
});
