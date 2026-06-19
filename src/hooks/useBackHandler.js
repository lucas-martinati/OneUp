import { useEffect } from 'react';
import { registerBackHandler } from '@utils/backHandler';

/**
 * useBackHandler Hook
 * 
 * Easily register a callback for the hardware back button.
 * The most recently registered active handler will be executed first (Stack/LIFO).
 * 
 * @param {Function} onBack - Callback that should return true if the back action was handled, false otherwise.
 * @param {Boolean} enabled - Whether the handler is currently active.
 */
export function useBackHandler(onBack, enabled = true) {
    useEffect(() => {
        if (!enabled) return;
        
        // registerBackHandler returns an unregister function
        return registerBackHandler(onBack);
    }, [onBack, enabled]);
}
