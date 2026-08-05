import React from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, BarChart3, CheckCircle2, RefreshCw } from '@utils/icons';
import { useHaptics } from '@hooks/useHaptics';
import { GradientModal } from '@components/ui/GradientModal';

export function ProExpiredModal({ open, onClose, onConfirm, onReSubscribe }) {
  const { t } = useTranslation();
  const { light } = useHaptics();

  if (!open) return null;

  const handleConfirm = (action) => {
    light();
    if (onConfirm) {
      onConfirm();
    } else {
      onClose?.();
    }
    if (action === 'renew' && onReSubscribe) {
      onReSubscribe();
    }
  };

  return (
    <GradientModal
      open={open}
      onClose={onClose}
      ariaLabel="Pro Expired"
      borderGradient="rgba(239, 68, 68, 0.3)"
      shadowGlow="rgba(239, 68, 68, 0.15)"
    >
      {/* Hero Header */}
      <div
        style={{
          padding: '32px 24px 16px',
          textAlign: 'center',
          background: 'radial-gradient(circle at top, rgba(239, 68, 68, 0.2) 0%, transparent 70%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.3) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(239, 68, 68, 0.2)',
          }}
        >
          <Clock size={36} color="#fca5a5" />
        </div>

        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
            {t('pro.expiredModal.title', 'Votre accès Pro a expiré')}
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: '0.92rem', color: 'rgba(255, 255, 255, 0.7)' }}>
            {t('pro.expiredModal.subtitle', 'Votre abonnement s\'est terminé, mais pas d\'inquiétude !')}
          </p>
        </div>
      </div>

      {/* Reassurance Info Cards */}
      <div style={{ padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div
          style={{
            padding: '14px',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <BarChart3 size={22} color="#60a5fa" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.4 }}>
            <strong>{t('pro.expiredModal.statsTitle', 'Accès à vos statistiques :')}</strong>{' '}
            {t('pro.expiredModal.statsDesc', 'Vous pouvez toujours consulter l\'ensemble de vos statistiques et progressions dans le panneau Stats.')}
          </div>
        </div>

        <div
          style={{
            padding: '14px',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <CheckCircle2 size={22} color="#a7f3d0" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.4 }}>
            <strong>{t('pro.expiredModal.repsTitle', 'Répétitions conservées :')}</strong>{' '}
            {t('pro.expiredModal.repsDesc', 'Toutes vos répétitions et séances déjà effectuées restent comptabilisées dans votre historique.')}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div
        style={{
          padding: '16px 24px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          background: 'rgba(0, 0, 0, 0.2)',
        }}
      >
        {onReSubscribe && (
          <button
            onClick={() => handleConfirm('renew')}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '16px',
              border: 'none',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              color: '#ffffff',
              fontSize: '0.98rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(139, 92, 246, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <RefreshCw size={18} />
            {t('pro.expiredModal.renewCta', 'Renouveler mon abonnement Pro')}
          </button>
        )}

        <button
          onClick={() => handleConfirm('dismiss')}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '14px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            background: 'transparent',
            color: 'rgba(255, 255, 255, 0.75)',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {t('pro.expiredModal.dismissCta', 'Continuer en version gratuite')}
        </button>
      </div>
    </GradientModal>
  );
}
