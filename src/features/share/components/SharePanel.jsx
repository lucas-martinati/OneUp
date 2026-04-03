import React, { useState, Suspense, lazy } from 'react';
import { Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useShareCard } from '../hooks/useShareCard';
import { getSessionHistory } from '../services/sessionHistoryService';
import { useSettings } from '../../../hooks/useSettings';

const ShareModal = lazy(() => import('./ShareModal').then(m => ({ default: m.ShareModal })));

/**
 * SharePanel — shared share button + modal for session or global stats sharing.
 * Used in SessionSummary, SessionDetailModal, and Stats.
 *
 * @param {Object} props
 * @param {Object} props.sessionData - { id, date, exercises, duration, name, type }
 * @param {Object} props.stats - computed stats for streak
 * @param {boolean} props.isPro - pro entitlement
 * @param {string} props.variant - 'large' | 'compact' | 'stats'
 * @param {string} props.mode - 'session' | 'global'
 * @param {string} props.label - button label (for 'stats' variant)
 * @param {Function} props.updateSettings - settings updater for achievement tracking
 */
export function SharePanel({ sessionData, stats = {}, isPro = false, variant = 'large', mode = 'session', label, updateSettings: propUpdateSettings }) {
  const [showShare, setShowShare] = useState(false);
  const { t } = useTranslation();
  const { settings, updateSettings: contextUpdateSettings } = useSettings();
  
  const updateSettings = propUpdateSettings || contextUpdateSettings;

  const handleShareClick = () => {
    if (!settings?.hasSharedFirstTime) {
      updateSettings({ hasSharedFirstTime: true });
    }
    setShowShare(true);
  };

  const shareHook = useShareCard({
    sessionData,
    stats,
    sessionHistory: getSessionHistory(),
    mode,
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
    ? t('share.shareCard', 'Partager mes statistiques')
    : isCompact ? t('share.share', 'Partager') : undefined;

  return (
    <>
      <button
        onClick={handleShareClick}
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
            isPro={isPro}
          />
        )}
      </Suspense>
    </>
  );
}
