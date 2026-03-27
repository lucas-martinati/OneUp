import { useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { runBackHandler } from '../utils/backHandler';

/**
 * useHardwareBack Hook
 * Allows seamless chaining of modal dismissals via the Android back hardware button.
 * 
 * @param {Array} modals - Array of objects: { isOpen, close, shouldResumeSync }. Order matters for priority.
 * @param {Function} onResumeSync - Callback to resume global cloud sync if a state dictates it.
 */
export function useHardwareBack(modals, onResumeSync) {
    useEffect(() => {
        const handleBackButton = ({ canGoBack }) => {
            // Priority 1: Any imperative non-hook back handlers (popups, etc)
            if (runBackHandler()) return;
            
            // Priority 2: Walk the active UI modals and close the first active one
            for (const modal of modals) {
                if (modal.isOpen) {
                    modal.close();
                    if (modal.shouldResumeSync && onResumeSync) {
                        onResumeSync();
                    }
                    return; // Prevent further bubbling, handled
                }
            }
            
            // Fallback: If no modal is open, exit the app
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
    }, [modals, onResumeSync]);
}
