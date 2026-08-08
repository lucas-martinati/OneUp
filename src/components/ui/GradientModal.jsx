import React from 'react';
import { ModalContainer } from '@components/ui/ModalContainer';
import { X } from '@utils/icons';
import { useHaptics } from '@hooks/useHaptics';
import { Button } from './Button';

export function GradientModal({ open, onClose, ariaLabel, maxWidth = '440px', borderGradient = 'rgba(139, 92, 246, 0.35)', shadowGlow = 'rgba(139, 92, 246, 0.25)', children }) {
  const { light } = useHaptics();

  if (!open) return null;

  const handleClose = () => {
    light();
    onClose?.();
  };

  return (
    <ModalContainer open={open} onClose={handleClose} ariaLabel={ariaLabel}>
      <div
        style={{
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(145deg, rgba(26, 20, 42, 0.95), rgba(15, 12, 28, 0.98))',
          border: `1px solid ${borderGradient}`,
          boxShadow: `0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px ${shadowGlow}`,
          borderRadius: '24px',
          overflow: 'hidden',
          position: 'relative',
          color: '#ffffff',
        }}
      >
        <Button
          variant="ghost"
          onClick={handleClose}
          aria-label="Fermer"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 10,
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255, 255, 255, 0.7)',
            cursor: 'pointer',
          }}
        >
          <X size={18} />
        </Button>

        {children}
      </div>
    </ModalContainer>
  );
}
