/**
 * Purchase Service — RevenueCat wrapper for OneUp Supporter Badge
 * 
 * Product: "supporter" — one-time purchase (~2–5€)
 * Entitlement: "supporter" — grants the ❤️ badge on leaderboard
 * 
 * Falls back gracefully on web/dev where native SDK is unavailable.
 */

import { Capacitor } from '@capacitor/core';
import { createLogger } from '../utils/logger';

const logger = createLogger('Purchases');

// Product identifier configured in RevenueCat dashboard
const SUPPORTER_PRODUCT_ID = 'supporter';
const SUPPORTER_ENTITLEMENT_ID = 'supporter';

let Purchases = null;
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
    // Dynamic import with variable path — prevents Vite static analysis
    const pkgName = '@revenuecat/purchases-capacitor';
    const mod = await import(/* @vite-ignore */ pkgName);
    Purchases = mod.Purchases;

    await Purchases.configure({
      apiKey: import.meta.env.VITE_REVENUECAT_API_KEY,
      appUserID: userId || null
    });

    isInitialized = true;
    logger.success('RevenueCat initialized');
    return true;
  } catch (error) {
    logger.error('RevenueCat init failed:', error);
    return false;
  }
}

/**
 * Check if user has the "supporter" entitlement.
 * Returns true if user is a supporter.
 */
export async function checkSupporterStatus() {
  if (!isInitialized || !Purchases) {
    // On web, check localStorage fallback
    return localStorage.getItem('oneup_supporter') === 'true';
  }

  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    const isSupporter = !!customerInfo.entitlements.active[SUPPORTER_ENTITLEMENT_ID];
    // Cache locally for offline access
    localStorage.setItem('oneup_supporter', isSupporter ? 'true' : 'false');
    return isSupporter;
  } catch (error) {
    logger.error('Error checking supporter status:', error);
    return localStorage.getItem('oneup_supporter') === 'true';
  }
}

/**
 * Get the supporter product offering (price, description).
 * Returns null if unavailable.
 */
export async function getSupporterOffering() {
  if (!isInitialized || !Purchases) return null;

  try {
    const { offerings } = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) return null;

    // Find the supporter package
    const pkg = current.availablePackages?.find(
      p => p.product?.identifier === SUPPORTER_PRODUCT_ID
    ) || current.availablePackages?.[0];

    if (!pkg) return null;

    return {
      id: pkg.identifier,
      price: pkg.product?.priceString || '2,99€',
      title: pkg.product?.title || 'Supporter',
      description: pkg.product?.description || '',
      product: pkg
    };
  } catch (error) {
    logger.error('Error getting offerings:', error);
    return null;
  }
}

/**
 * Purchase the supporter badge.
 * Returns { success: boolean, isSupporter: boolean }
 */
export async function purchaseSupporter() {
  if (!isInitialized || !Purchases) {
    if (!Capacitor.isNativePlatform()) {
      logger.info('Purchases: not available on web — use the Android app');
      return { success: false, isSupporter: false, webOnly: true };
    }
    logger.error('Purchases not initialized');
    return { success: false, isSupporter: false };
  }

  try {
    const offering = await getSupporterOffering();
    if (!offering?.product) {
      logger.error('No supporter product found');
      return { success: false, isSupporter: false };
    }

    const { customerInfo } = await Purchases.purchasePackage({
      aPackage: offering.product
    });

    const isSupporter = !!customerInfo.entitlements.active[SUPPORTER_ENTITLEMENT_ID];
    localStorage.setItem('oneup_supporter', isSupporter ? 'true' : 'false');
    
    logger.success('Purchase completed, supporter:', isSupporter);
    return { success: true, isSupporter };
  } catch (error) {
    // User cancelled or error
    if (error.code === 1 || error.userCancelled) {
      logger.info('Purchase cancelled by user');
    } else {
      logger.error('Purchase failed:', error);
    }
    return { success: false, isSupporter: false };
  }
}

/**
 * Restore previous purchases (for users who reinstall).
 * Returns { success: boolean, isSupporter: boolean }
 */
export async function restorePurchases() {
  if (!isInitialized || !Purchases) {
    if (!Capacitor.isNativePlatform()) {
      return { success: false, isSupporter: false, webOnly: true };
    }
    return { success: false, isSupporter: false };
  }

  try {
    const { customerInfo } = await Purchases.restorePurchases();
    const isSupporter = !!customerInfo.entitlements.active[SUPPORTER_ENTITLEMENT_ID];
    localStorage.setItem('oneup_supporter', isSupporter ? 'true' : 'false');
    
    logger.success('Purchases restored, supporter:', isSupporter);
    return { success: true, isSupporter };
  } catch (error) {
    logger.error('Restore failed:', error);
    return { success: false, isSupporter: false };
  }
}
