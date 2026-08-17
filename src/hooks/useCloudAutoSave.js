import { useEffect } from 'react';

export function useCloudAutoSave(isSignedIn, data, saveFn, { delay = 1000 } = {}) {
  useEffect(() => {
    if (isSignedIn) {
      const timer = setTimeout(() => { Promise.resolve(saveFn(data)).catch(() => {}); }, delay);
      return () => clearTimeout(timer);
    }
  }, [isSignedIn, data, saveFn, delay]);
}
