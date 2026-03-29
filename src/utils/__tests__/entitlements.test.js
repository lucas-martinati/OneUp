import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadCachedEntitlements,
  saveCachedEntitlements,
  clearCachedEntitlements,
  canAccessFeature,
  resolveEntitlements,
  getTierBadgeConfigs,
  FEATURES,
} from '../entitlements';

// ── Mock localStorage ───────────────────────────────────────────────────

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; },
  };
})();

beforeEach(() => {
  localStorageMock.clear();
  vi.stubGlobal('localStorage', localStorageMock);
});

// ── loadCachedEntitlements ──────────────────────────────────────────────

describe('loadCachedEntitlements', () => {
  it('returns false when nothing cached', () => {
    expect(loadCachedEntitlements()).toEqual({ isSupporter: false, isPro: false });
  });

  it('reads true flags from localStorage', () => {
    localStorage.setItem('oneup_supporter', 'true');
    localStorage.setItem('oneup_pro', 'true');
    expect(loadCachedEntitlements()).toEqual({ isSupporter: true, isPro: true });
  });

  it('returns false for non-"true" values', () => {
    localStorage.setItem('oneup_supporter', 'false');
    localStorage.setItem('oneup_pro', '1');
    expect(loadCachedEntitlements()).toEqual({ isSupporter: false, isPro: false });
  });
});

// ── saveCachedEntitlements ──────────────────────────────────────────────

describe('saveCachedEntitlements', () => {
  it('persists flags to localStorage', () => {
    saveCachedEntitlements({ isSupporter: true, isPro: false });
    expect(localStorage.getItem('oneup_supporter')).toBe('true');
    expect(localStorage.getItem('oneup_pro')).toBe('false');
  });

  it('writes "false" string, not empty', () => {
    saveCachedEntitlements({ isSupporter: false, isPro: false });
    expect(localStorage.getItem('oneup_supporter')).toBe('false');
  });
});

// ── clearCachedEntitlements ─────────────────────────────────────────────

describe('clearCachedEntitlements', () => {
  it('removes both keys', () => {
    localStorage.setItem('oneup_supporter', 'true');
    localStorage.setItem('oneup_pro', 'true');
    clearCachedEntitlements();
    expect(localStorage.getItem('oneup_supporter')).toBeNull();
    expect(localStorage.getItem('oneup_pro')).toBeNull();
  });
});

// ── canAccessFeature ────────────────────────────────────────────────────

describe('canAccessFeature', () => {
  it('grants Pro feature when isPro=true', () => {
    expect(canAccessFeature(FEATURES.WEIGHTS, { isPro: true })).toBe(true);
    expect(canAccessFeature(FEATURES.CUSTOM_EXERCISES, { isPro: true })).toBe(true);
  });

  it('denies Pro feature when isPro=false', () => {
    expect(canAccessFeature(FEATURES.WEIGHTS, { isPro: false })).toBe(false);
    expect(canAccessFeature(FEATURES.CUSTOM_PROGRAMS, { isPro: false })).toBe(false);
  });

  it('denies Pro feature when entitlements omitted', () => {
    expect(canAccessFeature(FEATURES.WEIGHTS)).toBe(false);
  });

  it('throws on unknown feature (typo protection)', () => {
    expect(() => canAccessFeature('wieghts')).toThrow('Unknown feature: "wieghts"');
    expect(() => canAccessFeature('foo')).toThrow('Unknown feature: "foo"');
  });

  it('validates all FEATURES constants are registered', () => {
    for (const feat of Object.values(FEATURES)) {
      // should not throw
      canAccessFeature(feat, { isPro: false });
    }
  });
});

// ── resolveEntitlements ─────────────────────────────────────────────────

describe('resolveEntitlements', () => {
  it('prefers primary source over fallback', () => {
    const result = resolveEntitlements(
      { isSupporter: true, isPro: false },
      { isSupporter: false, isPro: true },
    );
    expect(result.isSupporter).toBe(true);
    expect(result.isPro).toBe(true);
  });

  it('falls back when primary is all false', () => {
    const result = resolveEntitlements(
      { isSupporter: false, isPro: false },
      { isSupporter: true, isPro: false },
    );
    expect(result.isSupporter).toBe(true);
    expect(result.isPro).toBe(false);
  });

  it('returns all false when both sources are false', () => {
    const result = resolveEntitlements(
      { isSupporter: false, isPro: false },
      { isSupporter: false, isPro: false },
    );
    expect(result).toEqual({ isSupporter: false, isPro: false, hasAnyEntitlement: false });
  });

  it('hasAnyEntitlement is true when either tier is active', () => {
    expect(resolveEntitlements({ isSupporter: true, isPro: false }, { isSupporter: false, isPro: false }).hasAnyEntitlement).toBe(true);
    expect(resolveEntitlements({ isSupporter: false, isPro: true }, { isSupporter: false, isPro: false }).hasAnyEntitlement).toBe(true);
  });

  it('OR logic: primary true + fallback true = true', () => {
    const result = resolveEntitlements(
      { isSupporter: true, isPro: false },
      { isSupporter: false, isPro: true },
    );
    expect(result.hasAnyEntitlement).toBe(true);
  });
});

// ── getTierBadgeConfigs ─────────────────────────────────────────────────

describe('getTierBadgeConfigs', () => {
  it('returns empty array for free user', () => {
    expect(getTierBadgeConfigs({ isSupporter: false, isPro: false })).toEqual([]);
  });

  it('returns supporter badge only', () => {
    const badges = getTierBadgeConfigs({ isSupporter: true, isPro: false });
    expect(badges).toHaveLength(1);
    expect(badges[0].key).toBe('supporter');
    expect(badges[0].color).toBe('#ef4444');
  });

  it('returns pro badge only', () => {
    const badges = getTierBadgeConfigs({ isSupporter: false, isPro: true });
    expect(badges).toHaveLength(1);
    expect(badges[0].key).toBe('pro');
  });

  it('returns both badges for supporter+pro', () => {
    const badges = getTierBadgeConfigs({ isSupporter: true, isPro: true });
    expect(badges).toHaveLength(2);
    expect(badges.map(b => b.key)).toEqual(['supporter', 'pro']);
  });
});

// ── FEATURES constant ───────────────────────────────────────────────────

describe('FEATURES', () => {
  it('is frozen (immutable)', () => {
    expect(() => { FEATURES.WEIGHTS = 'hacked'; }).toThrow();
  });

  it('contains all expected features', () => {
    const keys = Object.keys(FEATURES);
    expect(keys).toContain('WEIGHTS');
    expect(keys).toContain('CUSTOM_EXERCISES');
    expect(keys).toContain('CUSTOM_PROGRAMS');
    expect(keys).toContain('INTER_DASHBOARD');
    expect(keys).toContain('MERGED_STATS');
  });
});
