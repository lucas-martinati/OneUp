import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { cloudSync } from '../services/cloudSync';
import {
  initPurchases, checkSupporterStatus, purchaseSupporter, restorePurchases,
  checkProStatus, purchasePro, purchaseProYearly
} from '../services/purchaseService';
import {
  saveCachedEntitlements, clearCachedEntitlements
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

  // IMPORTANT: Initialize to false, NOT from localStorage cache.
  // The cache can contain stale values (e.g. Pro removed from Firebase but still cached).
  // The real values are set by initAndCheck() which runs on sign-in.
  // This ensures features are locked until verification completes.
  const [isSupporter, setIsSupporter] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [hadPro, setHadPro] = useState(false);
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
    // Note: cloudSync.savePurchase() a été retiré, Firebase est mis à jour UNIQUEMENT par le Webhook RevenueCat.
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
          if (cloudPurchase) {
            fbEntitlements = { isSupporter: !!cloudPurchase.isSupporter, isPro: !!cloudPurchase.isPro, hadPro: !!cloudPurchase.hadPro };
            if (fbEntitlements.isSupporter || fbEntitlements.isPro || fbEntitlements.hadPro) logger.info('Loaded purchase from Firebase');
          }

          // Resolve Entitlements: Si RevenueCat est vérifié, c'est la source de vérité absolue.
          // S'il ne l'est pas (App Web sans paiement, Mode hors-ligne, Erreur), Firebase est la meilleure
          // source de secours puisqu'il est mis à jour par le webhook RevenueCat.
          // IMPORTANT: On ne fait JAMAIS confiance au cache local (localStorage) comme fallback final,
          // car il peut contenir des valeurs périmées qui ne seraient jamais corrigées.
          let resolved = {
            isSupporter: rcEntitlements.verified ? rcEntitlements.isSupporter : fbEntitlements.isSupporter,
            isPro: rcEntitlements.verified ? rcEntitlements.isPro : fbEntitlements.isPro,
          };
          resolved.hadPro = resolved.isPro || fbEntitlements.hadPro || (rcEntitlements.verified ? rcEntitlements.hadPro : false);
          resolved.hasAnyEntitlement = resolved.isSupporter || resolved.hadPro;

          setIsSupporter(resolved.isSupporter);
          setIsPro(resolved.isPro);
          setHadPro(resolved.hadPro);

          // Always update cache to correct any stale localStorage entries
          await saveAndPublish(resolved);
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
    
    // Si l'opération de restauration échoue (erreur réseau, annulation),
    // on ne doit SURTOUT PAS retirer les droits actuels de l'utilisateur.
    if (!result.success) {
      logger.warn('Restore operation failed or was cancelled, keeping current entitlements.');
      return result;
    }

    // RevenueCat est la source de vérité pour le Restore réussi
    let resolved = {
      isSupporter: result.supporter || result.isSupporter || false,
      isPro: result.pro || false,
      hadPro: false
    };

    // On utilise néanmoins Firebase pour récupérer le "hadPro" car RC ne le donne pas
    const cloudPurchase = await cloudSync.loadPurchase();
    if (cloudPurchase) {
       resolved.hadPro = resolved.isPro || !!cloudPurchase.hadPro || !!cloudPurchase.isPro;
    } else {
       resolved.hadPro = resolved.isPro;
    }

    // Sécurité additionnelle : Si Firebase dit qu'on est Pro mais RC dit non, 
    // on garde le Pro de Firebase pour éviter de pénaliser les utilisateurs
    // qui ont reçu le Pro manuellement via Firebase avant RevenueCat.
    if (!resolved.isPro && cloudPurchase?.isPro) {
      resolved.isPro = true;
    }
    if (!resolved.isSupporter && cloudPurchase?.isSupporter) {
      resolved.isSupporter = true;
    }

    resolved.hasAnyEntitlement = resolved.isSupporter || resolved.hadPro;

    setIsSupporter(resolved.isSupporter);
    setIsPro(resolved.isPro);
    setHadPro(resolved.hadPro);

    await saveAndPublish(resolved);
    return result;
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
