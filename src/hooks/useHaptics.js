import { useCallback } from 'react';
import { haptics } from '@utils/hapticsManager';

/**
 * React hook to trigger haptics aligned with the app's settings & platform engine.
 */
export function useHaptics() {
  const light = useCallback(() => haptics.light(), []);
  const medium = useCallback(() => haptics.medium(), []);
  const success = useCallback(() => haptics.success(), []);
  const celebrate = useCallback(() => haptics.celebrate(), []);

  return {
    light,
    medium,
    success,
    celebrate,
    impactLight: light,
    impactMedium: medium,
    notifySuccess: success,
  };
}
