import React, { useState, Suspense, lazy } from 'react';
import { Share2 } from '../../../utils/icons';
import { useTranslation } from 'react-i18next';
import { useShareCard } from '../hooks/useShareCard';
import { getSessionHistory } from '../services/sessionHistoryService';
import { useSubscription } from '../../../contexts/SubscriptionContext';
import { useProgressContext } from '../../../contexts/ProgressContext';
import { CATEGORIES } from '../../../config/categories';

const ShareModal = lazy(() => import('./ShareModal').then(m => ({ default: m.ShareModal })));

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
export function SharePanel({ sessionData, stats = {}, variant = 'large', mode = 'session', label, activeCategories = ['standard', 'weights', 'custom'] }) {
  const [showShare, setShowShare] = useState(false);
  const { t } = useTranslation();
  const { isPro, hadPro } = useSubscription();
  const hasProAccess = isPro || hadPro;
  const { completions, getDayNumber, settings } = useProgressContext();

  // Map Stats categories to SharePanel categories for initial state
  const categoryMap = {
      standard: CATEGORIES.BODYWEIGHT,
      weights: CATEGORIES.WEIGHTS,
      custom: CATEGORIES.CUSTOM,
  };
  const initialCategories = activeCategories
      .map(cat => categoryMap[cat])
      .filter(Boolean);

  const shareHook = useShareCard({
      sessionData,
      stats,
      sessionHistory: getSessionHistory(),
      mode,
      initialCategories: initialCategories.length > 0 ? initialCategories : [CATEGORIES.BODYWEIGHT, CATEGORIES.WEIGHTS, CATEGORIES.CUSTOM],
  });

  const isCompact = variant === 'compact';
  const isStats = variant === 'stats';

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
