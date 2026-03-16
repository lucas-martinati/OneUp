import { useState, useEffect } from 'react';
import { HeartHandshake, X } from 'lucide-react';
import { cloudSync } from '../services/cloudSync';
import { sounds } from '../utils/soundManager';

export function NotificationManager() {
    const [notifications, setNotifications] = useState([]);
    const [activeToasts, setActiveToasts] = useState([]);

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
                                
                                // Add to toasts
                                setActiveToasts(t => {
                                    const trulyNew = newNotifs.filter(n => !t.find(x => x.id === n.id));
                                    return [...t, ...trulyNew];
                                });
                                
                                // Auto-remove from DB after 5 seconds to keep it clean
                                newNotifs.forEach(n => {
                                    setTimeout(() => {
                                        cloudSync.deleteNotification(n.id);
                                        setActiveToasts(current => current.filter(toast => toast.id !== n.id));
                                    }, 5000);
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

    const dismissToast = (id) => {
        cloudSync.deleteNotification(id);
        setActiveToasts(current => current.filter(t => t.id !== id));
    };

    if (activeToasts.length === 0) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 'calc(var(--spacing-md) + env(safe-area-inset-top))',
            left: 0, right: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
            zIndex: 9999, pointerEvents: 'none'
        }}>
            {activeToasts.map(toast => (
                <div key={toast.id} className="slide-down" style={{
                    background: 'rgba(5, 5, 5, 0.95)',
                    border: '1px solid rgba(129, 140, 248, 0.3)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '12px 16px',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(129, 140, 248, 0.2)',
                    pointerEvents: 'auto',
                    maxWidth: '90%', minWidth: '280px'
                }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: toast.fromPhoto ? 'transparent' : 'linear-gradient(135deg, #6366f1, #a78bfa)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: '700', overflow: 'hidden', flexShrink: 0
                    }}>
                        {toast.fromPhoto ? (
                            <img src={toast.fromPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            toast.fromName.charAt(0).toUpperCase()
                        )}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'white' }}>
                            {toast.fromName}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <HeartHandshake size={12} /> {toast.message}
                        </div>
                    </div>

                    <button onClick={() => dismissToast(toast.id)} style={{
                        background: 'transparent', border: 'none', color: 'var(--text-secondary)',
                        padding: '4px', display: 'flex', cursor: 'pointer'
                    }}>
                        <X size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
}
