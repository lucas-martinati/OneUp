import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, cleanup, act } from '@testing-library/react';

/**
 * Pro subscription lifecycle, end-to-end through <SubscriptionProvider>:
 *   - buying Pro grants isPro + hadPro
 *   - an expired subscription (RevenueCat says inactive) revokes isPro but
 *     keeps hadPro, so the "was ever Pro" perks survive
 *   - the local cache can never be used to fake Pro (anti-cheat)
 *
 * RevenueCat (when verified) is the absolute source of truth; Firebase is the
 * offline fallback; localStorage is NEVER trusted for resolution.
 */

// ── Hoisted mocks (vi.mock factories run before imports) ─────────────────
const mocks = vi.hoisted(() => ({
  initPurchases: vi.fn(),
  checkSupporterStatus: vi.fn(),
  checkProStatus: vi.fn(),
  purchasePro: vi.fn(),
  purchaseProYearly: vi.fn(),
  purchaseSupporter: vi.fn(),
  restorePurchases: vi.fn(),
  loadPurchase: vi.fn(),
  getCurrentUserId: vi.fn(),
}));

const authHolder = vi.hoisted(() => ({
  value: { isSignedIn: true, authConfirmed: true, user: { uid: 'u1' } },
}));

vi.mock('@contexts/AuthContext', () => ({ useAuth: () => authHolder.value }));

vi.mock('@services/purchaseService', () => ({
  initPurchases: mocks.initPurchases,
  checkSupporterStatus: mocks.checkSupporterStatus,
  checkProStatus: mocks.checkProStatus,
  purchasePro: mocks.purchasePro,
  purchaseProYearly: mocks.purchaseProYearly,
  purchaseSupporter: mocks.purchaseSupporter,
  restorePurchases: mocks.restorePurchases,
}));

vi.mock('@services/cloudSync', () => ({
  cloudSync: { loadPurchase: mocks.loadPurchase, getCurrentUserId: mocks.getCurrentUserId },
}));

// entitlements.js (localStorage) is intentionally NOT mocked — the anti-cheat
// test relies on the real cache.
import { SubscriptionProvider, useSubscription } from '@contexts/SubscriptionContext';

// ── Test harness ─────────────────────────────────────────────────────────
// `result.current` always reflects the latest context value across rerenders.
let result = null;

/** Mount the provider and wait for the initial entitlement check to settle. */
async function mountAndSettle() {
  ({ result } = renderHook(() => useSubscription(), { wrapper: SubscriptionProvider }));
  await waitFor(() => expect(result.current.isSubscriptionLoading).toBe(false));
}

/** Latest context value. */
const ctx = () => result.current;

const LS_PRO = 'oneup_pro';
const LS_HAD_PRO = 'oneup_had_pro';

beforeEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
  result = null;

  authHolder.value = { isSignedIn: true, authConfirmed: true, user: { uid: 'u1' } };

  // Defaults: free signed-in user, RevenueCat reachable & says nothing active.
  mocks.initPurchases.mockResolvedValue(true);
  mocks.getCurrentUserId.mockReturnValue('u1');
  mocks.checkSupporterStatus.mockResolvedValue({ active: false, verified: true });
  mocks.checkProStatus.mockResolvedValue({ active: false, verified: true });
  mocks.loadPurchase.mockResolvedValue(null);
  mocks.purchasePro.mockResolvedValue({ success: true, isActive: true });
  mocks.purchaseProYearly.mockResolvedValue({ success: true, isActive: true });
  mocks.purchaseSupporter.mockResolvedValue({ success: true, isActive: true, isSupporter: true });
  mocks.restorePurchases.mockResolvedValue({ success: true, supporter: false, pro: false });
});

// ── Buying Pro ───────────────────────────────────────────────────────────
describe('Buying Pro', () => {
  it('starts as a free user with no entitlements', async () => {
    await mountAndSettle();
    expect(ctx().isPro).toBe(false);
    expect(ctx().hadPro).toBe(false);
    expect(ctx().isSupporter).toBe(false);
  });

  it('grants Pro and hadPro after a successful purchase', async () => {
    await mountAndSettle();
    expect(ctx().isPro).toBe(false);

    await act(async () => {
      await ctx().purchasePro();
    });

    expect(ctx().isPro).toBe(true);
    expect(ctx().hadPro).toBe(true);
    // Persisted to the local cache for fast subsequent boots.
    expect(localStorage.getItem(LS_PRO)).toBe('true');
    expect(localStorage.getItem(LS_HAD_PRO)).toBe('true');
  });

  it('does not grant Pro if the purchase is cancelled', async () => {
    mocks.purchasePro.mockResolvedValue({ success: false, isActive: false });
    await mountAndSettle();

    await act(async () => {
      await ctx().purchasePro();
    });

    expect(ctx().isPro).toBe(false);
    expect(ctx().hadPro).toBe(false);
  });

  it('grants Pro via the yearly plan too', async () => {
    await mountAndSettle();
    await act(async () => {
      await ctx().purchaseProYearly();
    });
    expect(ctx().isPro).toBe(true);
    expect(ctx().hadPro).toBe(true);
  });
});

