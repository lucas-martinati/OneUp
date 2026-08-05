import { useMemo } from 'react';
import { Button } from './Button';
import { ModalContainer } from './ModalContainer';
import { X } from '@utils/icons';

/**
 * Structured dialog shell providing consistent header / body / footer
 * layout for every functional dialog in the app.
 *
 * Sits on top of {@link ModalContainer} (which handles the backdrop,
 * blur, escape-to-dismiss, and scroll-locking) and adds the internal
 * card structure that was previously hand-rolled in each modal.
 *
 * **Not intended for "celebration" modals** (Pro unlocked,
 * Supporter unlocked) — those keep their bespoke GradientModal.
 *
 * @param {'sm'|'md'|'lg'} [size='sm'] — controls max-width
 * @param {'default'|'danger'} [variant='default']
 * @param {'row'|'column'} [footerLayout='row']
 * @param {boolean} [showCloseButton] — defaults to true when onClose is provided
 */
const MAX_WIDTH = { sm: '340px', md: '440px', lg: '540px' };

export function ModalShell({
  open,
  onClose,
  title,
  subtitle,
  icon: Icon,
  showCloseButton,
  size = 'sm',
  variant = 'default',
  footer,
  footerLayout = 'row',
  ariaLabel = 'Dialog',
  children,
  className = '',
  style,
}) {
  const showX = showCloseButton ?? !!onClose;

  const cardStyle = useMemo(
    () => ({
      position: 'relative',
      width: '100%',
      maxWidth: MAX_WIDTH[size],
      borderRadius: 'var(--radius-lg)',
      background: 'var(--sheet-bg)',
      border: `1px solid color-mix(in srgb, ${
        variant === 'danger' ? 'var(--error)' : 'var(--accent-glow)'
      } 20%, transparent)`,
      boxShadow:
        variant === 'danger'
          ? '0 24px 64px rgba(0, 0, 0, 0.5), 0 0 40px color-mix(in srgb, var(--error) 10%, transparent)'
          : 'var(--shadow-lg)',
      animation: 'dialogPop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
      overflow: 'hidden',
      ...style,
    }),
    [size, variant, style],
  );

  if (!open) return null;

  const accentTint = variant === 'danger' ? 'var(--error)' : 'var(--accent-glow)';

  return (
    <ModalContainer open={open} onClose={onClose} ariaLabel={ariaLabel}>
      <div className={className || undefined} style={cardStyle}>
        {/* ── Header ── */}
        {(title || Icon || showX) && (
          <div
            style={{
              padding: `var(--space-6) var(--space-6) 0`,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-3)',
              justifyContent: (!title && !subtitle && !showX) ? 'center' : 'flex-start',
            }}
          >
            {/* Icon */}
            {Icon && (
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: `color-mix(in srgb, ${accentTint} 15%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${accentTint} 30%, transparent)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={22} color={accentTint} />
              </div>
            )}

            {/* Title block */}
            {(title || subtitle) && (
              <div style={{ flex: 1, minWidth: 0 }}>
                {title && (
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p
                    style={{
                      margin: '4px 0 0',
                      fontSize: '0.82rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {subtitle}
                  </p>
                )}
              </div>
            )}

            {/* Spacer when no title but close button needed */}
            {!title && !Icon && showX && <div style={{ flex: 1 }} />}

            {/* Close button */}
            {showX && (
              <Button
                iconOnly
                icon={X}
                onClick={onClose}
                variant="glass"
                size="sm"
                aria-label="Close dialog"
                style={{ flexShrink: 0 }}
              />
            )}
          </div>
        )}

        {/* ── Body ── */}
        {children && (
          <div style={{ padding: 'var(--space-4) var(--space-6)' }}>
            {children}
          </div>
        )}

        {/* ── Footer ── */}
        {footer && (
          <div
            style={{
              padding: '0 var(--space-6) var(--space-6)',
              display: 'flex',
              flexDirection: footerLayout,
              gap: '10px',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </ModalContainer>
  );
}
