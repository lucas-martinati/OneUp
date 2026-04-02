import React, { useState, Suspense, lazy } from 'react';
import { Share2 } from 'lucide-react';
import { useShareCard } from '../hooks/useShareCard';
import { getSessionHistory } from '../services/sessionHistoryService';

const ShareModal = lazy(() => import('./ShareModal').then(m => ({ default: m.ShareModal })));

/**
 * SharePanel — shared share button + modal for session sharing.
 * Used in SessionSummary (end of workout) and SessionDetailModal (history).
 *
 * @param {Object} sessionData - { id, date, exercises, duration, name, type }
 * @param {Object} stats - computed stats for streak
 * @param {boolean} isPro - pro entitlement
 * @param {string} variant - 'large' (SessionSummary) | 'compact' (SessionDetailModal)
 */
export function SharePanel({ sessionData, stats = {}, isPro = false, variant = 'large' }) {
  const [showShare, setShowShare] = useState(false);

  const shareHook = useShareCard({
    sessionData,
    stats,
    sessionHistory: getSessionHistory(),
  });

  const isCompact = variant === 'compact';

  return (
    <>
      <button
        onClick={() => setShowShare(true)}
        className="hover-lift"
        style={{
          padding: isCompact ? '12px' : '14px 16px',
          borderRadius: isCompact ? '12px' : 'var(--radius-lg)',
          background: isCompact
            ? 'linear-gradient(135deg, #818cf8, #6366f1)'
            : 'rgba(255,255,255,0.08)',
          border: isCompact ? 'none' : '1px solid rgba(255,255,255,0.15)',
          color: 'white',
          fontSize: isCompact ? '0.85rem' : '1rem',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isCompact ? '8px' : undefined,
          flex: isCompact ? 1 : undefined,
        }}
      >
        <Share2 size={isCompact ? 16 : 20} />
        {isCompact && 'Partager'}
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
