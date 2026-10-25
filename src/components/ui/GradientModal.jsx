import { CloseButton } from './CloseButton';
import React from 'react';
import { ModalContainer } from '@components/ui/ModalContainer';
import { useHaptics } from '@hooks/useHaptics';

export function GradientModal({ open, onClose, ariaLabel, maxWidth = '440px', borderGradient = 'rgba(139, 92, 246, 0.35)', shadowGlow = 'rgba(139, 92, 246, 0.25)', children }) {
  const { light } = useHaptics();

  if (!open) return null;

  const handleClose = () => {
    light();
    onClose?.();
  };

  return (
    <ModalContainer open={open} onClose={handleClose} ariaLabel={ariaLabel} position="center" unstyled>
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
        <CloseButton
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 10,
          }}
        />

        {children}
      </div>
    </ModalContainer>
  );
}
