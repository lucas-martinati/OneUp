import { useEffect } from 'react';
import { registerSW } from 'virtual:pwa-register';

/**
 * PWAReloadHandler
 * 
 * Handles automatic service worker updates and page reloads.
 * When a new service worker takes control (new version), it triggers a full page reload.
 */
export function PWAReloadHandler() {
  useEffect(() => {
    // Only run in production and if serviceWorker is supported
    if (import.meta.env.DEV || !('serviceWorker' in navigator)) {
      return;
    }

    const intervalMS = 60 * 60 * 1000; // 1 hour

    registerSW({
      onRegisteredSW(swUrl, r) {
        if (r) {
          // Periodically check for updates
          setInterval(() => {
            if (r.installing || !navigator.onLine) return;
            r.update();
          }, intervalMS);
        }
      },
      onNeedRefresh() {
        console.log('New content available, waiting for controller change...');
      },
      onOfflineReady() {
        console.log('App ready to work offline');
      }
    });

    // Listen for the controllerchange event.
    // This event is fired when a new service worker takes control of the page.
    // This is the most reliable way to detect when a new version is ready.
    let refreshing = false;
    const handleControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  return null; // This component doesn't render anything
}
