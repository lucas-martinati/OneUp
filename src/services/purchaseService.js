/**
 * Purchase Service — RevenueCat wrapper for OneUp subscriptions
 *
 * Tiers:
 *   supporter  — one-time ~2-5€ — ❤️ badge on leaderboard
 *   pro        — 1.99€/mo  — custom programs, dedicated panel
 *   proYearly  — 19.99€/yr — same as pro, billed annually (save ~17%)
 *
 * Entitlements (configured in RevenueCat dashboard):
 *   "supporter" — non-consumable
 *   "pro"       — auto-renewable subscription
 *
 * Uses the Capacitor SDK on native (Android/iOS) and the Web SDK
 * (@revenuecat/purchases-js) on web for Stripe-based Web Billing.
 */

import { createLogger } from '../utils/logger';
import { isNativePlatform } from '../utils/platform';

const logger = createLogger('Purchases');

// Product identifiers configured in RevenueCat dashboard
const PRODUCTS = {
  supporter: {
    productId: 'supporter',
    packageId: '$rc_lifetime',
    entitlementId: 'supporter',
    localStorageKey: 'oneup_supporter',
  },
  pro: {
    productId: 'oneup_pro_monthly',
    packageId: '$rc_monthly',
    entitlementId: 'pro',
    localStorageKey: 'oneup_pro',
  },
  proYearly: {
    productId: 'oneup_pro_yearly',
    packageId: '$rc_annual',
    entitlementId: 'pro',
    localStorageKey: 'oneup_pro',
  },
};

let isInitialized = false;
let nativePurchasesPromise = null;
let webPurchasesPromise = null;

function getPlatformMode() {
  return isNativePlatform() ? 'native' : 'web';
}

async function getPurchasesRuntime() {
  if (isNativePlatform()) {
    if (!nativePurchasesPromise) {
      nativePurchasesPromise = import('@revenuecat/purchases-capacitor');
    }

    const { Purchases } = await nativePurchasesPromise;
    return { Purchases, mode: 'native' };
  }

  if (!webPurchasesPromise) {
    webPurchasesPromise = import('@revenuecat/purchases-js')
      .then(({ Purchases }) => Purchases);
  }

  return { Purchases: await webPurchasesPromise, mode: 'web' };
}

// ── Initialization ─────────────────────────────────────────────────────

/**
 * Initialize RevenueCat SDK (native or web).
 * Call once at app startup after auth.
 */
export async function initPurchases(userId) {
  try {
    const mode = getPlatformMode();

    if (mode === 'web' && !import.meta.env.VITE_REVENUECAT_WEB_API_KEY) {
      logger.warn('No Web Billing API key configured, skipping web init');
      return false;
    }

    const { Purchases } = await getPurchasesRuntime();

    if (mode === 'native') {
      // Native (Android / iOS) — Capacitor SDK
      await Purchases.configure({
        apiKey: import.meta.env.VITE_REVENUECAT_API_KEY,
        appUserID: userId || null,
      });
    } else {
      // Web — purchases-js SDK (Stripe / Web Billing)
      const webKey = import.meta.env.VITE_REVENUECAT_WEB_API_KEY;
      Purchases.configure(webKey, userId || 'anonymous');
    }

    isInitialized = true;
    logger.success(`RevenueCat initialized (${mode})`);
    return true;
  } catch (error) {
    logger.error('RevenueCat init failed:', error);
    return false;
  }
}

// ── Generic helpers ────────────────────────────────────────────────────

function hasActiveEntitlement(customerInfo, entitlementId) {
  if (!customerInfo?.entitlements?.active) return false;
  const targetId = entitlementId.toLowerCase();
  return Object.keys(customerInfo.entitlements.active).some(k => k.toLowerCase() === targetId);
}

async function _getCustomerInfo() {
  const { Purchases, mode } = await getPurchasesRuntime();

  if (mode === 'native') {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return customerInfo;
  }

  return await Purchases.getSharedInstance().getCustomerInfo();
}

async function _checkEntitlement(tier) {
  const cfg = PRODUCTS[tier];
  if (!cfg) return { active: false, verified: false };

  if (!isInitialized) {
    return { active: localStorage.getItem(cfg.localStorageKey) === 'true', verified: false };
  }

  try {
    const customerInfo = await _getCustomerInfo();
    const active = hasActiveEntitlement(customerInfo, cfg.entitlementId);
    localStorage.setItem(cfg.localStorageKey, active ? 'true' : 'false');
    return { active, verified: true };
  } catch (error) {
    logger.error(`Error checking ${tier} status:`, error);
    return { active: localStorage.getItem(cfg.localStorageKey) === 'true', verified: false };
  }
}

