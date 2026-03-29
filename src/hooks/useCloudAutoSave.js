import { useEffect } from 'react';

export function useCloudAutoSave(isSignedIn, data, saveFn, { delay = 1000 } = {}) {
  useEffect(() => {
    if (isSignedIn) {
      const timer = setTimeout(() => { saveFn(data); }, delay);
      return () => clearTimeout(timer);
    }
  }, [isSignedIn, data, saveFn, delay]);
}