// ── Active Pro ─────────────────────────────────────────────────────────--
describe('Active Pro', () => {
  it('keeps Pro when RevenueCat (verified) reports it active', async () => {
    mocks.checkProStatus.mockResolvedValue({ active: true, verified: true });
    await mountAndSettle();
    expect(ctx().isPro).toBe(true);
    expect(ctx().hadPro).toBe(true);
  });

  it('keeps Pro from Firebase when RevenueCat is unreachable (offline)', async () => {
    // RC unverified (network error) must NOT downgrade a genuine Pro. Offline,
    // both entitlement checks fail together (same underlying customer-info call).
    mocks.checkSupporterStatus.mockResolvedValue({ active: false, verified: false });
    mocks.checkProStatus.mockResolvedValue({ active: false, verified: false });
    mocks.loadPurchase.mockResolvedValue({ isPro: true, hadPro: true });
    await mountAndSettle();
    expect(ctx().isPro).toBe(true);
    expect(ctx().hadPro).toBe(true);
  });
});

// ── Losing Pro automatically (expiry) ────────────────────────────────────
describe('Losing Pro when the subscription expires', () => {
  it('revokes isPro but keeps hadPro once RevenueCat reports it inactive', async () => {
    // The webhook has flipped Firebase to isPro:false but left hadPro:true.
    mocks.checkProStatus.mockResolvedValue({ active: false, verified: true });
    mocks.loadPurchase.mockResolvedValue({ isPro: false, hadPro: true });

    await mountAndSettle();

    expect(ctx().isPro).toBe(false); // perd bien le Pro
    expect(ctx().hadPro).toBe(true); // garde "hasPro" (déjà été Pro)
    expect(localStorage.getItem(LS_PRO)).toBe('false');
    expect(localStorage.getItem(LS_HAD_PRO)).toBe('true');
  });

  it('revokes Pro live within a session when re-checked after expiry', async () => {
    // 1. User buys Pro and uses it for a while.
    await mountAndSettle();
    await act(async () => {
      await ctx().purchasePro();
    });
    expect(ctx().isPro).toBe(true);

    // 2. Subscription lapses: a restore/re-check now reports inactive, but
    //    Firebase still records that they were Pro.
    mocks.restorePurchases.mockResolvedValue({ success: true, supporter: false, pro: false });
    mocks.loadPurchase.mockResolvedValue({ isPro: false, hadPro: true });

    await act(async () => {
      await ctx().restorePurchases();
    });

    expect(ctx().isPro).toBe(false);
    expect(ctx().hadPro).toBe(true);
  });
});

// ── Anti-cheat ───────────────────────────────────────────────────────────
describe('Anti-cheat — the local cache cannot fake Pro', () => {
  it('ignores a forged localStorage Pro flag when RevenueCat says inactive', async () => {
    // Attacker flips the cache before launch.
    localStorage.setItem(LS_PRO, 'true');
    localStorage.setItem(LS_HAD_PRO, 'true');

    mocks.checkProStatus.mockResolvedValue({ active: false, verified: true });
    mocks.loadPurchase.mockResolvedValue(null);

    await mountAndSettle();

    expect(ctx().isPro).toBe(false);
    expect(ctx().hadPro).toBe(false);
    // The forged cache is corrected, not trusted.
    expect(localStorage.getItem(LS_PRO)).toBe('false');
    expect(localStorage.getItem(LS_HAD_PRO)).toBe('false');
  });

  it('still unlocks Pro for a legitimate user even if the cache was wiped', async () => {
    // No cache at all, but RevenueCat verifies an active subscription.
    mocks.checkProStatus.mockResolvedValue({ active: true, verified: true });
    await mountAndSettle();
    expect(ctx().isPro).toBe(true);
  });
});

// ── Sign-out gating ──────────────────────────────────────────────────────
describe('Sign-out gating', () => {
  it('never exposes Pro to a signed-out user', async () => {
    authHolder.value = { isSignedIn: false, authConfirmed: true, user: null };
    await mountAndSettle();
    expect(ctx().isPro).toBe(false);
    expect(ctx().hadPro).toBe(false);
  });
});
