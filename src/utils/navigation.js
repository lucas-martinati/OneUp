import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

/**
 * Cleanly opens a legal page (privacy policy or terms of service) inside the Capacitor app browser,
 * or in a new browser tab/window on standard web/PWA platform.
 * 
 * @param {'privacy' | 'terms'} type - The type of legal page to open.
 */
export async function openLegalPage(type) {
    if (type !== 'privacy' && type !== 'terms') {
        console.error(`Invalid legal page type: ${type}`);
        return;
    }

    const filename = type === 'privacy' ? 'privacy.html' : 'terms.html';
    // Clean, robust URL resolution relative to the current app origin/path
    const url = new URL(filename, window.location.href).href;

    if (Capacitor.isNativePlatform()) {
        try {
            await Browser.open({ url });
        } catch (error) {
            console.error('Failed to open legal page in Capacitor Browser:', error);
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    } else {
        window.open(url, '_blank', 'noopener,noreferrer');
    }
}
