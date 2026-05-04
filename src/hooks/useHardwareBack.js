import { useEffect } from 'react';
import { runBackHandler } from '../utils/backHandler';
import { isNativePlatform } from '../utils/platform';

/**
 * useHardwareBack Hook
 * 
 * Global listener for the Capacitor hardware back button.
 * It executes the top-most registered back handler in the global stack.
 * If no handler is registered or handles the event, it exits the app.
 * 
 * @param {Function} onResumeSync - Optional callback to resume global cloud sync if needed.
 */
export function useHardwareBack(onResumeSync) {
    useEffect(() => {
        if (!isNativePlatform()) return undefined;

        let cancelled = false;

        const listenerPromise = import('@capacitor/app')
            .then(({ App: CapacitorApp }) => {
                const handleBackButton = () => {
                    // Priority 1: Check the global back handler stack (modals, panels, etc)
                    if (runBackHandler()) {
                        if (onResumeSync) onResumeSync();
                        return;
                    }

                    // Fallback: Exit the app
                    CapacitorApp.exitApp();
                };

                if (cancelled) return null;
                return CapacitorApp.addListener('backButton', handleBackButton);
            })
            .catch(err => {
                console.warn('Capacitor App plugin error:', err);
                return null;
            });

        return () => {
            cancelled = true;
            listenerPromise.then(listener => {
                if (listener && listener.remove) {
                    listener.remove();
                }
            });
        };
    }, [onResumeSync]);
}
