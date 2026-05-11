import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { cloudSync } from '../services/cloudSync';
import {
  initPurchases, checkSupporterStatus, purchaseSupporter, restorePurchases,
  checkProStatus, purchasePro, purchaseProYearly
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
export function SubscriptionProvider({ children }) {
  const auth = useAuth();

  const [isSupporter, setIsSupporter] = useState(() => loadCachedEntitlements().isSupporter);
  const [isPro, setIsPro] = useState(() => loadCachedEntitlements().isPro);
  const [hadPro, setHadPro] = useState(() => loadCachedEntitlements().hadPro);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(true);

  const isSupporterRef = useRef(isSupporter);
  const isProRef = useRef(isPro);
  const hadProRef = useRef(hadPro);
  useEffect(() => { isSupporterRef.current = isSupporter; }, [isSupporter]);
  useEffect(() => { isProRef.current = isPro; }, [isPro]);
  useEffect(() => { hadProRef.current = hadPro; }, [hadPro]);

  const saveAndPublish = useCallback(async ({ isSupporter: sup, isPro: pr, hadPro: hp }) => {
    // If pr is true, hp must be true
    const finalHadPro = pr || hp;
    if (finalHadPro && !hadProRef.current) {
      setHadPro(true);
    }
    saveCachedEntitlements({ isSupporter: sup, isPro: pr, hadPro: finalHadPro });
    await cloudSync.savePurchase({ isSupporter: sup, isPro: pr, hadPro: finalHadPro });
  }, []);

  // Reset when user signs out
  useEffect(() => {
    if (!auth.isSignedIn) {
      queueMicrotask(() => {
        setIsSupporter(false);
        setIsPro(false);
        // keep hadPro in state as it might be loaded next session, but typically auth reset means clearing it
        setHadPro(false);
        clearCachedEntitlements();
      });
    }
  }, [auth.isSignedIn, auth.user?.uid]);

  // Initialize purchases and check ALL tier statuses on sign-in
  useEffect(() => {
    if (auth.isSignedIn && !auth.loading && auth.user?.uid) {
      const initAndCheck = async () => {
        setIsSubscriptionLoading(true);
        try {
          await initPurchases(cloudSync.getCurrentUserId());

          let rcEntitlements = { isSupporter: false, isPro: false, hadPro: false, verified: false };
          try {
            const supStatus = await checkSupporterStatus();
            const proStatus = await checkProStatus();
            rcEntitlements = {
              isSupporter: supStatus.active,
              isPro: proStatus.active,
              hadPro: false, // RevenueCat doesn't persistently track hadPro unless we query past receipts, we rely on FB for hadPro
              verified: supStatus.verified || proStatus.verified,
            };
          } catch (rcErr) {
            logger.warn('RevenueCat check failed:', rcErr);
          }

          let fbEntitlements = { isSupporter: false, isPro: false, hadPro: false };
          const cloudPurchase = await cloudSync.loadPurchase();
          let fbLoaded = false;
          if (cloudPurchase) {
            fbLoaded = true;
            fbEntitlements = { isSupporter: !!cloudPurchase.isSupporter, isPro: !!cloudPurchase.isPro, hadPro: !!cloudPurchase.hadPro };
            if (fbEntitlements.isSupporter || fbEntitlements.isPro || fbEntitlements.hadPro) logger.info('Loaded purchase from Firebase');
          }

          // Resolve Entitlements: Si RevenueCat n'est pas vérifié (ex: version Web sans paiement ou erreur),
          // on utilise les données de Firebase comme source de vérité absolue pour ne pas ramener à la vie
          // un vieil abonnement annulé stocké dans le localStorage (rcEntitlements partiel).
          let resolved = {
            isSupporter: rcEntitlements.verified ? rcEntitlements.isSupporter : (fbLoaded ? fbEntitlements.isSupporter : rcEntitlements.isSupporter),
            isPro: rcEntitlements.verified ? rcEntitlements.isPro : (fbLoaded ? fbEntitlements.isPro : rcEntitlements.isPro),
            hadPro: rcEntitlements.isPro || fbEntitlements.hadPro || rcEntitlements.hadPro,
          };
          resolved.hasAnyEntitlement = resolved.isSupporter || resolved.hadPro;

          setIsSupporter(resolved.isSupporter);
          setIsPro(resolved.isPro);
          setHadPro(resolved.hadPro);

          // We publish to DB if there's any mismatch internally or if we have entitlements, 
          // to make sure DB is updated when Pro expires!
          if (resolved.hasAnyEntitlement || fbEntitlements.isPro !== resolved.isPro) {
            await saveAndPublish(resolved);
          }
        } catch (error) {
          logger.error('Purchase init error:', error);
        } finally {
          setIsSubscriptionLoading(false);
        }
      };
      initAndCheck();
    } else if (!auth.isSignedIn && !auth.loading) {
      setIsSubscriptionLoading(false);
    }
    // Intentionally omitted from deps: this effect is an auth-triggered initializer.
    // initPurchases, cloudSync, resolveEntitlements are stable references (module-level
    // singletons or useState setters). Adding them would cause spurious re-inits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isSignedIn, auth.loading, auth.user?.uid]);

  const handlePurchaseSupporter = useCallback(async () => {
    const result = await purchaseSupporter();
    if (result.success || result.isSupporter || result.isActive) {
      setIsSupporter(true);
      await saveAndPublish({ isSupporter: true, isPro: isProRef.current, hadPro: hadProRef.current });
    }
    return result;
  }, [saveAndPublish]);

  const handlePurchasePro = useCallback(async () => {
    const result = await purchasePro();
    if (result.success || result.isActive) {
      setIsPro(true);
      setHadPro(true);
      await saveAndPublish({ isSupporter: isSupporterRef.current, isPro: true, hadPro: true });
    }
    return result;
  }, [saveAndPublish]);

  const handlePurchaseProYearly = useCallback(async () => {
    const result = await purchaseProYearly();
    if (result.success || result.isActive) {
      setIsPro(true);
      setHadPro(true);
      await saveAndPublish({ isSupporter: isSupporterRef.current, isPro: true, hadPro: true });
    }
    return result;
  }, [saveAndPublish]);

  const handleRestorePurchases = useCallback(async () => {
    const result = await restorePurchases();
    let resolved = resolveEntitlements(
      { isSupporter: result.supporter || result.isSupporter || false, isPro: result.pro || false },
      { isSupporter: false, isPro: false, hadPro: false }
    );

    if (!resolved.hasAnyEntitlement) {
      const cloudPurchase = await cloudSync.loadPurchase();
      if (cloudPurchase) {
        resolved = resolveEntitlements(resolved, {
          isSupporter: !!cloudPurchase.isSupporter,
          isPro: !!cloudPurchase.isPro,
          hadPro: !!cloudPurchase.hadPro,
        });
      }
    }

    setIsSupporter(resolved.isSupporter);
    setIsPro(resolved.isPro);
    setHadPro(resolved.hadPro);

    if (resolved.hasAnyEntitlement) {
      await saveAndPublish(resolved);
    }
  }, [saveAndPublish]);

  const value = useMemo(() => ({
    isSupporter: auth.isSignedIn ? isSupporter : false,
    isPro: auth.isSignedIn ? isPro : false,
    hadPro: auth.isSignedIn ? hadPro : false,
    isSubscriptionLoading,
    rawIsSupporter: isSupporter,
    rawIsPro: isPro,
    rawHadPro: hadPro,
    purchaseSupporter: handlePurchaseSupporter,
    purchasePro: handlePurchasePro,
    purchaseProYearly: handlePurchaseProYearly,
    restorePurchases: handleRestorePurchases,
  }), [auth.isSignedIn, isSupporter, isPro, hadPro, isSubscriptionLoading, handlePurchaseSupporter, handlePurchasePro, handlePurchaseProYearly, handleRestorePurchases]);

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
