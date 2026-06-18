import { useState, useEffect, useCallback } from 'react';
import { HeartHandshake, X } from '../../utils/icons';
import { sounds } from '../../utils/soundManager';
import { cloudSync } from '../../services/cloudSync';
import { Avatar } from '../ui/Avatar';
import { Z_INDEX } from '../../utils/zIndex';
import { useToastGestures } from '../../hooks/useToastGestures';
import styles from './NotificationManager.module.css';

/**
 * A single poke toast. The auto-dismiss timer + swipe-to-dismiss gesture are
 * shared with the achievement toast via useToastGestures; this component owns
 * only the poke-specific markup. `onDone` fires after the exit transition.
 */
function PokeToast({ toast, onDone }) {
    const { exit, dismiss, cardProps } = useToastGestures({
        onClose: () => onDone(toast.id),
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

            {!exit && <span className={styles.progress} />}
        </div>
    );
}

export function NotificationManager() {
    const [, setNotifications] = useState([]);
    const [activeToasts, setActiveToasts] = useState([]);

    const dismiss = useCallback((id) => {
        // Debug-injected pokes have no Firestore document to delete.
        if (!String(id).startsWith('debug-')) cloudSync.deleteNotification(id);
        setActiveToasts(current => current.filter(t => t.id !== id));
    }, []);

    // Debug: window.oneupDebug.poke() injects a fake poke toast without Firestore.
    useEffect(() => {
        const handler = (e) => {
            const d = e.detail || {};
            setActiveToasts(t => [...t, {
                id: `debug-${Date.now()}`,
                fromName: d.fromName || 'Debug',
                fromPhoto: d.fromPhoto || null,
                message: d.message || '👋 Poke de test !',
            }]);
            try { sounds.poke(); } catch { /* sound optional */ }
        };
        window.addEventListener('oneup-debug-poke', handler);
        return () => window.removeEventListener('oneup-debug-poke', handler);
    }, []);

    useEffect(() => {
        // Only start listening if user is signed in
        let unsubscribe = null;
        let isCancelled = false;

        const checkAndListen = async () => {
            const status = await cloudSync.checkSignInStatus();
            if (isCancelled) return;

            if (status.isSignedIn) {
                unsubscribe = cloudSync.listenToNotifications((notifs) => {
                    // Filter specifically unread
                    const unread = notifs.filter(n => !n.read);
                    if (unread.length > 0) {
                        setNotifications(prev => {
                            // Only add new ones to prevent duplicate toasts
                            const newNotifs = unread.filter(n => !prev.find(p => p.id === n.id));
                            if (newNotifs.length > 0) {
                                // Play sound for incoming nudges
                                sounds.poke(); // Using poke sound

                                // Add to toasts (each toast self-dismisses)
                                setActiveToasts(t => {
                                    const trulyNew = newNotifs.filter(n => !t.find(x => x.id === n.id));
                                    return [...t, ...trulyNew];
                                });
                            }
                            return unread;
                        });
                    }
                });
            }
        };

        checkAndListen();

        // Also listen to auth changes to start/stop listening
        const authUnsub = cloudSync.subscribe((state) => {
            if (state.isSignedIn && !unsubscribe) {
                checkAndListen();
            } else if (!state.isSignedIn && unsubscribe) {
                unsubscribe();
                unsubscribe = null;
                setNotifications([]);
                setActiveToasts([]);
            }
        });

        return () => {
            isCancelled = true;
            if (unsubscribe) unsubscribe();
            authUnsub();
        };
    }, []);

    if (activeToasts.length === 0) return null;

    return (
        <div className={styles.stack} style={{ zIndex: Z_INDEX.DELETE_OVERLAY }}>
            {activeToasts.map(toast => (
                <PokeToast key={toast.id} toast={toast} onDone={dismiss} />
            ))}
        </div>
    );
}
