import React from 'react';
import { useTranslation } from 'react-i18next';
import { Crown, Sparkles, Dumbbell, BarChart3, Palette, Snowflake, Plus, Check } from '@utils/icons';
import { useHaptics } from '@hooks/useHaptics';
import { GradientModal } from '@components/ui/GradientModal';
import { Stack, Card, Button } from '@components/ui';

export function ProUnlockedModal({ open, onClose, onConfirm }) {
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

  const featureItems = [
    {
      key: 'custom',
      icon: Plus,
      color: '#8b5cf6',
      bg: 'rgba(139, 92, 246, 0.15)',
      title: t('pro.unlockedModal.features.custom.title'),
      desc: t('pro.unlockedModal.features.custom.desc'),
    },
    {
      key: 'weights',
      icon: Dumbbell,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.15)',
      title: t('pro.unlockedModal.features.weights.title'),
      desc: t('pro.unlockedModal.features.weights.desc'),
    },
    {
      key: 'stats',
      icon: BarChart3,
      color: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.15)',
      title: t('pro.unlockedModal.features.stats.title'),
      desc: t('pro.unlockedModal.features.stats.desc'),
    },
    {
      key: 'themes',
      icon: Palette,
      color: '#ec4899',
      bg: 'rgba(236, 72, 153, 0.15)',
      title: t('pro.unlockedModal.features.themes.title'),
      desc: t('pro.unlockedModal.features.themes.desc'),
    },
    {
      key: 'freeze',
      icon: Snowflake,
      color: '#06b6d4',
      bg: 'rgba(6, 182, 212, 0.15)',
      title: t('pro.unlockedModal.features.freeze.title'),
      desc: t('pro.unlockedModal.features.freeze.desc'),
    },
  ];

  return (
    <GradientModal
      open={open}
      onClose={onClose}
      ariaLabel="Pro Unlocked"
      maxWidth="460px"
      borderGradient="rgba(139, 92, 246, 0.35)"
      shadowGlow="rgba(139, 92, 246, 0.25)"
    >
      {/* Header Hero */}
      <Stack
        align="center"
        gap="sm"
        style={{
          padding: 'var(--space-8) var(--space-6) var(--space-5)',
          textAlign: 'center',
          background: 'radial-gradient(circle at top, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '72px',
            height: '72px',
            borderRadius: '22px',
            background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 25px rgba(168, 85, 247, 0.4), 0 0 20px rgba(255, 215, 0, 0.3)',
          }}
        >
          <Crown size={38} color="#ffd700" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }} />
          <Sparkles
            size={20}
            color="#ffffff"
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              animation: 'pulse 1.8s infinite alternate',
            }}
          />
        </div>

        <Stack gap="xs" align="center">
          <h2
            style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {t('pro.unlockedModal.title')}
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '1.05rem',
              fontWeight: 600,
              color: '#a7f3d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            {t('pro.unlockedModal.subtitle')}
          </p>
        </Stack>
      </Stack>

      {/* Scrollable Feature List */}
      <Stack
        gap="sm"
        style={{
          padding: '0 var(--space-6) var(--space-5)',
          overflowY: 'auto',
          maxHeight: '340px',
        }}
      >
        <p
          style={{
            margin: '0 0 8px',
            fontSize: '0.88rem',
            color: 'rgba(255, 255, 255, 0.75)',
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          {t('pro.unlockedModal.description')}
        </p>

        {featureItems.map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.key}
              variant="glass"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                padding: 'var(--space-3) var(--space-4)',
                transition: 'transform 0.2s ease, background 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: item.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={20} color={item.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff', marginBottom: '2px' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.35 }}>
                  {item.desc}
                </div>
              </div>
              <Check size={18} color="#a7f3d0" style={{ flexShrink: 0, marginTop: '2px' }} />
            </Card>
          );
        })}
      </Stack>

      {/* Footer CTA */}
      <div
        style={{
          padding: 'var(--space-4) var(--space-6) var(--space-6)',
          borderTop: '1px solid var(--border-default)',
          background: 'rgba(0, 0, 0, 0.2)',
        }}
      >
        <Button
          variant="ghost"
          onClick={handleConfirm}
          style={{
            width: '100%',
            padding: 'var(--space-4) var(--space-5)',
            borderRadius: 'var(--radius-lg)',
            border: 'none',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            color: '#ffffff',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(139, 92, 246, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'transform 0.15s ease, filter 0.15s ease',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <Sparkles size={18} />
          {t('pro.unlockedModal.cta')}
        </Button>
      </div>
    </GradientModal>
  );
}
