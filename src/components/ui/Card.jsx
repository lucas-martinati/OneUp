import { forwardRef, useMemo } from 'react';
import styles from './Card.module.css';

/**
 * Surface/card primitive.
 *
 * Shared theme-aware surface across settings, statistics and other panels.
 * Glass variants retain the global blur utilities and their low-performance
 * overrides. Tinted cards use the same surface with a semantic accent color.
 *
 * @param {string} [color] – primary CSS color for the background, border and title divider
 * @param {'glass'|'elevated'|'section'|'plain'|'premium'|'tinted'} [variant='glass']
 * @param {'none'|'xs'|'sm'|'md'|'lg'|'xl'} [padding='md']
 * @param {boolean} [interactive=false] – adds hover-lift affordance
 * @param {React.ElementType} [as='div'] – render a different element/component
 */
const BASE = {
  borderRadius: 'var(--radius-lg)',
};

const PADDING = {
  none: 0,
  xs: 'var(--space-3)',
  sm: 'var(--space-4)',
  md: 'var(--space-6)',
  lg: 'var(--space-8)',
  xl: 'var(--space-10)',
};

// Variants backed by an existing utility class inherit its perf-mode overrides.
const VARIANT_CLASS = {
  glass: 'glass',
  elevated: '',
  section: '',
  plain: '',
  premium: 'glass-premium',
  tinted: '',
};

export const Card = forwardRef(function Card(
  { variant = 'glass', padding = 'md', interactive = false, as: Tag = 'div', className = '', style, children, color, tint, ...rest },
  ref,
) {
  const composed = useMemo(
    () => ({
      ...BASE,
      padding: padding === 'md' ? 'var(--card-padding, var(--space-6))' : PADDING[padding],
      ...((color || (variant === 'tinted' && tint))
        ? {
            '--card-accent': color || tint,
          }
        : {}),
      ...style,
    }),
    [variant, padding, color, tint, style],
  );

  const classes = [styles.card, VARIANT_CLASS[variant], interactive && 'micro-scale-hover', className]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag ref={ref} className={classes || undefined} style={composed} {...rest}>
      {children}
    </Tag>
  );
});
