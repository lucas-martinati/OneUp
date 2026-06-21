import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const h = vi.hoisted(() => ({
  native: false,
  native_api: {
    configure: vi.fn(() => Promise.resolve()),
    getCustomerInfo: vi.fn(() => Promise.resolve({ customerInfo: {} })),
    getOfferings: vi.fn(() => Promise.resolve({ current: null })),
    purchasePackage: vi.fn(() => Promise.resolve({ customerInfo: {} })),
    restorePurchases: vi.fn(() => Promise.resolve({ customerInfo: {} })),
  },
  shared: {
    getCustomerInfo: vi.fn(() => Promise.resolve({})),
    getOfferings: vi.fn(() => Promise.resolve({ current: null })),
    purchase: vi.fn(() => Promise.resolve({ customerInfo: {} })),
  },
}));

vi.mock('@revenuecat/purchases-capacitor', () => ({ Purchases: h.native_api }));
vi.mock('@revenuecat/purchases-js', () => ({
  Purchases: { configure: vi.fn(), getSharedInstance: () => h.shared },
}));
vi.mock('@utils/platform', () => ({ isNativePlatform: () => h.native }));
vi.mock('@utils/logger', () => ({
  createLogger: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() }),
}));

/** Fresh module (resets the module-level `isInitialized`) in web mode. */
async function freshWeb({ withKey = true } = {}) {
  vi.resetModules();
  h.native = false;
  if (withKey) vi.stubEnv('VITE_REVENUECAT_WEB_API_KEY', 'web_key');
  else vi.stubEnv('VITE_REVENUECAT_WEB_API_KEY', '');
  return import('../purchaseService');
}
async function initializedWeb() {
  const svc = await freshWeb();
  await svc.initPurchases('uid');
  return svc;
}

const entitlements = (activeIds = []) => ({
  entitlements: { active: Object.fromEntries(activeIds.map(id => [id, { isActive: true }])) },
});

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});
afterEach(() => vi.unstubAllEnvs());

describe('initPurchases', () => {
  it('skips web init when no Web Billing key is configured', async () => {
    const svc = await freshWeb({ withKey: false });
    expect(await svc.initPurchases('u')).toBe(false);
  });

  it('initializes on web when a key is present', async () => {
    const svc = await freshWeb();
    expect(await svc.initPurchases('u')).toBe(true);
  });

  it('initializes on native via the Capacitor SDK', async () => {
    vi.resetModules();
    h.native = true;
    vi.stubEnv('VITE_REVENUECAT_API_KEY', 'native_key');
    const svc = await import('../purchaseService');
    expect(await svc.initPurchases('u')).toBe(true);
    expect(h.native_api.configure).toHaveBeenCalledWith(expect.objectContaining({ appUserID: 'u' }));
    h.native = false;
  });

  it('returns false and logs when configure throws', async () => {
    const svc = await freshWeb();
    h.shared.getCustomerInfo.mockResolvedValue({});
    const Purchases = (await import('@revenuecat/purchases-js')).Purchases;
    Purchases.configure.mockImplementationOnce(() => { throw new Error('bad'); });
    expect(await svc.initPurchases('u')).toBe(false);
  });
});

describe('check status', () => {
  it('falls back to localStorage when not initialized', async () => {
    const svc = await freshWeb();
    localStorage.setItem('oneup_pro', 'true');
    expect(await svc.checkProStatus()).toEqual({ active: true, verified: false });
  });

  it('verifies against RevenueCat once initialized', async () => {
    const svc = await initializedWeb();
    h.shared.getCustomerInfo.mockResolvedValue(entitlements(['pro']));
    const res = await svc.checkProStatus();
    expect(res).toEqual({ active: true, verified: true });
    expect(localStorage.getItem('oneup_pro')).toBe('true');
  });

  it('is case-insensitive on entitlement ids and writes false when inactive', async () => {
    const svc = await initializedWeb();
    h.shared.getCustomerInfo.mockResolvedValue(entitlements(['SUPPORTER']));
    expect((await svc.checkSupporterStatus()).active).toBe(true);
    h.shared.getCustomerInfo.mockResolvedValue(entitlements([]));
    expect((await svc.checkProStatus()).active).toBe(false);
    expect(localStorage.getItem('oneup_pro')).toBe('false');
  });

  it('falls back to localStorage when the customer info call throws', async () => {
    const svc = await initializedWeb();
    localStorage.setItem('oneup_pro', 'true');
    h.shared.getCustomerInfo.mockRejectedValue(new Error('offline'));
    expect(await svc.checkProStatus()).toEqual({ active: true, verified: false });
  });
});