async function _getOffering(tier) {
  const cfg = PRODUCTS[tier];
  if (!isInitialized) return null;

  try {
    const { Purchases, mode } = await getPurchasesRuntime();
    let offerings;
    if (mode === 'native') {
      offerings = await Purchases.getOfferings();
    } else {
      offerings = await Purchases.getSharedInstance().getOfferings();
    }

    const current = offerings?.current;
    if (!current) {
      logger.error('No current offering set in RevenueCat dashboard');
      return null;
    }

    const pkg = current.availablePackages?.find((p) => {
      if (cfg.packageId && p.identifier === cfg.packageId) return true;
      const identifier = p.product?.identifier || p.webBillingProduct?.identifier;
      if (!identifier) return false;
      return identifier === cfg.productId || identifier.startsWith(`${cfg.productId}:`);
    });

    if (!pkg) {
      logger.error(`No package found for tier ${tier}. Available packages:`, 
        current.availablePackages?.map(p => ({
          pkgId: p.identifier,
          productId: p.product?.identifier || p.webBillingProduct?.identifier
        }))
      );
      return null;
    }

    if (!pkg) return null;

    // Normalize product info across native/web
    const product = pkg.product || pkg.webBillingProduct;

    return {
      id: pkg.identifier,
      price: product?.priceString || '',
      title: product?.title || tier,
      description: product?.description || '',
      product: pkg,
    };
  } catch (error) {
    logger.error(`Error getting ${tier} offering:`, error);
    return null;
  }
}

async function _purchase(tier) {
  const cfg = PRODUCTS[tier];

  if (!isInitialized) {
    logger.error('Purchases not initialized');
    return { success: false, isActive: false };
  }

  try {
    const offering = await _getOffering(tier);
    if (!offering?.product) {
      logger.error(`No ${tier} product found`);
      return { success: false, isActive: false };
    }

    let customerInfo;

    const { Purchases, mode } = await getPurchasesRuntime();

    if (mode === 'native') {
      // Native: Capacitor SDK
      const result = await Purchases.purchasePackage({
        aPackage: offering.product,
      });
      customerInfo = result.customerInfo;
    } else {
      // Web: purchases-js SDK — opens Stripe checkout
      const result = await Purchases.getSharedInstance().purchase({
        rcPackage: offering.product,
      });
      customerInfo = result.customerInfo;
    }

    const isActive = hasActiveEntitlement(customerInfo, cfg.entitlementId);
    localStorage.setItem(cfg.localStorageKey, isActive ? 'true' : 'false');

    logger.success(`Purchase completed, ${tier}:`, isActive);
    return {
      success: true,
      isActive,
      product: {
        id: offering.id,
        title: offering.title,
        price: offering.price,
        date: new Date().toISOString(),
        type: tier,
      },
    };
  } catch (error) {
    if (error.code === 1 || error.userCancelled || error.errorCode === 'UserCancelledError') {
      logger.info('Purchase cancelled by user');
    } else {
      logger.error(`Purchase ${tier} failed:`, error);
    }
    return { success: false, isActive: false };
  }
}

// ── Public API — Supporter ─────────────────────────────────────────────

export async function checkSupporterStatus() {
  return _checkEntitlement('supporter');
}

export async function purchaseSupporter() {
  const res = await _purchase('supporter');
  // Keep backward-compatible field name
  return { ...res, isSupporter: res.isActive };
}

// ── Public API — Pro ───────────────────────────────────────────────────

export async function checkProStatus() {
  return _checkEntitlement('pro');
}

export async function purchasePro() {
  return _purchase('pro');
}

export async function purchaseProYearly() {
  return _purchase('proYearly');
}

// ── Restore ────────────────────────────────────────────────────────────

/**
 * Restore previous purchases (for users who reinstall).
 * Returns status for all tiers.
 * On web, we just re-check customer info (Stripe purchases are server-side).
 */
export async function restorePurchases() {
  if (!isInitialized) {
    return { success: false, supporter: false, pro: false };
  }

  try {
    const { Purchases, mode } = await getPurchasesRuntime();
    let customerInfo;

    if (mode === 'native') {
      const result = await Purchases.restorePurchases();
      customerInfo = result.customerInfo;
    } else {
      // Web SDK: no restorePurchases — just re-fetch customer info
      customerInfo = await Purchases.getSharedInstance().getCustomerInfo();
    }

    const supporter = hasActiveEntitlement(customerInfo, PRODUCTS.supporter.entitlementId);
    const pro = hasActiveEntitlement(customerInfo, PRODUCTS.pro.entitlementId);

    localStorage.setItem(PRODUCTS.supporter.localStorageKey, supporter ? 'true' : 'false');
    localStorage.setItem(PRODUCTS.pro.localStorageKey, pro ? 'true' : 'false');

    logger.success('Purchases restored:', { supporter, pro });
    return { success: true, supporter, pro, isSupporter: supporter };
  } catch (error) {
    logger.error('Restore failed:', error);
    return { success: false, supporter: false, pro: false };
  }
}

/**
 * Fetch formatted purchase history directly from RevenueCat.
 *
 * Uses `subscriptionsByProductIdentifier` for subscriptions (accurate per-product
 * data with real purchaseDate, expiresDate, isActive) and `nonSubscriptionTransactions`
 * for one-time purchases (supporter donations).
 */
