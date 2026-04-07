/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { cloudSync } from '../services/cloudSync';
import {
  initPurchases, checkSupporterStatus, purchaseSupporter, restorePurchases,
  checkProStatus, purchasePro
} from '../services/purchaseService';
import {
  loadCachedEntitlements, saveCachedEntitlements, clearCachedEntitlements, resolveEntitlements
} from '../utils/entitlements';
import { createLogger } from '../utils/logger';

const logger = createLogger('Subscription');
const SubscriptionContext = createContext(null);

/**
 * Manages all subscription/entitlement logic (RevenueCat + Firebase fallback).
 * Extracted from App.jsx to decouple subscription concerns from the root component.
 */
export function SubscriptionProvider({ children, publishLeaderboardNow }) {
  const auth = useAuth();

  const [isSupporter, setIsSupporter] = useState(() => loadCachedEntitlements().isSupporter);
  const [isPro, setIsPro] = useState(() => loadCachedEntitlements().isPro);

  const isSupporterRef = useRef(isSupporter);
  const isProRef = useRef(isPro);
  useEffect(() => { isSupporterRef.current = isSupporter; }, [isSupporter]);
  useEffect(() => { isProRef.current = isPro; }, [isPro]);

  const saveAndPublish = useCallback(async ({ isSupporter: sup, isPro: pr }) => {
    saveCachedEntitlements({ isSupporter: sup, isPro: pr });
    await cloudSync.savePurchase({ isSupporter: sup, isPro: pr });
    if (publishLeaderboardNow) await publishLeaderboardNow();
  }, [publishLeaderboardNow]);

  // Reset when user signs out
  useEffect(() => {
    if (!auth.isSignedIn) {
      queueMicrotask(() => {
        setIsSupporter(false);
        setIsPro(false);
        clearCachedEntitlements();
      });
    }
  }, [auth.isSignedIn, auth.user?.uid]);

  // Initialize purchases and check ALL tier statuses on sign-in
  useEffect(() => {
    if (auth.isSignedIn && !auth.loading) {
      const initAndCheck = async () => {
        try {
          await initPurchases(cloudSync.getCurrentUserId());

          let rcEntitlements = { isSupporter: false, isPro: false };
          try {
            rcEntitlements = {
              isSupporter: await checkSupporterStatus(),
              isPro: await checkProStatus(),
            };
          } catch (rcErr) {
            logger.warn('RevenueCat check failed:', rcErr);
          }

          let fbEntitlements = { isSupporter: false, isPro: false };
          if (!rcEntitlements.isSupporter && !rcEntitlements.isPro) {
            const cloudPurchase = await cloudSync.loadPurchase();
            if (cloudPurchase) {
              fbEntitlements = { isSupporter: !!cloudPurchase.isSupporter, isPro: !!cloudPurchase.isPro };
              if (fbEntitlements.isSupporter || fbEntitlements.isPro) logger.info('Loaded purchase from Firebase');
            }
          }

          const resolved = resolveEntitlements(rcEntitlements, fbEntitlements);
          setIsSupporter(resolved.isSupporter);
          setIsPro(resolved.isPro);

          if (resolved.hasAnyEntitlement) {
            await saveAndPublish(resolved);
          }
        } catch (error) {
          logger.error('Purchase init error:', error);
        }
      };
      initAndCheck();
    }
  }, [auth.isSignedIn, auth.loading, saveAndPublish]);

  const handlePurchaseSupporter = useCallback(async () => {
    const result = await purchaseSupporter();
    if (result.success || result.isSupporter || result.isActive) {
      setIsSupporter(true);
      await saveAndPublish({ isSupporter: true, isPro: isProRef.current });
    }
    return result;
  }, [saveAndPublish]);

  const handlePurchasePro = useCallback(async () => {
    const result = await purchasePro();
    if (result.success || result.isActive) {
      setIsPro(true);
      await saveAndPublish({ isSupporter: isSupporterRef.current, isPro: true });
    }
    return result;
  }, [saveAndPublish]);

  const handleRestorePurchases = useCallback(async () => {
    const result = await restorePurchases();
    let resolved = resolveEntitlements(
      { isSupporter: result.supporter || result.isSupporter || false, isPro: result.pro || false },
      { isSupporter: false, isPro: false }
    );

    if (!resolved.hasAnyEntitlement) {
      const cloudPurchase = await cloudSync.loadPurchase();
      if (cloudPurchase) {
        resolved = resolveEntitlements(resolved, {
          isSupporter: !!cloudPurchase.isSupporter,
          isPro: !!cloudPurchase.isPro,
        });
      }
    }

    setIsSupporter(resolved.isSupporter);
    setIsPro(resolved.isPro);

    if (resolved.hasAnyEntitlement) {
      await saveAndPublish(resolved);
    }
  }, [saveAndPublish]);

  const value = useMemo(() => ({
    isSupporter: auth.isSignedIn ? isSupporter : false,
    isPro: auth.isSignedIn ? isPro : false,
    rawIsSupporter: isSupporter,
    rawIsPro: isPro,
    purchaseSupporter: handlePurchaseSupporter,
    purchasePro: handlePurchasePro,
    restorePurchases: handleRestorePurchases,
  }), [auth.isSignedIn, isSupporter, isPro, handlePurchaseSupporter, handlePurchasePro, handleRestorePurchases]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within <SubscriptionProvider>');
  return ctx;
}
