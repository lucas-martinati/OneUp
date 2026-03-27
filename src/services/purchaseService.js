/**
 * Purchase Service — RevenueCat wrapper for OneUp subscriptions
 *
 * Tiers:
 *   supporter — one-time ~2-5€ — ❤️ badge on leaderboard
 *   club      — 4.99€/mo  — friend challenges, mini-leagues
 *   pro       — 6.99€/mo  — custom programs, dedicated panel
 *
 * Entitlements (configured in RevenueCat dashboard):
 *   "supporter" — non-consumable or lifetime
 *   "club"      — auto-renewable subscription
 *   "pro"       — auto-renewable subscription
 *
 * Falls back gracefully on web/dev where native SDK is unavailable.
 */

import { Capacitor } from '@capacitor/core';
import { Purchases } from '@revenuecat/purchases-capacitor';
import { createLogger } from '../utils/logger';

const logger = createLogger('Purchases');

// Product identifiers configured in RevenueCat dashboard
const PRODUCTS = {
  supporter: {
    productId: 'supporter',
    entitlementId: 'supporter',
    localStorageKey: 'oneup_supporter',
  },
  club: {
    productId: 'oneup_club_monthly',
    entitlementId: 'club',
    localStorageKey: 'oneup_club',
  },
  pro: {
    productId: 'oneup_pro_monthly',
    entitlementId: 'pro',
    localStorageKey: 'oneup_pro',
  },
};

let isInitialized = false;

/**
 * Initialize RevenueCat SDK.
 * Call once at app startup after auth.
 */
export async function initPurchases(userId) {
  if (!Capacitor.isNativePlatform()) {
    logger.info('Purchases: skipping init on web');
    return false;
  }

  try {
    await Purchases.configure({
      apiKey: import.meta.env.VITE_REVENUECAT_API_KEY,
      appUserID: userId || null,
    });

    isInitialized = true;
    logger.success('RevenueCat initialized');
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

async function _checkEntitlement(tier) {
  const cfg = PRODUCTS[tier];
  if (!cfg) return false;

  if (!isInitialized) {
    return localStorage.getItem(cfg.localStorageKey) === 'true';
  }

  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
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
    const offerings = await Purchases.getOfferings();
    const current = offerings?.current;
    if (!current) {
      logger.error('No current offering set in RevenueCat dashboard');
      return null;
    }

    const pkg =
      current.availablePackages?.find(
        (p) => p.product?.identifier === cfg.productId
      ) || current.availablePackages?.[0];

    if (!pkg) return null;

    return {
      id: pkg.identifier,
      price: pkg.product?.priceString || '',
      title: pkg.product?.title || tier,
      description: pkg.product?.description || '',
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
    if (!Capacitor.isNativePlatform()) {
      logger.info('Purchases: not available on web — use the Android app');
      return { success: false, isActive: false, webOnly: true };
    }
    logger.error('Purchases not initialized');
    return { success: false, isActive: false };
  }

  try {
    const offering = await _getOffering(tier);
    if (!offering?.product) {
      logger.error(`No ${tier} product found`);
      return { success: false, isActive: false };
    }

    const { customerInfo } = await Purchases.purchasePackage({
      aPackage: offering.product,
    });

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
    if (error.code === 1 || error.userCancelled) {
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

// ── Public API — Club ──────────────────────────────────────────────────

export async function checkClubStatus() {
  return _checkEntitlement('club');
}

export async function getClubOffering() {
  return _getOffering('club');
}

export async function purchaseClub() {
  return _purchase('club');
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
 */
export async function restorePurchases() {
  if (!isInitialized) {
    if (!Capacitor.isNativePlatform()) {
      return { success: false, supporter: false, club: false, pro: false, webOnly: true };
    }
    return { success: false, supporter: false, club: false, pro: false };
  }

  try {
    const { customerInfo } = await Purchases.restorePurchases();

    const supporter = hasActiveEntitlement(customerInfo, PRODUCTS.supporter.entitlementId);
    const club = hasActiveEntitlement(customerInfo, PRODUCTS.club.entitlementId);
    const pro = hasActiveEntitlement(customerInfo, PRODUCTS.pro.entitlementId);

    localStorage.setItem(PRODUCTS.supporter.localStorageKey, supporter ? 'true' : 'false');
    localStorage.setItem(PRODUCTS.club.localStorageKey, club ? 'true' : 'false');
    localStorage.setItem(PRODUCTS.pro.localStorageKey, pro ? 'true' : 'false');

    logger.success('Purchases restored:', { supporter, club, pro });
    return { success: true, supporter, club, pro, isSupporter: supporter };
  } catch (error) {
    logger.error('Restore failed:', error);
    return { success: false, supporter: false, club: false, pro: false };
  }
}

/**
 * Fetch formatted purchase history directly from RevenueCat securely.
 */
export async function getPurchaseHistory() {
  if (!isInitialized || !Capacitor.isNativePlatform()) return [];

  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    const history = [];

    const getProductDetails = (identifier) => {
      if (identifier?.includes('supporter')) return { title: 'Soutien OneUp ❤️', desc: 'Achat unique premium' };
      if (identifier?.includes('club')) return { title: 'Abonnement Club', desc: 'Renouvellement automatique' };
      if (identifier?.includes('pro')) return { title: 'Abonnement Pro', desc: 'Renouvellement automatique' };
      return { title: 'Achat In-App', desc: 'Transaction OneUp' };
    };

    // 1. Active & Expired Entitlements
    if (customerInfo?.entitlements?.all) {
      for (const [key, ent] of Object.entries(customerInfo.entitlements.all)) {
        const details = getProductDetails(ent.productIdentifier);
        history.push({
          id: ent.productIdentifier || key,
          title: details.title,
          desc: details.desc,
          date: ent.latestPurchaseDate || ent.originalPurchaseDate,
          price: ent.isActive ? 'Actif' : 'Expiré',
          isActive: ent.isActive
        });
      }
    }

    // 2. Hard Purchases (One-Time)
    if (customerInfo?.nonSubscriptionTransactions?.length > 0) {
      for (const tx of customerInfo.nonSubscriptionTransactions) {
        if (!history.some(h => h.id === tx.productIdentifier)) {
          const details = getProductDetails(tx.productIdentifier);
          history.push({
            id: tx.transactionIdentifier || tx.productIdentifier,
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
