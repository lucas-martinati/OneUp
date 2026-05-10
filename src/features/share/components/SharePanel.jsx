import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { Share2 } from '../../../utils/icons';
import { useTranslation } from 'react-i18next';
import { useShareCard } from '../hooks/useShareCard';
import { getSessionHistory } from '../services/sessionHistoryService';
import { useSubscription } from '../../../contexts/SubscriptionContext';
import { useProgressStore } from '../../../store/useProgressStore';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { useBackHandler } from '../../../hooks/useBackHandler';
import { CATEGORIES } from '../../../config/categories';

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
  const { isPro, hadPro } = useSubscription();
  const hasProAccess = isPro || hadPro;
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

  const buttonStyle = isStats ? {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    padding: '14px', borderRadius: 'var(--radius-lg)',
    background: 'linear-gradient(135deg, rgba(129,140,248,0.15), rgba(139,92,246,0.1))',
    border: '1px solid rgba(129,140,248,0.2)',
    color: '#818cf8', fontSize: '0.9rem', fontWeight: 700,
    cursor: 'pointer', width: '100%',
  } : isCompact ? {
    padding: '12px', borderRadius: '12px',
    background: 'linear-gradient(135deg, #818cf8, #6366f1)',
    border: 'none', color: 'white', fontSize: '0.85rem', fontWeight: 700,
    cursor: 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: '8px', flex: 1,
  } : {
    padding: '14px 16px', borderRadius: 'var(--radius-lg)',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: 'white', fontSize: '1rem', fontWeight: 700,
    cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  };

  const defaultLabel = isStats
    ? t('share.shareCard')
    : isCompact ? t('common.share') : undefined;

  return (
    <>
      <button
        onClick={() => setShowShare(true)}
        className="hover-lift"
        style={buttonStyle}
      >
        <Share2 size={isCompact ? 16 : isStats ? 18 : 20} />
        {(label || defaultLabel)}
      </button>

      <Suspense fallback={null}>
        {showShare && (
          <ShareModal
            shareHook={shareHook}
            onClose={() => setShowShare(false)}
            isPro={hasProAccess}
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
