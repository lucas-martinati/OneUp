import { forwardRef, useCallback, useMemo } from 'react';
import { haptics } from '@utils/hapticsManager';

/**
 * Canonical button primitive for the whole app.
 *
 * Replaces the dozens of hand-rolled `<button style={{…}}>` blocks that each
 * re-declared padding / radius / gradients with slightly different (and often
 * hard-coded) values. Everything here is driven by the design tokens in
 * index.css, so buttons stay consistent across all 5 themes automatically.
 *
 * @param {'primary'|'secondary'|'success'|'danger'|'ghost'} [variant='primary']
 * @param {'sm'|'md'|'lg'} [size='md']
 * @param {boolean} [fullWidth=false] – stretch to container width
 * @param {React.ComponentType} [icon] – leading icon component (lucide-style)
 * @param {React.ComponentType} [iconRight] – trailing icon component
 * @param {boolean} [loading=false] – show spinner + disable interaction
 * @param {object} [style] – escape hatch for one-off overrides
 */
const BASE = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  fontFamily: 'inherit',
  fontWeight: 700,
  border: '1px solid transparent',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'background var(--motion-fast) ease, border-color var(--motion-fast) ease, box-shadow var(--motion-fast) ease, opacity var(--motion-fast) ease, transform var(--motion-fast) ease',
};

const SIZES = {
  sm: { padding: '8px 14px', fontSize: '0.8rem', minHeight: '36px' },
  md: { padding: '12px 20px', fontSize: '0.9rem', minHeight: 'var(--touch-min)' },
  lg: { padding: '16px 24px', fontSize: '1rem', minHeight: '52px' },
};

const VARIANTS = {
  primary: {
    background: 'var(--gradient-glow)',
    color: '#fff',
    boxShadow: 'var(--glow-accent)',
  },
  secondary: {
    background: 'var(--surface-muted)',
    color: 'var(--text-primary)',
    borderColor: 'var(--border-default)',
  },
  success: {
    background: 'linear-gradient(135deg, var(--success), #059669)',
    color: '#fff',
    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
  },
  danger: {
    background: 'linear-gradient(135deg, var(--error), #dc2626)',
    color: '#fff',
    boxShadow: '0 4px 16px rgba(239, 68, 68, 0.3)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
  },
};

const ICON_SIZE = { sm: 16, md: 18, lg: 20 };

export const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    icon: Icon,
    iconRight: IconRight,
    loading = false,
    disabled = false,
    children,
    style,
    type = 'button',
    onClick,
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;
  // Light physical tap on every press (no-op on web / when haptics are off).
  const handleClick = useCallback(
    (e) => {
      haptics.light();
      onClick?.(e);
    },
    [onClick],
  );
  const composed = useMemo(
    () => ({
      ...BASE,
      ...SIZES[size],
      ...VARIANTS[variant],
      width: fullWidth ? '100%' : undefined,
      opacity: isDisabled ? 0.6 : 1,
      pointerEvents: isDisabled ? 'none' : undefined,
      ...style,
    }),
    [variant, size, fullWidth, isDisabled, style],
  );

  const iconPx = ICON_SIZE[size];

  return (
    <button ref={ref} type={type} disabled={isDisabled} onClick={handleClick} style={composed} {...rest}>
      {loading ? (
        <span
          aria-hidden
          style={{
            width: iconPx,
            height: iconPx,
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
          }}
        />
      ) : (
        Icon && <Icon size={iconPx} />
      )}
      {children}
      {!loading && IconRight && <IconRight size={iconPx} />}
    </button>
  );
});
