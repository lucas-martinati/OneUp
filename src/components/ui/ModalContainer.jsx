import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useHaptics } from '@hooks/useHaptics';
import { useBackHandler } from '@hooks/useBackHandler';

/**
 * Composant ModalContainer unifié.
 * - Gère le backdrop (flou, clic pour fermer, escape).
 * - Définit la carte de la modale avec background, limites de taille et espacement.
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
  // Nouveaux paramètres selon la demande :
  showScrollbar = true,
  maxWidth = 'var(--panel-max-width, 640px)',
  // 'fullscreen' utilise modal-overlay (prend toute la page), 'center' utilise dialog-backdrop (centré)
  position = 'fullscreen', 
  background, // Optionnel, s'applique à l'overlay ou au backdrop
  unstyled = false, // Permet de désactiver la carte pour les modales existantes complexes (ex: GradientModal)
  contentClassName = '', // Custom class pour le div .modal-content interne
  contentStyle = {}, // Custom style pour le div .modal-content interne
  ...rest // Passed down to the inner content container if not unstyled
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

  // Handle hardware back button on Android / PWA
  const handleBack = useCallback(() => {
    if (open && closeOnEscape && onClose) {
      light();
      onClose();
      return true;
    }
    return false;
  }, [open, closeOnEscape, onClose, light]);

  useBackHandler(handleBack, open);

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

  const baseClass = position === 'center' ? 'dialog-backdrop' : 'modal-overlay';

  return createPortal(
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className={`fade-in ${baseClass} ${className}`}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      style={{
        zIndex: 1000,
        ...(background ? { background } : {}),
        ...style
      }}
    >
      {unstyled ? (
        children
      ) : (
        <div
          className={`modal-content ${contentClassName}`.trim()}
          style={{
            maxWidth: maxWidth,
            gap: 'var(--space-4)',
            overflowY: showScrollbar ? 'visible' : 'hidden', // Let the overlay handle scrolling
            ...contentStyle,
          }}
          onClick={(e) => e.stopPropagation()}
          {...rest}
        >
          {children}
        </div>
      )}
    </div>,
    document.body
  );
}
