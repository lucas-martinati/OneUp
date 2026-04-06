import { useCallback } from 'react';
import { useProgressContext } from '../contexts/ProgressContext';
import { useAchievementToast } from './useAchievementToast';

/**
 * Hook that centralizes the share success logic.
 * Replaces the prop drilling of setHasShared, showAchievement, hasShared
 * across Dashboard → Stats → SessionDetailModal → ShareModal.
 *
 * Usage:
 *   const { hasShared, handleShareSuccess, AchievementToast } = useShareSuccess(onToastClick);
 */
export function useShareSuccess(onToastClick) {
  const { hasShared, setHasShared } = useProgressContext();
  const { showAchievement, AchievementToast } = useAchievementToast(onToastClick);

  const handleShareSuccess = useCallback(() => {
    if (!hasShared) {
      setHasShared();
      showAchievement('first_share');
    }
  }, [hasShared, setHasShared, showAchievement]);

  return {
    hasShared,
    handleShareSuccess,
    showAchievement,
    AchievementToast,
  };
}
