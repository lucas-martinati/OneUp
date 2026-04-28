import { useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { runBackHandler } from '../utils/backHandler';

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
        const handleBackButton = () => {
            // Priority 1: Check the global back handler stack (modals, panels, etc)
            if (runBackHandler()) {
                if (onResumeSync) onResumeSync();
                return;
            }
            
            // Fallback: Exit the app
            CapacitorApp.exitApp();
        };

        const listenerPromise = CapacitorApp.addListener('backButton', handleBackButton)
            .catch(err => {
                console.warn('Capacitor App plugin error:', err);
                return null;
            });

        return () => {
            listenerPromise.then(listener => {
                if (listener && listener.remove) {
                    listener.remove();
                }
            });
        };
    }, [onResumeSync]);
}
