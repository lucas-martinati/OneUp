import React from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Sparkles, Award } from '@utils/icons';
import { useHaptics } from '@hooks/useHaptics';
import { GradientModal } from '@components/ui/GradientModal';
import { Button } from '@components/ui';

export function SupporterUnlockedModal({ open, onClose, onConfirm }) {
  const { t } = useTranslation();
  const { light } = useHaptics();

  if (!open) return null;

  const handleConfirm = () => {
    light();
    if (onConfirm) {
      onConfirm();
    } else {
      onClose?.();
    }
  };

  return (
    <GradientModal
      open={open}
      onClose={onClose}
      ariaLabel="Supporter Unlocked"
      borderGradient="rgba(239, 68, 68, 0.35)"
      shadowGlow="rgba(239, 68, 68, 0.25)"
    >
      {/* Hero Header */}
      <div
        style={{
          padding: '32px 24px 20px',
          textAlign: 'center',
          background: 'radial-gradient(circle at top, rgba(239, 68, 68, 0.3) 0%, transparent 70%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '72px',
            height: '72px',
            borderRadius: '22px',
            background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 25px rgba(239, 68, 68, 0.45)',
          }}
        >
          <Heart size={38} color="#ffffff" fill="#ffffff" />
          <Sparkles
            size={20}
            color="#ffd700"
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              animation: 'pulse 1.8s infinite alternate',
            }}
          />
        </div>

        <div>
          <h2
            style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #ffffff 0%, #fca5a5 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {t('supporter.unlockedModal.title', 'Un Grand Merci !')}
          </h2>
          <p
            style={{
              margin: '6px 0 0',
              fontSize: '1.05rem',
              fontWeight: 600,
              color: '#fca5a5',
            }}
          >
            {t('supporter.unlockedModal.subtitle', 'Vous êtes désormais Membre Supporteur ❤️')}
          </p>
        </div>
      </div>

      {/* Benefits Overview */}
      <div style={{ padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ margin: '0 0 4px', fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center', lineHeight: 1.4 }}>
          {t('supporter.unlockedModal.description', 'Votre soutien permet de faire vivre et évoluer OneUp de manière indépendante. Voici ce que vous avez débloqué :')}
        </p>

        <div
          style={{
            padding: '12px 14px',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Heart size={20} color="#ef4444" fill="#ef4444" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
              {t('supporter.unlockedModal.badgeTitle', 'Badge Supporteur Exclusif')}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.65)' }}>
              {t('supporter.unlockedModal.badgeDesc', 'Affiché fièrement sur votre profil et vos interactions.')}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '12px 14px',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Award size={20} color="#f59e0b" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
              {t('supporter.unlockedModal.indieTitle', 'Soutien au Développement Indépendant')}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.65)' }}>
              {t('supporter.unlockedModal.indieDesc', 'Vous aidez directement à financer les serveurs et les futures fonctionnalités.')}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Button */}
      <div
        style={{
          padding: '16px 24px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 0, 0, 0.2)',
        }}
      >
        <Button
          variant="ghost"
          onClick={handleConfirm}
          style={{
            width: '100%',
            padding: '14px 20px',
            borderRadius: '16px',
            border: 'none',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: '#ffffff',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(239, 68, 68, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <Sparkles size={18} />
          {t('supporter.unlockedModal.cta', 'C\'est un plaisir !')}
        </Button>
      </div>
    </GradientModal>
  );
}
