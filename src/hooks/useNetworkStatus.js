import { useState, useEffect } from 'react';

/**
 * Tracks the device's online/offline status.
 *
 * Sources, in order of precedence:
 *  - the browser `online` / `offline` window events (real connectivity),
 *  - `navigator.onLine` for the initial value,
 *  - a `oneup-debug-network` CustomEvent ({ detail: { online } }) so the offline
 *    indicator can be emulated from the OneUp debug console without actually
 *    pulling the network (see window.oneupDebug.offline / .online).
 *
 * @returns {boolean} whether the device currently has connectivity.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  );

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    const handleDebug = (e) => setIsOnline(!!e.detail?.online);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    window.addEventListener('oneup-debug-network', handleDebug);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('oneup-debug-network', handleDebug);
    };
  }, []);

  return isOnline;
}