describe('purchase', () => {
  it('refuses to purchase before initialization', async () => {
    const svc = await freshWeb();
    expect(await svc.purchasePro()).toEqual({ success: false, isActive: false });
  });

  it('returns failure when no matching package is offered', async () => {
    const svc = await initializedWeb();
    h.shared.getOfferings.mockResolvedValue({ current: { availablePackages: [] } });
    expect(await svc.purchasePro()).toEqual({ success: false, isActive: false });
  });

  it('completes a web purchase and reports the active entitlement', async () => {
    const svc = await initializedWeb();
    h.shared.getOfferings.mockResolvedValue({
      current: { availablePackages: [{ identifier: '$rc_monthly', webBillingProduct: { identifier: 'oneup_pro_monthly', priceString: '1.99€', title: 'Pro' } }] },
    });
    h.shared.purchase.mockResolvedValue({ customerInfo: entitlements(['pro']) });
    const res = await svc.purchasePro();
    expect(res.success).toBe(true);
    expect(res.isActive).toBe(true);
    expect(res.product).toMatchObject({ type: 'pro', price: '1.99€' });
  });

  it('treats a user cancellation as a non-error failure', async () => {
    const svc = await initializedWeb();
    h.shared.getOfferings.mockResolvedValue({
      current: { availablePackages: [{ identifier: '$rc_lifetime', webBillingProduct: { identifier: 'supporter' } }] },
    });
    h.shared.purchase.mockRejectedValue({ errorCode: 'UserCancelledError' });
    const res = await svc.purchaseSupporter();
    expect(res).toEqual({ success: false, isActive: false, isSupporter: false });
  });
});

describe('restorePurchases', () => {
  it('returns a not-initialized shape before init', async () => {
    const svc = await freshWeb();
    expect(await svc.restorePurchases()).toEqual({ success: false, supporter: false, pro: false });
  });

  it('re-checks entitlements on web and persists them', async () => {
    const svc = await initializedWeb();
    h.shared.getCustomerInfo.mockResolvedValue(entitlements(['pro', 'supporter']));
    const res = await svc.restorePurchases();
    expect(res).toMatchObject({ success: true, pro: true, supporter: true });
    expect(localStorage.getItem('oneup_pro')).toBe('true');
  });

  it('returns a failure shape when the call throws', async () => {
    const svc = await initializedWeb();
    h.shared.getCustomerInfo.mockRejectedValue(new Error('x'));
    expect(await svc.restorePurchases()).toEqual({ success: false, supporter: false, pro: false });
  });
});

describe('getPurchaseHistory', () => {
  it('returns [] before initialization', async () => {
    const svc = await freshWeb();
    expect(await svc.getPurchaseHistory()).toEqual([]);
  });

  it('parses subscriptions, non-sub transactions and entitlement fallbacks, newest first', async () => {
    const svc = await initializedWeb();
    h.shared.getCustomerInfo.mockResolvedValue({
      subscriptionsByProductIdentifier: {
        oneup_pro_monthly: {
          isActive: true, willRenew: true,
          purchaseDate: new Date('2024-03-01'), originalPurchaseDate: new Date('2024-01-01'),
          expiresDate: new Date('2024-04-01'), periodType: 'NORMAL',
        },
        pro_lifetime: {
          isActive: true, willRenew: false,
          purchaseDate: '2023-01-01T00:00:00Z', expiresDate: '2226-01-01T00:00:00Z',
        },
      },
      nonSubscriptionTransactions: [
        { productIdentifier: 'supporter', transactionIdentifier: 'tx1', purchaseDate: '2022-06-01T00:00:00Z' },
      ],
      entitlements: {
        all: {
          pro: { productIdentifier: 'oneup_pro_promo', periodType: 'PROMOTIONAL', isActive: false, expirationDate: '2024-02-01T00:00:00Z', latestPurchaseDate: '2024-02-01T00:00:00Z' },
        },
      },
    });
    const history = await svc.getPurchaseHistory();
    expect(history.length).toBe(4);
    // newest first
    const dates = history.map(h => new Date(h.date).getTime());
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
    // lifetime expiration hidden
    const lifetime = history.find(h => h.id === 'pro_lifetime');
    expect(lifetime.expirationDate).toBeNull();
    // promo entitlement fallback picked up
    expect(history.some(h => h.descKey === 'pro.promotionalDesc')).toBe(true);
    // supporter mapped
    expect(history.find(h => h.id === 'tx1').titleKey).toBe('supporter.historyTitle');
  });

  it('returns [] when parsing throws', async () => {
    const svc = await initializedWeb();
    h.shared.getCustomerInfo.mockRejectedValue(new Error('boom'));
    expect(await svc.getPurchaseHistory()).toEqual([]);
  });
});
