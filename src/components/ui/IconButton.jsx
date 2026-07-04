import { forwardRef, useMemo } from 'react';

/**
 * Round, icon-only button primitive.
 *
 * Replaces the recurring `iconBtnStyle` object (circular surface button) that
 * was redefined inline across the header, settings, modals, etc. Token-driven
 * so it adapts to every theme.
 *
 * Pass the icon as a component via `icon` (preferred) or as `children`.
 * An `aria-label` is strongly recommended since there is no text.
 *
 * @param {React.ComponentType} [icon] – icon component (lucide-style)
 * @param {'surface'|'glass'|'ghost'|'danger'} [variant='surface']
 * @param {'sm'|'md'|'lg'} [size='md']
 * @param {string} [color] – override the icon/content color
 */
const BASE = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  border: '1px solid transparent',
  cursor: 'pointer',
  flexShrink: 0,
  padding: 0,
  transition: 'background var(--motion-fast) ease, border-color var(--motion-fast) ease, opacity var(--motion-fast) ease, transform var(--motion-fast) ease',
};

const SIZES = {
  sm: { width: '34px', height: '34px' },
  md: { width: 'var(--touch-min)', height: 'var(--touch-min)' },
  lg: { width: '48px', height: '48px' },
};

// Even sizes only: the buttons are 34/40/48px wide, so an odd icon size
// leaves a half-pixel margin that desktop (DPR 1) snaps off-center.
const ICON_PX = { sm: 18, md: 20, lg: 22 };

// Variants backed by an existing utility class inherit its perf-mode overrides.
const VARIANT_CLASS = { surface: '', glass: 'glass', ghost: '', danger: '' };

const VARIANTS = {
  surface: {
    background: 'var(--surface-muted)',
    borderColor: 'var(--border-default)',
    color: 'var(--text-primary)',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
  },
  glass: {
    // Reuses the `.glass` utility (blur + shadow); flat circular close-button look.
    background: 'var(--surface-hover)',
    border: 'none',
    color: 'var(--text-primary)',
  },
  ghost: {
    background: 'none',
    color: 'var(--text-secondary)',
  },
  danger: {
    background: 'var(--surface-muted)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    color: 'var(--error)',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
  },
};

export const IconButton = forwardRef(function IconButton(
  { icon: Icon, variant = 'surface', size = 'md', color, disabled = false, className = '', children, style, type = 'button', ...rest },
  ref,
) {
  const composed = useMemo(
    () => ({
      ...BASE,
      ...SIZES[size],
      ...VARIANTS[variant],
      ...(color ? { color } : null),
      opacity: disabled ? 0.5 : 1,
      pointerEvents: disabled ? 'none' : undefined,
      ...style,
    }),
    [variant, size, color, disabled, style],
  );

  const classes = [VARIANT_CLASS[variant], className].filter(Boolean).join(' ');

  return (
    <button ref={ref} type={type} disabled={disabled} className={classes || undefined} style={composed} {...rest}>
      {Icon ? <Icon size={ICON_PX[size]} /> : children}
    </button>
  );
});
