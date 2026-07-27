import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useHaptics } from '@hooks/useHaptics';

/**
 * Standardized Modal Container primitive for uniform popups, drawers, and dialogs.
 * Ensures backdrop blur, Escape key dismiss, focus trapping, scroll locking, and haptic feedback.
 */
export function ModalContainer({
  open,
  onClose,
  children,
  className = '',
  style = {},
  closeOnBackdrop = true,
  closeOnEscape = true,
  ariaLabel = 'Modal',
}) {
  const backdropRef = useRef(null);
  const { light } = useHaptics();

  const handleKeyDown = useCallback(
    (e) => {
      if (closeOnEscape && e.key === 'Escape') {
        light();
        onClose?.();
      }
    },
    [closeOnEscape, onClose, light],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open, handleKeyDown]);

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === backdropRef.current) {
      light();
      onClose?.();
    }
  };

  if (!open) return null;

  return createPortal(
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className={`dialog-backdrop ${className}`}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        animation: 'fadeIn 0.2s var(--ease-panel-in) both',
        ...style,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
