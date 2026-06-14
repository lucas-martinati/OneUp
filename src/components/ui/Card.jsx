import { forwardRef, useMemo } from 'react';

/**
 * Surface/card primitive.
 *
 * Standardises the recurring "glass panel" look (background + border + radius +
 * shadow) that was previously copy-pasted as inline styles — often with the
 * `.glass` class on some screens and ad-hoc rgba() values on others.
 *
 * The `glass` variant intentionally reuses the existing `.glass` utility class
 * (rather than re-inlining its declarations) so it keeps inheriting the
 * `[data-perf="low"]` overrides in index.css that disable backdrop-blur on
 * low-end devices. The other variants are token-driven inline styles.
 *
 * @param {'glass'|'elevated'|'section'|'plain'} [variant='glass']
 * @param {'none'|'sm'|'md'|'lg'} [padding='md']
 * @param {boolean} [interactive=false] – adds hover-lift affordance
 * @param {React.ElementType} [as='div'] – render a different element/component
 */
const BASE = {
  borderRadius: 'var(--radius-lg)',
};

const PADDING = {
  none: 0,
  sm: 'var(--spacing-sm)',
  md: 'var(--spacing-md)',
  lg: 'var(--spacing-lg)',
};

// Variants backed by an existing utility class inherit its perf-mode overrides.
const VARIANT_CLASS = {
  glass: 'glass',
  elevated: '',
  section: '',
  plain: '',
};

const VARIANT_STYLE = {
  glass: {},
  elevated: {
    background: 'var(--surface-elevated)',
    border: '1px solid var(--border-default)',
    boxShadow: 'var(--shadow-lg)',
  },
  section: {
    background: 'var(--surface-section)',
    border: '1px solid var(--border-default)',
    boxShadow: 'var(--shadow-sm)',
  },
  plain: {
    background: 'var(--card-bg)',
    border: '1px solid var(--border-subtle)',
  },
};

export const Card = forwardRef(function Card(
  { variant = 'glass', padding = 'md', interactive = false, as: Tag = 'div', className = '', style, children, ...rest },
  ref,
) {
  const composed = useMemo(
    () => ({ ...BASE, ...VARIANT_STYLE[variant], padding: PADDING[padding], ...style }),
    [variant, padding, style],
  );

  const classes = [VARIANT_CLASS[variant], interactive && 'hover-lift', className]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag ref={ref} className={classes || undefined} style={composed} {...rest}>
      {children}
    </Tag>
  );
});
