import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { Share2 } from '@utils/icons';
import { useTranslation } from 'react-i18next';
import { useShareCard } from '@features/share/hooks/useShareCard';
import { getSessionHistory } from '@features/share/services/sessionHistoryService';
import { useSubscription } from '@contexts/SubscriptionContext';
import { useProgressStore } from '@store/useProgressStore';
import { useSettingsStore } from '@store/useSettingsStore';
import { useBackHandler } from '@hooks/useBackHandler';
import { CATEGORIES } from '@config/categories';
import { Button } from '@components/ui';

const ShareModal = lazy(() => import('./ShareModal').then(m => ({ default: m.ShareModal })));

const DEFAULT_ACTIVE_CATEGORIES = ['standard', 'weights', 'custom'];

/**
 * SharePanel — shared share button + modal for session or global stats sharing.
 * Used in SessionSummary, SessionDetailModal, and Stats.
 *
 * Now consumes isPro from SubscriptionContext directly.
 * 
 * @param {Object} params
 * @param {Object} params.sessionData - { date, exercises, duration, name, type }
 * @param {Object} params.stats - computed stats from useComputedStats
 * @param {string} params.variant - 'large' | 'compact' | 'stats'
 * @param {string} params.mode - 'session' | 'global'
 * @param {Array} params.activeCategories - ['standard', 'weights', 'custom'] from Stats filters
 */
export function SharePanel({ 
    sessionData, 
    stats = {}, 
    variant = 'large', 
    mode = 'session', 
    label, 
    activeCategories = DEFAULT_ACTIVE_CATEGORIES 
}) {
  const [showShare, setShowShare] = useState(false);
  const { t } = useTranslation();
  const { isPro } = useSubscription();
  const completions = useProgressStore(s => s.completions);
  const getDayNumber = useProgressStore(s => s.getDayNumber);
  const settings = useSettingsStore(s => s.settings);

  const mappedCategories = useMemo(() => {
    const categoryMap = {
        standard: CATEGORIES.BODYWEIGHT,
        weights: CATEGORIES.WEIGHTS,
        custom: CATEGORIES.CUSTOM,
        cardio: CATEGORIES.CARDIO,
    };
    const mapped = activeCategories
        .map(cat => categoryMap[cat] || cat) // Pass through user category IDs (cat_xxx) as-is
        .filter(Boolean);
    return mapped.length > 0 ? mapped : [CATEGORIES.BODYWEIGHT, CATEGORIES.WEIGHTS, CATEGORIES.CUSTOM, CATEGORIES.CARDIO];
  }, [activeCategories]);

  const shareHook = useShareCard({
      sessionData,
      stats,
      sessionHistory: getSessionHistory(),
      mode,
      initialCategories: mappedCategories,
      isPro,
  });

  const { setOption } = shareHook;

  // Keep share modal categories in sync with Stats filter changes
  useEffect(() => {
    // Only sync if in global mode or if categories were explicitly provided (not using defaults)
    // This avoids redundant updates in session mode where we prefer the local session context
    if (mode === 'global' || activeCategories !== DEFAULT_ACTIVE_CATEGORIES) {
      setOption('statsCategories', mappedCategories);
    }
  }, [mappedCategories, setOption, mode, activeCategories]);

  const isCompact = variant === 'compact';
  const isStats = variant === 'stats';

  // Handle back button to close share modal
  useBackHandler(() => {
    if (showShare) {
      setShowShare(false);
      return true;
    }
    return false;
  }, showShare);

  // All placements reuse the canonical Button primitive:
  // stats → full-width primary CTA, compact → primary stretched in a footer
  // row, large (default) → icon-only secondary next to a main CTA.
  let defaultLabel;
  let btnProps = { variant: 'secondary', 'aria-label': t('common.share') };
  if (isStats) {
    defaultLabel = t('share.shareCard');
    btnProps = { fullWidth: true };
  } else if (isCompact) {
    defaultLabel = t('common.share');
    btnProps = { style: { flex: 1 } };
  }

  return (
    <>
      <Button icon={Share2} onClick={() => setShowShare(true)} {...btnProps}>
        {label || defaultLabel}
      </Button>

      <Suspense fallback={null}>
        {showShare && (
          <ShareModal
            shareHook={shareHook}
            onClose={() => setShowShare(false)}
            isPro={isPro}
            mode={mode}
            completions={completions}
            getDayNumber={getDayNumber}
            settings={settings}
          />
        )}
      </Suspense>
    </>
  );
}
