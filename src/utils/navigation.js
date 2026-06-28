import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { APP_URL } from '@config/app';

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
    
    // On native platforms, resolve against the configured public APP_URL to avoid opening localhost
    let base = window.location.href;
    if (Capacitor.isNativePlatform()) {
        if (!APP_URL) {
            console.warn('Configuration warning: APP_URL is not defined. Falling back to window.location.href.');
        } else {
            base = APP_URL.endsWith('/') ? APP_URL : `${APP_URL}/`;
        }
    }
    const url = new URL(filename, base).href;

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
