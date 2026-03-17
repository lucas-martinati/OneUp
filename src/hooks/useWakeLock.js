import { useEffect, useRef } from 'react';

/**
 * Hook to request a Screen Wake Lock to prevent the device from sleeping.
 * Uses the Web Screen Wake Lock API.
 */
export function useWakeLock() {
  const wakeLock = useRef(null);

  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLock.current = await navigator.wakeLock.request('screen');
        console.log('Screen Wake Lock is active');
        
        wakeLock.current.addEventListener('release', () => {
          console.log('Screen Wake Lock was released');
        });
      } catch (err) {
        console.warn(`${err.name}, ${err.message}`);
      }
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLock.current !== null) {
      try {
        await wakeLock.current.release();
        wakeLock.current = null;
      } catch (err) {
        console.warn(`${err.name}, ${err.message}`);
      }
    }
  };

  useEffect(() => {
    requestWakeLock();

    // Re-request wake lock if visibility changes (e.g. app comes back from background)
    const handleVisibilityChange = () => {
      if (wakeLock.current !== null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      releaseWakeLock();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}
