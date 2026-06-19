import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { HeartHandshake, X } from '@utils/icons';
import { sounds } from '@utils/soundManager';
import { cloudSync } from '@services/cloudSync';
import { Avatar } from '../ui/Avatar';
import { useToastGestures } from '@hooks/useToastGestures';
import { getToastRoot } from '../feedback/toastRoot';
import styles from './NotificationManager.module.css';

/**
 * A single poke toast — one per sender. The auto-dismiss timer + swipe gesture
 * are shared with the achievement toast via useToastGestures; receiving another
 * poke from the same person bumps `count` (re-animated) and restarts the timer.
 * `onDone` fires with the toast key after the exit transition.
 */
function PokeToast({ toast, onDone }) {
    const { exit, dismiss, cardProps } = useToastGestures({
        onClose: () => onDone(toast.key),
    });

    return (
        <div
            className={`${styles.toast} ${styles.toastIn}`}
            {...cardProps}
            role="alert"
        >
            <div className={styles.avatarWrap}>
                <Avatar photoURL={toast.fromPhoto} name={toast.fromName} size={40} />
                <span className={styles.iconBadge}>
                    <HeartHandshake size={12} />
                </span>
                {toast.count > 1 && (
                    <span key={toast.count} className={styles.countBadge}>
                        ×{toast.count}
                    </span>
                )}
            </div>

            <div className={styles.body}>
                <div className={styles.name}>{toast.fromName}</div>
                <div className={styles.message}>{toast.message}</div>
            </div>

            <button
                className={styles.close}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); dismiss(); }}
                aria-label="dismiss"
            >
                <X size={16} />
            </button>

            {!exit && <span key={toast.count} className={styles.progress} />}
        </div>
    );
}

export function NotificationManager() {
    const [activeToasts, setActiveToasts] = useState([]);
    // Last seen count per sender id — lets us play a sound only on a genuinely
    // new poke or an incremented count, not on every (re)render of the node.
    const seenCounts = useRef(new Map());
    // Senders dismissed locally, hidden until their node is actually deleted.
    const dismissed = useRef(new Set());

    const dismiss = useCallback((key) => {
        dismissed.current.add(key);
        setActiveToasts(current => current.filter(t => t.key !== key));
        // Debug pokes are local-only; real ones delete their aggregated node.
        if (!String(key).startsWith('debug-')) cloudSync.deleteNotification(key);
    }, []);

    const handlePokeEvent = useCallback((e) => {
        const d = e.detail || {};
        const name = d.fromName || 'Debug';
        const key = `debug-${name}`;
        dismissed.current.delete(key);
        setActiveToasts(prev => {
            const existing = prev.find(t => t.key === key);
            if (existing) {
                return prev.map(t => t.key === key
                    ? { ...t, count: t.count + 1, message: d.message || t.message }
                    : t);
            }
            return [...prev, {
                key, fromName: name, fromPhoto: d.fromPhoto || null,
                message: d.message || '👋 Poke de test !', count: 1,
            }];
        });
        try { sounds.poke(); } catch { /* sound optional */ }
    }, []);

    const handleNotifs = useCallback((notifs) => {
        // count defaults to 1 so legacy (pre-aggregation) nodes still show.
        const unread = notifs.filter(n => !n.read);
        const liveIds = new Set(unread.map(n => n.id));

        // Forget state for nodes that are gone, so a future poke from the
        // same person surfaces (and chimes) again.
        for (const id of [...dismissed.current]) {
            if (!String(id).startsWith('debug-') && !liveIds.has(id)) dismissed.current.delete(id);
        }
        for (const id of [...seenCounts.current.keys()]) {
            if (!liveIds.has(id)) seenCounts.current.delete(id);
        }

        // Chime once if any non-dismissed sender is new or poked again.
        let chime = false;
        for (const n of unread) {
            const count = n.count || 1;
            const prev = seenCounts.current.get(n.id);
            if (!dismissed.current.has(n.id) && (prev === undefined || count > prev)) chime = true;
            seenCounts.current.set(n.id, count);
        }
        if (chime) { try { sounds.poke(); } catch { /* sound optional */ } }

        // Toasts mirror the live nodes (minus dismissed); debug toasts are
        // local-only so we preserve them across listener updates.
        setActiveToasts(prev => {
            const debugToasts = prev.filter(t => String(t.key).startsWith('debug-'));
            const dbToasts = unread
                .filter(n => !dismissed.current.has(n.id))
                .map(n => ({
                    key: n.id, fromName: n.fromName, fromPhoto: n.fromPhoto,
                    message: n.message, count: n.count || 1,
                }));
            return [...dbToasts, ...debugToasts];
        });
    }, []);

    // Debug: window.oneupDebug.poke() injects a fake, local-only poke.
    useEffect(() => {
        window.addEventListener('oneup-debug-poke', handlePokeEvent);
        return () => window.removeEventListener('oneup-debug-poke', handlePokeEvent);
    }, [handlePokeEvent]);

    useEffect(() => {
        // A single notifications listener, attached synchronously so the auth
        // state replay can't race us into attaching twice (double sounds).
        let unsubscribe = null;

        const attach = () => {
            if (unsubscribe) return; // already listening
            unsubscribe = cloudSync.listenToNotifications(handleNotifs);
        };

        const detach = () => {
            if (unsubscribe) { unsubscribe(); unsubscribe = null; }
        };

        // subscribe() replays the current auth state immediately, so this both
        // bootstraps (if already signed in) and reacts to later auth changes.
        const authUnsub = cloudSync.subscribe((state) => {
            if (state.isSignedIn) {
                attach();
            } else {
                detach();
                seenCounts.current.clear();
                dismissed.current.clear();
                setActiveToasts([]);
            }
        });

        return () => {
            detach();
            authUnsub();
        };
    }, [handleNotifs]);

    if (activeToasts.length === 0) return null;

    // Portal into the shared toast stack (below achievement toasts) so all
    // toasts share one flex column and reflow when any of them disappears.
    return createPortal(
        <div className={styles.stack} style={{ order: 1 }}>
            {activeToasts.map(toast => (
                // Include count in the key so a new poke from the same person
                // remounts the toast: timer resets, the ×N badge re-animates,
                // and a poke arriving mid-exit shows a fresh toast.
                <PokeToast key={`${toast.key}-${toast.count}`} toast={toast} onDone={dismiss} />
            ))}
        </div>,
        getToastRoot()
    );
}
