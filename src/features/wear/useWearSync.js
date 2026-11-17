import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@contexts/SubscriptionContext';
import { useProgressStore } from '@store/useProgressStore';
import { useExercisesStore } from '@store/useExercisesStore';
import { useComputedStatsStore } from '@store/useComputedStatsStore';
import { isAndroidPlatform } from '@utils/platform';
import { createLogger } from '@utils/logger';
import { buildWearSnapshot } from './wearSnapshot';
import { applyWearSessionEffect } from './wearSession';
import { WEAR_SESSION_EVENT } from './wearProtocol';

const logger = createLogger('WearSync');
let nativePlugin;

async function getBridge() {
  if (!nativePlugin) {
    const { registerPlugin } = await import('@capacitor/core');
    nativePlugin = registerPlugin('WearBridge');
  }
  return { plugin: nativePlugin };
}

/** Native inbox survives a closed phone app; acknowledgments follow durable JS storage. */
export function useWearSync(auth) {
  const { t, i18n } = useTranslation();
  const { isPro, isSubscriptionLoading } = useSubscription();
  useEffect(() => {
    if (!isAndroidPlatform() || auth.loading || isSubscriptionLoading) return undefined;
    let disposed = false;
    let timer;
    let running = false;
    let again = false;
    let bridge;
    let scope;
    let listener;
    let lastPublished = '';
    const subscriptions = [];

    const snapshot = () => buildWearSnapshot({
      progress: useProgressStore.getState(), exerciseStore: useExercisesStore.getState(),
      stats: useComputedStatsStore.getState().stats, isPro, scope, t, userId: auth.user?.uid || null, language: i18n.resolvedLanguage,
    });
    const publish = async () => {
      const data = snapshot();
      const serialized = JSON.stringify(data);
      if (serialized !== lastPublished && !disposed) {
        await bridge.publish({ snapshot: data });
        lastPublished = serialized;
      }
    };
    const sync = async () => {
      if (disposed || !bridge) return;
      if (running) { again = true; return; }
      running = true;
      try {
        await publish();
        if (!snapshot().ready) return;
        const { operations = [] } = await bridge.getPending({ scope });
        operations.sort((a, b) => a.operation.device.localeCompare(b.operation.device) || a.operation.sequence - b.operation.sequence);
        const acknowledged = [];
        for (const item of operations) {
          if (disposed || useProgressStore.getState()._userId !== (auth.user?.uid || null)
            || !useProgressStore.getState().isStoreInitialized) break;
          const status = await useProgressStore.getState().applyWearOperation(item.operation, item.catalog, scope, applyWearSessionEffect);
          if (status === 'applied' || status === 'duplicate') acknowledged.push(item.uri);
        }
        if (acknowledged.length) {
          await publish();
          await bridge.acknowledge({ uris: acknowledged });
        }
      } catch (error) {
        logger.warn('Watch synchronization will retry:', error);
      } finally {
        running = false;
        if (again) { again = false; schedule(); }
      }
    };
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(sync, 200);
    };
    const onVisible = () => { if (!document.hidden) schedule(); };
    const initialize = async () => {
      const { plugin } = await getBridge();
      if (disposed) return;
      bridge = plugin;
      ({ scope } = await bridge.configure({ userId: auth.user?.uid || '' }));
      if (disposed) return;
      listener = await bridge.addListener('wearOperations', schedule);
      if (disposed) { listener.remove(); return; }
      subscriptions.push(useProgressStore.subscribe(schedule), useExercisesStore.subscribe(schedule), useComputedStatsStore.subscribe(schedule));
      window.addEventListener(WEAR_SESSION_EVENT, schedule);
      document.addEventListener('visibilitychange', onVisible);
      schedule();
    };
    initialize().catch(error => logger.warn('Watch bridge unavailable:', error));
    // Retry temporarily unavailable Play Services and roll dates at midnight
    // while the app is visible (visibilitychange already syncs on resume).
    const retry = setInterval(() => {
      if (!document.hidden) schedule();
    }, 30000);
    return () => {
      disposed = true;
      clearTimeout(timer);
      clearInterval(retry);
      subscriptions.forEach(unsubscribe => unsubscribe());
      listener?.remove();
      window.removeEventListener(WEAR_SESSION_EVENT, schedule);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [auth.loading, auth.user?.uid, isPro, isSubscriptionLoading, t, i18n.resolvedLanguage]);
}
