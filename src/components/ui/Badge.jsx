import { forwardRef } from 'react';

/**
 * Standardized Badge primitive for status indicators, difficulty levels,
 * category chips, and tag pills.
 *
 * @param {'default'|'primary'|'success'|'warning'|'error'|'info'|'gold'} [variant='default']
 * @param {'sm'|'md'} [size='md']
 */
export const Badge = forwardRef(function Badge(
  {
    variant = 'default',
    size = 'md',
    icon: Icon,
    className = '',
    style,
    children,
    ...rest
  },
  ref,
) {
  const classes = ['badge', `badge--${size}`, `badge--${variant}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <span ref={ref} className={classes} style={style} {...rest}>
      {Icon && <Icon className="badge-icon" size={size === 'sm' ? 12 : 14} />}
      {children}
    </span>
  );
});
