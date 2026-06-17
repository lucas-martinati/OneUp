import { useState, useEffect, useCallback, useRef } from 'react';
import { HeartHandshake, X } from '../../utils/icons';
import { sounds } from '../../utils/soundManager';
import { cloudSync } from '../../services/cloudSync';
import { Avatar } from '../ui/Avatar';
import { Z_INDEX } from '../../utils/zIndex';
import styles from './NotificationManager.module.css';

const AUTO_DISMISS_MS = 5000;
const SWIPE_THRESHOLD = 80; // px before a release flings the toast away
const FADE_DISTANCE = 220;  // px of drag that fades the toast to ~0.4 opacity

/**
 * A single poke toast. Owns its auto-dismiss timer plus swipe-to-dismiss:
 * the card follows the finger horizontally and, once dragged past the
 * threshold, flies off-screen; otherwise it springs back. `onDone` is fired
 * once, after the exit transition completes.
 */
function PokeToast({ toast, onDone }) {
    const [dragX, setDragX] = useState(0);
    const [exit, setExit] = useState(null); // null | 'up' | 'left' | 'right'
    const [animate, setAnimate] = useState(false);

    const startX = useRef(0);
    const dragging = useRef(false);
    const moved = useRef(false);
    const done = useRef(false);
    const autoTimer = useRef(null);

    const clearAuto = useCallback(() => {
        if (autoTimer.current) { clearTimeout(autoTimer.current); autoTimer.current = null; }
    }, []);

    const closeUp = useCallback(() => {
        clearAuto();
        setAnimate(true);
        setExit('up');
    }, [clearAuto]);

    useEffect(() => {
        autoTimer.current = setTimeout(closeUp, AUTO_DISMISS_MS);
        return clearAuto;
    }, [closeUp, clearAuto]);

    const onPointerDown = (e) => {
        if (exit) return;
        clearAuto();
        dragging.current = true;
        moved.current = false;
        startX.current = e.clientX;
        setAnimate(false);
        e.currentTarget.setPointerCapture?.(e.pointerId);
    };

    const onPointerMove = (e) => {
        if (!dragging.current) return;
        const dx = e.clientX - startX.current;
        if (Math.abs(dx) > 4) moved.current = true;
        setDragX(dx);
    };

    const onPointerUp = () => {
        if (!dragging.current) return;
        dragging.current = false;
        setAnimate(true);

        if (!moved.current) { closeUp(); return; } // tap to dismiss

        if (Math.abs(dragX) > SWIPE_THRESHOLD) {
            setExit(dragX < 0 ? 'left' : 'right');
        } else {
            setDragX(0); // spring back
        }
    };

    const handleTransitionEnd = (e) => {
        if (exit && e.propertyName === 'transform' && !done.current) {
            done.current = true;
            onDone(toast.id);
        }
    };

    let transform, opacity;
    if (exit === 'up') { transform = 'translateY(-16px) scale(0.96)'; opacity = 0; }
    else if (exit === 'left') { transform = 'translateX(-120%)'; opacity = 0; }
    else if (exit === 'right') { transform = 'translateX(120%)'; opacity = 0; }
    else {
        transform = `translateX(${dragX}px)`;
        opacity = 1 - Math.min(Math.abs(dragX) / FADE_DISTANCE, 0.6);
    }

    return (
        <div
            className={`${styles.toast} ${styles.toastIn}`}
            style={{
                transform,
                opacity,
                transition: animate ? 'transform 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.28s ease' : 'none',
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onTransitionEnd={handleTransitionEnd}
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
                onClick={(e) => { e.stopPropagation(); closeUp(); }}
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
        cloudSync.deleteNotification(id);
        setActiveToasts(current => current.filter(t => t.id !== id));
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
