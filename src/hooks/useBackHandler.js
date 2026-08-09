import { useEffect, useRef } from 'react';
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
    const onBackRef = useRef(onBack);

    // Keep the ref up to date with the latest callback
    useEffect(() => {
        onBackRef.current = onBack;
    }, [onBack]);

    useEffect(() => {
        if (!enabled) return;
        
        // Register a stable wrapper function that calls the latest ref
        const handler = () => {
            if (onBackRef.current) {
                return onBackRef.current();
            }
            return false;
        };

        return registerBackHandler(handler);
    }, [enabled]); // Only re-register if 'enabled' state changes
}
