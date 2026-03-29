/**
 * Purchase Service — RevenueCat wrapper for OneUp subscriptions
 *
 * Tiers:
 *   supporter — one-time ~2-5€ — ❤️ badge on leaderboard
 *   pro       — 1.99€/mo  — custom programs, dedicated panel
 *
 * Entitlements (configured in RevenueCat dashboard):
 *   "supporter" — non-consumable
 *   "pro"       — auto-renewable subscription
 *
 * Uses the Capacitor SDK on native (Android/iOS) and the Web SDK
 * (@revenuecat/purchases-js) on web for Stripe-based Web Billing.
 */

import { Capacitor } from '@capacitor/core';
import { Purchases as PurchasesNative } from '@revenuecat/purchases-capacitor';
import { Purchases as PurchasesWeb } from '@revenuecat/purchases-js';
import { createLogger } from '../utils/logger';

const logger = createLogger('Purchases');

const isNative = Capacitor.isNativePlatform();

// Product identifiers configured in RevenueCat dashboard
const PRODUCTS = {
  supporter: {
    productId: 'supporter',
    entitlementId: 'supporter',
    localStorageKey: 'oneup_supporter',
  },
  pro: {
    productId: 'oneup_pro_monthly',
    entitlementId: 'pro',
    localStorageKey: 'oneup_pro',
  },
};

let isInitialized = false;

// ── Initialization ─────────────────────────────────────────────────────

/**
 * Initialize RevenueCat SDK (native or web).
 * Call once at app startup after auth.
 */
export async function initPurchases(userId) {
  try {
    if (isNative) {
      // Native (Android / iOS) — Capacitor SDK
      await PurchasesNative.configure({
        apiKey: import.meta.env.VITE_REVENUECAT_API_KEY,
        appUserID: userId || null,
      });
    } else {
      // Web — purchases-js SDK (Stripe / Web Billing)
      const webKey = import.meta.env.VITE_REVENUECAT_WEB_API_KEY;
      if (!webKey) {
        logger.warn('No Web Billing API key configured, skipping web init');
        return false;
      }
      PurchasesWeb.configure(webKey, userId || 'anonymous');
    }

    isInitialized = true;
    logger.success(`RevenueCat initialized (${isNative ? 'native' : 'web'})`);
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
  if (isNative) {
    const { customerInfo } = await PurchasesNative.getCustomerInfo();
    return customerInfo;
  }
  return await PurchasesWeb.getSharedInstance().getCustomerInfo();
}

async function _checkEntitlement(tier) {
  const cfg = PRODUCTS[tier];
  if (!cfg) return false;

  if (!isInitialized) {
    return localStorage.getItem(cfg.localStorageKey) === 'true';
  }

  try {
    const customerInfo = await _getCustomerInfo();
    const active = hasActiveEntitlement(customerInfo, cfg.entitlementId);
    localStorage.setItem(cfg.localStorageKey, active ? 'true' : 'false');
    return active;
  } catch (error) {
    logger.error(`Error checking ${tier} status:`, error);
    return localStorage.getItem(cfg.localStorageKey) === 'true';
  }
}

async function _getOffering(tier) {
  const cfg = PRODUCTS[tier];
  if (!isInitialized) return null;

  try {
    let offerings;
    if (isNative) {
      offerings = await PurchasesNative.getOfferings();
    } else {
      offerings = await PurchasesWeb.getSharedInstance().getOfferings();
    }

    const current = offerings?.current;
    if (!current) {
      logger.error('No current offering set in RevenueCat dashboard');
      return null;
    }

    const pkg =
      current.availablePackages?.find(
        (p) => {
          // Native uses product.identifier, Web uses webBillingProduct.identifier
          const identifier = p.product?.identifier || p.webBillingProduct?.identifier;
          return identifier === cfg.productId;
        }
      ) || current.availablePackages?.[0];

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

    if (isNative) {
      // Native: Capacitor SDK
      const result = await PurchasesNative.purchasePackage({
        aPackage: offering.product,
      });
      customerInfo = result.customerInfo;
    } else {
      // Web: purchases-js SDK — opens Stripe checkout
      const result = await PurchasesWeb.getSharedInstance().purchase({
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

export async function getSupporterOffering() {
  return _getOffering('supporter');
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

export async function getProOffering() {
  return _getOffering('pro');
}

export async function purchasePro() {
  return _purchase('pro');
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
    let customerInfo;

    if (isNative) {
      const result = await PurchasesNative.restorePurchases();
      customerInfo = result.customerInfo;
    } else {
      // Web SDK: no restorePurchases — just re-fetch customer info
      customerInfo = await PurchasesWeb.getSharedInstance().getCustomerInfo();
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
 * Fetch formatted purchase history directly from RevenueCat securely.
 */
export async function getPurchaseHistory() {
  if (!isInitialized) return [];

  try {
    const customerInfo = await _getCustomerInfo();
    const history = [];

    const getProductDetails = (identifier) => {
      if (identifier?.includes('supporter')) return { title: 'Soutien OneUp ❤️', desc: 'Achat unique premium' };
      if (identifier?.includes('pro')) return { title: 'Abonnement Pro', desc: 'Renouvellement automatique' };
      return { title: 'Achat In-App', desc: 'Transaction OneUp' };
    };

    // 1. Active & Expired Entitlements
    if (customerInfo?.entitlements?.all) {
      for (const [key, ent] of Object.entries(customerInfo.entitlements.all)) {
        const details = getProductDetails(ent.productIdentifier);
        const rawId = ent.productIdentifier || key;
        history.push({
          id: rawId.replace(/^\$/, ''),
          title: details.title,
          desc: details.desc,
          date: ent.latestPurchaseDate || ent.originalPurchaseDate,
          price: ent.isActive ? 'Actif' : 'Expiré',
          isActive: ent.isActive
        });
      }
    }

    // 2. Hard Purchases (One-Time) — native only (nonSubscriptionTransactions)
    if (isNative && customerInfo?.nonSubscriptionTransactions?.length > 0) {
      for (const tx of customerInfo.nonSubscriptionTransactions) {
        if (!history.some(h => h.id === tx.productIdentifier)) {
          const details = getProductDetails(tx.productIdentifier);
          const rawId = tx.transactionIdentifier || tx.productIdentifier;
          history.push({
            id: rawId.replace(/^\$/, ''),
            title: details.title,
            desc: details.desc,
            date: tx.purchaseDate,
            price: 'Payé',
            isActive: true
          });
        }
      }
    }

    // Newest first
    return history.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    logger.error('Failed to parse active purchase history from RC:', error);
    return [];
  }
}
