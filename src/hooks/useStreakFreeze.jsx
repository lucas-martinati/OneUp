import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Snowflake, ChevronRight } from '@utils/icons';
import { getLocalDateStr } from '@shared/dateUtils';
import { useProgressStore } from '@store/useProgressStore';
import { useCloudSyncStore } from '@store/useCloudSyncStore';
import { useSubscription } from '@contexts/SubscriptionContext';
import { useAuth } from '@contexts/AuthContext';
import { useToastGestures } from './useToastGestures';
import { getToastRoot } from '@components/feedback/toastRoot';
import { getToastContainerStyle, getToastCardStyle } from '@utils/toastStyles';

const TOAST_DURATION_MS = 6000;
const FREEZE_COLOR = '#38bdf8';

/**
 * Toast shown when a Streak Freeze is auto-consumed to protect the streak.
 * Mirrors the achievement/poke toast styling and reuses the shared toast root.
 */
function StreakFreezeNotification({ count, onClose }) {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);
    const { exit, cardProps } = useToastGestures({ onClose, duration: TOAST_DURATION_MS });
    const { style: gestureStyle, ...gestureHandlers } = cardProps;

    useEffect(() => {
        const id = requestAnimationFrame(() => setIsVisible(true));
        return () => cancelAnimationFrame(id);
    }, []);

    return createPortal(
        <div style={getToastContainerStyle(1, isVisible, exit)}>
            <div
                {...gestureHandlers}
                className="hover-lift"
                style={getToastCardStyle(FREEZE_COLOR, gestureStyle)}
            >
                <div style={{
                    position: 'relative', flexShrink: 0,
                    width: '46px', height: '46px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `radial-gradient(circle at 32% 26%, ${FREEZE_COLOR}, ${FREEZE_COLOR}cc)`,
                    border: `2px solid ${FREEZE_COLOR}`,
                    boxShadow: `0 4px 16px ${FREEZE_COLOR}66, inset 0 1px 2px rgba(255,255,255,0.4)`
                }}>
                    <Snowflake size={23} color="#fff" />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        fontSize: '0.62rem', fontWeight: 800, color: FREEZE_COLOR,
                        textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px'
                    }}>
                        <Snowflake size={11} />
                        {t('streakFreeze.toastTitle')}
                    </div>
                    <div style={{
                        fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)',
                        lineHeight: 1.25
                    }}>
                        {t('streakFreeze.toastBody', { count })}
                    </div>
                </div>

                <ChevronRight size={20} color="var(--text-secondary)" style={{ flexShrink: 0, opacity: 0.7 }} />

                {!exit && (
                    <span aria-hidden style={{
                        position: 'absolute', left: 0, bottom: 0, height: '3px', width: '100%',
                        transformOrigin: 'left', background: FREEZE_COLOR, opacity: 0.85,
                        animation: `toastCountdown ${TOAST_DURATION_MS}ms linear forwards`,
                        pointerEvents: 'none'
                    }} />
                )}
            </div>
        </div>,
        getToastRoot()
    );
}

/**
 * Drives the Streak Freeze feature: runs the monthly refill + auto-freeze
 * reconciliation once the store (and cloud, for signed-in users) is ready, and
 * again at each day rollover, then surfaces a toast for any newly frozen day.
 *
 * Mount once near the top of the tree (it returns a <StreakFreezeToast /> to
 * render). Reconciliation is idempotent, so repeated calls are harmless.
 */
export function useStreakFreeze() {
    const { isPro, isSubscriptionLoading } = useSubscription();
    const auth = useAuth();
    const isSetup = useProgressStore(s => s.isSetup);
    const isStoreInitialized = useProgressStore(s => s.isStoreInitialized);
    const reconcileStreakFreezes = useProgressStore(s => s.reconcileStreakFreezes);
    const clearStreakFreezes = useProgressStore(s => s.clearStreakFreezes);
    const isInitialSyncDone = useCloudSyncStore(s => s.isInitialSyncDone);

    const [toast, setToast] = useState(null);
    const lastRunDateRef = useRef(null);

    const runReconcile = useCallback(() => {
        const frozeDates = reconcileStreakFreezes(isPro);
        lastRunDateRef.current = getLocalDateStr(new Date());
        if (Array.isArray(frozeDates) && frozeDates.length > 0) {
            setToast({ count: frozeDates.length, seq: Date.now() });
        }
    }, [reconcileStreakFreezes, isPro]);

    // Streak freezes are exclusive to signed-in users: guests never earn or hold
    // them. Once the store is loaded, wipe any local inventory while signed out
    // (e.g. left over after a sign-out) so the badge disappears for guests.
    useEffect(() => {
        if (isStoreInitialized && !auth.isSignedIn) clearStreakFreezes();
    }, [isStoreInitialized, auth.isSignedIn, clearStreakFreezes]);

    // Gate: signed in, store loaded, challenge set up, subscription resolved, and
    // the initial cloud sync done (so we reconcile against the merged calendar,
    // not stale local data).
    const ready = auth.isSignedIn && isStoreInitialized && isSetup
        && !isSubscriptionLoading && isInitialSyncDone;

    useEffect(() => {
        if (!ready) return undefined;
        // Defer the first run a tick so we never setState synchronously inside the
        // effect body (the toast is a side effect of reconciliation).
        const initial = setTimeout(runReconcile, 0);
        // Detect day rollover (cheap date-string compare on a coarse interval).
        const interval = setInterval(() => {
            if (getLocalDateStr(new Date()) !== lastRunDateRef.current) runReconcile();
        }, 30000);
        return () => { clearTimeout(initial); clearInterval(interval); };
    }, [ready, runReconcile]);

    const StreakFreezeToast = useCallback(() => {
        if (!toast) return null;
        return (
            <StreakFreezeNotification
                key={toast.seq}
                count={toast.count}
                onClose={() => setToast(null)}
            />
        );
    }, [toast]);

    return { StreakFreezeToast };
}