export async function getPurchaseHistory() {
  if (!isInitialized) return [];

  try {
    const customerInfo = await _getCustomerInfo();
    const history = [];

    // Normalize date → ISO string (web SDK returns Date objects, native returns strings)
    const toISO = (d) => {
      if (!d) return null;
      return d instanceof Date ? d.toISOString() : String(d);
    };

    const getProductDetails = (identifier) => {
      if (identifier?.includes('supporter')) return { titleKey: 'supporter.historyTitle', descKey: 'supporter.historyDesc' };
      if (identifier?.includes('pro')) return { titleKey: 'pro.title', descKey: 'pro.historyDesc' };
      return { titleKey: 'store.historyTitle', descKey: 'store.historyDesc' };
    };

    // ── 1. Subscriptions (Pro monthly / yearly) ────────────────────────
    const subs = customerInfo?.subscriptionsByProductIdentifier;
    if (subs) {
      for (const [productId, sub] of Object.entries(subs)) {
        const details = getProductDetails(productId);

        let descKey = details.descKey;
        const isPromotional = sub.periodType === 'PROMOTIONAL' || productId.toLowerCase().includes('promo');
        const isLifetime = productId.toLowerCase().includes('lifetime');

        if (productId.includes('pro')) {
          if (isPromotional) {
            descKey = 'pro.promotionalDesc';
          } else if (isLifetime) {
            descKey = 'pro.lifetimeDesc';
          } else if (!sub.willRenew && !productId.includes('monthly') && !productId.includes('yearly')) {
            descKey = 'pro.oneTimeDesc';
          } else {
            descKey = 'pro.historyDesc'; // Regular sub, whether active or cancelled
          }
        }

        const purchaseDate = toISO(sub.purchaseDate);
        const originalDate = toISO(sub.originalPurchaseDate);
        let expiresDate = toISO(sub.expiresDate ?? sub.expirationDate);
        const isActive = sub.isActive ?? false;

        // Hide expiration for lifetime grants (often year 2226 or similar)
        if (isLifetime || (expiresDate && expiresDate.startsWith('22'))) {
          expiresDate = null;
        }

        history.push({
          id: productId.replace(/^\$/, ''),
          titleKey: details.titleKey,
          descKey,
          date: originalDate || purchaseDate,
          expirationDate: expiresDate,
          priceKey: isActive ? 'store.statusActive' : 'store.statusExpired',
          isActive,
          willRenew: sub.willRenew ?? false,
        });
      }
    }

    // ── 2. Non-subscription purchases (Supporter, one-time) ────────────
    if (customerInfo?.nonSubscriptionTransactions?.length > 0) {
      for (const tx of customerInfo.nonSubscriptionTransactions) {
        const details = getProductDetails(tx.productIdentifier);
        const txId = tx.transactionIdentifier || tx.productIdentifier;
        history.push({
          id: txId.replace(/^\$/, ''),
          titleKey: details.titleKey,
          descKey: details.descKey,
          date: toISO(tx.purchaseDate),
          expirationDate: null,
          priceKey: 'store.statusPaid',
          isActive: true,
        });
      }
    }

    // ── 3. Fallback: entitlements not covered above ────────────────────
    if (customerInfo?.entitlements?.all) {
      const coveredProducts = new Set(history.map(h => h.id));

      for (const [key, ent] of Object.entries(customerInfo.entitlements.all)) {
        const rawId = (ent.productIdentifier || key).replace(/^\$/, '');
        if (coveredProducts.has(rawId)) continue;

        const details = getProductDetails(rawId);
        let descKey = details.descKey;
        
        const isPromotional = ent.periodType === 'PROMOTIONAL' || rawId.toLowerCase().includes('promo');
        const isLifetime = rawId.toLowerCase().includes('lifetime');
        const isOneTime = ent.willRenew === false;

        if (rawId.includes('pro')) {
          if (isPromotional) {
            descKey = 'pro.promotionalDesc';
          } else if (isLifetime) {
            descKey = 'pro.lifetimeDesc';
          } else if (isOneTime && !rawId.includes('monthly') && !rawId.includes('yearly')) {
            descKey = 'pro.oneTimeDesc';
          } else {
             descKey = 'pro.historyDesc';
          }
        }

        let expiresDate = toISO(ent.expirationDate);
        if (isLifetime || (expiresDate && expiresDate.startsWith('22'))) {
          expiresDate = null;
        }

        history.push({
          id: rawId,
          titleKey: details.titleKey,
          descKey,
          date: toISO(ent.latestPurchaseDate) || toISO(ent.originalPurchaseDate),
          expirationDate: expiresDate,
          priceKey: ent.isActive ? 'store.statusActive' : 'store.statusExpired',
          isActive: ent.isActive ?? false,
        });
      }
    }

    // Newest first, active before expired at same date
    return history.sort((a, b) => {
      const diff = new Date(b.date) - new Date(a.date);
      if (diff !== 0) return diff;
      return (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0);
    });
  } catch (error) {
    logger.error('Failed to parse purchase history from RC:', error);
    return [];
  }
}
